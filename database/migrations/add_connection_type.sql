-- Add connection_type column to mailboxes table
ALTER TABLE mailboxes 
ADD COLUMN IF NOT EXISTS connection_type VARCHAR(50) DEFAULT 'imap';

-- Update existing records to have 'imap' as connection_type
UPDATE mailboxes 
SET connection_type = 'imap' 
WHERE connection_type IS NULL;

-- Make connection_type NOT NULL after setting defaults
ALTER TABLE mailboxes 
ALTER COLUMN connection_type SET NOT NULL;
