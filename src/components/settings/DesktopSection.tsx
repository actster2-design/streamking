"use client"

import { Monitor, Check, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useSettingsStore } from "@/stores/settings"
import { useTauri } from "@/hooks/useTauri"

/**
 * Desktop App Settings Section
 *
 * Only visible when running in the Tauri desktop app.
 * Provides controls for MPV player preferences.
 */
export function DesktopSection() {
  const { isTauri, mpvAvailable, isReady } = useTauri()
  const { desktopSettings, setDesktopSettings } = useSettingsStore()

  // Only show in Tauri app
  if (!isReady || !isTauri) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Monitor className="h-5 w-5" />
        <h3 className="font-semibold">Desktop Player</h3>
      </div>

      {/* MPV Status */}
      <div className="flex items-center gap-2 text-sm">
        {mpvAvailable ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">
              MPV player available
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-muted-foreground">
              MPV not found - some formats may not play
            </span>
          </>
        )}
      </div>

      {/* Always use desktop player */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="desktop-always">Always use desktop player</Label>
          <p className="text-xs text-muted-foreground">
            Use MPV for all playback instead of browser
          </p>
        </div>
        <Switch
          id="desktop-always"
          checked={desktopSettings?.alwaysUseDesktopPlayer ?? false}
          onCheckedChange={(checked) =>
            setDesktopSettings({ alwaysUseDesktopPlayer: checked })
          }
          disabled={!mpvAvailable}
        />
      </div>

      {/* Prefer highest quality */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="desktop-quality">Prefer highest quality</Label>
          <p className="text-xs text-muted-foreground">
            Select best stream even if not browser-compatible
          </p>
        </div>
        <Switch
          id="desktop-quality"
          checked={desktopSettings?.preferHighestQuality ?? false}
          onCheckedChange={(checked) =>
            setDesktopSettings({ preferHighestQuality: checked })
          }
        />
      </div>
    </div>
  )
}
