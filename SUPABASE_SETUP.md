# Local Supabase Setup

This project is configured to work with a local Supabase database for development.

## What's Been Set Up

### 1. Database Schema
- **Users Table**: Automatically created when users sign up
- **Row Level Security (RLS)**: Users can only see and update their own profiles
- **Database Triggers**: Automatically create user records when someone signs up through auth

### 2. Database Structure

```sql
-- Users table schema
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 3. Automatic User Creation
When someone signs up through your app:
1. Supabase Auth creates a record in `auth.users`
2. A database trigger (`on_auth_user_created`) automatically creates a corresponding record in `public.users`
3. The user's email and any metadata (full_name, avatar_url) are copied over

## Getting Started

### Prerequisites
- Docker (for running local Supabase)
- Node.js and npm

### 1. Start Local Supabase
```bash
supabase start
```

This will start all Supabase services locally:
- **API URL**: http://127.0.0.1:54321
- **Studio URL**: http://127.0.0.1:54323 (Database management UI)
- **Inbucket URL**: http://127.0.0.1:54324 (Local email testing)

### 2. Environment Configuration
The `.env.local` file is already configured with local Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Start Your App
```bash
npm run dev
```

### 4. Test User Registration
1. Go to http://localhost:3000/auth/sign-up
2. Create a new account
3. Check the Supabase Studio at http://127.0.0.1:54323
4. Navigate to Table Editor → users to see your new user record

## Database Management

### Supabase Studio
Access the local database management interface at http://127.0.0.1:54323

### Useful Commands
```bash
# Reset database (applies all migrations)
supabase db reset

# Stop local services
supabase stop

# View logs
supabase logs

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

### Email Testing
Local email testing is available at http://127.0.0.1:54324
All emails (confirmations, password resets) will be captured here instead of being sent.

## Database Triggers

### User Creation Trigger
```sql
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;
```

### User Update Trigger
Automatically updates the users table when auth user data changes.

## Security

### Row Level Security (RLS)
- Users can only view their own profile
- Users can only update their own profile
- Service role can access all data (for admin functions)

### Policies
```sql
-- Users can view own profile
create policy "Users can view own profile" 
  on public.users for select 
  using (auth.uid() = id);

-- Users can update own profile
create policy "Users can update own profile" 
  on public.users for update 
  using (auth.uid() = id);
```

## Troubleshooting

### Port Conflicts
If you get port conflicts when starting Supabase:
```bash
# Stop any running Supabase projects
supabase stop --project-id [project-id]

# Or configure different ports in supabase/config.toml
```

### Database Issues
```bash
# Reset the entire database
supabase db reset

# View migration status
supabase migration list
```

### Connection Issues
Make sure your `.env.local` file has the correct local URLs and that Supabase is running.

## Production Deployment

When deploying to production:
1. Create a new Supabase project at https://supabase.com
2. Run your migrations: `supabase db push`
3. Update your environment variables with production URLs
4. Set up proper RLS policies for production data

## Migration Files

Database schema changes are stored in `supabase/migrations/`:
- `20240911_create_users_table.sql` - Initial users table and triggers

To create new migrations:
```bash
supabase migration new your_migration_name
```
