"use client"

import { useCallback, useState } from "react"
import { useTauri } from "./useTauri"
import { buildProtocolUrl, openProtocolUrl } from "@/lib/protocol"
import { useWatchProgressStore } from "@/stores/watch-progress"

export interface DesktopPlaybackParams {
  /** Stream URL to play */
  url: string
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
}

interface PlaybackResult {
  success: boolean
  error: string | null
}

interface UseDesktopPlayerResult {
  /** Play video in desktop app (MPV via Tauri or protocol URL) */
  playInDesktop: (params: DesktopPlaybackParams) => Promise<PlaybackResult>
  /** Whether desktop playback is possible */
  canPlayDesktop: boolean
  /** Whether we're running in Tauri */
  isTauriApp: boolean
  /** Whether MPV is available (Tauri only) */
  mpvAvailable: boolean
  /** Whether a playback operation is in progress */
  isPlaying: boolean
}

/**
 * Hook for playing videos in the desktop app
 *
 * In Tauri: Uses libmpv directly via invoke
 * In browser: Opens streamking:// protocol URL to launch desktop app
 *
 * @example
 * ```tsx
 * function PlayButton({ stream }) {
 *   const { playInDesktop, canPlayDesktop } = useDesktopPlayer()
 *
 *   if (!canPlayDesktop) return null
 *
 *   return (
 *     <button onClick={() => playInDesktop({
 *       url: stream.url,
 *       title: "Movie",
 *       tmdbId: 12345,
 *       mediaType: "movie"
 *     })}>
 *       Play in Desktop App
 *     </button>
 *   )
 * }
 * ```
 */
export function useDesktopPlayer(): UseDesktopPlayerResult {
  const { isTauri, mpvAvailable, invoke, isReady } = useTauri()
  const { getProgress } = useWatchProgressStore()
  const [isPlaying, setIsPlaying] = useState(false)

  const playInDesktop = useCallback(
    async (params: DesktopPlaybackParams): Promise<PlaybackResult> => {
      setIsPlaying(true)

      try {
        // Get resume position from watch progress
        const progress = getProgress(
          params.tmdbId,
          params.mediaType,
          params.season,
          params.episode
        )

        // Calculate position in seconds (assuming ~2 hour movie or ~45 min episode)
        // This is approximate since we don't have exact duration stored
        let position: number | undefined
        if (progress && progress.progress > 5 && progress.progress < 95) {
          // Rough estimate: movie = 7200s (2h), episode = 2700s (45min)
          const estimatedDuration =
            params.mediaType === "movie" ? 7200 : 2700
          position = (progress.progress / 100) * estimatedDuration
        }

        if (isTauri && mpvAvailable) {
          // Direct MPV invocation in Tauri
          console.log("Playing via Tauri MPV:", params.title)

          const result = await invoke<{ success: boolean; error?: string }>(
            "play_video",
            {
              params: {
                url: params.url,
                title: params.title,
                start_position: position,
              },
            }
          )

          return {
            success: result.success,
            error: result.error || null,
          }
        } else {
          // Use protocol handler (opens desktop app from browser)
          console.log("Playing via protocol URL:", params.title)

          const protocolUrl = buildProtocolUrl({
            url: params.url,
            title: params.title,
            quality: params.quality,
            position,
          })

          const opened = openProtocolUrl(protocolUrl)

          return {
            success: opened,
            error: opened ? null : "Failed to open desktop app",
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Desktop playback failed"
        console.error("Desktop playback error:", err)
        return { success: false, error: message }
      } finally {
        setIsPlaying(false)
      }
    },
    [isTauri, mpvAvailable, invoke, getProgress]
  )

  return {
    playInDesktop,
    // In browser, we can always try the protocol (app might be installed)
    // In Tauri, we need MPV to be available
    canPlayDesktop: isReady && (isTauri ? mpvAvailable : true),
    isTauriApp: isTauri,
    mpvAvailable,
    isPlaying,
  }
}
