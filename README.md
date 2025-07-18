# IMDBuddy 🎥

Automatically adds IMDb ratings to every movie and TV show while browsing Hotstar, Netflix, Prime Video & other streaming platforms.

![Demo Image of IMDBuddy](./images/demo.png)

**Supported Platforms**: Hotstar • Netflix • Prime Video • Disney+ ✨

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

## Built with ❤️ by

[Pankaj Tanwar](https://twitter.com/the2ndfloorguy), and checkout his [other side-hustles](https://pankajtanwar.in/side-hustles)