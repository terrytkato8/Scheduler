-- Add file tracking and reformatted content to documents
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS original_content text,
  ADD COLUMN IF NOT EXISTS reformatted_content text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_type text; -- 'manual' | 'local_upload' | 'google_drive'
