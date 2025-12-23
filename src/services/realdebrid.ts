import type {
  RDUser,
  RDTorrentInfo,
  RDUnrestrictedLink,
  RDInstantAvailability,
} from "@/types"

const RD_BASE_URL = "https://api.real-debrid.com/rest/1.0"

class RealDebridService {
  private apiToken: string

  constructor(apiToken: string) {
    this.apiToken = apiToken
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${RD_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.error || `RealDebrid API error: ${response.status}`
      )
    }

    return response.json()
  }

  /**
   * Get current user info
   */
  async getUser(): Promise<RDUser> {
    return this.fetch<RDUser>("/user")
  }

  /**
   * Check if torrents are instantly available (cached)
   * @param hashes - Array of torrent info hashes
   */
  async checkInstantAvailability(
    hashes: string[]
  ): Promise<RDInstantAvailability> {
    const hashString = hashes.join("/")
    return this.fetch<RDInstantAvailability>(
      `/torrents/instantAvailability/${hashString}`
    )
  }

  /**
   * Add a magnet link
   * @param magnet - Magnet URI
   */
  async addMagnet(magnet: string): Promise<{ id: string; uri: string }> {
    const formData = new URLSearchParams()
    formData.append("magnet", magnet)

    return this.fetch<{ id: string; uri: string }>("/torrents/addMagnet", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
  }

  /**
   * Get torrent info
   */
  async getTorrentInfo(id: string): Promise<RDTorrentInfo> {
    return this.fetch<RDTorrentInfo>(`/torrents/info/${id}`)
  }

  /**
   * Select files to download from a torrent
   * @param id - Torrent ID
   * @param files - File IDs to select (comma-separated) or "all"
   */
  async selectFiles(id: string, files: string = "all"): Promise<void> {
    const formData = new URLSearchParams()
    formData.append("files", files)

    await this.fetch(`/torrents/selectFiles/${id}`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
  }

  /**
   * Unrestrict a link to get direct download URL
   */
  async unrestrictLink(link: string): Promise<RDUnrestrictedLink> {
    const formData = new URLSearchParams()
    formData.append("link", link)

    return this.fetch<RDUnrestrictedLink>("/unrestrict/link", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
  }

  /**
   * Delete a torrent
   */
  async deleteTorrent(id: string): Promise<void> {
    await this.fetch(`/torrents/delete/${id}`, {
      method: "DELETE",
    })
  }

  /**
   * Full flow: Get streamable link from a magnet hash
   * 1. Check cache availability
   * 2. Add magnet
   * 3. Select files
   * 4. Get unrestricted link
   */
  async getStreamableLink(
    hash: string,
    magnetUri?: string
  ): Promise<string | null> {
    // Check if cached
    const availability = await this.checkInstantAvailability([hash])
    const hashData = availability[hash.toLowerCase()]

    if (!hashData?.rd || hashData.rd.length === 0) {
      return null // Not cached, would require download
    }

    // Build magnet URI if not provided
    const magnet = magnetUri || `magnet:?xt=urn:btih:${hash}`

    // Add magnet
    const { id } = await this.addMagnet(magnet)

    // Select all files
    await this.selectFiles(id, "all")

    // Get torrent info to get the download links
    const torrentInfo = await this.getTorrentInfo(id)

    if (!torrentInfo.links || torrentInfo.links.length === 0) {
      return null
    }

    // Unrestrict the first (main) link
    const unrestricted = await this.unrestrictLink(torrentInfo.links[0])

    return unrestricted.download
  }
}

export { RealDebridService }

/**
 * Create a RealDebrid service instance
 */
export function createRDService(apiToken: string): RealDebridService {
  return new RealDebridService(apiToken)
}
