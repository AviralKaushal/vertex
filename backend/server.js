require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRouter = require('./src/routes/AuthRouter');
const plaidRouter = require('./src/routes/PlaidRouter');
const transferRouter = require('./src/routes/TransferRouter');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/auth', authRouter);
app.use('/plaid', plaidRouter);
app.use('/transfers', transferRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Vertex API running on port ${PORT}`));
