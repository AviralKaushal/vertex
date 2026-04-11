const stripeService = require('../services/stripeService');

const createPaymentIntent = async (req, res) => {
  try {
    const { toAccountId, amount, note, idempotencyKey } = req.body;
    if (!toAccountId || !amount) {
      return res.status(400).json({ message: 'toAccountId and amount are required' });
    }
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const result = await stripeService.createPaymentIntent(req.user.userId, {
      toAccountId, amount: parseFloat(amount), note, idempotencyKey
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error('Stripe createPaymentIntent error:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Failed to create transfer' });
  }
};

const confirmTransfer = async (req, res) => {
  try {
    const { transferId, paymentIntentId } = req.body;
    if (!transferId || !paymentIntentId) {
      return res.status(400).json({ message: 'transferId and paymentIntentId are required' });
    }

    const result = await stripeService.confirmTransfer(req.user.userId, transferId, paymentIntentId);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Failed to confirm transfer' });
  }
};

const getTransfers = async (req, res) => {
  try {
    const transfers = await stripeService.getTransfers(req.user.userId);
    return res.status(200).json({ transfers });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Failed to fetch transfers' });
  }
};

module.exports = { createPaymentIntent, confirmTransfer, getTransfers };
