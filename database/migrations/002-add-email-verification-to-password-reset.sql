ALTER TABLE auth.password_reset_tokens
    ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reset_token_hash TEXT,
    ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS
    idx_password_reset_reset_token_hash
ON auth.password_reset_tokens (reset_token_hash)
WHERE reset_token_hash IS NOT NULL;

ALTER TABLE auth.password_reset_tokens
    ADD CONSTRAINT password_reset_attempt_count_check
    CHECK (attempt_count >= 0);
