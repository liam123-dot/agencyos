-- Add VAPI publishable key column to organizations table
-- Created: 2024-09-23

ALTER TABLE public.organizations 
ADD COLUMN vapi_publishable_key TEXT;

-- Create index for the new column when it has a value
CREATE INDEX idx_organizations_vapi_publishable_key 
ON public.organizations(vapi_publishable_key) 
WHERE vapi_publishable_key IS NOT NULL;

