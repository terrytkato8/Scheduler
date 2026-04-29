-- Add weekly_overrides column to availability table
-- Stores per-week slot overrides as: { "2026-04-28": { available: [...], busy: [...] } }
ALTER TABLE availability ADD COLUMN IF NOT EXISTS weekly_overrides jsonb DEFAULT '{}';
