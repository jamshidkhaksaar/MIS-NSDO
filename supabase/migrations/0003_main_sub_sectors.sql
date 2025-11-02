CREATE TABLE IF NOT EXISTS main_sectors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_sectors (
  id BIGSERIAL PRIMARY KEY,
  main_sector_id BIGINT NOT NULL REFERENCES main_sectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(main_sector_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sub_sectors_main_sector_id ON sub_sectors(main_sector_id);
