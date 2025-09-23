-- Complete Database Schema Migration - Tables and Indexes Only
-- This migration creates tables, indexes, and updated_at triggers only
-- Created: 2024-09-18

-- Create enums
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE user_type AS ENUM ('platform', 'clients');

-- Create users table
CREATE TABLE public.users (
  id uuid references auth.users not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  type user_type default 'platform',
  selected_organization_id uuid,
  client_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create organizations table
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    vapi_api_key TEXT,
    stripe_api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    domain TEXT UNIQUE
);

-- Create clients table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    twilio_account_sid TEXT,
    twilio_auth_token TEXT
);

-- Create agents table
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    platform_id TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id),
    platform TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    data JSONB
);

-- Create calls table
CREATE TABLE public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id),
    client_id UUID NOT NULL REFERENCES public.clients(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    seconds INTEGER NOT NULL DEFAULT 0,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    minutes_included INTEGER DEFAULT 0,
    price_per_minute_cents INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'usd',
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    stripe_product_id TEXT,
    stripe_billing_meter_id TEXT,
    stripe_base_price_id TEXT,
    billing_interval TEXT DEFAULT 'month',
    stripe_usage_price_id TEXT,
    billing_meter_event_name TEXT,
    base_price_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create client_invitations table
CREATE TABLE public.client_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id),
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    status invitation_status NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create clients_products junction table
CREATE TABLE public.clients_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(client_id, product_id)
);

-- Create user_organizations junction table
CREATE TABLE public.user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    role organization_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, organization_id)
);

-- Create organization_invitations table
CREATE TABLE public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    invited_email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    role organization_role NOT NULL DEFAULT 'member',
    status invitation_status NOT NULL DEFAULT 'pending',
    token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    status TEXT NOT NULL,
    
    -- Base pricing info
    base_price_id TEXT,
    base_amount_cents INTEGER DEFAULT 0,
    minutes_included INTEGER DEFAULT 0,
    
    -- Usage pricing info
    usage_price_id TEXT,
    per_second_price_cents NUMERIC(10, 6) DEFAULT 0,
    billing_meter_id TEXT,
    billing_meter_event_name TEXT,
    
    -- Subscription periods
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    
    -- Payment method info
    payment_method_brand TEXT,
    payment_method_last4 TEXT,
    
    -- Sync tracking
    synced_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create phone_numbers table
CREATE TABLE public.phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    source TEXT,
    twilio_account_sid TEXT,
    twilio_auth_token TEXT,
    agent_id uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add foreign key constraints after all tables are created
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_selected_organization 
FOREIGN KEY (selected_organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.users 
ADD CONSTRAINT fk_users_client 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.phone_numbers 
ADD CONSTRAINT fk_phone_numbers_agent 
FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE SET NULL;


-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_type ON public.users(type);
CREATE INDEX idx_users_selected_organization ON public.users(selected_organization_id);
CREATE INDEX idx_users_client_id ON public.users(client_id);
CREATE INDEX idx_user_organizations_user_id ON public.user_organizations(user_id);
CREATE INDEX idx_user_organizations_organization_id ON public.user_organizations(organization_id);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_vapi_api_key ON public.organizations(vapi_api_key) WHERE vapi_api_key IS NOT NULL;
CREATE INDEX idx_organizations_stripe_api_key ON public.organizations(stripe_api_key) WHERE stripe_api_key IS NOT NULL;
CREATE INDEX idx_invitations_token ON public.organization_invitations(token);
CREATE INDEX idx_invitations_email ON public.organization_invitations(invited_email);
CREATE INDEX idx_invitations_organization_id ON public.organization_invitations(organization_id);

-- Indexes for new tables
CREATE INDEX idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX idx_clients_stripe_customer_id ON public.clients(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_agents_organization_id ON public.agents(organization_id);
CREATE INDEX idx_agents_client_id ON public.agents(client_id);
CREATE INDEX idx_agents_platform_id ON public.agents(platform_id);
CREATE INDEX idx_agents_platform ON public.agents(platform);
CREATE INDEX idx_calls_agent_id ON public.calls(agent_id);
CREATE INDEX idx_calls_client_id ON public.calls(client_id);
CREATE INDEX idx_calls_organization_id ON public.calls(organization_id);
CREATE INDEX idx_calls_created_at ON public.calls(created_at);
CREATE INDEX idx_calls_seconds ON public.calls(seconds);
CREATE INDEX idx_products_organization_id ON public.products(organization_id);
CREATE INDEX idx_products_stripe_product_id ON public.products(stripe_product_id) WHERE stripe_product_id IS NOT NULL;
CREATE INDEX idx_products_stripe_billing_meter_id ON public.products(stripe_billing_meter_id) WHERE stripe_billing_meter_id IS NOT NULL;
CREATE INDEX idx_client_invitations_client_id ON public.client_invitations(client_id);
CREATE INDEX idx_client_invitations_email ON public.client_invitations(email);
CREATE INDEX idx_client_invitations_token ON public.client_invitations(token);
CREATE INDEX idx_client_invitations_status ON public.client_invitations(status);
CREATE INDEX idx_clients_products_client_id ON public.clients_products(client_id);
CREATE INDEX idx_clients_products_product_id ON public.clients_products(product_id);
CREATE INDEX idx_clients_products_organization_id ON public.clients_products(organization_id);
CREATE INDEX idx_subscriptions_client_id ON public.subscriptions(client_id);
CREATE INDEX idx_subscriptions_organization_id ON public.subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);
CREATE INDEX idx_phone_numbers_client_id ON public.phone_numbers(client_id);
CREATE INDEX idx_phone_numbers_organization_id ON public.phone_numbers(organization_id);
CREATE INDEX idx_phone_numbers_phone_number ON public.phone_numbers(phone_number);
CREATE INDEX idx_phone_numbers_twilio_account_sid ON public.phone_numbers(twilio_account_sid) WHERE twilio_account_sid IS NOT NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_organizations_updated_at
    BEFORE UPDATE ON public.user_organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON public.calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_invitations_updated_at
    BEFORE UPDATE ON public.client_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_products_updated_at
    BEFORE UPDATE ON public.clients_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phone_numbers_updated_at
    BEFORE UPDATE ON public.phone_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $func$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$func$ language plpgsql security definer;

-- Create trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update() 
RETURNS TRIGGER AS $func$
BEGIN
  UPDATE public.users 
  SET 
    email = new.email,
    updated_at = timezone('utc'::text, now())
  WHERE id = new.id;
  RETURN new;
END;
$func$ language plpgsql security definer;