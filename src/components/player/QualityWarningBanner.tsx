"use client"

import { AlertTriangle, X } from "lucide-react"
import { DesktopPlayerButton } from "./DesktopPlayerButton"
import { Button } from "@/components/ui/button"

interface QualityWarningBannerProps {
  /** Warning message to display */
  message: string
  /** URL of the highest quality (incompatible) stream */
  incompatibleStreamUrl?: string
  /** Display title for desktop playback */
  title: string
  /** Quality label */
  quality?: string
  /** TMDB ID */
  tmdbId: number
  /** Media type */
  mediaType: "movie" | "tv"
  /** Season number (for TV shows) */
  season?: number
  /** Episode number (for TV shows) */
  episode?: number
  /** Callback when banner is dismissed */
  onDismiss?: () => void
}

/**
 * Warning banner shown when video format has compatibility issues
 *
 * Displays a message and optionally provides a link to play in desktop app
 */
export function QualityWarningBanner({
  message,
  incompatibleStreamUrl,
  title,
  quality,
  tmdbId,
  mediaType,
  season,
  episode,
  onDismiss,
}: QualityWarningBannerProps) {
  return (
    <div className="bg-yellow-900/80 backdrop-blur-sm border border-yellow-700/50 rounded-lg p-4 flex items-start gap-3 shadow-lg">
      <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-yellow-100">{message}</p>
        {incompatibleStreamUrl && (
          <div className="mt-2">
            <DesktopPlayerButton
              streamUrl={incompatibleStreamUrl}
              title={title}
              quality={quality}
              tmdbId={tmdbId}
              mediaType={mediaType}
              season={season}
              episode={episode}
              variant="inline"
            />
          </div>
        )}
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-8 w-8 text-yellow-400 hover:text-yellow-200 hover:bg-yellow-800/50 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
