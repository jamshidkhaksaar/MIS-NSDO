-- Enforce row level security on sector taxonomy tables
ALTER TABLE main_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_sectors ENABLE ROW LEVEL SECURITY;

-- Default deny for anonymous access
CREATE POLICY anon_block_main_sectors ON main_sectors FOR ALL TO anon USING (false);
CREATE POLICY anon_block_sub_sectors ON sub_sectors FOR ALL TO anon USING (false);
