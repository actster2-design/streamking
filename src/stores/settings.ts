import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AppSettings } from "@/types"

interface SettingsState extends AppSettings {
  setTheme: (theme: AppSettings["theme"]) => void
  setPreferredQuality: (quality: AppSettings["preferredQuality"]) => void
  setAutoPlay: (autoPlay: boolean) => void
  setSubtitlesEnabled: (enabled: boolean) => void
  setSubtitlesLanguage: (language: string) => void
  resetSettings: () => void
}

const defaultSettings: AppSettings = {
  theme: "dark",
  preferredQuality: "auto",
  autoPlay: true,
  subtitlesEnabled: true,
  subtitlesLanguage: "en",
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => set({ theme }),

      setPreferredQuality: (preferredQuality) => set({ preferredQuality }),

      setAutoPlay: (autoPlay) => set({ autoPlay }),

      setSubtitlesEnabled: (subtitlesEnabled) => set({ subtitlesEnabled }),

      setSubtitlesLanguage: (subtitlesLanguage) => set({ subtitlesLanguage }),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: "stream-king-settings",
    }
  )
)
