"use client"

import { useState, useCallback } from "react"
import { useAuthStore } from "@/stores/auth"
import { useProvidersStore } from "@/stores/providers"
import { useSettingsStore } from "@/stores/settings"
import { createRDService } from "@/services/realdebrid"
import type { StreamItem } from "@/types/provider"

interface ResolvedStream {
  url: string
  title: string
  quality: string
  hash: string
  /** Warning message if quality was reduced for compatibility */
  qualityWarning?: string
  /** Whether the best stream has an incompatible format */
  hasIncompatibleFormat?: boolean
  /** URL of the highest quality stream (may not be browser-compatible) */
  incompatibleStreamUrl?: string
}

interface UseStreamResolverResult {
  resolve: (imdbId: string, season?: number, episode?: number) => Promise<ResolvedStream | null>
  availableStreams: StreamItem[]
  isResolving: boolean
  error: string | null
  clearError: () => void
}

/**
 * Generic Stremio addon stream format
 * Supports both Torrentio (hash-based) and Comet (URL-based) responses
 */
interface StremioStream {
  name?: string
  title?: string
  description?: string
  url?: string  // Direct streaming URL (Comet-style)
  infoHash?: string  // Torrent hash (Torrentio-style)
  fileIdx?: number
  behaviorHints?: {
    bingeGroup?: string
    videoSize?: number
    filename?: string
  }
}

interface StremioResponse {
  streams?: StremioStream[]
}

/**
 * Extended StreamItem that may include a direct URL
 */
interface ExtendedStreamItem extends StreamItem {
  url?: string  // Direct streaming URL (skips RealDebrid resolution)
  filename?: string  // Original filename for format detection
  isBrowserCompatible?: boolean  // Whether the format can play in browser
}

/**
 * Check if a file format is browser-compatible
 * Browsers support: MP4/WebM containers with H.264/H.265/VP9 video and AAC/Opus/MP3 audio
 */
function checkBrowserCompatibility(filename?: string, description?: string): boolean {
  if (!filename && !description) return false

  const text = `${filename || ""} ${description || ""}`.toLowerCase()

  // Check container format
  const isCompatibleContainer = /\.(mp4|webm|m4v)$/i.test(filename || "") ||
    text.includes(".mp4") || text.includes(".webm")

  // Check for incompatible audio codecs
  const hasIncompatibleAudio =
    text.includes("dts") ||
    text.includes("truehd") ||
    text.includes("atmos") ||
    text.includes("dts-hd") ||
    text.includes("dts:x")

  // Check for incompatible video features
  const hasIncompatibleVideo =
    text.includes("dolby vision") ||
    text.includes("dovi") ||
    text.includes(".dv.") ||
    text.includes("remux")  // REMUXes usually have lossless audio

  // MKV with compatible codecs might work, but unreliable
  const isMkv = /\.mkv$/i.test(filename || "") || text.includes(".mkv")

  // MP4 with AAC is the safest choice
  const hasCompatibleAudio =
    text.includes("aac") ||
    text.includes("opus") ||
    text.includes("mp3") ||
    text.includes("ddp") ||  // Dolby Digital Plus (E-AC3) has some browser support
    text.includes("dd5.1") ||
    text.includes("ac3")  // Basic AC3 has some support

  // Prefer MP4/WebM with compatible audio
  if (isCompatibleContainer && !hasIncompatibleAudio && hasCompatibleAudio) {
    return true
  }

  // MP4 without known incompatible codecs is probably OK
  if (isCompatibleContainer && !hasIncompatibleAudio && !hasIncompatibleVideo) {
    return true
  }

  // MKV is generally not browser-compatible
  if (isMkv) {
    return false
  }

  return isCompatibleContainer && !hasIncompatibleAudio
}

/**
 * Get quality rank for comparison (lower is better)
 */
function getQualityRank(quality: string): number {
  const ranks: Record<string, number> = {
    "4k": 0,
    "2160p": 0,
    "1080p": 1,
    "720p": 2,
    "480p": 3,
  }
  return ranks[quality] ?? 99
}

/**
 * Parse Stremio addon stream into our StreamItem format
 * Handles both Torrentio (hash-based) and Comet (URL-based) formats
 */
