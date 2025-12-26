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
    const url = `${RD_BASE_URL}${endpoint}`

    console.log(`RealDebrid API: ${options.method || "GET"} ${endpoint}`)

    try {
      // Import fetch dynamically or from plugin
      // For Tauri, we want to use the native fetch to bypass CORS
      let fetchFn = globalThis.fetch;

      const isTauri = typeof window !== 'undefined' &&
        ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);

      if (isTauri) {
        try {
          const { fetch } = await import('@tauri-apps/plugin-http');
          fetchFn = fetch;
          console.log("Using Tauri HTTP plugin fetch");
        } catch (e) {
          console.error("Failed to load tauri fetch plugin", e);
        }
      }

      const response = await fetchFn(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          ...options.headers,
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error("RealDebrid API error:", response.status, error)
        throw new Error(
          error.error || `RealDebrid API error: ${response.status}`
        )
      }

      return response.json()
    } catch (err) {
      console.error("RealDebrid fetch failed:", err)
      throw err
    }
  }

  /**
   * OAuth2: Get Device Code
   * POST /oauth/v2/device/code
   */
  async getDeviceCode(clientId: string): Promise<{
    device_code: string
    user_code: string
    verification_url: string
    expires_in: number
    interval: number
    direct_verification_url: string
  }> {
    const params = new URLSearchParams()
    params.append("client_id", clientId)
    params.append("new_credentials", "yes")

    const res = await fetch(`${RD_BASE_URL}/oauth/v2/device/code`, {
      method: "POST",
      body: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    if (!res.ok) {
      throw new Error(`Failed to get device code: ${res.status}`)
    }

    return res.json()
  }

  /**
   * OAuth2: Get Credentials (Exchange Device Code for Token)
   * POST /oauth/v2/device/credentials
   */
  async getCredentials(
    clientId: string,
    code: string
  ): Promise<{
    client_id: string
    client_secret: string
  }> {
    const params = new URLSearchParams()
    params.append("client_id", clientId)
    params.append("code", code)

    const res = await fetch(`${RD_BASE_URL}/oauth/v2/device/credentials`, {
      method: "POST",
      body: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    if (!res.ok) {
      // Returns 400 while waiting for user approval, handled by caller polling
      throw new Error("WAITING_FOR_APPROVAL")
    }

    return res.json()
  }

  /**
   * OAuth2: Get Token (Exchange Client ID/Secret for Access Token)
   * POST /oauth/v2/token
   */
  async getToken(
    clientId: string,
    clientSecret: string,
    code: string
  ): Promise<{
    access_token: string
    expires_in: number
    token_type: string
    refresh_token: string
  }> {
    const params = new URLSearchParams()
    params.append("client_id", clientId)
    params.append("client_secret", clientSecret)
    params.append("code", code)
    params.append("grant_type", "http://oauth.net/grant_type/device/1.0")

    const res = await fetch(`${RD_BASE_URL}/oauth/v2/token`, {
      method: "POST",
      body: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    if (!res.ok) {
      throw new Error(`Failed to get token: ${res.status}`)
    }

    return res.json()
  }

  /**
   * Get current user info
   */
  /**
   * Get current user info
   */
  async getUser(): Promise<RDUser> {
    const isTauri = typeof window !== 'undefined' &&
      ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);

    if (isTauri && window.__TAURI__?.core?.invoke) {
      console.log("Using Rust backend for RD validation");
      try {
        interface RDValidationResult {
          valid: boolean;
          user: RDUser | null;
          error: string | null;
        }

        const result = await window.__TAURI__.core.invoke<RDValidationResult>('validate_rd_token', {
          token: this.apiToken
        });

        if (result.valid && result.user) {
          return result.user;
        } else {
          throw new Error(result.error || "Validation failed");
        }
      } catch (e) {
        console.error("Rust backend validation failed:", e);
        // Fallback or re-throw? Re-throw for now to be clear
        throw e;
      }
    }

    return this.fetch<RDUser>("/user")
  }

  /**
   * Check if torrents are instantly available (cached)
   * @param hashes - Array of torrent info hashes
   */
  /**
   * Check if torrents are instantly available (cached)
   * @param hashes - Array of torrent info hashes
   */
  async checkInstantAvailability(
    hashes: string[]
  ): Promise<RDInstantAvailability> {
    const isTauri = typeof window !== 'undefined' &&
      ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);

    if (isTauri && window.__TAURI__?.core?.invoke) {
      console.log("Using Rust backend for availability check");
      return window.__TAURI__.core.invoke<RDInstantAvailability>('rd_check_instant_availability', {
        token: this.apiToken,
        hashes
      });
    }

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
    const isTauri = typeof window !== 'undefined' &&
      ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);

    if (isTauri && window.__TAURI__?.core?.invoke) {
      console.log("Using Rust backend for adding magnet");
      return window.__TAURI__.core.invoke<{ id: string; uri: string }>('rd_add_magnet', {
        token: this.apiToken,
        magnet
      });
    }

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
    const isTauri = typeof window !== 'undefined' &&
      ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);

    if (isTauri && window.__TAURI__?.core?.invoke) {
      return window.__TAURI__.core.invoke<RDTorrentInfo>('rd_get_torrent_info', {
        token: this.apiToken,
        id
      });
    }

    return this.fetch<RDTorrentInfo>(`/torrents/info/${id}`)
  }

  /**
   * Select files to download from a torrent
   * @param id - Torrent ID
   * @param files - File IDs to select (comma-separated) or "all"
   */
  async selectFiles(id: string, files: string = "all"): Promise<void> {
    const isTauri = typeof window !== 'undefined' &&
      ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);

    if (isTauri && window.__TAURI__?.core?.invoke) {
      await window.__TAURI__.core.invoke('rd_select_files', {
        token: this.apiToken,
        id,
        files
      });
      return;
    }

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
    const isTauri = typeof window !== 'undefined' &&
      ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);

    if (isTauri && window.__TAURI__?.core?.invoke) {
      console.log("Using Rust backend for unrestrict");
      return window.__TAURI__.core.invoke<RDUnrestrictedLink>('rd_unrestrict_link', {
        token: this.apiToken,
        link
      });
    }

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
