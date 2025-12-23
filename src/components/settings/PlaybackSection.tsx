"use client"

import { Play } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSettingsStore } from "@/stores/settings"

export function PlaybackSection() {
  const {
    preferredQuality,
    autoPlay,
    subtitlesEnabled,
    setPreferredQuality,
    setAutoPlay,
    setSubtitlesEnabled,
  } = useSettingsStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Play className="h-5 w-5" />
        <h3 className="font-semibold">Playback</h3>
      </div>

      {/* Quality preference */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Preferred Quality</Label>
          <p className="text-xs text-muted-foreground">
            Default stream quality when available
          </p>
        </div>
        <Select
          value={preferredQuality}
          onValueChange={(value) =>
            setPreferredQuality(value as "auto" | "4k" | "1080p" | "720p")
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="4k">4K</SelectItem>
            <SelectItem value="1080p">1080p</SelectItem>
            <SelectItem value="720p">720p</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Auto-play */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="autoplay">Auto-play</Label>
          <p className="text-xs text-muted-foreground">
            Automatically play next episode
          </p>
        </div>
        <Switch
          id="autoplay"
          checked={autoPlay}
          onCheckedChange={setAutoPlay}
        />
      </div>

      {/* Subtitles */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="subtitles">Subtitles</Label>
          <p className="text-xs text-muted-foreground">
            Show subtitles when available
          </p>
        </div>
        <Switch
          id="subtitles"
          checked={subtitlesEnabled}
          onCheckedChange={setSubtitlesEnabled}
        />
      </div>
    </div>
  )
}
