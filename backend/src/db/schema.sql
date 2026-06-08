CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  phone         VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plaid_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plaid_item_id       TEXT UNIQUE NOT NULL,
  plaid_access_token  TEXT NOT NULL,
  institution_id      TEXT,
  institution_name    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plaid_item_id     UUID REFERENCES plaid_items(id) ON DELETE CASCADE,
  plaid_account_id  TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  official_name     TEXT,
  type              TEXT NOT NULL,
  subtype           TEXT,
  mask              TEXT,
  current_balance   NUMERIC(15,2),
  available_balance NUMERIC(15,2),
  iso_currency_code TEXT DEFAULT 'USD',
  color             TEXT DEFAULT '#6366f1',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id            UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  plaid_transaction_id  TEXT UNIQUE,
  amount                NUMERIC(15,2) NOT NULL,
  iso_currency_code     TEXT DEFAULT 'USD',
  description           TEXT NOT NULL,
  merchant_name         TEXT,
  category              TEXT,
  subcategory           TEXT,
  date                  DATE NOT NULL,
  type                  VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
  channel               TEXT,
  status                TEXT DEFAULT 'posted',
  pending               BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_account_id         UUID REFERENCES accounts(id),
  to_account_id           UUID REFERENCES accounts(id),
  amount                  NUMERIC(15,2) NOT NULL,
  currency                TEXT DEFAULT 'USD',
  note                    TEXT,
  status                  TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  stripe_payment_intent   TEXT,
  idempotency_key         TEXT NOT NULL UNIQUE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  completed_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON plaid_items(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_transfers_idempotency_key ON transfers(idempotency_key);
