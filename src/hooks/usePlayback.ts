"use client"

import { useCallback } from "react"
import { usePlayerStore, type PlayerMedia } from "@/stores/player"
import { useWatchProgressStore } from "@/stores/watch-progress"
import { useStreamResolver } from "./useStreamResolver"
import type { TMDBMovieDetails } from "@/types"

interface UsePlaybackResult {
  play: (media: TMDBMovieDetails, episode?: { season: number; episode: number; title?: string }) => Promise<void>
  isLoading: boolean
  error: string | null
  clearError: () => void
}

/**
 * usePlayback - Main hook for initiating playback
 *
 * Flow:
 * 1. Extract IMDB ID from TMDB details
 * 2. Resolve stream via provider (Torrentio) + RealDebrid
 * 3. Open player with stream URL
 * 4. Track watch progress
 */
export function usePlayback(): UsePlaybackResult {
  const { openPlayer, setLoading, setError: setPlayerError } = usePlayerStore()
  const { resolve, isResolving, error, clearError } = useStreamResolver()
  const { setProgress } = useWatchProgressStore()

  const play = useCallback(
    async (
      media: TMDBMovieDetails,
      episode?: { season: number; episode: number; title?: string }
    ) => {
      // Get IMDB ID
      const imdbId = media.imdb_id || media.external_ids?.imdb_id
      if (!imdbId) {
        setPlayerError("No IMDB ID found for this content. Cannot resolve streams.")
        return
      }

      setLoading(true)

      // Resolve stream
      const stream = await resolve(
        imdbId,
        episode?.season,
        episode?.episode
      )

      if (!stream) {
        // Error already set by resolver
        return
      }

      // Build player media info
      const playerMedia: PlayerMedia = {
        tmdbId: media.id,
        mediaType: episode ? "tv" : "movie",
        title: media.title || media.name || "Unknown",
        posterPath: media.poster_path,
        backdropPath: media.backdrop_path,
        imdbId,
        season: episode?.season,
        episode: episode?.episode,
        episodeTitle: episode?.title,
      }

      // Open player
      openPlayer(playerMedia, stream.url, {
        title: stream.title,
        quality: stream.quality,
        qualityWarning: stream.qualityWarning,
        incompatibleStreamUrl: stream.incompatibleStreamUrl,
      })

      // Initialize progress tracking
      setProgress(
        media.id,
        episode ? "tv" : "movie",
        0,
        episode?.season,
        episode?.episode
      )
    },
    [resolve, openPlayer, setLoading, setPlayerError, setProgress]
  )

  return {
    play,
    isLoading: isResolving,
    error,
    clearError,
  }
}
