const plaidService = require('../services/plaidService');

const createLinkToken = async (req, res) => {
  try {
    const link_token = await plaidService.createLinkToken(req.user.userId);
    return res.status(200).json({ link_token });
  } catch (err) {
    console.error('Plaid createLinkToken error:', err.response?.data || err.message);
    return res.status(err.status || 500).json({ message: err.message || 'Failed to create link token' });
  }
};

const exchangePublicToken = async (req, res) => {
  try {
    const { public_token } = req.body;
    if (!public_token) return res.status(400).json({ message: 'public_token is required' });

    const result = await plaidService.exchangePublicToken(req.user.userId, public_token);
    return res.status(200).json({ message: 'Bank connected successfully', ...result });
  } catch (err) {
    console.error('Plaid exchangePublicToken error:', err.response?.data || err.message);
    return res.status(err.status || 500).json({ message: err.message || 'Failed to connect bank' });
  }
};

const getAccounts = async (req, res) => {
  try {
    const accounts = await plaidService.getAccounts(req.user.userId);
    return res.status(200).json({ accounts });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Failed to fetch accounts' });
  }
};

const syncTransactions = async (req, res) => {
  try {
    const count = await plaidService.syncTransactions(req.user.userId);
    return res.status(200).json({ message: `Synced ${count} transactions` });
  } catch (err) {
    console.error('Plaid syncTransactions error:', err.response?.data || err.message);
    return res.status(err.status || 500).json({ message: err.message || 'Failed to sync transactions' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { limit, offset, accountId, category, search } = req.query;
    const transactions = await plaidService.getTransactions(req.user.userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      accountId,
      category,
      search,
    });
    return res.status(200).json({ transactions });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Failed to fetch transactions' });
  }
};

const getConnectedItems = async (req, res) => {
  try {
    const items = await plaidService.getConnectedItems(req.user.userId);
    return res.status(200).json({ items });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Failed to fetch connected banks' });
  }
};

const removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await plaidService.removeItem(req.user.userId, itemId);
    return res.status(200).json({ message: 'Bank disconnected successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Failed to disconnect bank' });
  }
};

module.exports = { createLinkToken, exchangePublicToken, getAccounts, syncTransactions, getTransactions, getConnectedItems, removeItem };
