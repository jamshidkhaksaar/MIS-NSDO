ALTER TABLE branding_settings
  ADD COLUMN IF NOT EXISTS logo_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS favicon_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS favicon_url TEXT;
