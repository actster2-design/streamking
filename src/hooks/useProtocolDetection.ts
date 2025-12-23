"use client"

import { useState, useCallback, useRef } from "react"
import { buildProtocolUrl } from "@/lib/protocol"

interface ProtocolDetectionResult {
  /** Attempt to open desktop app via protocol */
  openDesktopApp: (params: {
    url: string
    title: string
    quality?: string
    position?: number
  }) => void
  /** Whether the download modal should be shown */
  showDownloadModal: boolean
  /** Close the download modal */
  closeDownloadModal: () => void
  /** Whether a protocol attempt is in progress */
  isAttempting: boolean
}

/**
 * Hook to detect if the desktop app is installed
 *
 * Uses a combination of:
 * - Window blur detection (app launched = window loses focus)
 * - Visibility change (app launched = page becomes hidden)
 * - Timeout fallback (if nothing happens, app probably not installed)
 *
 * @param timeout - How long to wait before showing download modal (default: 2000ms)
 */
export function useProtocolDetection(timeout = 2000): ProtocolDetectionResult {
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [isAttempting, setIsAttempting] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const detectedRef = useRef(false)

  const openDesktopApp = useCallback(
    (params: {
      url: string
      title: string
      quality?: string
      position?: number
    }) => {
      // Reset state
      detectedRef.current = false
      setIsAttempting(true)
      setShowDownloadModal(false)

      // Build protocol URL
      const protocolUrl = buildProtocolUrl(params)

      // Setup detection handlers
      const handleBlur = () => {
        // Window lost focus - app probably launched
        detectedRef.current = true
        cleanup()
        setIsAttempting(false)
      }

      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Page became hidden - app probably launched
          detectedRef.current = true
          cleanup()
          setIsAttempting(false)
        }
      }

      const cleanup = () => {
        window.removeEventListener("blur", handleBlur)
        document.removeEventListener("visibilitychange", handleVisibilityChange)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }

      // Add event listeners
      window.addEventListener("blur", handleBlur)
      document.addEventListener("visibilitychange", handleVisibilityChange)

      // Create an invisible iframe to attempt protocol
      // This prevents the browser from showing "page not found" if protocol fails
      const iframe = document.createElement("iframe")
      iframe.style.display = "none"
      document.body.appendChild(iframe)

      try {
        // Attempt to open protocol URL
        if (iframe.contentWindow) {
          iframe.contentWindow.location.href = protocolUrl
        }
      } catch {
        // Protocol error - might not be registered
        console.log("Protocol attempt threw error")
      }

      // Set timeout to check if app launched
      timeoutRef.current = setTimeout(() => {
        cleanup()
        document.body.removeChild(iframe)
        setIsAttempting(false)

        if (!detectedRef.current) {
          // No blur/visibility change detected - show download modal
          setShowDownloadModal(true)
        }
      }, timeout)

      // Cleanup iframe after longer timeout
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe)
        }
      }, timeout + 500)
    },
    [timeout]
  )

  const closeDownloadModal = useCallback(() => {
    setShowDownloadModal(false)
  }, [])

  return {
    openDesktopApp,
    showDownloadModal,
    closeDownloadModal,
    isAttempting,
  }
}
