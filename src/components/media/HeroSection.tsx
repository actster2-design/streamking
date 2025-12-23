"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Info, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getBackdropUrl } from "@/services/tmdb"
import type { TMDBMovie } from "@/types"

interface HeroSectionProps {
  items: TMDBMovie[]
  onPlay?: (item: TMDBMovie) => void
  onMoreInfo?: (item: TMDBMovie) => void
}

/**
 * HeroSection - Featured content showcase
 *
 * HIG Principles Applied:
 * - Deference: Full-bleed imagery, content is the focus
 * - Clarity: Large typography visible from distance
 * - Depth: Layered gradients create visual hierarchy
 * - Motion: Smooth crossfade transitions (500ms)
 */
export function HeroSection({ items, onPlay, onMoreInfo }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

  const featured = items[currentIndex]

  // Auto-rotate every 10 seconds (longer dwell time per HIG)
  useEffect(() => {
    if (items.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
      setImageLoaded(false)
    }, 10000)

    return () => clearInterval(interval)
  }, [items.length])

  if (!featured) return null

  const title = featured.title || featured.name || "Untitled"
  const backdropUrl = getBackdropUrl(featured.backdrop_path, "original")
  const year = (featured.release_date || featured.first_air_date || "").slice(0, 4)

  return (
    <div className="relative h-[75vh] md:h-[85vh] w-full overflow-hidden">
      {/* Backdrop Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={featured.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt={title}
              fill
              className="object-cover"
              priority
              quality={90}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-muted" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Loading state */}
      {!imageLoaded && backdropUrl && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Gradient overlays - layered for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-transparent" />

      {/* Content - generous padding per HIG safe zones */}
      <div className="absolute bottom-20 md:bottom-32 left-8 md:left-16 lg:left-24 right-8 md:right-16 lg:right-24 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={featured.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            {/* Title - extra large for TV viewing */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 leading-tight">
              {title}
            </h1>

            {/* Meta info row */}
            <div className="flex items-center gap-4 text-base md:text-lg text-muted-foreground mb-5">
              {year && <span className="font-medium">{year}</span>}
              {featured.vote_average > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{featured.vote_average.toFixed(1)}</span>
                </span>
              )}
              {featured.media_type && (
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-sm font-medium capitalize">
                  {featured.media_type}
                </span>
              )}
            </div>

            {/* Overview - readable line length */}
            <p className="text-base md:text-lg text-muted-foreground line-clamp-3 mb-8 max-w-2xl leading-relaxed">
              {featured.overview}
            </p>

            {/* Action buttons - larger touch targets */}
            <div className="flex gap-4">
              <Button
                size="lg"
                className="h-14 px-8 text-lg gap-3 rounded-xl font-semibold shadow-lg"
                onClick={() => onPlay?.(featured)}
              >
                <Play className="h-6 w-6 fill-current" />
                Play
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-14 px-8 text-lg gap-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                onClick={() => onMoreInfo?.(featured)}
              >
                <Info className="h-6 w-6" />
                More Info
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicator dots - minimal, unobtrusive */}
      {items.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {items.slice(0, 5).map((_, index) => (
            <button
              key={index}
              className={`rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 h-2 bg-white"
                  : "w-2 h-2 bg-white/40 hover:bg-white/60"
              }`}
              onClick={() => {
                setCurrentIndex(index)
                setImageLoaded(false)
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
