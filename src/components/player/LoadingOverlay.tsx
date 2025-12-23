"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Loader2, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoadingOverlayProps {
  isLoading: boolean
  error: string | null
  onClose: () => void
  onRetry?: () => void
  title?: string
}

/**
 * LoadingOverlay - Shows stream resolution progress
 *
 * States:
 * - Loading: Spinner with status message
 * - Error: Error message with retry option
 */
export function LoadingOverlay({
  isLoading,
  error,
  onClose,
  onRetry,
  title,
}: LoadingOverlayProps) {
  const isVisible = isLoading || !!error

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="text-center max-w-md px-6">
            {isLoading && !error && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="h-16 w-16 animate-spin text-white mx-auto mb-6" />
                <h2 className="text-2xl font-semibold mb-2">
                  Finding best stream...
                </h2>
                {title && (
                  <p className="text-lg text-muted-foreground mb-4">{title}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Checking provider and RealDebrid cache
                </p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 mx-auto mb-6">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  Unable to play
                </h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <div className="flex gap-3 justify-center">
                  {onRetry && (
                    <Button onClick={onRetry} size="lg">
                      Try Again
                    </Button>
                  )}
                  <Button variant="outline" onClick={onClose} size="lg">
                    Close
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
