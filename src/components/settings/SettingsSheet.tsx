"use client"

import { Settings } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { AccountSection } from "./AccountSection"
import { ProvidersSection } from "./ProvidersSection"
import { PlaybackSection } from "./PlaybackSection"
import { DesktopSection } from "./DesktopSection"
import { AppearanceSection } from "./AppearanceSection"

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle>Settings</SheetTitle>
                <SheetDescription>
                  Configure your Stream King experience
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Separator className="flex-shrink-0" />

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <AccountSection />
              <Separator />
              <ProvidersSection />
              <Separator />
              <PlaybackSection />
              <Separator />
              <DesktopSection />
              <AppearanceSection />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
