# IMDBuddy Installation Guide

IMDBuddy is available for both Chrome and Safari browsers. Choose your preferred installation method below.

## 🌐 Chrome Extension

### From Chrome Web Store (Recommended)
*Coming Soon - Extension under review*

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the repository folder
5. The extension should now appear in your extensions list

## 🦆 Safari Extension

Safari extensions require a native macOS app wrapper and must be built using Xcode.

### Option 1: Simple Safari Web Extension (Development Only)
1. Run the build script:
   ```bash
   ./build-safari.sh
   ```
2. Open Safari > Preferences > Extensions
3. Enable "Allow Unsigned Extensions" (Developer menu)
4. Load the extension from the `safari-extension` directory

### Option 2: Full Native App (Recommended for Distribution)
1. Follow the detailed guide in `Safari-App/README.md`
2. Open the Xcode project
3. Build and run the native macOS app
4. Enable the extension in Safari Preferences

## ✅ Verify Installation

After installation, visit any supported streaming platform:
- Netflix
- Hotstar/Disney+
- Prime Video

You should see IMDb ratings appear on movie and TV show thumbnails.

## 🔧 Troubleshooting

### Chrome Extension Issues
- Ensure developer mode is enabled
- Check console for JavaScript errors
- Verify permissions for streaming sites

### Safari Extension Issues
- Check that the extension is enabled in Safari Preferences
- Verify website permissions are granted
- Use Safari Web Inspector for debugging

### General Issues
- Clear browser cache and reload streaming pages
- Check that you're on a supported streaming platform
- Ensure JavaScript is enabled

## 🌟 Features

- **Auto-detection**: Automatically detects supported streaming platforms
- **Smart matching**: Advanced fuzzy matching for accurate title recognition
- **Cached results**: Stores ratings locally to reduce API calls
- **Platform-agnostic**: Single codebase supports all platforms
- **Non-intrusive**: Subtle overlay design that doesn't interfere with browsing

## 📱 Supported Platforms

| Platform | Chrome | Safari |
|----------|--------|--------|
| Netflix | ✅ | ✅ |
| Hotstar | ✅ | ✅ |
| Disney+ | ✅ | ✅ |
| Prime Video | ✅ | ✅ |

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Open an issue on GitHub with browser version and error details
3. Include steps to reproduce the problem

## 🔒 Privacy

IMDBuddy respects your privacy:
- Only accesses supported streaming sites
- Caches ratings locally to minimize API calls
- No user data is collected or transmitted
- Open source for transparency