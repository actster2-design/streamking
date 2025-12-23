"use client"

import { VideoPlayer } from "./VideoPlayer"
import { LoadingOverlay } from "./LoadingOverlay"
import { usePlayerStore } from "@/stores/player"

/**
 * PlayerPortal - Client-side wrapper for player components
 *
 * Renders at the root layout level to ensure fullscreen playback
 * works correctly across all pages.
 */
export function PlayerPortal() {
  const {
    isLoading,
    error,
    currentMedia,
    closePlayer,
    clearError,
    setLoading,
  } = usePlayerStore()

  const handleClose = () => {
    closePlayer()
  }

  const handleRetry = () => {
    clearError()
    setLoading(false)
  }

  return (
    <>
      {/* Loading/Error overlay */}
      <LoadingOverlay
        isLoading={isLoading}
        error={error}
        onClose={handleClose}
        onRetry={handleRetry}
        title={currentMedia?.title}
      />

      {/* Video player (shows when stream URL is ready) */}
      <VideoPlayer />
    </>
  )
}
