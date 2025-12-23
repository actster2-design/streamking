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

  const validateRdToken = useCallback(async (token: string): Promise<RDUser | null> => {
    setIsValidating(true)
    setError(null)

    try {
      const rd = createRDService(token)
      const user = await rd.getUser()

      // Check if premium
      if (!user.premium) {
        setError("RealDebrid account must have premium status")
        return null
      }

      // Save to store
      setRdAuth(token, user)
      return user
    } catch {
      setError("Invalid API token. Please check and try again.")
      return null
    } finally {
      setIsValidating(false)
    }
  }, [setRdAuth])

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
    completeOnboarding,
    canSkipProvider: providers.length > 0,
  }
}
