import type { TMDBMovie, TMDBMovieDetails, TMDBSeasonDetails } from "@/types"

const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

export function getImageUrl(
  path: string | null,
  size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w500"
): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function getBackdropUrl(
  path: string | null,
  size: "w300" | "w780" | "w1280" | "original" = "w1280"
): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

class TMDBService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
    url.searchParams.set("api_key", this.apiKey)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  }

  async getTrending(
    mediaType: "all" | "movie" | "tv" = "all",
    timeWindow: "day" | "week" = "day"
  ): Promise<TMDBMovie[]> {
    const data = await this.fetch<{ results: TMDBMovie[] }>(
      `/trending/${mediaType}/${timeWindow}`
    )
    return data.results
  }

  async getPopularMovies(page = 1): Promise<TMDBMovie[]> {
    const data = await this.fetch<{ results: TMDBMovie[] }>("/movie/popular", {
      page: String(page),
    })
    return data.results
  }

  async getPopularTVShows(page = 1): Promise<TMDBMovie[]> {
    const data = await this.fetch<{ results: TMDBMovie[] }>("/tv/popular", {
      page: String(page),
    })
    return data.results.map((show) => ({ ...show, media_type: "tv" as const }))
  }

  async getMovieDetails(id: number): Promise<TMDBMovieDetails> {
    return this.fetch<TMDBMovieDetails>(`/movie/${id}`, {
      append_to_response: "credits,similar,external_ids",
    })
  }

  async getTVDetails(id: number): Promise<TMDBMovieDetails> {
    return this.fetch<TMDBMovieDetails>(`/tv/${id}`, {
      append_to_response: "credits,similar,external_ids",
    })
  }

  async getSeasonDetails(tvId: number, seasonNumber: number): Promise<TMDBSeasonDetails> {
    return this.fetch<TMDBSeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`)
  }

  async search(query: string, page = 1): Promise<TMDBMovie[]> {
    const data = await this.fetch<{ results: TMDBMovie[] }>("/search/multi", {
      query,
      page: String(page),
    })
    // Filter to only movies and TV shows
    return data.results.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv"
    )
  }

  async getGenres(mediaType: "movie" | "tv"): Promise<{ id: number; name: string }[]> {
    const data = await this.fetch<{ genres: { id: number; name: string }[] }>(
      `/genre/${mediaType}/list`
    )
    return data.genres
  }

  async discoverByGenre(
    mediaType: "movie" | "tv",
    genreId: number,
    page = 1
  ): Promise<TMDBMovie[]> {
    const data = await this.fetch<{ results: TMDBMovie[] }>(
      `/discover/${mediaType}`,
      {
        with_genres: String(genreId),
        page: String(page),
        sort_by: "popularity.desc",
      }
    )
    return data.results.map((item) => ({
      ...item,
      media_type: mediaType,
    }))
  }
}

// Export a singleton - API key should be set via environment variable
export const tmdb = new TMDBService(
  process.env.NEXT_PUBLIC_TMDB_API_KEY ?? ""
)

export { TMDBService }
