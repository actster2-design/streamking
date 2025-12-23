import { create } from "zustand"

export interface PlayerMedia {
  tmdbId: number
  mediaType: "movie" | "tv"
  title: string
  posterPath?: string | null
  backdropPath?: string | null
  imdbId?: string
  season?: number
  episode?: number
  episodeTitle?: string
}

interface PlayerState {
  // Player visibility
  isOpen: boolean
  isFullscreen: boolean

  // Current media info
  currentMedia: PlayerMedia | null

  // Stream info
  streamUrl: string | null
  streamTitle: string | null
  streamQuality: string | null

  // Playback state
  isLoading: boolean
  error: string | null

  // Actions
  openPlayer: (media: PlayerMedia, streamUrl: string, streamInfo?: { title?: string; quality?: string }) => void
  closePlayer: () => void
  setFullscreen: (fullscreen: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isOpen: false,
  isFullscreen: false,
  currentMedia: null,
  streamUrl: null,
  streamTitle: null,
  streamQuality: null,
  isLoading: false,
  error: null,

  openPlayer: (media, streamUrl, streamInfo) =>
    set({
      isOpen: true,
      isFullscreen: true,
      currentMedia: media,
      streamUrl,
      streamTitle: streamInfo?.title ?? null,
      streamQuality: streamInfo?.quality ?? null,
      isLoading: false,
      error: null,
    }),

  closePlayer: () =>
    set({
      isOpen: false,
      isFullscreen: false,
      currentMedia: null,
      streamUrl: null,
      streamTitle: null,
      streamQuality: null,
      isLoading: false,
      error: null,
    }),

  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  clearError: () => set({ error: null }),
}))
