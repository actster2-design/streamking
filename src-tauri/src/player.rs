use serde::{Deserialize, Serialize};
use url::Url;
use tauri::Emitter;

/// Result of a playback operation
#[derive(Debug, Serialize, Deserialize)]
pub struct PlaybackResult {
    pub success: bool,
    pub error: Option<String>,
}

/// Parameters for video playback
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PlayParams {
    pub url: String,
    pub title: String,
    #[serde(default)]
    pub start_position: Option<f64>,
}

/// Parse protocol URL (streamking://play?url=...&title=...)
pub fn parse_protocol_url(url_str: &str) -> Option<PlayParams> {
    let url = Url::parse(url_str).ok()?;

    if url.scheme() != "streamking" {
        return None;
    }

    // Handle both streamking://play?... and streamking:play?...
    let is_play = url.host_str() == Some("play") || url.path() == "play";
    if !is_play {
        return None;
    }

    let params: std::collections::HashMap<_, _> = url.query_pairs().collect();

    let video_url = params.get("url")?.to_string();
    let title = params
        .get("title")
        .map(|s| s.to_string())
        .unwrap_or_else(|| "Stream King".to_string());
    let start_position = params.get("position").and_then(|s| s.parse().ok());

    Some(PlayParams {
        url: video_url,
        title,
        start_position,
    })
}

/// Handle incoming protocol URL and start playback
pub fn handle_protocol_url(app: &tauri::AppHandle, url_str: &str) -> Result<(), String> {
    let params = parse_protocol_url(url_str).ok_or("Invalid protocol URL")?;

    log::info!("Playing from protocol: {} - {}", params.title, params.url);

    // Emit event to frontend instead of playing natively
    app.emit("deep-link-play", &params)
        .map_err(|e| e.to_string())
}

/// Tauri command: Play video with MPV
#[tauri::command]
pub async fn play_video(params: PlayParams) -> PlaybackResult {
    log::info!("play_video called (native player disabled): {} - {}", params.title, params.url);
    
    // Native player disabled in favor of frontend player
    PlaybackResult {
        success: false,
        error: Some("Native playback disabled. Please use frontend player.".to_string()),
    }
}

/// Tauri command: Stop current video playback
#[tauri::command]
pub fn stop_video() -> PlaybackResult {
    PlaybackResult {
        success: true,
        error: None,
    }
}

/// Tauri command: Check if MPV/libmpv is available
#[tauri::command]
pub fn check_mpv_available() -> bool {
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_protocol_url() {
        let url = "streamking://play?url=https%3A%2F%2Fexample.com%2Fvideo.mp4&title=Test%20Video";
        let params = parse_protocol_url(url).unwrap();
        assert_eq!(params.url, "https://example.com/video.mp4");
        assert_eq!(params.title, "Test Video");
        assert_eq!(params.start_position, None);
    }

    #[test]
    fn test_parse_protocol_url_with_position() {
        let url = "streamking://play?url=https%3A%2F%2Fexample.com%2Fvideo.mp4&title=Test&position=120.5";
        let params = parse_protocol_url(url).unwrap();
        assert_eq!(params.start_position, Some(120.5));
    }
}
