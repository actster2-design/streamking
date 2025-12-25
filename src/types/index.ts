// TMDB Types
export interface TMDBMovie {
  id: number
  title: string
  name?: string // For TV shows
  original_title?: string
  original_name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  media_type?: "movie" | "tv"
  adult: boolean
  popularity: number
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime?: number
  episode_run_time?: number[]
  genres: { id: number; name: string }[]
  imdb_id?: string
  status: string
  tagline?: string
  number_of_seasons?: number
  number_of_episodes?: number
  seasons?: TMDBSeason[]
  credits?: {
    cast: TMDBCastMember[]
    crew: TMDBCrewMember[]
  }
  similar?: {
    results: TMDBMovie[]
  }
  external_ids?: {
    imdb_id: string | null
    tvdb_id: number | null
  }
}

export interface TMDBSeason {
  id: number
  season_number: number
  name: string
  overview: string
  poster_path: string | null
  air_date: string | null
  episode_count: number
}

export interface TMDBEpisode {
  id: number
  episode_number: number
  season_number: number
  name: string
  overview: string
  still_path: string | null
  air_date: string | null
  runtime: number | null
  vote_average: number
}

export interface TMDBSeasonDetails {
  id: number
  season_number: number
  name: string
  overview: string
  poster_path: string | null
  air_date: string | null
  episodes: TMDBEpisode[]
}

export interface TMDBCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface TMDBCrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

// Provider Types (Link Resolver)
export interface StreamSource {
  quality: "4k" | "1080p" | "720p" | "480p"
  hash: string
  title: string
  size?: number
  seeds?: number
}

export interface ProviderResponse {
  streams: StreamSource[]
}

export interface ProviderConfig {
  id: string
  name: string
  url: string
  enabled: boolean
}

// RealDebrid Types
export interface RDUser {
  id: number
  username: string
  email: string
  points?: number
  locale?: string
  avatar: string
  type?: string
  premium: number
  expiration: string
}

export interface RDTorrentInfo {
  id: string
  filename: string
  hash: string
  bytes: number
  host: string
  status: string
  progress: number
  links: string[]
}

export interface RDUnrestrictedLink {
  id: string
  filename: string
  mimeType: string
  filesize: number
  link: string
  host: string
  download: string
  streamable: number
}

export interface RDInstantAvailability {
  [hash: string]: {
    rd?: Array<{
      [fileId: string]: {
        filename: string
        filesize: number
      }
    }>
  }
}

// Trakt Types
export interface TraktUser {
  username: string
  ids: {
    slug: string
  }
}

export interface TraktWatchedItem {
  plays: number
  last_watched_at: string
  movie?: {
    title: string
    year: number
    ids: {
      trakt: number
      slug: string
      imdb: string
      tmdb: number
    }
  }
  show?: {
    title: string
    year: number
    ids: {
      trakt: number
      slug: string
      imdb: string
      tmdb: number
    }
  }
}

// App State Types
export interface WatchProgress {
  tmdbId: number
  mediaType: "movie" | "tv"
  progress: number // 0-100
  lastWatched: string
  seasonNumber?: number
  episodeNumber?: number
}

export interface AppSettings {
  theme: "light" | "dark" | "system"
  preferredQuality: "4k" | "1080p" | "720p" | "auto"
  autoPlay: boolean
  subtitlesEnabled: boolean
  subtitlesLanguage: string
  desktopSettings: DesktopSettings
}

export interface DesktopSettings {
  /** Always use desktop player (MPV) instead of browser player */
  alwaysUseDesktopPlayer: boolean
  /** Skip browser compatibility check and select highest quality stream */
  preferHighestQuality: boolean
}
