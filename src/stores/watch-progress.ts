import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { WatchProgress } from "@/types"

interface WatchProgressState {
  progress: Record<string, WatchProgress>

  getProgress: (
    tmdbId: number,
    mediaType: "movie" | "tv",
    season?: number,
    episode?: number
  ) => WatchProgress | null

  setProgress: (
    tmdbId: number,
    mediaType: "movie" | "tv",
    progressPercent: number,
    season?: number,
    episode?: number
  ) => void

  clearProgress: (
    tmdbId: number,
    mediaType: "movie" | "tv",
    season?: number,
    episode?: number
  ) => void

  clearAllProgress: () => void

  getContinueWatching: () => WatchProgress[]
}

function makeKey(
  tmdbId: number,
  mediaType: "movie" | "tv",
  season?: number,
  episode?: number
): string {
  if (mediaType === "tv" && season !== undefined && episode !== undefined) {
    return `${mediaType}-${tmdbId}-s${season}e${episode}`
  }
  return `${mediaType}-${tmdbId}`
}

export const useWatchProgressStore = create<WatchProgressState>()(
  persist(
    (set, get) => ({
      progress: {},

      getProgress: (tmdbId, mediaType, season, episode) => {
        const key = makeKey(tmdbId, mediaType, season, episode)
        return get().progress[key] ?? null
      },

      setProgress: (tmdbId, mediaType, progressPercent, season, episode) => {
        const key = makeKey(tmdbId, mediaType, season, episode)
        set((state) => ({
          progress: {
            ...state.progress,
            [key]: {
              tmdbId,
              mediaType,
              progress: progressPercent,
              lastWatched: new Date().toISOString(),
              seasonNumber: season,
              episodeNumber: episode,
            },
          },
        }))
      },

      clearProgress: (tmdbId, mediaType, season, episode) => {
        const key = makeKey(tmdbId, mediaType, season, episode)
        set((state) => {
          const { [key]: _removed, ...rest } = state.progress
          void _removed
          return { progress: rest }
        })
      },

      clearAllProgress: () => {
        set({ progress: {} })
      },

      getContinueWatching: () => {
        const items = Object.values(get().progress)
        // Return items that are in progress (5-95%)
        return items
          .filter((item) => item.progress > 5 && item.progress < 95)
          .sort(
            (a, b) =>
              new Date(b.lastWatched).getTime() -
              new Date(a.lastWatched).getTime()
          )
      },
    }),
    {
      name: "stream-king-watch-progress",
    }
  )
)
