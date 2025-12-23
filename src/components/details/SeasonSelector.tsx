"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Play, Loader2, Clock, Star } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { tmdb, getImageUrl } from "@/services/tmdb"
import type { TMDBSeason, TMDBEpisode, TMDBSeasonDetails } from "@/types"

interface SeasonSelectorProps {
  tvId: number
  seasons: TMDBSeason[]
  onPlayEpisode: (season: number, episode: number, title: string) => void
}

export function SeasonSelector({
  tvId,
  seasons,
  onPlayEpisode,
}: SeasonSelectorProps) {
  // Filter out specials (season 0) and sort by season number
  const validSeasons = seasons
    .filter((s) => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number)

  const [selectedSeason, setSelectedSeason] = useState<number>(
    validSeasons[0]?.season_number ?? 1
  )
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchEpisodes = useCallback(async () => {
    setIsLoading(true)
    try {
      const data: TMDBSeasonDetails = await tmdb.getSeasonDetails(
        tvId,
        selectedSeason
      )
      setEpisodes(data.episodes || [])
    } catch (error) {
      console.error("Failed to fetch episodes:", error)
      setEpisodes([])
    } finally {
      setIsLoading(false)
    }
  }, [tvId, selectedSeason])

  useEffect(() => {
    fetchEpisodes()
  }, [fetchEpisodes])

  if (validSeasons.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No seasons available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Episodes</h3>
        <Select
          value={String(selectedSeason)}
          onValueChange={(value) => setSelectedSeason(Number(value))}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {validSeasons.map((season) => (
              <SelectItem
                key={season.season_number}
                value={String(season.season_number)}
              >
                {season.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : episodes.length > 0 ? (
        <div className="space-y-2">
          {episodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              onPlay={() =>
                onPlayEpisode(
                  episode.season_number,
                  episode.episode_number,
                  episode.name
                )
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          No episodes available
        </div>
      )}
    </div>
  )
}

interface EpisodeCardProps {
  episode: TMDBEpisode
  onPlay: () => void
}

function EpisodeCard({ episode, onPlay }: EpisodeCardProps) {
  const stillUrl = getImageUrl(episode.still_path, "w342")

  return (
    <div
      className="flex gap-4 p-3 rounded-lg bg-card/50 hover:bg-card transition-colors cursor-pointer group"
      onClick={onPlay}
    >
      {/* Thumbnail */}
      <div className="relative w-32 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
        {stillUrl ? (
          <Image
            src={stillUrl}
            alt={episode.name}
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            No Image
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="h-8 w-8 text-white fill-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-muted-foreground">
            E{episode.episode_number}
          </span>
          <h4 className="font-medium truncate">{episode.name}</h4>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          {episode.runtime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {episode.runtime}m
            </span>
          )}
          {episode.vote_average > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {episode.vote_average.toFixed(1)}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {episode.overview || "No description available."}
        </p>
      </div>
    </div>
  )
}
