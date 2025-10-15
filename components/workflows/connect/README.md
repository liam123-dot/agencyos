# Pipedream Connect Integration

This integration allows clients to connect their external app accounts (Google Sheets, GitHub, Slack, etc.) using the Pipedream SDK.

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Pipedream Connect Configuration
PIPEDREAM_CLIENT_ID=your_client_id
PIPEDREAM_CLIENT_SECRET=your_client_secret
PIPEDREAM_PROJECT_ID=your_project_id
NEXT_PUBLIC_PIPEDREAM_ENVIRONMENT=development
```

**Important:** 
- `PIPEDREAM_CLIENT_ID`, `PIPEDREAM_CLIENT_SECRET`, and `PIPEDREAM_PROJECT_ID` are server-only secrets (NO `NEXT_PUBLIC_` prefix)
- `NEXT_PUBLIC_PIPEDREAM_ENVIRONMENT` is public and used by both client and server (can be "development" or "production")

### 2. Get Pipedream Credentials

1. Visit [pipedream.com/projects](https://pipedream.com/projects)
2. Create a new project or select an existing one
3. Copy your **Project ID** from the Settings tab
4. Visit [API settings](https://pipedream.com/settings/api) to create an OAuth client
5. Copy the **Client ID** and **Client Secret**

## Components

### ConnectAppsInterface (Server Component)

The main component to use - displays a full-page interface with search and app grid. Automatically gets the client ID from authentication.

```tsx
import { ConnectAppsInterface } from '@/components/workflows/connect'

// In a server component or page
export default function MyPage() {
  return (
    <div>
      <ConnectAppsInterface
        // clientId is optional - automatically fetched from clientDashboardAuth()
      />
    </div>
  )
}
```

### ConnectAppsGrid (Client Component)

A grid of app cards with search functionality. **Requires client ID to be passed.**

```tsx
'use client'
import { ConnectAppsGrid } from '@/components/workflows/connect'

<ConnectAppsGrid
  clientId={clientId} // Required
  onSuccess={(account, app) => console.log('Connected', app, account)}
/>
```

### ConnectAccountButton (Client Component)

A simple button component to connect a specific app. **Requires client ID to be passed.**

```tsx
'use client'
import { ConnectAccountButton } from '@/components/workflows/connect'

// You must provide the clientId prop
<ConnectAccountButton
  app="google_sheets"
  clientId={clientId} // Required
  onSuccess={(account) => console.log('Connected:', account)}
  onError={(error) => console.error('Error:', error)}
>
  Connect Google Sheets
</ConnectAccountButton>
```

## Usage Example

The easiest way is to use the `ConnectAppsInterface` server component:

```tsx
// app/my-page/page.tsx (Server Component)
import { ConnectAppsInterface } from '@/components/workflows/connect'

export default function MyPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Connect Your Apps</h1>
      <ConnectAppsInterface />
    </div>
  )
}
```

This will display:
- A search bar at the top
- A responsive grid of app cards
- Click any app to initiate the Pipedream OAuth connection flow
- No dialogs/modals to avoid z-index issues

If you need custom handling, you can create a wrapper:

```tsx
// components/MyConnectInterface.tsx (Server Component)
import { clientDashboardAuth } from "@/app/api/clients/clientDashboardAuth"
import { ConnectAppsGrid } from '@/components/workflows/connect'

export async function MyConnectInterface() {
  const { client } = await clientDashboardAuth()
  
  return (
    <ConnectAppsGrid
      clientId={client.id}
      onSuccess={(account, app) => {
        // This runs client-side
        console.log('Connected:', app, account)
      }}
    />
  )
}
```

## Authentication

The integration uses `clientDashboardAuth()` to authenticate users. This means:

- The `ConnectAppsInterface` server component automatically fetches the client ID
- You can optionally pass a `clientId` prop if you already have it
- All token generation is scoped to the client via `authorizedToAccessClient()`
- Tokens are generated server-side and securely passed to the frontend

## Design Decisions

### No Dialogs/Modals

The interface uses a full-page grid layout instead of dialogs to avoid z-index issues with the Pipedream OAuth popup. When a user clicks on an app card, the Pipedream SDK opens a popup window for OAuth authentication.

### Search Functionality

Currently shows a filtered list of popular apps. Search will be expanded in the future to query all 2,800+ Pipedream apps via their API.

## Supported Apps

Pipedream Connect supports over 2,800+ apps including:

- Google Sheets
- GitHub
- Notion
- Gmail
- Slack
- OpenAI
- Airtable
- HubSpot
- And many more...

Find the full list and app slugs at [pipedream.com/apps](https://pipedream.com/apps)

## How It Works

1. **SDK Initialization**: When the component mounts, the Pipedream SDK is initialized with a token callback
2. **Token Generation**: When a token is needed, the SDK calls `/api/connect/token` which uses `authorizedToAccessClient()` to verify access
3. **Authentication**: The API route uses the server action to securely generate a Pipedream Connect token
4. **OAuth Flow**: The Pipedream SDK opens a secure OAuth popup window for the selected app
5. **Account Connection**: The user authorizes the app connection through Pipedream
6. **Success Callback**: Your `onSuccess` handler receives the connected account details

### Architecture

```
Client Component (ConnectAccountButton)
    ↓ 
Pipedream SDK (tokenCallback)
    ↓
API Route (/api/connect/token)
    ↓
Server Action (generateConnectToken)
    ↓
Auth Check (authorizedToAccessClient)
    ↓
Pipedream API (create token)
```

## Security

- All tokens are generated server-side and scoped to a specific client
- Tokens expire after 4 hours or after being used once
- Client authentication is enforced through `authorizedToAccessClient()` in the API route
- The API route validates the client ID before generating tokens
- OAuth secrets never reach the frontend
- Pipedream OAuth credentials are stored server-side only

