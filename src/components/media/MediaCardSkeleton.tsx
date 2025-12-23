"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function MediaCardSkeleton() {
  return (
    <div className="flex-shrink-0 snap-start">
      <Skeleton className="aspect-[2/3] w-40 md:w-48 rounded-xl" />
    </div>
  )
}

export function MediaRowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex gap-4 md:gap-6 px-8 md:px-16 lg:px-24">
      {Array.from({ length: count }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  )
}
