-- Add platform columns to phone_numbers table
ALTER TABLE public.phone_numbers 
ADD COLUMN platform_id TEXT,
ADD COLUMN platform TEXT;

-- Add index on platform for better query performance
CREATE INDEX IF NOT EXISTS idx_phone_numbers_platform ON public.phone_numbers(platform);

-- Add index on platform_id for better query performance  
CREATE INDEX IF NOT EXISTS idx_phone_numbers_platform_id ON public.phone_numbers(platform_id);
