-- Add vapi_knowledge_base_id column to knowledge_base table
ALTER TABLE knowledge_base 
ADD COLUMN vapi_knowledge_base_id TEXT;

-- Create index for better performance on vapi_knowledge_base_id lookups
CREATE INDEX idx_knowledge_base_vapi_knowledge_base_id ON knowledge_base(vapi_knowledge_base_id);
