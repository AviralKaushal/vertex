const router = require('express').Router();
const { signup, login, getMe } = require('../controllers/AuthController');
const { validateSignup, validateLogin } = require('../middlewares/ValidationMiddleware');
const { authenticate } = require('../middlewares/AuthMiddleware');

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.get('/me', authenticate, getMe);

module.exports = router;