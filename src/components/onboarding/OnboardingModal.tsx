"use client"

import { Tv, ChevronRight, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RealDebridStep } from "./RealDebridStep"
import { ProviderStep } from "./ProviderStep"
import { useOnboarding, type OnboardingStep } from "@/hooks/useOnboarding"
import { cn } from "@/lib/utils"

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STEPS: { id: OnboardingStep; title: string }[] = [
  { id: "welcome", title: "Welcome" },
  { id: "realdebrid", title: "RealDebrid" },
  { id: "provider", title: "Provider" },
  { id: "complete", title: "Complete" },
]

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const {
    currentStep,
    isValidating,
    error,
    nextStep,
    validateRdToken,
    completeOnboarding,
    canSkipProvider,
  } = useOnboarding()

  const handleComplete = () => {
    completeOnboarding()
    onOpenChange(false)
  }

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index <= currentStepIndex
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 transition-colors",
                    index < currentStepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Welcome step */}
        {currentStep === "welcome" && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                <Tv className="h-8 w-8 text-primary-foreground" />
              </div>
              <DialogTitle className="text-2xl">Welcome to Stream King</DialogTitle>
              <DialogDescription className="text-base">
                Let&apos;s get you set up in just a few steps. You&apos;ll need a RealDebrid
                account and at least one stream provider.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Connect RealDebrid</p>
                  <p className="text-sm text-muted-foreground">Required for streaming</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Add a Provider</p>
                  <p className="text-sm text-muted-foreground">Find streams for content</p>
                </div>
              </div>
            </div>

            <Button onClick={nextStep} className="w-full mt-6 gap-2" size="lg">
              Get Started
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* RealDebrid step */}
        {currentStep === "realdebrid" && (
          <>
            <DialogHeader>
              <DialogTitle>Connect RealDebrid</DialogTitle>
              <DialogDescription>
                RealDebrid provides high-speed, cached streaming. Enter your API token to
                connect.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <RealDebridStep
                onValidate={validateRdToken}
                onSuccess={nextStep}
                isValidating={isValidating}
                error={error}
              />
            </div>
          </>
        )}

        {/* Provider step */}
        {currentStep === "provider" && (
          <>
            <DialogHeader>
              <DialogTitle>Add a Stream Provider</DialogTitle>
              <DialogDescription>
                Providers find available streams for movies and TV shows. You can add more
                later in settings.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <ProviderStep onComplete={nextStep} canSkip={canSkipProvider} />
            </div>
          </>
        )}

        {/* Complete step */}
        {currentStep === "complete" && (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <DialogTitle className="text-2xl">You&apos;re All Set!</DialogTitle>
              <DialogDescription className="text-base">
                Stream King is ready. Start browsing and enjoy your content.
              </DialogDescription>
            </DialogHeader>

            <Button onClick={handleComplete} className="w-full mt-6" size="lg">
              Start Watching
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
