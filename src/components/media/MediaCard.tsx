"use client"

import { useState } from "react"
import Image from "next/image"
import Tilt from "react-parallax-tilt"
import { motion } from "framer-motion"
import { Play, Star } from "lucide-react"
import { getImageUrl } from "@/services/tmdb"
import { useWatchProgressStore } from "@/stores/watch-progress"
import { cn } from "@/lib/utils"
import type { TMDBMovie } from "@/types"

interface MediaCardProps {
  media: TMDBMovie
  onClick?: () => void
  priority?: boolean
  size?: "default" | "large"
}

/**
 * MediaCard - Apple TV style poster card
 *
 * HIG Principles Applied:
 * - Depth: Parallax tilt + elevated shadow on focus
 * - Focus: Scale 1.08 with prominent shadow (visible from distance)
 * - Motion: Quick, precise transitions (200ms)
 * - Clarity: High contrast rating badge
 */
export function MediaCard({ media, onClick, priority = false, size = "default" }: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const title = media.title || media.name || "Untitled"
  const posterUrl = getImageUrl(media.poster_path, "w342")
  const year = (media.release_date || media.first_air_date || "").slice(0, 4)
  const mediaType = media.media_type || "movie"

  const { getProgress } = useWatchProgressStore()
  const progress = getProgress(media.id, mediaType)

  // Size variants following HIG spacing
  const sizeClasses = {
    default: "w-40 md:w-48",
    large: "w-52 md:w-64",
  }

  return (
    <Tilt
      tiltMaxAngleX={6}
      tiltMaxAngleY={6}
      glareEnable
      glareMaxOpacity={0.15}
      glareColor="#ffffff"
      glarePosition="all"
      scale={1.0} // Scale handled by framer-motion for smoother animation
      transitionSpeed={300}
      className="flex-shrink-0 snap-start"
    >
      <motion.div
        className={cn(
          "relative aspect-[2/3] cursor-pointer rounded-xl overflow-hidden",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50",
          sizeClasses[size]
        )}
        // Apple TV style: scale up + shadow lift on focus
        initial={false}
        animate={{
          scale: isHovered ? 1.08 : 1,
          y: isHovered ? -8 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.5,
        }}
        style={{
          // Dynamic shadow based on focus state (HIG: "big shadows easier to see at distance")
          boxShadow: isHovered
            ? "0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 8px 16px -8px rgba(0, 0, 0, 0.3)"
            : "0 4px 12px -4px rgba(0, 0, 0, 0.2)",
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onClick={onClick}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick?.()}
        role="button"
        aria-label={`View ${title}`}
      >
        {/* Poster Image */}
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className={cn(
              "object-cover transition-opacity duration-200",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            sizes="(max-width: 768px) 160px, 192px"
            priority={priority}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No Image</span>
          </div>
        )}

        {/* Loading skeleton */}
        {!imageLoaded && posterUrl && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}

        {/* Rating badge - high contrast for clarity */}
        {media.vote_average > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-black/80 px-2 py-1 text-sm font-semibold backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            {media.vote_average.toFixed(1)}
          </div>
        )}

        {/* Hover overlay - subtle, content-focused */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Play indicator */}
          <motion.div
            className="mb-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: isHovered ? 1 : 0.8,
              opacity: isHovered ? 1 : 0
            }}
            transition={{ delay: 0.05, duration: 0.15 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-lg">
              <Play className="h-5 w-5 text-black fill-black ml-0.5" />
            </div>
          </motion.div>

          {/* Title and year */}
          <p className="font-semibold text-base leading-tight line-clamp-2">{title}</p>
          {year && (
            <p className="text-sm text-white/70 mt-1">{year}</p>
          )}
        </motion.div>

        {/* Watch progress bar */}
        {progress && progress.progress > 0 && progress.progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </motion.div>
    </Tilt>
  )
}
