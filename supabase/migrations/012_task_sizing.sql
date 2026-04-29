-- Add t-shirt sizing and cycle time tracking to tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS size_estimate text CHECK (size_estimate IN ('XS','S','M','L','XL')),
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;
