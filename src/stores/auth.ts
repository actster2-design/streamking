import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { RDUser, TraktUser } from "@/types"

interface AuthState {
  // RealDebrid
  rdApiToken: string | null
  rdUser: RDUser | null
  setRdAuth: (token: string, user: RDUser) => void
  clearRdAuth: () => void

  // Trakt
  traktAccessToken: string | null
  traktRefreshToken: string | null
  traktUser: TraktUser | null
  traktExpiresAt: number | null
  setTraktAuth: (
    accessToken: string,
    refreshToken: string,
    user: TraktUser,
    expiresIn: number
  ) => void
  clearTraktAuth: () => void

  // General
  isOnboarded: boolean
  setOnboarded: (onboarded: boolean) => void
  clearAllAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // RealDebrid state
      rdApiToken: null,
      rdUser: null,
      setRdAuth: (token, user) =>
        set({
          rdApiToken: token,
          rdUser: user,
        }),
      clearRdAuth: () =>
        set({
          rdApiToken: null,
          rdUser: null,
        }),

      // Trakt state
      traktAccessToken: null,
      traktRefreshToken: null,
      traktUser: null,
      traktExpiresAt: null,
      setTraktAuth: (accessToken, refreshToken, user, expiresIn) =>
        set({
          traktAccessToken: accessToken,
          traktRefreshToken: refreshToken,
          traktUser: user,
          traktExpiresAt: Date.now() + expiresIn * 1000,
        }),
      clearTraktAuth: () =>
        set({
          traktAccessToken: null,
          traktRefreshToken: null,
          traktUser: null,
          traktExpiresAt: null,
        }),

      // General
      isOnboarded: false,
      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),
      clearAllAuth: () =>
        set({
          rdApiToken: null,
          rdUser: null,
          traktAccessToken: null,
          traktRefreshToken: null,
          traktUser: null,
          traktExpiresAt: null,
          isOnboarded: false,
        }),
    }),
    {
      name: "stream-king-auth",
    }
  )
)
