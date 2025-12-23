"use client"

import { useState, useEffect, useCallback } from "react"
import { tmdb } from "@/services/tmdb"
import type { TMDBMovieDetails } from "@/types"

interface UseMediaDetailsResult {
  data: TMDBMovieDetails | null
  isLoading: boolean
  error: string | null
}

// Simple cache for details
const detailsCache = new Map<string, TMDBMovieDetails>()

export function useMediaDetails(
  id: number | null,
  mediaType: "movie" | "tv" | null
): UseMediaDetailsResult {
  const [data, setData] = useState<TMDBMovieDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetails = useCallback(async () => {
    if (!id || !mediaType) {
      setData(null)
      return
    }

    const cacheKey = `${mediaType}-${id}`

    // Check cache
    if (detailsCache.has(cacheKey)) {
      setData(detailsCache.get(cacheKey)!)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result =
        mediaType === "movie"
          ? await tmdb.getMovieDetails(id)
          : await tmdb.getTVDetails(id)

      detailsCache.set(cacheKey, result)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch details")
    } finally {
      setIsLoading(false)
    }
  }, [id, mediaType])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  return { data, isLoading, error }
}
