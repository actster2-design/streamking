"use client"

import { useState, useEffect } from "react"
import { Minus, Square, X, Maximize2 } from "lucide-react"

// Check if we're in Tauri
const isTauri = typeof window !== "undefined" && !!(window as unknown as { __TAURI__?: unknown }).__TAURI__

/**
 * Custom title bar for Tauri desktop app
 *
 * Only renders when running in Tauri with decorations disabled.
 * Provides window controls (minimize, maximize, close) and drag region.
 */
export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!isTauri) return

    // Check initial maximized state
    const checkMaximized = async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window")
        const win = getCurrentWindow()
        const maximized = await win.isMaximized()
        setIsMaximized(maximized)

        // Listen for changes
        const unlisten = await win.onResized(async () => {
          const max = await win.isMaximized()
          setIsMaximized(max)
        })

        return unlisten
      } catch (err) {
        console.warn("Failed to check window state:", err)
      }
    }

    const cleanup = checkMaximized()
    return () => {
      cleanup.then((unlisten) => unlisten?.())
    }
  }, [])

  // Only render in Tauri
  if (!isTauri) return null

  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window")
      await getCurrentWindow().minimize()
    } catch (err) {
      console.error("Failed to minimize:", err)
    }
  }

  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window")
      const win = getCurrentWindow()
      if (await win.isMaximized()) {
        await win.unmaximize()
      } else {
        await win.maximize()
      }
    } catch (err) {
      console.error("Failed to maximize:", err)
    }
  }

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window")
      await getCurrentWindow().close()
    } catch (err) {
      console.error("Failed to close:", err)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-8 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border select-none">
      {/* Drag region - takes most of the space */}
      <div
        className="flex-1 h-full flex items-center px-3 gap-2"
        data-tauri-drag-region
      >
        <span className="text-sm font-medium text-muted-foreground">Stream King</span>
      </div>

      {/* Window controls */}
      <div className="flex h-full">
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-muted transition-colors flex items-center justify-center"
          title="Minimize"
        >
          <Minus className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-muted transition-colors flex items-center justify-center"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Square className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Wrapper component that adds padding for the custom title bar
 * Use this to wrap your main content when using the custom title bar
 */
export function TitleBarPadding({ children }: { children: React.ReactNode }) {
  if (!isTauri) return <>{children}</>

  return <div className="pt-8">{children}</div>
}
