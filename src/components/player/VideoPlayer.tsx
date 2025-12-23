"use client"

import { useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowLeft } from "lucide-react"
import "@vidstack/react/player/styles/default/theme.css"
import "@vidstack/react/player/styles/default/layouts/video.css"
import {
  MediaPlayer,
  MediaProvider,
  type MediaPlayerInstance,
} from "@vidstack/react"
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default"
import { Button } from "@/components/ui/button"
import { usePlayerStore } from "@/stores/player"
import { useWatchProgressStore } from "@/stores/watch-progress"
import { getBackdropUrl } from "@/services/tmdb"
import { QualityWarningBanner } from "./QualityWarningBanner"

/**
 * VideoPlayer - Full-screen video player with Vidstack
 *
 * Features:
 * - Netflix-style full-screen overlay
 * - Progress tracking (saves every 10 seconds)
 * - Resume from last position
 * - Keyboard shortcuts (Escape to close)
 */
export function VideoPlayer() {
  const playerRef = useRef<MediaPlayerInstance>(null)
  const lastSaveRef = useRef<number>(0)

  const {
    isOpen,
    currentMedia,
    streamUrl,
    streamTitle,
    streamQuality,
    qualityWarning,
    incompatibleStreamUrl,
    closePlayer,
    dismissWarning,
  } = usePlayerStore()

  const { getProgress, setProgress } = useWatchProgressStore()

  // Get resume position
  const resumePosition = currentMedia
    ? getProgress(
        currentMedia.tmdbId,
        currentMedia.mediaType,
        currentMedia.season,
        currentMedia.episode
      )
    : null

  // Save progress periodically
  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (!currentMedia || !duration) return

      const now = Date.now()
      // Save every 10 seconds
      if (now - lastSaveRef.current < 10000) return
      lastSaveRef.current = now

      const percent = (currentTime / duration) * 100
      setProgress(
        currentMedia.tmdbId,
        currentMedia.mediaType,
        percent,
        currentMedia.season,
        currentMedia.episode
      )
    },
    [currentMedia, setProgress]
  )

  // Handle video end
  const handleEnded = useCallback(() => {
    if (!currentMedia) return

    // Mark as completed (100%)
    setProgress(
      currentMedia.tmdbId,
      currentMedia.mediaType,
      100,
      currentMedia.season,
      currentMedia.episode
    )
  }, [currentMedia, setProgress])

  // Keyboard handler
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePlayer()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, closePlayer])

  // Lock body scroll when player is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const title = currentMedia?.episodeTitle
    ? `${currentMedia.title} - ${currentMedia.episodeTitle}`
    : currentMedia?.title || "Playing"

  const posterUrl = currentMedia?.backdropPath
    ? getBackdropUrl(currentMedia.backdropPath, "w780")
    : undefined

  return (
    <AnimatePresence>
      {isOpen && streamUrl && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header overlay */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
                onClick={closePlayer}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl font-semibold truncate">
                  {title}
                </h1>
                {streamQuality && (
                  <p className="text-sm text-muted-foreground">
                    {streamQuality.toUpperCase()}
                    {streamTitle && ` • ${streamTitle.slice(0, 50)}...`}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
                onClick={closePlayer}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Quality Warning Banner */}
          {qualityWarning && currentMedia && (
            <div className="absolute top-24 left-0 right-0 z-10 px-4 md:px-6">
              <QualityWarningBanner
                message={qualityWarning}
                incompatibleStreamUrl={incompatibleStreamUrl ?? undefined}
                title={title}
                quality={streamQuality ?? undefined}
                tmdbId={currentMedia.tmdbId}
                mediaType={currentMedia.mediaType}
                season={currentMedia.season}
                episode={currentMedia.episode}
                onDismiss={dismissWarning}
              />
            </div>
          )}

          {/* Video Player */}
          <MediaPlayer
            ref={playerRef}
            src={streamUrl}
            title={title}
            poster={posterUrl ?? undefined}
            playsInline
            autoPlay
            className="w-full h-full"
            onTimeUpdate={(detail) => {
              const duration = playerRef.current?.duration ?? 0
              handleTimeUpdate(detail.currentTime, duration)
            }}
            onEnded={handleEnded}
            onCanPlay={() => {
              // Seek to resume position if available
              if (
                resumePosition &&
                resumePosition.progress > 5 &&
                resumePosition.progress < 95 &&
                playerRef.current
              ) {
                const duration = playerRef.current.duration
                if (duration) {
                  const seekTime = (resumePosition.progress / 100) * duration
                  playerRef.current.currentTime = seekTime
                }
              }
            }}
          >
            <MediaProvider />
            <DefaultVideoLayout icons={defaultLayoutIcons} />
          </MediaPlayer>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
