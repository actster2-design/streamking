"use client"

import { useState } from "react"
import { Link2, Plus, Trash2, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useProvidersStore } from "@/stores/providers"
import { cn } from "@/lib/utils"

export function ProvidersSection() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const {
    providers,
    activeProviderId,
    addProvider,
    removeProvider,
    setActiveProvider,
    toggleProvider,
  } = useProvidersStore()

  const handleAdd = () => {
    setError(null)

    if (!name.trim() || !url.trim()) {
      setError("Name and URL are required")
      return
    }

    try {
      new URL(url)
    } catch {
      setError("Invalid URL format")
      return
    }

    addProvider({
      name: name.trim(),
      url: url.trim().replace(/\/$/, ""),
      enabled: true,
    })

    setName("")
    setUrl("")
    setShowAddForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          <h3 className="font-semibold">Stream Providers</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Provider list */}
      {providers.length > 0 ? (
        <div className="space-y-2">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={cn(
                "p-4 rounded-lg border bg-card transition-colors",
                activeProviderId === provider.id && "border-primary"
              )}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{provider.name}</p>
                  {activeProviderId === provider.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>

                <p className="text-xs text-muted-foreground break-all">
                  {provider.url}
                </p>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={() => toggleProvider(provider.id)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {provider.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  {activeProviderId !== provider.id && provider.enabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setActiveProvider(provider.id)}
                    >
                      Set as Active
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => removeProvider(provider.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-lg border border-dashed text-center">
          <p className="text-muted-foreground mb-4">No providers configured</p>
          <Button variant="outline" asChild>
            <a
              href="https://torrentio.strem.fun/configure"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Configure Torrentio
            </a>
          </Button>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider-name">Name</Label>
            <Input
              id="provider-name"
              placeholder="My Provider"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider-url">URL</Label>
            <Input
              id="provider-url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handleAdd} className="flex-1">
              Add Provider
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false)
                setName("")
                setUrl("")
                setError(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
