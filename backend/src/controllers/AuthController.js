const authService = require('../services/authService');

const signup = async (req, res) => {
  try {
    const user = await authService.signupUser(req.body);
    return res.status(201).json({ message: 'Account created successfully', user });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const data = await authService.loginUser(req.body);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.userId);
    return res.status(200).json(user);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
  }
};

module.exports = { signup, login, getMe };