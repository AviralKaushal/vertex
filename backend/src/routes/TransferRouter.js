const router = require('express').Router();
const { authenticate } = require('../middlewares/AuthMiddleware');
const transferController = require('../controllers/TransferController');

router.post('/create-intent', authenticate, transferController.createPaymentIntent);
router.post('/confirm',       authenticate, transferController.confirmTransfer);
router.post('/internal',      authenticate, transferController.internalTransfer);
router.get('/',               authenticate, transferController.getTransfers);

module.exports = router;
