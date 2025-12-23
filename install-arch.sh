#!/bin/bash
# Stream King Installer for Arch Linux

set -e

BINARY="src-tauri/target/release/stream-king"
INSTALL_DIR="/usr/local/bin"
DESKTOP_DIR="/usr/share/applications"
ICON_DIR="/usr/share/icons/hicolor"

# Check if binary exists
if [ ! -f "$BINARY" ]; then
    echo "Error: Binary not found. Run 'npm run tauri:build' first."
    exit 1
fi

echo "Installing Stream King..."

# Install binary
sudo install -Dm755 "$BINARY" "$INSTALL_DIR/stream-king"

# Install icons
sudo install -Dm644 "src-tauri/icons/32x32.png" "$ICON_DIR/32x32/apps/stream-king.png"
sudo install -Dm644 "src-tauri/icons/128x128.png" "$ICON_DIR/128x128/apps/stream-king.png"
sudo install -Dm644 "src-tauri/icons/128x128@2x.png" "$ICON_DIR/256x256/apps/stream-king.png"

# Create desktop entry with protocol handler
sudo tee "$DESKTOP_DIR/stream-king.desktop" > /dev/null << 'EOF'
[Desktop Entry]
Name=Stream King
Comment=High-fidelity streaming with full format support
Exec=stream-king %u
Icon=stream-king
Terminal=false
Type=Application
Categories=AudioVideo;Video;Player;
Keywords=streaming;video;mpv;movies;tv;
MimeType=x-scheme-handler/streamking;
EOF

# Update icon cache
sudo gtk-update-icon-cache -f -t "$ICON_DIR" 2>/dev/null || true

# Register the protocol handler
xdg-mime default stream-king.desktop x-scheme-handler/streamking
update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true

echo "Stream King installed successfully!"
echo "You can now run 'stream-king' or find it in your application menu."
echo "The streamking:// protocol handler has been registered."
