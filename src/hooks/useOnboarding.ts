"use client"

import { useState, useCallback } from "react"
import { useAuthStore } from "@/stores/auth"
import { useProvidersStore } from "@/stores/providers"
import { createRDService } from "@/services/realdebrid"
import type { RDUser } from "@/types"

export type OnboardingStep = "welcome" | "realdebrid" | "provider" | "complete"

interface UseOnboardingReturn {
  currentStep: OnboardingStep
  isValidating: boolean
  error: string | null
  goToStep: (step: OnboardingStep) => void
  nextStep: () => void
  prevStep: () => void
  validateRdToken: (token: string) => Promise<RDUser | null>
  startRdAuth: () => Promise<{ device_code: string; user_code: string; verification_url: string; interval: number; expires_in: number; direct_verification_url: string }>
  pollRdAuth: (deviceCode: string) => Promise<RDUser | null>
  completeOnboarding: () => void
  canSkipProvider: boolean
}

const STEP_ORDER: OnboardingStep[] = ["welcome", "realdebrid", "provider", "complete"]

export function useOnboarding(): UseOnboardingReturn {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { setRdAuth, setOnboarded } = useAuthStore()
  const { providers } = useProvidersStore()

  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step)
    setError(null)
  }, [])

  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep)
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1])
      setError(null)
    }
  }, [currentStep])

  const prevStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1])
      setError(null)
    }
  }, [currentStep])

  // Placeholder Client ID for open source app (should be replaced with actual registered ID)
  const RD_CLIENT_ID = "X245A4XAIBGVM"

  const startRdAuth = useCallback(async () => {
    try {
      // Create service without token for auth flow
      const rd = createRDService("")
      return await rd.getDeviceCode(RD_CLIENT_ID)
    } catch (e) {
      console.error(e)
      throw new Error("Failed to start RealDebrid authentication")
    }
  }, [])

  const pollRdAuth = useCallback(async (deviceCode: string) => {
    try {
      const rd = createRDService("")
      const { client_id, client_secret } = await rd.getCredentials(RD_CLIENT_ID, deviceCode)

      // If we got credentials, we can now get the token
      const tokenData = await rd.getToken(client_id, client_secret, deviceCode)

      // Get user info with the new token
      const rdWithToken = createRDService(tokenData.access_token)
      const user = await rdWithToken.getUser()

      // Save everything to store
      setRdAuth(
        tokenData.access_token,
        tokenData.refresh_token,
        client_id,
        client_secret,
        tokenData.expires_in,
        user
      )

      return user
    } catch (e: any) {
      if (e.message === "WAITING_FOR_APPROVAL") {
        return null // Still waiting
      }
      throw e
    }
  }, [setRdAuth])

  const validateRdToken = useCallback(async (token: string): Promise<RDUser | null> => {
    // Legacy method support if needed, or remove. 
    // Keeping for "manual token enter" fallback if we wanted it, but we are moving to OAuth.
    // We'll update the interface to strictly use OAuth ideally.
    return null
  }, [])

  const completeOnboarding = useCallback(() => {
    setOnboarded(true)
  }, [setOnboarded])

  return {
    currentStep,
    isValidating,
    error,
    goToStep,
    nextStep,
    prevStep,
    validateRdToken,
    startRdAuth,
    pollRdAuth,
    completeOnboarding,
    canSkipProvider: providers.length > 0,
  }
}
