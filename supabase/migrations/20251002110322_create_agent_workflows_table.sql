-- Create Agent Workflows table
CREATE TABLE public.agent_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    platform_id TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'vapi',
    name TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_agent_workflows_client_id ON public.agent_workflows(client_id);
CREATE INDEX idx_agent_workflows_organization_id ON public.agent_workflows(organization_id);
CREATE INDEX idx_agent_workflows_platform_id ON public.agent_workflows(platform_id);

-- Create updated_at trigger
CREATE TRIGGER update_agent_workflows_updated_at
    BEFORE UPDATE ON public.agent_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

