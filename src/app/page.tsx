"use client"

import { useState } from "react"
import { Header } from "@/components/layout/Header"
import { ContentRow } from "@/components/layout/ContentRow"
import { MediaCard, MediaRowSkeleton, HeroSection } from "@/components/media"
import { DetailsModal } from "@/components/details"
import { OnboardingModal } from "@/components/onboarding"
import { SettingsSheet } from "@/components/settings"
import { SearchDialog } from "@/components/search"
import { useAuthStore } from "@/stores/auth"
import { useUIStore } from "@/stores/ui"
import { useTrending, usePopularMovies, usePopularTVShows } from "@/hooks/useTMDB"
import { usePlayback } from "@/hooks/usePlayback"
import { tmdb } from "@/services/tmdb"
import type { TMDBMovie } from "@/types"

export default function Home() {
  const { isOnboarded } = useAuthStore()
  const { openDetails } = useUIStore()
  const [showOnboarding, setShowOnboarding] = useState(!isOnboarded)
  const [showSettings, setShowSettings] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const { play } = usePlayback()

  // Fetch content
  const { data: trending, isLoading: trendingLoading } = useTrending("all", "day")
  const { data: movies, isLoading: moviesLoading } = usePopularMovies()
  const { data: tvShows, isLoading: tvLoading } = usePopularTVShows()

  const handleMediaClick = (media: TMDBMovie) => {
    const mediaType = media.media_type || "movie"
    openDetails(media.id, mediaType)
  }

  const handleHeroPlay = async (item: TMDBMovie) => {
    const mediaType = item.media_type || "movie"
    // Fetch full details (needed for IMDB ID)
    const details = mediaType === "movie"
      ? await tmdb.getMovieDetails(item.id)
      : await tmdb.getTVDetails(item.id)
    await play(details)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Modal */}
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
      />

      {/* Details Modal */}
      <DetailsModal />

      {/* Settings Sheet */}
      <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />

      {/* Search Dialog */}
      <SearchDialog open={showSearch} onOpenChange={setShowSearch} />

      {/* Header */}
      <Header
        onSearchClick={() => setShowSearch(true)}
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* Hero Section */}
      {trending && trending.length > 0 ? (
        <HeroSection
          items={trending.slice(0, 5)}
          onPlay={handleHeroPlay}
          onMoreInfo={handleMediaClick}
        />
      ) : (
        <div className="h-[70vh] md:h-[80vh] bg-muted animate-pulse" />
      )}

      {/* Content Rows */}
      <div className="relative z-10 -mt-32 pb-16 space-y-2">
        {/* Trending Now */}
        <ContentRow title="Trending Now">
          {trendingLoading ? (
            <MediaRowSkeleton />
          ) : (
            trending?.map((item, index) => (
              <MediaCard
                key={item.id}
                media={item}
                onClick={() => handleMediaClick(item)}
                priority={index < 4}
              />
            ))
          )}
        </ContentRow>

        {/* Popular Movies */}
        <ContentRow title="Popular Movies">
          {moviesLoading ? (
            <MediaRowSkeleton />
          ) : (
            movies?.map((item) => (
              <MediaCard
                key={item.id}
                media={item}
                onClick={() => handleMediaClick(item)}
              />
            ))
          )}
        </ContentRow>

        {/* Popular TV Shows */}
        <ContentRow title="Popular TV Shows">
          {tvLoading ? (
            <MediaRowSkeleton />
          ) : (
            tvShows?.map((item) => (
              <MediaCard
                key={item.id}
                media={item}
                onClick={() => handleMediaClick(item)}
              />
            ))
          )}
        </ContentRow>
      </div>

      {/* No API Key Warning */}
      {!process.env.NEXT_PUBLIC_TMDB_API_KEY && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm">
          <p className="font-medium">TMDB API Key Missing</p>
          <p className="text-yellow-500/80 mt-1">
            Add NEXT_PUBLIC_TMDB_API_KEY to your .env.local file to load content.
          </p>
        </div>
      )}
    </div>
  )
}
