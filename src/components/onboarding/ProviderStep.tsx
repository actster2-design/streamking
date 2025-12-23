"use client"

import { useState } from "react"
import { Plus, Trash2, ExternalLink, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProvidersStore } from "@/stores/providers"

interface ProviderStepProps {
  onComplete: () => void
  canSkip: boolean
}

export function ProviderStep({ onComplete, canSkip }: ProviderStepProps) {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { providers, addProvider, removeProvider } = useProvidersStore()

  const handleAdd = () => {
    setError(null)

    if (!name.trim() || !url.trim()) {
      setError("Please enter both name and URL")
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setError("Please enter a valid URL")
      return
    }

    addProvider({
      name: name.trim(),
      url: url.trim().replace(/\/$/, ""), // Remove trailing slash
      enabled: true,
    })

    setName("")
    setUrl("")
  }

  const hasProviders = providers.length > 0

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-500">What is a Provider?</p>
            <p className="text-muted-foreground mt-1">
              A provider is a service that finds stream sources for movies and TV shows.
              Stream King is compatible with Stremio addons and Torznab indexers.
            </p>
          </div>
        </div>
      </div>

      {/* Existing providers */}
      {hasProviders && (
        <div className="space-y-2">
          <Label>Your Providers</Label>
          <div className="space-y-2">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card border"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{provider.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {provider.url}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProvider(provider.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add provider form */}
      <div className="space-y-4 p-4 rounded-lg border border-dashed">
        <div className="space-y-2">
          <Label htmlFor="provider-name">Provider Name</Label>
          <Input
            id="provider-name"
            placeholder="e.g., My Stremio Addon"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider-url">Provider URL</Label>
          <Input
            id="provider-url"
            placeholder="https://example.com/manifest.json"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {/* Quick add Torrentio */}
      {!providers.some(p => p.url.includes("torrentio.strem.fun")) && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-sm font-medium text-green-500 mb-2">Recommended Provider</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Torrentio</p>
              <p className="text-xs text-muted-foreground">Configure at torrentio.strem.fun first</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href="https://torrentio.strem.fun/configure"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Configure
              </a>
            </Button>
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <p>
          Looking for more providers? Check out{" "}
          <a
            href="https://stremio-addons.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            Stremio Addon Catalog
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>

      <div className="flex gap-3">
        {!hasProviders && canSkip && (
          <Button variant="outline" className="flex-1" onClick={onComplete}>
            Skip for Now
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={onComplete}
          disabled={!hasProviders && !canSkip}
        >
          {hasProviders ? "Continue" : "Add a Provider to Continue"}
        </Button>
      </div>
    </div>
  )
}
