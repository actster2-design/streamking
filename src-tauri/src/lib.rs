mod player;

use tauri_plugin_deep_link::DeepLinkExt;

/// Check if we're running in Tauri (always true from Rust side)
#[tauri::command]
fn is_tauri_app() -> bool {
    true
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
