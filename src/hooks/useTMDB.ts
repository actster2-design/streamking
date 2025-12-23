"use client"

import { useState, useEffect, useCallback } from "react"
import { tmdb } from "@/services/tmdb"
import type { TMDBMovie } from "@/types"

interface UseTMDBResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

export function useTrending(
  mediaType: "all" | "movie" | "tv" = "all",
  timeWindow: "day" | "week" = "day"
): UseTMDBResult<TMDBMovie[]> {
  const [data, setData] = useState<TMDBMovie[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = `trending-${mediaType}-${timeWindow}`

  const fetch = useCallback(async () => {
    // Check cache first
    const cached = getCached<TMDBMovie[]>(cacheKey)
    if (cached) {
      setData(cached)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await tmdb.getTrending(mediaType, timeWindow)
      setData(result)
      setCache(cacheKey, result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trending")
    } finally {
      setIsLoading(false)
    }
  }, [cacheKey, mediaType, timeWindow])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, isLoading, error, refetch: fetch }
}

export function usePopularMovies(page = 1): UseTMDBResult<TMDBMovie[]> {
  const [data, setData] = useState<TMDBMovie[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = `popular-movies-${page}`

  const fetch = useCallback(async () => {
    const cached = getCached<TMDBMovie[]>(cacheKey)
    if (cached) {
      setData(cached)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await tmdb.getPopularMovies(page)
      // Add media_type to movies
      const withType = result.map((m) => ({ ...m, media_type: "movie" as const }))
      setData(withType)
      setCache(cacheKey, withType)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch movies")
    } finally {
      setIsLoading(false)
    }
  }, [cacheKey, page])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, isLoading, error, refetch: fetch }
}

export function usePopularTVShows(page = 1): UseTMDBResult<TMDBMovie[]> {
  const [data, setData] = useState<TMDBMovie[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = `popular-tv-${page}`

  const fetch = useCallback(async () => {
    const cached = getCached<TMDBMovie[]>(cacheKey)
    if (cached) {
      setData(cached)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await tmdb.getPopularTVShows(page)
      setData(result)
      setCache(cacheKey, result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch TV shows")
    } finally {
      setIsLoading(false)
    }
  }, [cacheKey, page])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, isLoading, error, refetch: fetch }
}

export function useSearch(query: string): UseTMDBResult<TMDBMovie[]> {
  const [data, setData] = useState<TMDBMovie[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query || query.length < 2) {
      setData(null)
      return
    }

    const controller = new AbortController()

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await tmdb.search(query)
        if (!controller.signal.aborted) {
          setData(result)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Search failed")
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 300) // 300ms debounce

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query])

  return {
    data,
    isLoading,
    error,
    refetch: () => {},
  }
}
