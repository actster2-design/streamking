"use client"

import { Monitor, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTauri } from "@/hooks/useTauri"
import { useProtocolDetection } from "@/hooks/useProtocolDetection"
import { useWatchProgressStore } from "@/stores/watch-progress"
import { DownloadAppModal } from "./DownloadAppModal"

interface DesktopPlayerButtonProps {
  /** Stream URL to play */
  streamUrl: string
  /** Display title */
  title: string
  /** Quality label */
  quality?: string
  /** TMDB ID for progress tracking */
  tmdbId: number
  /** Media type */
  mediaType: "movie" | "tv"
  /** Season number (for TV shows) */
  season?: number
  /** Episode number (for TV shows) */
  episode?: number
  /** Button variant style */
  variant?: "default" | "inline" | "outline"
  /** Optional class name */
  className?: string
}

/**
 * Button to trigger playback in desktop app (MPV)
 *
 * In Tauri: Uses MPV directly via invoke
 * In browser: Opens protocol URL, shows download modal if app not installed
 */
export function DesktopPlayerButton({
  streamUrl,
  title,
  quality,
  tmdbId,
  mediaType,
  season,
  episode,
  variant = "default",
  className,
}: DesktopPlayerButtonProps) {
  const { isTauri, mpvAvailable, invoke } = useTauri()
  const { getProgress } = useWatchProgressStore()
  const {
    openDesktopApp,
    showDownloadModal,
    closeDownloadModal,
    isAttempting,
  } = useProtocolDetection()

  const handleClick = async () => {
    // Get resume position from watch progress
    const progress = getProgress(tmdbId, mediaType, season, episode)
    let position: number | undefined

    if (progress && progress.progress > 5 && progress.progress < 95) {
      // Rough estimate: movie = 7200s (2h), episode = 2700s (45min)
      const estimatedDuration = mediaType === "movie" ? 7200 : 2700
      position = (progress.progress / 100) * estimatedDuration
    }

    if (isTauri && mpvAvailable) {
      // Direct MPV invocation in Tauri
      try {
        await invoke("play_video", {
          params: {
            url: streamUrl,
            title,
            start_position: position,
          },
        })
      } catch (err) {
        console.error("Failed to play with MPV:", err)
      }
    } else {
      // Use protocol detection (shows download modal if app not installed)
      openDesktopApp({
        url: streamUrl,
        title,
        quality,
        position,
      })
    }
  }

  const label = isTauri ? "Play with MPV" : "Open in Desktop App"
  const Icon = isTauri ? Monitor : ExternalLink

  if (variant === "inline") {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isAttempting}
          className={`text-primary hover:underline inline-flex items-center gap-1.5 text-sm font-medium disabled:opacity-50 ${className || ""}`}
        >
          {isAttempting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          {isAttempting ? "Opening..." : label}
        </button>
        <DownloadAppModal
          open={showDownloadModal}
          onOpenChange={closeDownloadModal}
        />
      </>
    )
  }

  return (
    <>
      <Button
        variant={variant === "outline" ? "outline" : "default"}
        onClick={handleClick}
        disabled={isAttempting}
        className={`gap-2 ${className || ""}`}
      >
        {isAttempting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        {isAttempting ? "Opening..." : label}
      </Button>
      <DownloadAppModal
        open={showDownloadModal}
        onOpenChange={closeDownloadModal}
      />
    </>
  )
}
