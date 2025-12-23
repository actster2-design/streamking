"use client"

import { Download, Monitor, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DownloadAppModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void
}

interface DownloadLink {
  name: string
  url: string
  description: string
}

// GitHub releases URL for Stream King
const RELEASES_URL = "https://github.com/actster2-design/streamking/releases/latest"

// Direct download links for different Linux formats
const downloadLinks: DownloadLink[] = [
  {
    name: "AppImage",
    url: `${RELEASES_URL}/download/stream-king.AppImage`,
    description: "Universal Linux package, works on most distros",
  },
  {
    name: "Debian/Ubuntu (.deb)",
    url: `${RELEASES_URL}/download/stream-king.deb`,
    description: "For Debian, Ubuntu, Linux Mint, Pop!_OS",
  },
  {
    name: "Fedora/RHEL (.rpm)",
    url: `${RELEASES_URL}/download/stream-king.rpm`,
    description: "For Fedora, CentOS, RHEL, openSUSE",
  },
]

/**
 * Modal shown when the desktop app isn't installed
 *
 * Provides download links for different Linux distributions
 */
export function DownloadAppModal({ open, onOpenChange }: DownloadAppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Desktop App Required</DialogTitle>
              <DialogDescription>
                This video format requires the Stream King desktop app
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The Stream King desktop app includes MPV player for full format
            support, including MKV files with DTS/TrueHD audio.
          </p>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Download for Linux</h4>
            <div className="space-y-2">
              {downloadLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{link.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open(RELEASES_URL, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
              View All Releases
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            After installing, click the play button again to open in the desktop
            app.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
