-- Add workflow_id column to phone_numbers table
ALTER TABLE public.phone_numbers
ADD COLUMN workflow_id UUID REFERENCES public.agent_workflows(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_phone_numbers_workflow_id ON public.phone_numbers(workflow_id);

-- Add constraint to ensure phone number can only be assigned to either an agent OR a workflow, not both
ALTER TABLE public.phone_numbers
ADD CONSTRAINT phone_number_assignment_check 
CHECK (
    (agent_id IS NOT NULL AND workflow_id IS NULL) OR
    (agent_id IS NULL AND workflow_id IS NOT NULL) OR
    (agent_id IS NULL AND workflow_id IS NULL)
);

