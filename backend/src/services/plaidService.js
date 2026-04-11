const { plaidClient, Products, CountryCode } = require('../config/plaid');
const db = require('../db/db');
const { withCache, invalidateCache } = require('../config/redis');

const ACCOUNT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const createLinkToken = async (userId) => {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'Vertex',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  });
  return response.data.link_token;
};

const exchangePublicToken = async (userId, publicToken) => {
  const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
  const { access_token, item_id } = exchangeResponse.data;

  const institutionResponse = await plaidClient.itemGet({ access_token });
  const institutionId = institutionResponse.data.item.institution_id;
  let institutionName = null;

  if (institutionId) {
    const instResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: [CountryCode.Us],
    });
    institutionName = instResponse.data.institution.name;
  }

  const existingItem = await db.query('SELECT id FROM plaid_items WHERE plaid_item_id = $1', [item_id]);
  let plaidItemDbId;

  if (existingItem.rows.length > 0) {
    plaidItemDbId = existingItem.rows[0].id;
    await db.query(
      'UPDATE plaid_items SET plaid_access_token = $1 WHERE id = $2',
      [access_token, plaidItemDbId]
    );
  } else {
    const itemResult = await db.query(
      'INSERT INTO plaid_items (user_id, plaid_item_id, plaid_access_token, institution_id, institution_name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, item_id, access_token, institutionId, institutionName]
    );
    plaidItemDbId = itemResult.rows[0].id;
  }

  const accountsResponse = await plaidClient.accountsGet({ access_token });
  const plaidAccounts = accountsResponse.data.accounts;
  const existingAccountsResult = await db.query('SELECT plaid_account_id FROM accounts WHERE user_id = $1', [userId]);
  const existingAccountIds = new Set(existingAccountsResult.rows.map(r => r.plaid_account_id));

  const colorOffset = (await db.query('SELECT COUNT(*) FROM accounts WHERE user_id = $1', [userId])).rows[0].count;

  for (let i = 0; i < plaidAccounts.length; i++) {
    const acc = plaidAccounts[i];
    if (existingAccountIds.has(acc.account_id)) continue;

    const color = ACCOUNT_COLORS[(parseInt(colorOffset) + i) % ACCOUNT_COLORS.length];
    await db.query(
      `INSERT INTO accounts 
        (user_id, plaid_item_id, plaid_account_id, name, official_name, type, subtype, mask, current_balance, available_balance, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (plaid_account_id) DO UPDATE SET
         current_balance = EXCLUDED.current_balance,
         available_balance = EXCLUDED.available_balance,
         updated_at = NOW()`,
      [
        userId, plaidItemDbId, acc.account_id, acc.name, acc.official_name,
        acc.type, acc.subtype, acc.mask,
        acc.balances.current, acc.balances.available, color,
      ]
    );
  }

  return { institutionName, accountCount: plaidAccounts.length };
};

const getAccounts = async (userId) => {
  return await withCache(`user:${userId}:accounts`, 60 * 5, async () => {
    const result = await db.query(
      `SELECT a.id, a.name, a.official_name, a.type, a.subtype, a.mask, 
              a.current_balance, a.available_balance, a.color, a.iso_currency_code,
              pi.institution_name, pi.institution_id
       FROM accounts a
       LEFT JOIN plaid_items pi ON a.plaid_item_id = pi.id
       WHERE a.user_id = $1
       ORDER BY a.created_at ASC`,
      [userId]
    );
    return result.rows;
  });
};

const syncTransactions = async (userId) => {
  const items = await db.query(
    'SELECT * FROM plaid_items WHERE user_id = $1',
    [userId]
  );

  let totalSynced = 0;

  for (const item of items.rows) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    const start = startDate.toISOString().split('T')[0];
    const end = new Date().toISOString().split('T')[0];

    const txnResponse = await plaidClient.transactionsGet({
      access_token: item.plaid_access_token,
      start_date: start,
      end_date: end,
    });

    const plaidTransactions = txnResponse.data.transactions;

    for (const txn of plaidTransactions) {
      const accountResult = await db.query(
        'SELECT id FROM accounts WHERE plaid_account_id = $1 AND user_id = $2',
        [txn.account_id, userId]
      );
      if (accountResult.rows.length === 0) continue;

      const accountId = accountResult.rows[0].id;
      const type = txn.amount < 0 ? 'credit' : 'debit';
      const category = txn.personal_finance_category?.primary || (txn.category && txn.category[0]) || 'Other';

      await db.query(
        `INSERT INTO transactions 
          (user_id, account_id, plaid_transaction_id, amount, description, merchant_name, category, date, type, channel, pending)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (plaid_transaction_id) DO UPDATE SET
           amount = EXCLUDED.amount,
           description = EXCLUDED.description,
           pending = EXCLUDED.pending`,
        [
          userId, accountId, txn.transaction_id,
          Math.abs(txn.amount), txn.name || txn.merchant_name,
          txn.merchant_name, category, txn.date,
          type, txn.payment_channel, txn.pending,
        ]
      );
      totalSynced++;
    }
  }

  // Actively invalidate caches when transactions are synced so UI reflects fresh data
  if (totalSynced > 0) {
    await invalidateCache(`user:${userId}:transactions:*`);
    await invalidateCache(`user:${userId}:accounts`);
  }

  return totalSynced;
};

const getTransactions = async (userId, { limit = 50, offset = 0, accountId, category, search } = {}) => {
  // Build a unique cache key based on query filters
  const cacheKey = `user:${userId}:transactions:l${limit}:o${offset}:a${accountId || 'all'}:c${category || 'all'}:s${search || 'none'}`;

  return await withCache(cacheKey, 60 * 2, async () => {
    let query = `
      SELECT t.*, a.name as account_name, a.color as account_color
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (accountId) {
      query += ` AND t.account_id = $${paramIndex++}`;
      params.push(accountId);
    }
    if (category) {
      query += ` AND t.category = $${paramIndex++}`;
      params.push(category);
    }
    if (search) {
      query += ` AND (t.description ILIKE $${paramIndex} OR t.merchant_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY t.date DESC, t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  });
};

const getConnectedItems = async (userId) => {
  const result = await db.query(
    'SELECT id, institution_name, institution_id, created_at FROM plaid_items WHERE user_id = $1 ORDER BY created_at ASC',
    [userId]
  );
  return result.rows;
};

const removeItem = async (userId, itemId) => {
  const itemResult = await db.query(
    'SELECT plaid_access_token FROM plaid_items WHERE id = $1 AND user_id = $2',
    [itemId, userId]
  );
  if (itemResult.rows.length === 0) throw { status: 404, message: 'Item not found' };

  await plaidClient.itemRemove({ access_token: itemResult.rows[0].plaid_access_token });
  await db.query('DELETE FROM plaid_items WHERE id = $1', [itemId]);
};

module.exports = {
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  syncTransactions,
  getTransactions,
  getConnectedItems,
  removeItem,
};
