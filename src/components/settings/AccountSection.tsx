"use client"

import { User, Crown, LogOut, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/stores/auth"

export function AccountSection() {
  const { rdUser, rdApiToken, clearRdAuth } = useAuthStore()

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
          ) : (
            <p className="text-sm text-muted-foreground">Not connected</p>
          )}

          <div className="pt-1">
            {rdApiToken ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDisconnect}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://real-debrid.com/apitoken"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get Token
                </a>
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
