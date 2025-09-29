-- Update knowledge table status column to include pending and not-started
-- Drop the existing check constraint
ALTER TABLE knowledge DROP CONSTRAINT knowledge_status_check;

-- Add the new check constraint with additional status values
ALTER TABLE knowledge ADD CONSTRAINT knowledge_status_check 
    CHECK (status IN ('not-started', 'pending', 'processing', 'processing-ragie', 'failed', 'succeeded'));
