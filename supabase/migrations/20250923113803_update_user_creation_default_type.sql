-- Update user creation function to set default type as 'platform'
-- This ensures all new users get a default type unless explicitly set otherwise

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $func$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, type)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'platform'  -- Default type for new users
  );
  RETURN new;
END;
$func$ language plpgsql security definer;