function parseStremioStream(stream: StremioStream): ExtendedStreamItem | null {
  // For Comet-style streams with direct URLs
  const hasDirectUrl = !!stream.url
  // For Torrentio-style streams with hashes
  const hash = stream.infoHash || extractHashFromBingeGroup(stream.behaviorHints?.bingeGroup)

  // Must have either a direct URL or a hash
  if (!hasDirectUrl && !hash) return null

  // Build title from available fields
  const title = stream.name || stream.title || stream.behaviorHints?.filename || hash?.substring(0, 8) || "Unknown"
  const description = stream.description || ""
  const filename = stream.behaviorHints?.filename
  const searchText = `${title} ${description} ${filename || ""}`.toLowerCase()

  // Extract quality from name/description
  let quality: StreamItem["quality"] = "480p"
  if (searchText.includes("2160p") || searchText.includes("4k") || searchText.includes("uhd")) {
    quality = "4k"
  } else if (searchText.includes("1080p")) {
    quality = "1080p"
  } else if (searchText.includes("720p")) {
    quality = "720p"
  }

  // Extract size - check behaviorHints first, then parse from text
  let size: number | undefined = stream.behaviorHints?.videoSize
  if (!size) {
    const sizeMatch = searchText.match(/💾\s*([\d.]+)\s*(GB|MB)/i)
    if (sizeMatch) {
      const value = parseFloat(sizeMatch[1])
      const unit = sizeMatch[2].toUpperCase()
      size = unit === "GB" ? value * 1024 * 1024 * 1024 : value * 1024 * 1024
    }
  }

  // Extract seeds if present (e.g., "👤 150")
  let seeds: number | undefined
  const seedsMatch = searchText.match(/👤\s*(\d+)/i)
  if (seedsMatch) {
    seeds = parseInt(seedsMatch[1], 10)
  }

  // Check browser compatibility
  const isBrowserCompatible = checkBrowserCompatibility(filename, description)

  return {
    hash: hash || "direct-url",
    title,
    quality,
    size,
    seeds,
    url: hasDirectUrl ? stream.url : undefined,
    filename,
    isBrowserCompatible,
  }
}

/**
 * Extract hash from Comet's bingeGroup format
 * Format: "comet|hash|..."
 */
function extractHashFromBingeGroup(bingeGroup?: string): string | undefined {
  if (!bingeGroup) return undefined
  const parts = bingeGroup.split("|")
  if (parts.length >= 2 && parts[1].length >= 32) {
    return parts[1]
  }
  return undefined
}

/**
 * Fetch streams from a Stremio addon (Torrentio, Comet, etc.)
 */
async function fetchStreams(
  baseUrl: string,
  imdbId: string,
  season?: number,
  episode?: number
): Promise<ExtendedStreamItem[]> {
  // Build URL based on media type
  // Remove manifest.json if present in baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/manifest\.json$/, "").replace(/\/$/, "")

  const path = season !== undefined && episode !== undefined
    ? `stream/series/${imdbId}:${season}:${episode}.json`
    : `stream/movie/${imdbId}.json`

  const url = `${cleanBaseUrl}/${path}`

  try {
    console.log("Fetching streams from:", url)
    const response = await fetch(url)
    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("Provider response not ok:", response.status, errorText)
      throw new Error(`Provider returned ${response.status}: ${errorText || response.statusText}`)
    }

    const data: StremioResponse = await response.json()

    if (!data.streams || !Array.isArray(data.streams)) {
      console.log("No streams array in response:", data)
      return []
    }

    console.log(`Found ${data.streams.length} streams from provider`)

    return data.streams
      .map(parseStremioStream)
      .filter((s): s is ExtendedStreamItem => s !== null)
  } catch (error) {
    console.error("Failed to fetch streams:", error)
    throw error
  }
}

/**
 * Sort streams by quality preference
 */
function sortByQualityPreference(
  streams: ExtendedStreamItem[],
  preference: "4k" | "1080p" | "720p" | "auto"
): ExtendedStreamItem[] {
  const qualityOrder: Record<string, number> = {
    "4k": 0,
    "2160p": 0,
    "1080p": 1,
    "720p": 2,
    "480p": 3,
  }

  const sorted = [...streams].sort((a, b) => {
    const aOrder = qualityOrder[a.quality] ?? 99
    const bOrder = qualityOrder[b.quality] ?? 99

    // If same quality, prefer more seeds
    if (aOrder === bOrder) {
      return (b.seeds ?? 0) - (a.seeds ?? 0)
    }

    return aOrder - bOrder
  })

  // If preference is not "auto", prioritize that quality
  if (preference !== "auto") {
    const preferredQuality = preference === "4k" ? ["4k", "2160p"] : [preference]
    const preferred = sorted.filter(s => preferredQuality.includes(s.quality))
    const others = sorted.filter(s => !preferredQuality.includes(s.quality))
    return [...preferred, ...others]
  }

  return sorted
}

