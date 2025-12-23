/**
 * Stream King Protocol URL Utilities
 *
 * Builds and handles streamking:// protocol URLs for desktop app integration
 */

export interface ProtocolParams {
  /** Stream URL to play */
  url: string
  /** Display title */
  title: string
  /** Quality label (e.g., "4k", "1080p") */
  quality?: string
  /** Resume position in seconds */
  position?: number
}

/**
 * Build a streamking:// protocol URL for desktop playback
 *
 * @example
 * ```ts
 * const protocolUrl = buildProtocolUrl({
 *   url: "https://example.com/video.mkv",
 *   title: "Movie Title",
 *   quality: "4k",
 *   position: 120.5
 * })
 * // Returns: streamking://play?url=...&title=...&quality=4k&position=120.5
 * ```
 */
export function buildProtocolUrl(params: ProtocolParams): string {
  const searchParams = new URLSearchParams()

  searchParams.set("url", params.url)
  searchParams.set("title", params.title)

  if (params.quality) {
    searchParams.set("quality", params.quality)
  }
  if (params.position !== undefined && params.position > 0) {
    searchParams.set("position", params.position.toString())
  }

  return `streamking://play?${searchParams.toString()}`
}

/**
 * Attempt to open a protocol URL
 *
 * This will trigger the OS to open the registered protocol handler (Stream King desktop app).
 * If the app is not installed, the behavior depends on the browser/OS.
 *
 * @returns true if the navigation was attempted
 */
export function openProtocolUrl(url: string): boolean {
  try {
    // Use location.href for protocol URLs
    // This triggers the OS protocol handler
    window.location.href = url
    return true
  } catch (err) {
    console.error("Failed to open protocol URL:", err)
    return false
  }
}

/**
 * Check if the desktop app might be installed by attempting to open the protocol
 * and detecting if the window loses focus (indicating app launch)
 *
 * @param timeout - How long to wait for app response in ms (default: 2500)
 * @returns Promise that resolves to true if app seems installed, false otherwise
 */
export function checkDesktopAppInstalled(timeout = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    let hasBlurred = false
    let timeoutId: ReturnType<typeof setTimeout>

    const handleBlur = () => {
      hasBlurred = true
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hasBlurred = true
      }
    }

    // Listen for window blur (indicates app launched)
    window.addEventListener("blur", handleBlur)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Try to open a no-op protocol URL
    // We use a special "ping" action that the app can ignore
    const testUrl = "streamking://ping"

    // Create an invisible iframe to attempt the protocol
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    document.body.appendChild(iframe)

    try {
      iframe.contentWindow?.location.replace(testUrl)
    } catch {
      // Protocol might throw, that's okay
    }

    // Wait and check if we got a blur event
    timeoutId = setTimeout(() => {
      window.removeEventListener("blur", handleBlur)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.body.removeChild(iframe)
      resolve(hasBlurred)
    }, timeout)

    // Cleanup if component unmounts
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("blur", handleBlur)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (iframe.parentNode) {
        document.body.removeChild(iframe)
      }
    }
  })
}
