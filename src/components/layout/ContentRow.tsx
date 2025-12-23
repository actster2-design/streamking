"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ContentRowProps {
  title: string
  children: React.ReactNode
  className?: string
}

/**
 * ContentRow - Horizontal scrolling content row
 *
 * HIG Principles Applied:
 * - Spacing: 90px side margins (tvOS safe zone), generous gap between items
 * - Clarity: Large, legible title with proper hierarchy
 * - Deference: Minimal UI chrome, content takes center stage
 */
export function ContentRow({ title, children, className }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const scrollAmount = scrollRef.current.clientWidth * 0.75
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  return (
    <section className={cn("relative group py-8", className)}>
      {/* Title - larger for TV viewing distance */}
      <h2 className="text-2xl font-semibold mb-6 px-8 md:px-16 lg:px-24">
        {title}
      </h2>

      {/* Scroll container */}
      <div className="relative">
        {/* Left scroll button - subtle, appears on hover */}
        <motion.div
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 hidden md:block"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-20 w-12 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/10"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        </motion.div>

        {/* Content - generous spacing per HIG */}
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto px-8 md:px-16 lg:px-24 pb-4 scroll-smooth snap-x snap-mandatory scrollbar-hide"
          style={{ scrollPaddingLeft: "2rem" }}
        >
          {children}
        </div>

        {/* Right scroll button */}
        <motion.div
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 hidden md:block"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-20 w-12 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/10"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </motion.div>

        {/* Edge gradients for scroll indication */}
        <div className="absolute left-0 top-0 bottom-4 w-8 md:w-16 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-4 w-8 md:w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </section>
  )
}
