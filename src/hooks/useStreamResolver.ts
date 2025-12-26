"use client"

import { useState, useCallback } from "react"
import { useAuthStore } from "@/stores/auth"
import { useProvidersStore } from "@/stores/providers"
import { useSettingsStore } from "@/stores/settings"
import { useTauri } from "@/hooks/useTauri"
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
 * Browsers reliably support: MP4 with H.264 video + AAC audio
 * WebM with VP8/VP9 video + Vorbis/Opus audio also works
 *
 * We're STRICT here - if we can't confirm compatibility, assume incompatible
 */
function checkBrowserCompatibility(filename?: string, description?: string): boolean {
  const text = `${filename || ""} ${description || ""}`.toLowerCase()

  // No info to check - can't confirm compatibility
  if (!text.trim()) return false

  // === DEFINITELY INCOMPATIBLE ===

  // Incompatible audio codecs (DTS variants, lossless audio)
  const hasIncompatibleAudio =
    /\bdts\b/.test(text) ||
    text.includes("dts-hd") ||
    text.includes("dts:x") ||
    text.includes("dtsx") ||
    text.includes("truehd") ||
    text.includes("true-hd") ||
    text.includes("atmos") ||
    text.includes("lpcm") ||
    text.includes("flac")  // FLAC audio not browser-compatible

  // Incompatible video formats
  const hasIncompatibleVideo =
    text.includes("dolby vision") ||
    text.includes("dovi") ||
    /\.dv\./.test(text) ||
    /\bdv\b/.test(text) ||
    text.includes("remux") ||  // REMUXes have lossless audio
    text.includes("bdremux") ||
    text.includes("blu-ray") ||
    text.includes("bluray remux")

  // If we detect incompatible codecs, definitely not compatible
  if (hasIncompatibleAudio || hasIncompatibleVideo) {
    return false
  }

  // === CONTAINER CHECK ===

  // MKV is NOT browser-compatible (even with compatible codecs inside)
  const isMkv = /\.mkv/i.test(text)
  if (isMkv) {
    return false
  }

  // MP4/M4V/WebM containers are browser-compatible
  const isCompatibleContainer =
    /\.mp4/i.test(text) ||
    /\.m4v/i.test(text) ||
    /\.webm/i.test(text)

  // === CODEC CHECK ===

  // Best case: H.264/x264 with AAC - universally supported
  const hasH264 = text.includes("x264") || text.includes("h264") || text.includes("h.264") || text.includes("avc")
  const hasAAC = text.includes("aac")

  // Also good: VP9/VP8 for WebM
  const hasVP9 = text.includes("vp9") || text.includes("vp8")
  const hasOpus = text.includes("opus") || text.includes("vorbis")

  // H.265/HEVC has limited browser support (Safari, Edge) - allow with caution
  const hasH265 = text.includes("x265") || text.includes("h265") || text.includes("h.265") || text.includes("hevc")

  // AC3/EAC3 (Dolby Digital) has some browser support
  const hasAC3 = text.includes("ac3") || text.includes("eac3") || text.includes("ddp") || text.includes("dd5.1") || text.includes("dd+")

  // === COMPATIBILITY SCORING ===

  // MP4 + H.264 + AAC = Gold standard (100% compatible)
  if (isCompatibleContainer && hasH264 && hasAAC) {
    return true
  }

  // WebM + VP9/VP8 + Opus/Vorbis = Also great
  if (text.includes(".webm") && (hasVP9) && (hasOpus)) {
    return true
  }

  // MP4 + H.264 + AC3 = Generally works
  if (isCompatibleContainer && hasH264 && hasAC3) {
    return true
  }

  // MP4 + H.265 + AAC = Works on Safari/Edge, may fail on Firefox/Chrome
  // Allow it but it's not guaranteed
  if (isCompatibleContainer && hasH265 && hasAAC) {
    return true
  }

  // MP4 with H.264 (audio unspecified but no incompatible audio detected)
  if (isCompatibleContainer && hasH264 && !hasIncompatibleAudio) {
    return true
  }

  // If we have a compatible container and can identify compatible video codec
  if (isCompatibleContainer && (hasH264 || hasVP9)) {
    return true
  }

  // WEB-DL and WEBRip releases are typically browser-compatible (encoded for streaming)
  const isWebRelease = text.includes("web-dl") || text.includes("webdl") || text.includes("webrip") || text.includes("web-rip")
  if (isWebRelease && isCompatibleContainer) {
    return true
  }

  // HDTV releases in MP4 are usually compatible
  if (text.includes("hdtv") && isCompatibleContainer) {
    return true
  }

  // If we only have container info (MP4/WebM) and no incompatible codecs detected, cautiously allow
  if (isCompatibleContainer && !hasIncompatibleAudio && !hasIncompatibleVideo && !isMkv) {
    // Only if we have SOME indication it might be compatible
    if (hasH264 || hasAAC || hasAC3 || isWebRelease) {
      return true
    }
  }

  // Default: If we can't confirm compatibility, assume incompatible for browser safety
  return false
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

    // Import fetch dynamically or from plugin
    // For Tauri, we want to use the native fetch to bypass CORS
    let fetchFn = globalThis.fetch;

    const isTauri = typeof window !== 'undefined' &&
      ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);

    let responseData: any;

    if (isTauri && window.__TAURI__?.core?.invoke) {
      console.log("Using Rust backend for stream fetching");
      const jsonString = await window.__TAURI__.core.invoke<string>('fetch_url', { url });
      responseData = JSON.parse(jsonString);
    } else {
      // Fallback or browser mode
      const response = await fetch(url)
      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        console.error("Provider response not ok:", response.status, errorText)
        throw new Error(`Provider returned ${response.status}: ${errorText || response.statusText}`)
      }
      responseData = await response.json();
    }

    const data: StremioResponse = responseData;

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
/**
 * Sort streams by quality preference and English language priority
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

  // Keywords to prioritize/deprioritize
  const englishKeywords = ["eng", "english", "multi"]
  const negativeKeywords = ["latino", "french", "german", "italian", "spanish", "rus", "dubbed"]

  const getLanguageScore = (stream: ExtendedStreamItem) => {
    const text = (stream.title + " " + (stream.filename || "")).toLowerCase()

    // Check for negative keywords first (non-English dubbed)
    // But be careful with "multi" which might contain both
    if (negativeKeywords.some(k => text.includes(k)) && !text.includes("multi")) {
      return 2 // Low priority
    }

    // Explicit English or Multi
    if (englishKeywords.some(k => text.includes(k))) {
      return 0 // High priority
    }

    // Default (assume English if not specified, common in scene releases)
    return 1
  }

  const sorted = [...streams].sort((a, b) => {
    // 1. Language Priority
    const scoreA = getLanguageScore(a)
    const scoreB = getLanguageScore(b)

    if (scoreA !== scoreB) {
      return scoreA - scoreB
    }

    // 2. Quality Priority
    const aOrder = qualityOrder[a.quality] ?? 99
    const bOrder = qualityOrder[b.quality] ?? 99

    if (aOrder !== bOrder) {
      // If preference is auto, trust standard order (4k -> 1080p)
      // If preference is set, we filter later, so here just sort by quality descending
      return aOrder - bOrder
    }

    // 3. Seed Count
    return (b.seeds ?? 0) - (a.seeds ?? 0)
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
  const { isTauri, mpvAvailable } = useTauri()

  // In Tauri with MPV, all formats are compatible
  const skipCompatibilityCheck = isTauri && mpvAvailable

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
          const bestOverall = directUrlStreams[0]

          // In Tauri with MPV, skip compatibility filtering - just use the best stream
          if (skipCompatibilityCheck) {
            console.log("Tauri+MPV: Using best quality stream directly:", bestOverall.title)
            return {
              url: bestOverall.url!,
              title: bestOverall.title,
              quality: bestOverall.quality,
              hash: bestOverall.hash,
            }
          }

          // Apply smart format filtering for browser compatibility
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

          // No compatible streams at all - throw error instead of trying incompatible format
          console.log("No browser-compatible streams found. Available streams:", directUrlStreams.length)
          throw new Error(
            `No browser-compatible streams found. Available streams use formats (MKV, DTS, etc.) that won't play in your browser. ` +
            `Try searching for a different release or use the desktop app for full format support.`
          )
        }

        // No direct URLs - need to resolve through RealDebrid
        if (!rdApiToken) {
          throw new Error("RealDebrid not connected. Please add your API token in settings.")
        }

        // Step 2: Check RealDebrid cache availability
        const rd = createRDService(rdApiToken)

        // Filter streams for browser compatibility before checking cache (unless in Tauri+MPV mode)
        const streamsToCheck = skipCompatibilityCheck
          ? sortedStreams.filter(s => !s.url)
          : sortedStreams.filter(s => !s.url && s.isBrowserCompatible)

        if (streamsToCheck.length === 0 && !skipCompatibilityCheck) {
          // No compatible streams even before cache check
          throw new Error(
            `No browser-compatible streams found. Available streams use formats (MKV, DTS, etc.) that won't play in your browser. ` +
            `Try searching for a different release or use the desktop app for full format support.`
          )
        }

        const hashes = streamsToCheck.map(s => s.hash)

        console.log("Checking RealDebrid cache for", hashes.length, "browser-compatible streams")
        const availability = await rd.checkInstantAvailability(hashes)

        // Find first cached stream (already filtered for compatibility)
        const cachedStream = streamsToCheck.find(stream => {
          const hashLower = stream.hash.toLowerCase()
          const hashData = availability[hashLower]
          return hashData?.rd && hashData.rd.length > 0
        })

        if (!cachedStream) {
          // Check if there were incompatible cached streams we skipped
          if (!skipCompatibilityCheck) {
            const allHashes = sortedStreams.filter(s => !s.url).map(s => s.hash)
            const allAvailability = await rd.checkInstantAvailability(allHashes)
            const hasIncompatibleCached = sortedStreams.some(stream => {
              if (stream.url || stream.isBrowserCompatible) return false
              const hashData = allAvailability[stream.hash.toLowerCase()]
              return hashData?.rd && hashData.rd.length > 0
            })

            if (hasIncompatibleCached) {
              throw new Error(
                `Cached streams are available but not in browser-compatible formats. ` +
                `Use the desktop app for full format support, or try a different release.`
              )
            }
          }
          throw new Error("No cached streams available. Try a different title or wait for caching.")
        }

        console.log("Found cached browser-compatible stream:", cachedStream.title)

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
    [rdApiToken, getActiveProvider, preferredQuality, skipCompatibilityCheck]
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
