-- Add trial_days column to products table
ALTER TABLE public.products
ADD COLUMN trial_days INTEGER DEFAULT 0;

-- Add comment to the column
COMMENT ON COLUMN public.products.trial_days IS 'Number of days for trial period when subscribing to this product';

