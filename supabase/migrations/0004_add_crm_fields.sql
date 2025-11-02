-- Add new columns to the complaints table
ALTER TABLE complaints
ADD COLUMN village TEXT,
ADD COLUMN gender TEXT,
ADD COLUMN source_of_complaint TEXT,
ADD COLUMN category TEXT,
ADD COLUMN complaint_type TEXT,
ADD COLUMN summary TEXT,
ADD COLUMN how_reported TEXT,
ADD COLUMN referred_to TEXT,
ADD COLUMN date_sent TIMESTAMPTZ,
ADD COLUMN response_given BOOLEAN;
