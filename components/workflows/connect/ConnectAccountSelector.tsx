'use client'

import { useState } from "react"
import { ConnectAccountButton } from "./ConnectAccountButton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ConnectAccountSelectorProps {
  clientId: string
  onSuccess?: (account: any, app: string) => void
}

const POPULAR_APPS = [
  { slug: "google_sheets", name: "Google Sheets", icon: "📊" },
  { slug: "github", name: "GitHub", icon: "🐙" },
  { slug: "notion", name: "Notion", icon: "📝" },
  { slug: "gmail", name: "Gmail", icon: "📧" },
  { slug: "slack", name: "Slack", icon: "💬" },
  { slug: "openai", name: "OpenAI", icon: "🤖" },
  { slug: "airtable", name: "Airtable", icon: "🗂️" },
  { slug: "hubspot", name: "HubSpot", icon: "🎯" },
]

export function ConnectAccountSelector({
  clientId,
  onSuccess
}: ConnectAccountSelectorProps) {
  const [customApp, setCustomApp] = useState("")
  const [filter, setFilter] = useState("")

  const filteredApps = POPULAR_APPS.filter(app =>
    app.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="search">Search Apps</Label>
        <Input
          id="search"
          placeholder="Search for an app..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="mb-3 block">Popular Apps</Label>
        <div className="grid grid-cols-2 gap-3">
          {filteredApps.map((app) => (
            <ConnectAccountButton
              key={app.slug}
              app={app.slug}
              clientId={clientId}
              onSuccess={(account) => onSuccess?.(account, app.slug)}
              className="justify-start h-auto py-4 px-4"
            >
              <span className="mr-2 text-xl">{app.icon}</span>
              <span className="font-medium">{app.name}</span>
            </ConnectAccountButton>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="custom-app" className="mb-2 block">
          Or enter a custom app slug
        </Label>
        <div className="flex gap-2">
          <Input
            id="custom-app"
            placeholder="e.g., salesforce, dropbox, twitter"
            value={customApp}
            onChange={(e) => setCustomApp(e.target.value)}
          />
          <ConnectAccountButton
            app={customApp}
            clientId={clientId}
            onSuccess={(account) => onSuccess?.(account, customApp)}
            disabled={!customApp.trim()}
          >
            Connect
          </ConnectAccountButton>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Find app slugs at{" "}
          <a
            href="https://pipedream.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            pipedream.com/apps
          </a>
        </p>
      </div>
    </div>
  )
}

