-- Add branding fields to organizations table
ALTER TABLE organizations 
ADD COLUMN logo_url TEXT,
ADD COLUMN tab_title TEXT;

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true);
