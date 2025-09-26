-- Create agent_routing_rules table
CREATE TABLE IF NOT EXISTS agent_routing_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT NOT NULL,
    client_id UUID,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days TEXT[] NOT NULL DEFAULT '{}', -- Array of day abbreviations: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    route_to TEXT NOT NULL, -- Phone number to route to
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_routing_rules_agent_id ON agent_routing_rules(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_routing_rules_client_id ON agent_routing_rules(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_routing_rules_organization_id ON agent_routing_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_routing_rules_enabled ON agent_routing_rules(enabled);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_routing_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_routing_rules_updated_at
    BEFORE UPDATE ON agent_routing_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_routing_rules_updated_at();
