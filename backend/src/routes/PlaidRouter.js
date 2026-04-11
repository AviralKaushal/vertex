const router = require('express').Router();
const { authenticate } = require('../middlewares/AuthMiddleware');
const plaidController = require('../controllers/PlaidController');

router.post('/create-link-token', authenticate, plaidController.createLinkToken);
router.post('/exchange-token', authenticate, plaidController.exchangePublicToken);
router.get('/accounts', authenticate, plaidController.getAccounts);
router.post('/sync', authenticate, plaidController.syncTransactions);
router.get('/transactions', authenticate, plaidController.getTransactions);
router.get('/items', authenticate, plaidController.getConnectedItems);
router.delete('/items/:itemId', authenticate, plaidController.removeItem);

module.exports = router;
