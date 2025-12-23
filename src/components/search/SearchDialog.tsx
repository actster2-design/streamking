"use client"

import { useEffect, useCallback } from "react"
import Image from "next/image"
import { Search, Film, Tv, Loader2, Star } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useSearch } from "@/hooks/useSearch"
import { useUIStore } from "@/stores/ui"
import { getImageUrl } from "@/services/tmdb"
import type { TMDBMovie } from "@/types"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { query, setQuery, results, isSearching, clearSearch } = useSearch()
  const { openDetails } = useUIStore()

  // Clear search when dialog closes
  useEffect(() => {
    if (!open) {
      clearSearch()
    }
  }, [open, clearSearch])

  const handleSelect = useCallback(
    (item: TMDBMovie) => {
      openDetails(item.id, item.media_type || "movie")
      onOpenChange(false)
    },
    [openDetails, onOpenChange]
  )

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search movies and TV shows..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {/* Loading state */}
        {isSearching && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isSearching && query && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {/* Results */}
        {!isSearching && results.length > 0 && (
          <CommandGroup heading="Results">
            {results.map((item) => (
              <SearchResultItem
                key={`${item.media_type}-${item.id}`}
                item={item}
                onSelect={() => handleSelect(item)}
              />
            ))}
          </CommandGroup>
        )}

        {/* Default state - show hint */}
        {!query && !isSearching && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Search for movies and TV shows</p>
            <p className="text-xs mt-1">Press ⌘K anytime to search</p>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  )
}

interface SearchResultItemProps {
  item: TMDBMovie
  onSelect: () => void
}

function SearchResultItem({ item, onSelect }: SearchResultItemProps) {
  const title = item.title || item.name || "Unknown"
  const year = (item.release_date || item.first_air_date || "").slice(0, 4)
  const isMovie = item.media_type === "movie"
  const posterUrl = getImageUrl(item.poster_path, "w92")

  return (
    <CommandItem
      value={`${title} ${year}`}
      onSelect={onSelect}
      className="flex items-center gap-3 p-2 cursor-pointer"
    >
      {/* Poster */}
      <div className="relative w-10 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            {isMovie ? (
              <Film className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Tv className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{title}</span>
          {item.vote_average > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {item.vote_average.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {isMovie ? (
              <Film className="h-3 w-3" />
            ) : (
              <Tv className="h-3 w-3" />
            )}
            {isMovie ? "Movie" : "TV Show"}
          </span>
          {year && <span>{year}</span>}
        </div>
      </div>
    </CommandItem>
  )
}
