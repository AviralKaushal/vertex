const db = require('../db/db');
const { invalidateCache } = require('../config/redis');

/**
 * Internal ledger transfer between two of the user's own linked accounts.
 *
 * This is 100% free — no Stripe, no Plaid Transfer API needed.
 * Both accounts are already in our DB (linked via Plaid), so we just
 * run a DB transaction that atomically:
 *   1. Validates both accounts belong to this user
 *   2. Checks sufficient balance on the source account
 *   3. Debits the source account
 *   4. Credits the destination account
 *   5. Inserts a debit transaction record (source side)
 *   6. Inserts a credit transaction record (destination side)
 *   7. Inserts a completed transfer record
 *
 * Double-entry bookkeeping — every dollar that leaves one account
 * appears in another, with a full audit trail on both sides.
 */
const internalTransfer = async (userId, { fromAccountId, toAccountId, amount, note, idempotencyKey }) => {
  const parsedAmount = parseFloat(amount);

  if (fromAccountId === toAccountId) {
    throw { status: 400, message: 'Source and destination accounts must be different.' };
  }

  // Resolve idempotency key
  const resolvedKey = idempotencyKey
    || `internal_${userId}_${fromAccountId}_${toAccountId}_${Math.round(parsedAmount * 100)}_${Date.now()}`;

  const client = await db.pool.connect();
  let txStarted = false;

  try {
    await client.query('BEGIN');
    txStarted = true;

    // ── Idempotency check ────────────────────────────────────────────────────
    const existing = await client.query(
      'SELECT id FROM transfers WHERE idempotency_key = $1 AND user_id = $2',
      [resolvedKey, userId]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return { success: true, transferId: existing.rows[0].id, duplicate: true };
    }
    // ────────────────────────────────────────────────────────────────────────

    // Lock both account rows (ordered by id to prevent deadlocks)
    const [lockId1, lockId2] = [fromAccountId, toAccountId].sort();
    await client.query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [lockId1, userId]
    );
    await client.query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [lockId2, userId]
    );

    // Fetch source account — verify ownership + balance
    const fromResult = await client.query(
      'SELECT id, name, current_balance, available_balance FROM accounts WHERE id = $1 AND user_id = $2',
      [fromAccountId, userId]
    );
    if (fromResult.rows.length === 0) {
      throw { status: 404, message: 'Source account not found.' };
    }

    // Fetch destination account — verify ownership
    const toResult = await client.query(
      'SELECT id, name FROM accounts WHERE id = $1 AND user_id = $2',
      [toAccountId, userId]
    );
    if (toResult.rows.length === 0) {
      throw { status: 404, message: 'Destination account not found.' };
    }

    const fromAccount = fromResult.rows[0];

    // Insufficient funds check
    const availableBalance = parseFloat(fromAccount.available_balance ?? fromAccount.current_balance ?? 0);
    if (availableBalance < parsedAmount) {
      throw {
        status: 400,
        message: `Insufficient funds. Available balance: $${availableBalance.toFixed(2)}`
      };
    }

    // Debit source account
    await client.query(
      `UPDATE accounts
       SET current_balance   = current_balance   - $1,
           available_balance = available_balance - $1,
           updated_at        = NOW()
       WHERE id = $2`,
      [parsedAmount, fromAccountId]
    );

    // Credit destination account
    await client.query(
      `UPDATE accounts
       SET current_balance   = current_balance   + $1,
           available_balance = available_balance + $1,
           updated_at        = NOW()
       WHERE id = $2`,
      [parsedAmount, toAccountId]
    );

    const description = note || `Transfer to account`;

    // Debit transaction record (source side)
    await client.query(
      `INSERT INTO transactions
         (user_id, account_id, amount, description, category, date, type, status)
       VALUES ($1, $2, $3, $4, 'Transfer', CURRENT_DATE, 'debit', 'posted')`,
      [userId, fromAccountId, parsedAmount, description]
    );

    // Credit transaction record (destination side)
    await client.query(
      `INSERT INTO transactions
         (user_id, account_id, amount, description, category, date, type, status)
       VALUES ($1, $2, $3, $4, 'Transfer', CURRENT_DATE, 'credit', 'posted')`,
      [userId, toAccountId, parsedAmount, description]
    );

    // Transfer record — status immediately 'completed', no payment processor needed
    const transferResult = await client.query(
      `INSERT INTO transfers
         (user_id, from_account_id, to_account_id, amount, note, idempotency_key, status, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW())
       RETURNING id`,
      [userId, fromAccountId, toAccountId, parsedAmount, note || null, resolvedKey]
    );

    await client.query('COMMIT');

    // Bust caches so UI reflects updated balances + histories immediately
    await invalidateCache(`user:${userId}:accounts`);
    await invalidateCache(`user:${userId}:transactions:*`);
    await invalidateCache(`user:${userId}:transfers`);

    return {
      success:    true,
      transferId: transferResult.rows[0].id,
      duplicate:  false,
    };
  } catch (err) {
    if (txStarted) await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { internalTransfer };
