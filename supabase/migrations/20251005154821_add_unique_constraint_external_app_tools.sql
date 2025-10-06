-- Add unique constraint to prevent duplicate tool names within the same client and agent
-- This ensures each client can only have one tool with a given name per agent
ALTER TABLE external_app_tools
ADD CONSTRAINT unique_tool_name_per_client_agent 
UNIQUE (name, client_id, agent_id);
