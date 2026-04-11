const db = require('./db.js');

async function drop() {
  await db.query(`
    DROP TABLE IF EXISTS transfers CASCADE;
    DROP TABLE IF EXISTS transactions CASCADE;
    DROP TABLE IF EXISTS accounts CASCADE;
    DROP TABLE IF EXISTS plaid_items CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
  console.log('Tables dropped');
  process.exit(0);
}
drop();
