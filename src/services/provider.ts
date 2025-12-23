import type { StreamResult, StreamItem } from "@/types/provider"
import { sortByQuality } from "@/types/provider"

/**
 * Fetch streams from a provider URL
 *
 * Provider URL format:
 * - Movie: GET {providerUrl}/stream/movie/{imdbId}
 * - Episode: GET {providerUrl}/stream/series/{imdbId}:{season}:{episode}
 *
 * Expected response:
 * {
 *   "streams": [
 *     { "quality": "1080p", "hash": "...", "title": "...", "size": 1234567890 }
 *   ]
 * }
 */
export async function fetchMovieStreams(
  providerUrl: string,
  imdbId: string
): Promise<StreamResult> {
  try {
    const url = `${providerUrl.replace(/\/$/, "")}/stream/movie/${imdbId}`
    const response = await fetch(url)

    if (!response.ok) {
      return {
        streams: [],
        error: `Provider returned ${response.status}`,
      }
    }

    const data = await response.json()
    const streams = parseStreams(data)

    return {
      streams: sortByQuality(streams),
    }
  } catch (error) {
    return {
      streams: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function fetchEpisodeStreams(
  providerUrl: string,
  imdbId: string,
  season: number,
  episode: number
): Promise<StreamResult> {
  try {
    const url = `${providerUrl.replace(/\/$/, "")}/stream/series/${imdbId}:${season}:${episode}`
    const response = await fetch(url)

    if (!response.ok) {
      return {
        streams: [],
        error: `Provider returned ${response.status}`,
      }
    }

    const data = await response.json()
    const streams = parseStreams(data)

    return {
      streams: sortByQuality(streams),
    }
  } catch (error) {
    return {
      streams: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Parse various provider response formats into StreamItem[]
 * Handles both Stremio-style and custom formats
 */
function parseStreams(data: unknown): StreamItem[] {
  if (!data || typeof data !== "object") {
    return []
  }

  const obj = data as Record<string, unknown>

  // Handle { streams: [...] } format
  if (Array.isArray(obj.streams)) {
    return obj.streams
      .map((stream: unknown) => parseStreamItem(stream))
      .filter((s): s is StreamItem => s !== null)
  }

  // Handle direct array format
  if (Array.isArray(data)) {
    return data
      .map((stream: unknown) => parseStreamItem(stream))
      .filter((s): s is StreamItem => s !== null)
  }

  return []
}

function parseStreamItem(item: unknown): StreamItem | null {
  if (!item || typeof item !== "object") {
    return null
  }

  const obj = item as Record<string, unknown>

  // Extract hash from various formats
  let hash = ""
  if (typeof obj.hash === "string") {
    hash = obj.hash
  } else if (typeof obj.infoHash === "string") {
    hash = obj.infoHash
  } else if (typeof obj.url === "string" && obj.url.includes("btih:")) {
    // Extract from magnet URI
    const match = obj.url.match(/btih:([a-fA-F0-9]+)/i)
    if (match) {
      hash = match[1]
    }
  }

  if (!hash) {
    return null
  }

  // Extract quality
  let quality: StreamItem["quality"] = "1080p"
  if (typeof obj.quality === "string") {
    quality = normalizeQuality(obj.quality)
  } else if (typeof obj.name === "string") {
    quality = extractQualityFromTitle(obj.name)
  } else if (typeof obj.title === "string") {
    quality = extractQualityFromTitle(obj.title)
  }

  // Extract title
  const title =
    typeof obj.title === "string"
      ? obj.title
      : typeof obj.name === "string"
        ? obj.name
        : hash.substring(0, 8)

  return {
    hash,
    quality,
    title,
    size: typeof obj.size === "number" ? obj.size : undefined,
    seeds: typeof obj.seeds === "number" ? obj.seeds : undefined,
    source: typeof obj.source === "string" ? obj.source : undefined,
  }
}

function normalizeQuality(q: string): StreamItem["quality"] {
  const lower = q.toLowerCase()
  if (lower.includes("4k") || lower.includes("2160")) return "4k"
  if (lower.includes("1080")) return "1080p"
  if (lower.includes("720")) return "720p"
  return "480p"
}

function extractQualityFromTitle(title: string): StreamItem["quality"] {
  const lower = title.toLowerCase()
  if (lower.includes("2160p") || lower.includes("4k") || lower.includes("uhd")) {
    return "4k"
  }
  if (lower.includes("1080p") || lower.includes("1080i")) {
    return "1080p"
  }
  if (lower.includes("720p")) {
    return "720p"
  }
  return "480p"
}
