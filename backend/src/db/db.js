const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port:     parseInt(process.env.DB_PORT, 10),
});

// Expose `pool` so services can acquire dedicated clients for transactions,
// and `query` as a convenience wrapper for one-shot queries.
module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
