# Resend Email Configuration for Supabase

## Overview
This document explains how to configure Supabase to use Resend for sending verification emails via the mail.biziscan.com domain.

## Configuration Changes Made

### 1. Supabase Config Updates
The following changes have been made to `supabase/config.toml`:

- **Enabled SMTP**: Configured Resend SMTP settings
- **Disabled Inbucket**: Turned off the local email testing server since we're using real email delivery
- **Email Configuration**: Set up mail.biziscan.com domain

### 2. SMTP Settings
```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 587
user = "resend"
pass = "env(RESEND_API_KEY)"
admin_email = "admin@mail.biziscan.com"
sender_name = "Biziscan"
```

## Required Environment Variables

You need to create a `.env` file in your project root with the following:

```bash
# Resend API Configuration
RESEND_API_KEY=your_actual_resend_api_key_here
```

## Setup Instructions

### 1. Get Resend API Key
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key
3. Copy the API key

### 2. Configure Domain in Resend
1. In your Resend dashboard, add and verify the domain `mail.biziscan.com`
2. Follow Resend's domain verification process
3. Ensure the domain is properly configured for sending emails

### 3. Set Environment Variable
Create a `.env` file in your project root:
```bash
RESEND_API_KEY=re_YourActualApiKey_Here
```

### 4. Restart Supabase
After making these changes, restart your local Supabase instance:
```bash
supabase stop
supabase start
```

## Testing Email Delivery

Once configured, test the email delivery by:

1. Signing up a new user
2. Triggering a password reset
3. Check that emails are sent via Resend instead of appearing in the local Inbucket interface

## Troubleshooting

- **Domain not verified**: Ensure `mail.biziscan.com` is properly verified in your Resend dashboard
- **API Key issues**: Double-check your RESEND_API_KEY is correct and has proper permissions
- **SMTP errors**: Check Supabase logs for detailed error messages

## Important Notes

- The Inbucket email testing interface is now disabled
- All verification emails will be sent through Resend to real email addresses
- Make sure your Resend account has sufficient sending limits for your needs
