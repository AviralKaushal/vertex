const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/db');

const SALT_ROUNDS = 12;

const signupUser = async ({ username, email, phone, password }) => {
  const phoneCheck = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
  if (phoneCheck.rows.length > 0) throw { status: 409, message: 'Phone number already in use' };

  const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (emailCheck.rows.length > 0) throw { status: 409, message: 'Email already in use' };

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await db.query(
    'INSERT INTO users (username, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, username, email',
    [username, email, phone, password_hash]
  );

  return result.rows[0];
};

const loginUser = async ({ email, password }) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) throw { status: 404, message: 'User not found' };

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw { status: 401, message: 'Invalid credentials' };

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email },
  };
};

const getMe = async (userId) => {
  const result = await db.query(
    'SELECT id, username, email, phone, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) throw { status: 404, message: 'User not found' };
  return result.rows[0];
};

module.exports = { signupUser, loginUser, getMe };
