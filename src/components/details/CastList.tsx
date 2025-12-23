"use client"

import Image from "next/image"
import { User } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { getImageUrl } from "@/services/tmdb"
import type { TMDBCastMember } from "@/types"

interface CastListProps {
  cast: TMDBCastMember[]
}

export function CastList({ cast }: CastListProps) {
  // Show top 10 cast members
  const displayCast = cast.slice(0, 10)

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Cast</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4">
          {displayCast.map((member) => (
            <CastCard key={member.id} member={member} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

function CastCard({ member }: { member: TMDBCastMember }) {
  const imageUrl = getImageUrl(member.profile_path, "w185")

  return (
    <div className="flex-shrink-0 w-24 text-center">
      <div className="relative w-24 h-24 rounded-full overflow-hidden mx-auto mb-2 bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={member.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <p className="text-sm font-medium truncate">{member.name}</p>
      <p className="text-xs text-muted-foreground truncate">{member.character}</p>
    </div>
  )
}
