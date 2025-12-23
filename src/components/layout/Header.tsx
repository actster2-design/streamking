"use client"

import { Search, Settings, Tv } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onSearchClick?: () => void
  onSettingsClick?: () => void
}

/**
 * Header - App navigation header
 *
 * HIG Principles Applied:
 * - Deference: Transparent, minimal chrome that fades into content
 * - Clarity: Clear iconography with proper sizing
 * - Safe zones: Respects tvOS margin guidelines
 */
export function Header({ onSearchClick, onSettingsClick }: HeaderProps) {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {/* Gradient background - subtle, content-deferring */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-transparent backdrop-blur-sm" />

      <div className="relative flex items-center justify-between px-8 md:px-16 lg:px-24 py-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg">
            <Tv className="h-5 w-5 text-black" />
          </div>
          <span className="text-xl font-semibold tracking-tight hidden sm:inline">
            Stream King
          </span>
        </div>

        {/* Actions - larger touch targets */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearchClick}
            className="h-12 w-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <Search className="h-6 w-6" />
            <span className="sr-only">Search</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="h-12 w-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <Settings className="h-6 w-6" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>
    </motion.header>
  )
}
