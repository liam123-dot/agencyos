-- Create knowledge table
CREATE TABLE knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID,
    organization_id UUID NOT NULL,
    external_id TEXT,
    knowledge_base_id UUID,
    type TEXT NOT NULL CHECK (type IN ('website', 'file', 'text')),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'failed', 'succeeded')),
    
    -- Website-specific fields
    url TEXT,
    
    -- File-specific fields
    file_name TEXT,
    
    -- Text-specific fields
    content TEXT,
    word_count INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints to ensure required fields per type
    CONSTRAINT website_fields_check CHECK (
        (type != 'website') OR (url IS NOT NULL)
    ),
    CONSTRAINT file_fields_check CHECK (
        (type != 'file') OR (file_name IS NOT NULL)
    ),
    CONSTRAINT text_fields_check CHECK (
        (type != 'text') OR (content IS NOT NULL)
    )
);

-- Create indexes for better performance
CREATE INDEX idx_knowledge_client_id ON knowledge(client_id);
CREATE INDEX idx_knowledge_organization_id ON knowledge(organization_id);
CREATE INDEX idx_knowledge_knowledge_base_id ON knowledge(knowledge_base_id);
CREATE INDEX idx_knowledge_external_id ON knowledge(external_id);
CREATE INDEX idx_knowledge_type ON knowledge(type);
CREATE INDEX idx_knowledge_status ON knowledge(status);
CREATE INDEX idx_knowledge_created_at ON knowledge(created_at);

-- Create updated_at trigger (reuse existing function)
CREATE TRIGGER update_knowledge_updated_at
    BEFORE UPDATE ON knowledge
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraints (assuming these tables exist)
-- ALTER TABLE knowledge ADD CONSTRAINT fk_knowledge_knowledge_base 
--     FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_base(id) ON DELETE CASCADE;
