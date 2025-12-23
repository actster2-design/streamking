"use client"

import { Palette, Moon, Sun, Monitor } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSettingsStore } from "@/stores/settings"

export function AppearanceSection() {
  const { theme, setTheme } = useSettingsStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5" />
        <h3 className="font-semibold">Appearance</h3>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Theme</Label>
          <p className="text-xs text-muted-foreground">
            Choose your preferred appearance
          </p>
        </div>
        <Select
          value={theme}
          onValueChange={(value) =>
            setTheme(value as "system" | "light" | "dark")
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                System
              </div>
            </SelectItem>
            <SelectItem value="light">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Light
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Dark
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Version info */}
      <div className="pt-4 text-center text-xs text-muted-foreground">
        <p>Stream King v1.0.0</p>
        <p className="mt-1">Powered by RealDebrid</p>
      </div>
    </div>
  )
}
