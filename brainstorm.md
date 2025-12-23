technical specification: high-fidelity streaming web app

1. executive summary

objective: build a responsive web application with a "netflix-grade" ui/ux that streams content directly via the realdebrid (rd) api. core value: zero-buffer streaming (via rd cache) wrapped in a premium, motion-heavy interface (apple tv feel).

2. recommended tech stack

to achieve the "fluid" 60fps feel, we need a react-based framework with strong animation libraries.

    frontend: Next.js 15 (for speed/seo) or Vite + React (for pure spa feel).

    styling: Tailwind CSS (rapid ui dev).

    animations: Framer Motion (critical for that "apple tv" snappy focus effect).

    video player: Vidstack or react-player (needs custom skinning to look like netflix).

    backend: Next.js API Routes (serverless) or Node.js.

3. realdebrid integration flow (backend)

developer note: strict adherence to the RealDebrid API docs is required.
a. authentication (oauth2)

don't ask users for their api token directly (it's sketchy). use the official 3-legged oauth flow.

    get auth url: GET /oauth/v2/auth with your client_id.

    exchange code: user approves app -> you get a code -> exchange for access_token via POST /oauth/v2/token.

b. the "seamless" streaming logic

this is the secret sauce. to make it instant (like netflix) and not wait for downloads, you must strictly use cached torrents.

step 1: check cache (critical) before showing a "play" button, hash the torrent magnet and check availability.

    endpoint: GET /rest/1.0/torrents/instantAvailability/{info_hash}

    logic: if the response contains a file structure, it means the video is cached on rd servers and is instantly streamable. if 404 or empty, the user would have to wait for a download (skip these for a "seamless" exp).

step 2: add magnet

    endpoint: POST /rest/1.0/torrents/addMagnet

    payload: { "magnet": "magnet:?xt=urn:..." }

    response: returns a id (torrent_id).

step 3: select file even if cached, rd requires you to "select" the file you want to stream to generate the link.

    endpoint: POST /rest/1.0/torrents/selectFiles/{id}

    payload: { "files": "all" } (or specific file id from step 1).

step 4: get streamable link

    endpoint: POST /rest/1.0/unrestrict/link

    payload: { "link": "https://real-debrid.com/d/..." } (the link you got from step 3).

    result: this returns a download key which is a raw .mp4 or .mkv link. feed this directly into the video player.

4. ui/ux requirements (the "apple tv" feel)
visual language

    parallax posters: use a library like react-parallax-tilt on movie posters. when the user hovers, the card should tilt slightly with a "shine" effect.

    hero section: full-screen video background that auto-plays (muted) after 2 seconds of idleness.

    typography: sans-serif, heavy weights for headers (similar to sf pro display or netflix sans).

interaction design

    no layout shifts: use "skeleton screens" (gray pulsing boxes) while data loads. never let the content "jump" around.

    focus states: crucial for tv/keyboard nav. active items must scale up (scale: 1.05) and have a thick white border/shadow.

    infinite scroll: rows of content (like "trending now") must scroll horizontally with momentum (css: scroll-snap-type: x mandatory).
    
    technical specification v2.0: "stream-queen" architecture

1. high-level architecture: "the client-side mesh"

this application is a serverless single page application (SPA). it acts as an aggregator interface. the backend logic is distributed across third-party apis triggered directly by the client (user's browser).

    hosting: static site (Vercel/Netlify/GitHub Pages).

    database: none (use localStorage for settings, Trakt API for watch history).

    privacy: user tokens (RealDebrid/Trakt) never leave the user's device.

2. core modules
a. content discovery (the "netflix" face)

primary source: TMDB API (v3)

    endpoint: GET /trending/all/day (for the home page).

    endpoint: GET /movie/{id}?append_to_response=credits,similar (for the details modal).

    ui requirement: lazy-load high-res posters (w500 size) and use a blurry low-res placeholder while loading (blurhash) to maintain that "premium" feel.

b. stream resolution (the "provider" pattern)

to decouple the app from piracy sources, we use a plugin interface. define a standard ProviderInterface in typescript. the app allows users to input a custom URL for a "Link Resolver."

provider workflow:

    user action: clicks "play" on Dune (2021) (TMDB ID: 438631, IMDB ID: tt1160419).

    app request: sends GET {user_provider_url}/stream/movie/tt1160419

    provider response: returns a JSON array of magnet hashes sorted by quality (4k, 1080p).

    app action: takes the top magnet hash -> sends to RealDebrid API (instantAvailability check) -> plays video.

note for dev: check the "Torznab" or "Stremio Addon" standards. compatible parsers will save weeks of work.
c. playback engine

    player: Vidstack (best react support).

    hls support: realdebrid links are just MP4 files. for best performance, ensure the player supports "range requests" so user can scrub/seek instantly without buffering the whole file.

    subtitles: use the OpenSubtitles API (free tier) to auto-fetch .srt files based on the IMDB ID.

3. authentication & persistence

since we have no backend, we use local persistence.

on first load:

    modal: "connect your accounts."

    realdebrid: user enters API Token (save to localStorage encrypted).

    trakt (optional): OAuth2 flow (redirect to trakt -> back to app).

sync logic:

    every 5 minutes, pull "watched" status from Trakt to update UI (play bars).

    when video ends -> POST /scrobble/stop to Trakt.

4. updated tech stack recommendation

    Framework: Next.js 14 (App Router) - export as output: export (static).

    State Management: Zustand (lightweight, perfect for saving settings locally).

    Styling: Tailwind CSS + Shadcn UI (for clean, accessible components).

    Icons: Lucide React.
