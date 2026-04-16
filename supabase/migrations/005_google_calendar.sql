-- Migration 005: Google Calendar OAuth token storage
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_access_token  text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_refresh_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_token_expiry  bigint;
