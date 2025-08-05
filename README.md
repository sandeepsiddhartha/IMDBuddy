# IMDBuddy 🎥

Automatically adds IMDb ratings to every movie and TV show while browsing Hotstar, Netflix, Prime Video & other streaming platforms.

![Demo Image of IMDBuddy](./images/demo.png)

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

Update `manifest.json` permissions and you're done!

## 🦆 Safari Extension

A Safari Web Extension version is available in the `Safari-App/` directory. This provides the same functionality as the Chrome extension but packaged as a native macOS app with Safari extension.

### Quick Setup for Safari:
1. Run `./build-safari.sh` to generate Safari-compatible files
2. Use the generated files in an Xcode Safari Web Extension project
3. See `Safari-App/README.md` for detailed build instructions

The Safari extension maintains full compatibility with the Chrome version while providing native macOS integration.