export function useStreamResolver(): UseStreamResolverResult {
  const [availableStreams, setAvailableStreams] = useState<StreamItem[]>([])
  const [isResolving, setIsResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { rdApiToken } = useAuthStore()
  const { getActiveProvider } = useProvidersStore()
  const { preferredQuality } = useSettingsStore()

  const resolve = useCallback(
    async (
      imdbId: string,
      season?: number,
      episode?: number
    ): Promise<ResolvedStream | null> => {
      setIsResolving(true)
      setError(null)
      setAvailableStreams([])

      try {
        const provider = getActiveProvider()
        if (!provider) {
          throw new Error("No stream provider configured. Please add a provider in settings.")
        }

        // Step 1: Fetch streams from provider
        console.log("Fetching streams from:", provider.url)
        const streams = await fetchStreams(provider.url, imdbId, season, episode)

        if (streams.length === 0) {
          throw new Error("No streams found for this content.")
        }

        // Sort by quality preference
        const sortedStreams = sortByQualityPreference(streams, preferredQuality)
        setAvailableStreams(sortedStreams)

        // Check if we have streams with direct URLs (Comet-style)
        const directUrlStreams = sortedStreams.filter(s => s.url)

        if (directUrlStreams.length > 0) {
          // Apply smart format filtering for browser compatibility
          const bestOverall = directUrlStreams[0]
          const bestQualityRank = getQualityRank(bestOverall.quality)

          // Find best compatible stream at the same quality
          const compatibleAtSameQuality = directUrlStreams.find(
            s => s.isBrowserCompatible && getQualityRank(s.quality) === bestQualityRank
          )

          if (compatibleAtSameQuality && compatibleAtSameQuality.url) {
            console.log("Using compatible stream at best quality:", compatibleAtSameQuality.title)
            return {
              url: compatibleAtSameQuality.url,
              title: compatibleAtSameQuality.title,
              quality: compatibleAtSameQuality.quality,
              hash: compatibleAtSameQuality.hash,
            }
          }

          // No compatible stream at same quality - find best compatible overall
          const bestCompatible = directUrlStreams.find(s => s.isBrowserCompatible)

          if (bestCompatible && bestCompatible.url) {
            const qualityDrop = getQualityRank(bestCompatible.quality) - bestQualityRank
            let qualityWarning: string | undefined
            let incompatibleStreamUrl: string | undefined

            if (qualityDrop > 0) {
              qualityWarning = `Best quality (${bestOverall.quality}) unavailable in browser-compatible format. Playing ${bestCompatible.quality} instead. For full quality, use the desktop app.`
              incompatibleStreamUrl = bestOverall.url
              console.log("Quality warning:", qualityWarning)
            }

            console.log("Using compatible stream:", bestCompatible.title)
            return {
              url: bestCompatible.url,
              title: bestCompatible.title,
              quality: bestCompatible.quality,
              hash: bestCompatible.hash,
              qualityWarning,
              hasIncompatibleFormat: qualityDrop > 0,
              incompatibleStreamUrl,
            }
          }

          // No compatible streams at all - try the best one anyway (might work)
          console.log("No browser-compatible streams found, trying best available:", bestOverall.title)
          return {
            url: bestOverall.url!,
            title: bestOverall.title,
            quality: bestOverall.quality,
            hash: bestOverall.hash,
            qualityWarning: `Warning: This format (${bestOverall.filename || 'unknown'}) may not play in your browser. Consider using the desktop app for full compatibility.`,
            hasIncompatibleFormat: true,
            incompatibleStreamUrl: bestOverall.url!,
          }
        }

        // No direct URLs - need to resolve through RealDebrid
        if (!rdApiToken) {
          throw new Error("RealDebrid not connected. Please add your API token in settings.")
        }

        // Step 2: Check RealDebrid cache availability
        const rd = createRDService(rdApiToken)
        const hashes = sortedStreams.filter(s => !s.url).map(s => s.hash)

        console.log("Checking RealDebrid cache for", hashes.length, "streams")
        const availability = await rd.checkInstantAvailability(hashes)

        // Find first cached stream
        const cachedStream = sortedStreams.find(stream => {
          if (stream.url) return false // Skip direct URL streams (already handled above)
          const hashLower = stream.hash.toLowerCase()
          const hashData = availability[hashLower]
          return hashData?.rd && hashData.rd.length > 0
        })

        if (!cachedStream) {
          throw new Error("No cached streams available. Try a different title or wait for caching.")
        }

        console.log("Found cached stream:", cachedStream.title)

        // Step 3: Get streamable URL from RealDebrid
        const streamUrl = await rd.getStreamableLink(cachedStream.hash)

        if (!streamUrl) {
          throw new Error("Failed to generate stream URL from RealDebrid.")
        }

        console.log("Stream URL obtained successfully")

        return {
          url: streamUrl,
          title: cachedStream.title,
          quality: cachedStream.quality,
          hash: cachedStream.hash,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to resolve stream"
        setError(message)
        console.error("Stream resolution failed:", err)
        return null
      } finally {
        setIsResolving(false)
      }
    },
    [rdApiToken, getActiveProvider, preferredQuality]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    resolve,
    availableStreams,
    isResolving,
    error,
    clearError,
  }
}
