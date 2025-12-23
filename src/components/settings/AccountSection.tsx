"use client"

import { useState } from "react"
import { User, Crown, LogOut, ExternalLink, Save, Loader2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth"
import { createRDService } from "@/services/realdebrid"

export function AccountSection() {
  const { rdUser, rdApiToken, setRdAuth, clearRdAuth } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [tokenInput, setTokenInput] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return

    setIsValidating(true)
    setError(null)

    try {
      const rd = createRDService(tokenInput.trim())
      const user = await rd.getUser()
      setRdAuth(tokenInput.trim(), user)
      setIsEditing(false)
      setTokenInput("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid API token")
    } finally {
      setIsValidating(false)
    }
  }

  const handleDisconnect = () => {
    clearRdAuth()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5" />
        <h3 className="font-semibold">Account</h3>
      </div>

      {/* RealDebrid */}
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">RealDebrid</p>
            {rdUser?.premium && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Crown className="h-3 w-3" />
                Premium
              </Badge>
            )}
          </div>

          {rdUser ? (
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="break-all">{rdUser.email}</p>
              {rdUser.expiration && (
                <p>
                  Expires: {new Date(rdUser.expiration).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : rdApiToken && !isEditing ? (
            <p className="text-sm text-muted-foreground">Token configured (user info unavailable)</p>
          ) : !isEditing ? (
            <p className="text-sm text-muted-foreground">Not connected</p>
          ) : null}

          {/* Token input form */}
          {isEditing && (
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Paste your RealDebrid API token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                disabled={isValidating}
                className="font-mono text-sm"
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveToken}
                  disabled={!tokenInput.trim() || isValidating}
                >
                  {isValidating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isValidating ? "Validating..." : "Save Token"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setTokenInput("")
                    setError(null)
                  }}
                  disabled={isValidating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {rdApiToken ? "Change Token" : "Enter Token"}
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href="https://real-debrid.com/apitoken"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Get Token
                  </a>
                </Button>
              </>
            )}
            {rdApiToken && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDisconnect}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Trakt - placeholder for future implementation */}
      <div className="p-4 rounded-lg border bg-card opacity-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium">Trakt</p>
            <p className="text-sm text-muted-foreground">
              Sync watch history and progress
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Coming Soon
          </Badge>
        </div>
      </div>
    </div>
  )
}
