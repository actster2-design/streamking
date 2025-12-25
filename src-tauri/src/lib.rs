mod player;
mod realdebrid;

use tauri_plugin_deep_link::DeepLinkExt;

/// Check if we're running in Tauri (always true from Rust side)
#[tauri::command]
fn is_tauri_app() -> bool {
    true
}

/// Generic URL fetcher to bypass CORS
#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    log::info!("Fetching URL via Rust: {}", url);
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
        
    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    if !response.status().is_success() {
        return Err(format!("Request failed with status: {}", response.status()));
    }
    
    response.text()
        .await
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // Setup logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Register deep link handler
            #[cfg(desktop)]
            {
                let handle = app.handle().clone();
                app.deep_link().on_open_url(move |event| {
                    let urls = event.urls();
                    for url in urls {
                        log::info!("Received deep link: {}", url);
                        if let Err(e) = player::handle_protocol_url(&handle, url.as_str()) {
                            log::error!("Failed to handle protocol URL: {}", e);
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            is_tauri_app,
            player::play_video,
            player::stop_video,
            player::check_mpv_available,
            realdebrid::validate_rd_token,
            realdebrid::rd_check_instant_availability,
            realdebrid::rd_add_magnet,
            realdebrid::rd_select_files,
            realdebrid::rd_get_torrent_info,
            realdebrid::rd_unrestrict_link,
            fetch_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
