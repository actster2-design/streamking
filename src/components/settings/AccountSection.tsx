"use client"

import { useState, useEffect, useRef } from "react"
import { User, Crown, LogOut, ExternalLink, Save, Loader2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/stores/auth"
import { createRDService } from "@/services/realdebrid"
import type { RDUser } from "@/types"

export function AccountSection() {
  const { rdUser, rdApiToken, setRdAuth, clearRdAuth } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [tokenInput, setTokenInput] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTauri, setIsTauri] = useState(false)

  // Detect Tauri on client side
  useEffect(() => {
    const win = window as unknown as { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown };
    const checkTauri = !!(win.__TAURI__ || win.__TAURI_INTERNALS__);
    setIsTauri(checkTauri)
  }, [])

  // Track if we've attempted validation
  const validationAttempted = useRef(false)

  // Auto-validate token on mount if we have a token but no user info
  // Skip validation in Tauri to avoid network issues - token will be used directly
  useEffect(() => {
    const validateExistingToken = async () => {
      // Skip if already attempted, no token, or user already loaded
      if (validationAttempted.current || !rdApiToken || rdUser) return
      validationAttempted.current = true

      // In Tauri, skip validation - just use the token directly
      // The token will be validated when actually making API calls
      if (isTauri) {
        console.log("Tauri detected - skipping token validation, using token directly")
        return
      }

      setIsValidating(true)
      setError(null)

      try {
        // Browser: use fetch directly
        const rd = createRDService(rdApiToken)
        const user = await rd.getUser()
        // Legacy/manual token doesn't have OAuth refresh data
        setRdAuth(rdApiToken, "", "", "", 0, user)
      } catch (err) {
        console.error("Token validation failed:", err)
        setError(err instanceof Error ? err.message : "Token validation failed")
      } finally {
        setIsValidating(false)
      }
    }

    validateExistingToken()
  }, [rdApiToken, rdUser, setRdAuth, isTauri])

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return

    setIsValidating(true)
    setError(null)

    try {
      // In Tauri, skip validation and just save the token directly
      if (isTauri) {
        // Create a placeholder user object for Tauri
        const placeholderUser: RDUser = {
          id: 0,
          username: "RealDebrid User",
          email: "configured@realdebrid.com",
          points: 0,
          locale: "en",
          avatar: "",
          type: "premium",
          premium: 1,
          expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }
        setRdAuth(tokenInput.trim(), "", "", "", 0, placeholderUser)
        setIsEditing(false)
        setTokenInput("")
      } else {
        // In browser, use the service directly
        const rd = createRDService(tokenInput.trim())
        const user = await rd.getUser()
        setRdAuth(tokenInput.trim(), "", "", "", 0, user)
        setIsEditing(false)
        setTokenInput("")
      }
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
