-- Disable RLS on the organization-logos bucket
UPDATE storage.buckets 
SET public = true 
WHERE id = 'organization-logos';

-- Remove any existing RLS policies on storage.objects for organization-logos bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete organization logos" ON storage.objects;

-- Create a permissive policy that allows all operations on organization-logos bucket
CREATE POLICY "Allow all operations on organization logos" ON storage.objects
FOR ALL USING (bucket_id = 'organization-logos');
