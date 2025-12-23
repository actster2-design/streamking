"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * Tauri API interface for type safety
 */
interface TauriInvoke {
  <T>(cmd: string, args?: Record<string, unknown>): Promise<T>
}

declare global {
  interface Window {
    __TAURI__?: {
      core?: {
        invoke: TauriInvoke
      }
    }
    __TAURI_INTERNALS__?: unknown
  }
}

interface UseTauriResult {
  /** Whether we're running inside Tauri desktop app */
  isTauri: boolean
  /** Whether the Tauri detection has completed */
  isReady: boolean
  /** Whether MPV/libmpv is available for playback */
  mpvAvailable: boolean
  /** Invoke a Tauri command */
  invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>
}

/**
 * Hook for detecting Tauri environment and accessing Tauri APIs
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isTauri, mpvAvailable, invoke } = useTauri()
 *
 *   if (isTauri && mpvAvailable) {
 *     // Can use desktop player
 *   }
 * }
 * ```
 */
export function useTauri(): UseTauriResult {
  const [isReady, setIsReady] = useState(false)
  const [isTauri, setIsTauri] = useState(false)
  const [mpvAvailable, setMpvAvailable] = useState(false)

  useEffect(() => {
    const checkTauri = async () => {
      // Check if we're in Tauri environment
      const hasTauri =
        typeof window !== "undefined" &&
        (!!window.__TAURI__?.core?.invoke || !!window.__TAURI_INTERNALS__)

      setIsTauri(hasTauri)

      if (hasTauri && window.__TAURI__?.core?.invoke) {
        try {
          // Check if MPV is available
          const available = await window.__TAURI__.core.invoke<boolean>(
            "check_mpv_available"
          )
          setMpvAvailable(available)
        } catch (err) {
          console.warn("Failed to check MPV availability:", err)
          setMpvAvailable(false)
        }
      }

      setIsReady(true)
    }

    checkTauri()
  }, [])

  const invoke = useCallback(
    async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
      if (!window.__TAURI__?.core?.invoke) {
        throw new Error("Tauri not available")
      }
      return window.__TAURI__.core.invoke<T>(cmd, args)
    },
    []
  )

  return { isTauri, isReady, invoke, mpvAvailable }
}
