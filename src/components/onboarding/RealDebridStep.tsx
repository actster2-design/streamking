"use client"

import { useState } from "react"
import { ExternalLink, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { RDUser } from "@/types"

interface RealDebridStepProps {
  onValidate: (token: string) => Promise<RDUser | null>
  onSuccess: () => void
  isValidating: boolean
  error: string | null
}

export function RealDebridStep({
  onValidate,
  onSuccess,
  isValidating,
  error,
}: RealDebridStepProps) {
  const [token, setToken] = useState("")
  const [validatedUser, setValidatedUser] = useState<RDUser | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return

    const user = await onValidate(token.trim())
    if (user) {
      setValidatedUser(user)
    }
  }

  if (validatedUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
          <div>
            <p className="font-medium text-green-500">Connected!</p>
            <p className="text-sm text-muted-foreground">
              Logged in as {validatedUser.username}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Account</p>
              <p className="font-medium">{validatedUser.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Premium Until</p>
              <p className="font-medium">
                {new Date(validatedUser.expiration).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <Button onClick={onSuccess} className="w-full" size="lg">
          Continue
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="rd-token">RealDebrid API Token</Label>
        <Input
          id="rd-token"
          type="password"
          placeholder="Enter your API token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={isValidating}
          className="font-mono"
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      <div className="p-4 rounded-lg bg-muted/50 space-y-3">
        <p className="text-sm text-muted-foreground">
          To get your API token:
        </p>
        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
          <li>Go to RealDebrid API Key page</li>
          <li>Copy your private API token</li>
          <li>Paste it above</li>
        </ol>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          asChild
        >
          <a
            href="https://real-debrid.com/apitoken"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            Open RealDebrid API Page
          </a>
        </Button>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!token.trim() || isValidating}
      >
        {isValidating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Validating...
          </>
        ) : (
          "Connect RealDebrid"
        )}
      </Button>
    </form>
  )
}
