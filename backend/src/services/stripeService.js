const stripe = require('../config/stripe');
const db = require('../db/db');
const { withCache, invalidateCache } = require('../config/redis');

/**
 * Creates a Stripe PaymentIntent and a pending transfer record.
 *
 * Idempotency guarantee:
 *  - If a transfer with the same idempotency_key already exists in the DB,
 *    we return the stored result immediately (no new Stripe charge, no new row).
 *  - The resolved key is stored in the `idempotency_key` column so it can be
 *    queried and deduplicated on future retries.
 */
const createPaymentIntent = async (userId, { toAccountId, amount, note, idempotencyKey }) => {
  // Resolve the key — client-supplied or auto-generated
  const resolvedKey = idempotencyKey
    || `auto_${userId}_${toAccountId}_${Math.round(parseFloat(amount) * 100)}_${Date.now()}`;

  // ── Idempotency check ──────────────────────────────────────────────────────
  // Check DB FIRST before hitting Stripe so retries never double-charge.
  const existing = await db.query(
    'SELECT id, stripe_payment_intent FROM transfers WHERE idempotency_key = $1 AND user_id = $2',
    [resolvedKey, userId]
  );

  if (existing.rows.length > 0) {
    const existingTransfer = existing.rows[0];
    // Re-fetch PaymentIntent from Stripe to get a fresh client_secret
    const intent = await stripe.paymentIntents.retrieve(existingTransfer.stripe_payment_intent);
    return {
      clientSecret:    intent.client_secret,
      transferId:      existingTransfer.id,
      paymentIntentId: intent.id,
      duplicate:       true,  // lets the client know this was a replayed response
    };
  }
  // ── End idempotency check ──────────────────────────────────────────────────

  const toAcct = await db.query(
    'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
    [toAccountId, userId]
  );
  if (toAcct.rows.length === 0) throw { status: 404, message: 'Destination account not found' };

  const amountInCents = Math.round(parseFloat(amount) * 100);

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount:   amountInCents,
      currency: 'usd',
      metadata: { userId, toAccountId, note: note || '' },
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    },
    // Pass the same key to Stripe — Stripe also deduplicates on its side
    { idempotencyKey: resolvedKey }
  );

  // Store the resolved key so future retries hit the early-return path above
  const transferResult = await db.query(
    `INSERT INTO transfers
       (user_id, from_account_id, to_account_id, amount, note, stripe_payment_intent, idempotency_key, status)
     VALUES ($1, NULL, $2, $3, $4, $5, $6, 'pending')
     RETURNING id`,
    [userId, toAccountId, amount, note, paymentIntent.id, resolvedKey]
  );

  return {
    clientSecret:    paymentIntent.client_secret,
    transferId:      transferResult.rows[0].id,
    paymentIntentId: paymentIntent.id,
    duplicate:       false,
  };
};

/**
 * Confirms a transfer by verifying the Stripe PaymentIntent status,
 * then atomically marks it completed and credits the destination account.
 *
 * Uses SELECT … FOR UPDATE to prevent concurrent confirmation races.
 */
const confirmTransfer = async (userId, transferId, paymentIntentId) => {
  // db.pool is explicitly exported — no duck-type guessing needed
  const client = await db.pool.connect();
  let txStarted = false;

  try {
    await client.query('BEGIN');
    txStarted = true;

    // Lock the row to block concurrent confirmations of the same transfer
    const transferResult = await client.query(
      'SELECT * FROM transfers WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [transferId, userId]
    );

    if (transferResult.rows.length === 0) throw { status: 404, message: 'Transfer not found.' };

    const transfer = transferResult.rows[0];

    // Idempotency: already completed/failed → return cached result, don't re-process
    if (transfer.status !== 'pending') {
      await client.query('ROLLBACK');
      return { success: true, transferId, alreadyProcessed: true };
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const succeeded = intent.status === 'succeeded' || intent.status === 'requires_capture';

    if (!succeeded) {
      throw { status: 400, message: `Payment not completed. Stripe status: ${intent.status}` };
    }

    await client.query(
      `UPDATE transfers SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [transferId]
    );

    await client.query(
      `INSERT INTO transactions
         (user_id, account_id, amount, description, category, date, type, status)
       VALUES ($1, $2, $3, $4, 'Deposit', CURRENT_DATE, 'credit', 'posted')`,
      [userId, transfer.to_account_id, transfer.amount, 'External Deposit']
    );

    // Atomically credit the destination account balance
    await client.query(
      `UPDATE accounts
       SET current_balance   = current_balance   + $1,
           available_balance = available_balance + $1,
           updated_at        = NOW()
       WHERE id = $2`,
      [transfer.amount, transfer.to_account_id]
    );

    await client.query('COMMIT');

    // Bust caches so the UI immediately reflects new balance / history
    await invalidateCache(`user:${userId}:accounts`);
    await invalidateCache(`user:${userId}:transactions:*`);
    await invalidateCache(`user:${userId}:transfers`);

    return { success: true, transferId };
  } catch (err) {
    if (txStarted) await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Returns the last 50 transfers for a user, with joined account names/colors.
 * Result is cached for 5 minutes.
 */
const getTransfers = async (userId) => {
  return await withCache(`user:${userId}:transfers`, 60 * 5, async () => {
    const result = await db.query(
      `SELECT tr.*,
              fa.name  AS from_account_name,  fa.color  AS from_account_color,
              ta.name  AS to_account_name,    ta.color  AS to_account_color
       FROM   transfers tr
       LEFT JOIN accounts fa ON tr.from_account_id = fa.id
       LEFT JOIN accounts ta ON tr.to_account_id   = ta.id
       WHERE  tr.user_id = $1
       ORDER  BY tr.created_at DESC
       LIMIT  50`,
      [userId]
    );
    return result.rows;
  });
};

module.exports = { createPaymentIntent, confirmTransfer, getTransfers };
