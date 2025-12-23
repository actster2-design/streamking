use libmpv2::Mpv;
use serde::{Deserialize, Serialize};
use url::Url;

/// Result of a playback operation
#[derive(Debug, Serialize, Deserialize)]
pub struct PlaybackResult {
    pub success: bool,
    pub error: Option<String>,
}

/// Parameters for video playback
#[derive(Debug, Deserialize)]
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
pub fn handle_protocol_url(_app: &tauri::AppHandle, url_str: &str) -> Result<(), String> {
    let params = parse_protocol_url(url_str).ok_or("Invalid protocol URL")?;

    log::info!("Playing from protocol: {} - {}", params.title, params.url);

    // Create new MPV instance and play
    play_with_mpv(&params.url, &params.title, params.start_position)
}

/// Play video using libmpv in a new window
fn play_with_mpv(url: &str, title: &str, start_position: Option<f64>) -> Result<(), String> {
    // Create MPV instance
    let mpv = Mpv::new().map_err(|e| format!("Failed to create MPV instance: {}", e))?;

    // Configure MPV for best playback
    mpv.set_property("title", title)
        .map_err(|e| format!("Failed to set title: {}", e))?;

    mpv.set_property("hwdec", "auto")
        .map_err(|e| format!("Failed to set hwdec: {}", e))?;

    mpv.set_property("vo", "gpu")
        .map_err(|e| format!("Failed to set video output: {}", e))?;

    mpv.set_property("fullscreen", true)
        .map_err(|e| format!("Failed to set fullscreen: {}", e))?;

    // Set start position if provided
    if let Some(pos) = start_position {
        mpv.set_property("start", format!("+{}", pos))
            .map_err(|e| format!("Failed to set start position: {}", e))?;
    }

    // Load and play the file
    mpv.command("loadfile", &[url, "replace"])
        .map_err(|e| format!("Failed to load file: {}", e))?;

    // Wait for playback to complete (blocking in this simple implementation)
    // In a more complete implementation, you'd use events
    loop {
        match mpv.get_property::<String>("path") {
            Ok(_) => {
                // Check if we're still playing
                if let Ok(idle) = mpv.get_property::<bool>("idle-active") {
                    if idle {
                        break;
                    }
                }
                std::thread::sleep(std::time::Duration::from_millis(100));
            }
            Err(_) => break,
        }
    }

    Ok(())
}

/// Tauri command: Play video with MPV
#[tauri::command]
pub async fn play_video(params: PlayParams) -> PlaybackResult {
    log::info!("play_video called: {} - {}", params.title, params.url);

    // Spawn in a separate thread since MPV blocks
    let result = tokio::task::spawn_blocking(move || {
        play_with_mpv(&params.url, &params.title, params.start_position)
    })
    .await;

    match result {
        Ok(Ok(())) => PlaybackResult {
            success: true,
            error: None,
        },
        Ok(Err(e)) => PlaybackResult {
            success: false,
            error: Some(e),
        },
        Err(e) => PlaybackResult {
            success: false,
            error: Some(format!("Task failed: {}", e)),
        },
    }
}

/// Tauri command: Stop current video playback
#[tauri::command]
pub fn stop_video() -> PlaybackResult {
    // In a more complete implementation, you'd track the MPV instance
    // and send a quit command to it
    PlaybackResult {
        success: true,
        error: None,
    }
}

/// Tauri command: Check if MPV/libmpv is available
#[tauri::command]
pub fn check_mpv_available() -> bool {
    // Try to create an MPV instance to verify libmpv is working
    match Mpv::new() {
        Ok(_) => {
            log::info!("MPV is available");
            true
        }
        Err(e) => {
            log::warn!("MPV not available: {}", e);
            false
        }
    }
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
