"use client"

import { useState } from "react"
import { ExternalLink, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOnboarding } from "@/hooks/useOnboarding"
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
  error: parentError,
}: RealDebridStepProps) {
  const { startRdAuth, pollRdAuth } = useOnboarding()
  const [deviceCode, setDeviceCode] = useState<{
    device_code: string
    user_code: string
    verification_url: string
    direct_verification_url: string
    interval: number
    expires_in: number
  } | null>(null)
  const [validatedUser, setValidatedUser] = useState<RDUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  const handleStartAuth = async () => {
    try {
      setError(null)
      const code = await startRdAuth()
      setDeviceCode(code)

      // Start polling
      setIsPolling(true)
      const intervalId = setInterval(async () => {
        try {
          const user = await pollRdAuth(code.device_code)
          if (user) {
            clearInterval(intervalId)
            setValidatedUser(user)
            setIsPolling(false)
          }
        } catch (e) {
          // If error (other than waiting), stop polling
          clearInterval(intervalId)
          setIsPolling(false)
          setError("Authentication failed. Please try again.")
        }
      }, code.interval * 1000)

      // Stop polling after expiration
      setTimeout(() => {
        clearInterval(intervalId)
        if (!validatedUser) {
          setIsPolling(false)
          setError("Code expired. Please try again.")
        }
      }, code.expires_in * 1000)

    } catch (e) {
      setError("Failed to start authentication")
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
    <div className="space-y-6">
      {!deviceCode ? (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Connect your RealDebrid account to enable high-speed secure streaming.
          </p>
          <Button onClick={handleStartAuth} className="w-full" size="lg">
            Connect RealDebrid
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Enter Code</h3>
            <div className="flex items-center justify-center gap-4">
              <div className="text-3xl font-mono tracking-widest bg-muted p-4 rounded-lg border">
                {deviceCode.user_code}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Please visit strict URL to authorize:
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(deviceCode.verification_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              {deviceCode.verification_url}
            </Button>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Waiting for authorization...
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
