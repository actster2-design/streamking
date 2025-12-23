"use client"

import { useState, useEffect, useCallback } from "react"
import { tmdb } from "@/services/tmdb"
import type { TMDBMovie } from "@/types"

interface UseSearchResult {
  query: string
  setQuery: (query: string) => void
  results: TMDBMovie[]
  isSearching: boolean
  clearSearch: () => void
}

export function useSearch(): UseSearchResult {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<TMDBMovie[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      try {
        const searchResults = await tmdb.search(query)
        if (!controller.signal.aborted) {
          // Filter to only movies and TV shows
          const filtered = searchResults.filter(
            (item) => item.media_type === "movie" || item.media_type === "tv"
          )
          setResults(filtered.slice(0, 10))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Search failed:", error)
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false)
        }
      }
    }, 300) // 300ms debounce

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [query])

  const clearSearch = useCallback(() => {
    setQuery("")
    setResults([])
  }, [])

  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
  }
}
