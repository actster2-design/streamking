/**
 * Provider Interface
 *
 * This defines the contract for "Link Resolver" providers.
 * Providers return magnet hashes for a given IMDB ID.
 *
 * Compatible with:
 * - Torznab API
 * - Stremio Addon Protocol
 * - Custom implementations
 */

export interface ProviderInterface {
  /**
   * Get stream sources for a movie
   * @param imdbId - IMDB ID (e.g., "tt1160419")
   * @returns Array of stream sources sorted by quality
   */
  getMovieStreams(imdbId: string): Promise<StreamResult>

  /**
   * Get stream sources for a TV episode
   * @param imdbId - IMDB ID of the show
   * @param season - Season number
   * @param episode - Episode number
   * @returns Array of stream sources sorted by quality
   */
  getEpisodeStreams(
    imdbId: string,
    season: number,
    episode: number
  ): Promise<StreamResult>
}

export interface StreamResult {
  streams: StreamItem[]
  error?: string
}

export interface StreamItem {
  quality: "4k" | "2160p" | "1080p" | "720p" | "480p"
  hash: string
  title: string
  size?: number // bytes
  seeds?: number
  source?: string // e.g., "RARBG", "YTS"
}

/**
 * Normalize quality string to standard format
 */
export function normalizeQuality(
  quality: string
): "4k" | "1080p" | "720p" | "480p" {
  const q = quality.toLowerCase()
  if (q.includes("2160") || q.includes("4k") || q.includes("uhd")) {
    return "4k"
  }
  if (q.includes("1080")) {
    return "1080p"
  }
  if (q.includes("720")) {
    return "720p"
  }
  return "480p"
}

/**
 * Sort streams by quality (highest first)
 */
export function sortByQuality(streams: StreamItem[]): StreamItem[] {
  const qualityOrder = { "4k": 0, "2160p": 0, "1080p": 1, "720p": 2, "480p": 3 }
  return [...streams].sort(
    (a, b) =>
      (qualityOrder[a.quality] ?? 99) - (qualityOrder[b.quality] ?? 99)
  )
}
