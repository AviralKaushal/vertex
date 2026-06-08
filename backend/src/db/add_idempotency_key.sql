-- Safe, re-runnable migration to add idempotency_key to an existing transfers table.
-- Run this once against your live DB if it already has data.
--
-- Step 1: Add the column as nullable (safe for existing rows)
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Step 2: Back-fill any existing NULL rows with a generated unique key
--         so we can later enforce NOT NULL without touching application code.
UPDATE transfers
SET idempotency_key = 'legacy_' || id::TEXT
WHERE idempotency_key IS NULL;

-- Step 3: Enforce NOT NULL + UNIQUE now that every row has a value
ALTER TABLE transfers ALTER COLUMN idempotency_key SET NOT NULL;
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_idempotency_key_key;
ALTER TABLE transfers ADD CONSTRAINT transfers_idempotency_key_key UNIQUE (idempotency_key);

-- Step 4: Supporting index (no-op if already created by the constraint above)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transfers_idempotency_key ON transfers(idempotency_key);
