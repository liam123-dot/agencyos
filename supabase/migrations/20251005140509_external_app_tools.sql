-- Create external_app_tools table
CREATE TABLE external_app_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    label TEXT,
    description TEXT,
    function_schema JSONB NOT NULL,
    static_config JSONB,
    
    -- Pipedream metadata
    app TEXT,
    app_name TEXT,
    app_img_src TEXT,
    account_id TEXT,
    action_key TEXT,
    action_name TEXT,
    
    external_id TEXT,
    agent_id UUID NOT NULL,
    client_id UUID,
    organization_id UUID NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_external_app_tools_agent_id ON external_app_tools(agent_id);
CREATE INDEX idx_external_app_tools_client_id ON external_app_tools(client_id);
CREATE INDEX idx_external_app_tools_organization_id ON external_app_tools(organization_id);
CREATE INDEX idx_external_app_tools_external_id ON external_app_tools(external_id);
CREATE INDEX idx_external_app_tools_created_at ON external_app_tools(created_at);

-- Create updated_at trigger
CREATE TRIGGER update_external_app_tools_updated_at
    BEFORE UPDATE ON external_app_tools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
