"use client"

import { useCallback } from "react"
import Image from "next/image"
import { X, Play, Star, Clock, Calendar, Tv } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { CastList } from "./CastList"
import { SimilarContent } from "./SimilarContent"
import { SeasonSelector } from "./SeasonSelector"
import { useUIStore } from "@/stores/ui"
import { useMediaDetails } from "@/hooks/useMediaDetails"
import { usePlayback } from "@/hooks/usePlayback"
import { getBackdropUrl, getImageUrl } from "@/services/tmdb"

export function DetailsModal() {
  const { detailsModal, closeDetails } = useUIStore()
  const { data, isLoading } = useMediaDetails(
    detailsModal.mediaId,
    detailsModal.mediaType
  )
  const { play } = usePlayback()

  const isTV = detailsModal.mediaType === "tv"
  const title = data?.title || data?.name || ""
  const year = (data?.release_date || data?.first_air_date || "").slice(0, 4)
  const runtime = data?.runtime || data?.episode_run_time?.[0]
  const backdropUrl = getBackdropUrl(data?.backdrop_path ?? null, "w1280")
  const posterUrl = getImageUrl(data?.poster_path ?? null, "w342")

  const handlePlay = async () => {
    if (!data) return
    closeDetails()
    await play(data)
  }

  const handlePlayEpisode = useCallback(
    async (season: number, episode: number, episodeTitle: string) => {
      if (!data) return
      closeDetails()
      await play(data, { season, episode, title: episodeTitle })
    },
    [data, closeDetails, play]
  )

  return (
    <Dialog open={detailsModal.open} onOpenChange={(open) => !open && closeDetails()}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden bg-background border-none">
        <VisuallyHidden.Root>
          <DialogTitle>{title || "Content Details"}</DialogTitle>
        </VisuallyHidden.Root>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <DetailsModalSkeleton />
          ) : data ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              {/* Header with backdrop */}
              <div className="relative h-72 md:h-96 flex-shrink-0">
                {backdropUrl ? (
                  <Image
                    src={backdropUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 rounded-full bg-black/50 hover:bg-black/70"
                  onClick={closeDetails}
                >
                  <X className="h-5 w-5" />
                </Button>

                {/* Content info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 flex gap-6">
                  {/* Poster */}
                  {posterUrl && (
                    <div className="hidden md:block relative w-32 h-48 rounded-lg overflow-hidden shadow-xl flex-shrink-0">
                      <Image
                        src={posterUrl}
                        alt={title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-4xl font-bold mb-2">{title}</h1>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                      {year && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {year}
                        </span>
                      )}
                      {isTV && data.number_of_seasons && (
                        <span className="flex items-center gap-1">
                          <Tv className="h-4 w-4" />
                          {data.number_of_seasons} Season{data.number_of_seasons > 1 ? "s" : ""}
                        </span>
                      )}
                      {!isTV && runtime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {runtime} min
                        </span>
                      )}
                      {data.vote_average > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {data.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {data.genres?.slice(0, 4).map((genre) => (
                        <Badge key={genre.id} variant="secondary">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>

                    {/* Play button - only for movies, TV shows use episode selector */}
                    {!isTV && (
                      <Button size="lg" className="gap-2" onClick={handlePlay}>
                        <Play className="h-5 w-5 fill-current" />
                        Play
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable content */}
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                  {/* Tagline */}
                  {data.tagline && (
                    <p className="text-lg italic text-muted-foreground">
                      &ldquo;{data.tagline}&rdquo;
                    </p>
                  )}

                  {/* Overview */}
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Overview</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {data.overview || "No overview available."}
                    </p>
                  </div>

                  {/* Season/Episode Selector for TV Shows */}
                  {isTV && data.seasons && data.seasons.length > 0 && (
                    <SeasonSelector
                      tvId={data.id}
                      seasons={data.seasons}
                      onPlayEpisode={handlePlayEpisode}
                    />
                  )}

                  {/* Cast */}
                  {data.credits?.cast && data.credits.cast.length > 0 && (
                    <CastList cast={data.credits.cast} />
                  )}

                  {/* Similar */}
                  {data.similar?.results && data.similar.results.length > 0 && (
                    <SimilarContent
                      items={data.similar.results}
                      mediaType={detailsModal.mediaType || "movie"}
                    />
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

function DetailsModalSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <Skeleton className="h-72 md:h-96 w-full" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}
