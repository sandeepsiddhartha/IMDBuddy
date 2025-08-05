# IMDBuddy 🎥

Automatically adds IMDb ratings to every movie and TV show while browsing Hotstar, Netflix, Prime Video & other streaming platforms.

![Demo Image of IMDBuddy](./chrome-extension/images/demo.png)

**Supported Platforms**: Hotstar • Netflix • Prime Video • Disney+ ✨

**Available For**: Chrome • Safari (Web Extension) 🌐

## 🎛️ Architecture

**Platform-Agnostic Design**: Single codebase supports all platforms through configuration objects containing platform-specific DOM selectors and extraction logic.

**Core Components**:
- `PlatformDetector` - Auto-detects current platform
- `TitleExtractor` - Extracts titles using platform configs
- `FuzzyMatcher` - Multi-algorithm matching with confidence scoring
- `ApiService` - Rate-limited IMDB API with caching
- `OverlaySystem` - Consistent UI across platforms

## 🔧 Adding New Platforms

Simply add a configuration object:

```javascript
platformName: {
    name: 'Platform Name',
    hostnames: ['domain.com'],
    cardSelectors: ['.card-class'],
    titleSelectors: ['.title-class'],
    imageContainerSelectors: ['.container'],
    extractTitle: (element, selectors) => ({ title: 'Title', type: 'movie' })
}
```

Update `chrome-extension/manifest.json` and `safari-manifest.json` permissions and you're done!

## 📁 Project Structure

```
IMDBuddy/
├── chrome-extension/           # Chrome extension files
│   ├── manifest.json          # Chrome Manifest V3
│   ├── content.js             # Main content script
│   ├── popup.html             # Extension popup
│   ├── styles.css             # Extension styles
│   └── images/                # Extension icons and assets
├── Safari-App/                # Safari extension Xcode project
├── safari-manifest.json       # Safari Manifest V2
├── safari-compatibility.js    # Safari compatibility layer
├── shared-config.json         # Shared configuration for manifests
├── generate-manifests.sh      # Generate manifests from shared config
├── build-safari.sh           # Build Safari extension
└── verify-safari-setup.sh    # Verify setup
```

## 🛠️ Development Workflow

### For Chrome:
- Work directly in the `chrome-extension/` directory
- Load unpacked extension from `chrome-extension/` in Chrome

### For Safari:
- Run `./build-safari.sh` to generate Safari-compatible files
- Follow `Safari-App/README.md` for Xcode setup

### Shared Configuration:
- Edit `shared-config.json` for common settings
- Run `./generate-manifests.sh` to update both manifests
- This ensures consistency between Chrome and Safari versions

## 🦆 Safari Extension

A Safari Web Extension version is available in the `Safari-App/` directory. This provides the same functionality as the Chrome extension but packaged as a native macOS app with Safari extension.

### Quick Setup for Safari:
1. Run `./build-safari.sh` to generate Safari-compatible files
2. Use the generated files in an Xcode Safari Web Extension project  
3. See `Safari-App/README.md` for detailed build instructions

The Safari extension maintains full compatibility with the Chrome version while providing native macOS integration.

### Manifest Management:
- Chrome uses Manifest V3 (`chrome-extension/manifest.json`)
- Safari uses Manifest V2 (`safari-manifest.json`)
- Both manifests can be generated from `shared-config.json` using `./generate-manifests.sh`
- This approach maintains the necessary differences while sharing common configuration
