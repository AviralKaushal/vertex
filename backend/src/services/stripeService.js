const stripe = require('../config/stripe');
const db = require('../db/db');
const { withCache, invalidateCache } = require('../config/redis');

const createPaymentIntent = async (userId, { toAccountId, amount, note, idempotencyKey }) => {
  const toAcct = await db.query('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [toAccountId, userId]);
  if (toAcct.rows.length === 0) throw { status: 404, message: 'Destination account not found' };

  const amountInCents = Math.round(parseFloat(amount) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    metadata: {
      userId,
      toAccountId,
      note: note || '',
    },
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  }, {
    idempotencyKey: idempotencyKey || `create_pi_${userId}_${Date.now()}`
  });

  const transferResult = await db.query(
    `INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, note, stripe_payment_intent, status)
     VALUES ($1, NULL, $2, $3, $4, $5, 'pending')
     RETURNING id`,
    [userId, toAccountId, amount, note, paymentIntent.id]
  );

  return {
    clientSecret: paymentIntent.client_secret,
    transferId: transferResult.rows[0].id,
    paymentIntentId: paymentIntent.id,
  };
};

const confirmTransfer = async (userId, transferId, paymentIntentId) => {
  const client = await db.pool.connect ? await db.pool.connect() : db;
  let isTransactionActive = false;

  try {
    if (client.query) await client.query('BEGIN');
    isTransactionActive = true;

    // Use FOR UPDATE to lock the row and prevent concurrent confirmation requests
    const transferResult = await client.query(
      'SELECT * FROM transfers WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [transferId, userId]
    );

    if (transferResult.rows.length === 0) throw { status: 404, message: 'Transfer not found.' };

    const transfer = transferResult.rows[0];
    
    // Prevent double-processing
    if (transfer.status !== 'pending') {
      if (client.query) await client.query('ROLLBACK');
      return { success: true, transferId, alreadyProcessed: true };
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const succeeded = intent.status === 'succeeded' || intent.status === 'requires_capture';

    if (!succeeded) {
      throw { status: 400, message: `Payment not completed. Stripe status is: ${intent.status}` };
    }

    await client.query(
      `UPDATE transfers SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [transferId]
    );

    await client.query(
      `INSERT INTO transactions (user_id, account_id, amount, description, category, date, type, status)
       VALUES ($1, $2, $3, $4, 'Deposit', CURRENT_DATE, 'credit', 'posted')`,
      [userId, transfer.to_account_id, transfer.amount, 'External Deposit']
    );

    // Atomically increment the balance for the targeted account
    await client.query(
      `UPDATE accounts SET current_balance = current_balance + $1, available_balance = available_balance + $1, updated_at = NOW()
       WHERE id = $2`,
      [transfer.amount, transfer.to_account_id]
    );

    if (client.query) await client.query('COMMIT');

    // Invalidate caches immediately so UI reflects updated balances and transaction/transfer histories
    await invalidateCache(`user:${userId}:accounts`);
    await invalidateCache(`user:${userId}:transactions:*`);
    await invalidateCache(`user:${userId}:transfers`);

    return { success: true, transferId };
  } catch (err) {
    if (isTransactionActive && client.query) await client.query('ROLLBACK');
    throw err;
  } finally {
    if (client.release) client.release();
  }
};

const getTransfers = async (userId) => {
  return await withCache(`user:${userId}:transfers`, 60 * 5, async () => {
    const result = await db.query(
      `SELECT tr.*, 
              fa.name as from_account_name, fa.color as from_account_color,
              ta.name as to_account_name, ta.color as to_account_color
       FROM transfers tr
       LEFT JOIN accounts fa ON tr.from_account_id = fa.id
       LEFT JOIN accounts ta ON tr.to_account_id = ta.id
       WHERE tr.user_id = $1
       ORDER BY tr.created_at DESC
       LIMIT 50`,
      [userId]
    );
    return result.rows;
  });
};

module.exports = { createPaymentIntent, confirmTransfer, getTransfers };
