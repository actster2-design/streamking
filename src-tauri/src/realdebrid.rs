use reqwest::Client;
use serde::{Deserialize, Serialize};

const RD_BASE_URL: &str = "https://api.real-debrid.com/rest/1.0";

#[derive(Debug, Serialize, Deserialize)]
pub struct RDUser {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub points: i64,
    pub locale: String,
    pub avatar: String,
    pub r#type: String,
    pub premium: i64,
    pub expiration: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RDValidationResult {
    pub valid: bool,
    pub user: Option<RDUser>,
    pub error: Option<String>,
}

/// Validate a RealDebrid API token by fetching user info
#[tauri::command]
pub async fn validate_rd_token(token: String) -> RDValidationResult {
    log::info!("Validating RealDebrid token via Rust backend");
    let client = Client::new();

    let result = client
        .get(format!("{}/user", RD_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await;

    match result {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<RDUser>().await {
                    Ok(user) => RDValidationResult {
                        valid: true,
                        user: Some(user),
                        error: None,
                    },
                    Err(e) => RDValidationResult {
                        valid: false,
                        user: None,
                        error: Some(format!("Failed to parse response: {}", e)),
                    },
                }
            } else {
                RDValidationResult {
                    valid: false,
                    user: None,
                    error: Some(format!("API error: {}", response.status())),
                }
            }
        }
        Err(e) => RDValidationResult {
            valid: false,
            user: None,
            error: Some(format!("Request failed: {}", e)),
        },
    }
}

/// Check instant availability of torrents
#[tauri::command]
pub async fn rd_check_instant_availability(token: String, hashes: Vec<String>) -> Result<serde_json::Value, String> {
    log::info!("Checking availability for {} hashes", hashes.len());
    let client = Client::new();
    let hash_string = hashes.join("/");
    
    let result = client
        .get(format!("{}/torrents/instantAvailability/{}", RD_BASE_URL, hash_string))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !result.status().is_success() {
        return Err(format!("API error: {}", result.status()));
    }

    result.json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RDAddMagnetResponse {
    pub id: String,
    pub uri: String,
}

/// Add magnet link
#[tauri::command]
pub async fn rd_add_magnet(token: String, magnet: String) -> Result<RDAddMagnetResponse, String> {
    log::info!("Adding magnet link");
    let client = Client::new();
    
    let result = client
        .post(format!("{}/torrents/addMagnet", RD_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .form(&[("magnet", magnet)])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !result.status().is_success() {
        return Err(format!("API error: {}", result.status()));
    }

    result.json::<RDAddMagnetResponse>()
        .await
        .map_err(|e| e.to_string())
}

/// Select files for download
#[tauri::command]
pub async fn rd_select_files(token: String, id: String, files: String) -> Result<(), String> {
    log::info!("Selecting files for torrent {}", id);
    let client = Client::new();
    
    let result = client
        .post(format!("{}/torrents/selectFiles/{}", RD_BASE_URL, id))
        .header("Authorization", format!("Bearer {}", token))
        .form(&[("files", files)])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !result.status().is_success() {
        return Err(format!("API error: {}", result.status()));
    }

    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RDTorrentInfo {
    pub id: String,
    pub filename: String,
    pub links: Vec<String>,
    pub status: String,
}

/// Get torrent info
#[tauri::command]
pub async fn rd_get_torrent_info(token: String, id: String) -> Result<RDTorrentInfo, String> {
    log::info!("Getting torrent info for {}", id);
    let client = Client::new();
    
    let result = client
        .get(format!("{}/torrents/info/{}", RD_BASE_URL, id))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !result.status().is_success() {
        return Err(format!("API error: {}", result.status()));
    }

    result.json::<RDTorrentInfo>()
        .await
        .map_err(|e| e.to_string())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RDUnrestrictResponse {
    pub id: String,
    pub filename: String,
    pub download: String,
}

/// Unrestrict link
#[tauri::command]
pub async fn rd_unrestrict_link(token: String, link: String) -> Result<RDUnrestrictResponse, String> {
    log::info!("Unrestricting link");
    let client = Client::new();
    
    let result = client
        .post(format!("{}/unrestrict/link", RD_BASE_URL))
        .header("Authorization", format!("Bearer {}", token))
        .form(&[("link", link)])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !result.status().is_success() {
        return Err(format!("API error: {}", result.status()));
    }

    result.json::<RDUnrestrictResponse>()
        .await
        .map_err(|e| e.to_string())
}

