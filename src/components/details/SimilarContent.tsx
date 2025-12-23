"use client"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { MediaCard } from "@/components/media/MediaCard"
import { useUIStore } from "@/stores/ui"
import type { TMDBMovie } from "@/types"

interface SimilarContentProps {
  items: TMDBMovie[]
  mediaType: "movie" | "tv"
}

export function SimilarContent({ items, mediaType }: SimilarContentProps) {
  const { openDetails } = useUIStore()

  // Add media_type to items if missing
  const itemsWithType = items.map((item) => ({
    ...item,
    media_type: item.media_type || mediaType,
  }))

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">More Like This</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3">
          {itemsWithType.slice(0, 10).map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              onClick={() => openDetails(item.id, item.media_type || mediaType)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
