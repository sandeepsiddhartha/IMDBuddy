# IMDBuddy Debugging Guide

## Debug Mode
The extension now includes comprehensive debug logging to help diagnose issues.

### Enabling/Disabling Debug Mode
Debug mode is controlled by the `DEBUG` setting in `shared/core/config.js`:
```javascript
DEBUG: true, // Set to false for production
```

### Viewing Debug Logs
1. **Chrome**: Open Developer Tools (F12) → Console tab
2. **Safari**: Develop menu → Show Web Inspector → Console tab

All debug messages are prefixed with `[IMDBuddy]` for easy filtering.

### Debug Log Categories

#### 🚀 **Initialization Logs**
- Extension loading and module initialization
- Platform detection results
- API service setup

```
[IMDBuddy] Starting extension initialization...
[IMDBuddy] PlatformDetector: Checking hostname: netflix.com
[IMDBuddy] PlatformDetector: Detected platform: Netflix (netflix)
[IMDBuddy] StreamingRatings: Starting initialization...
```

#### 🔍 **Card Processing Logs**
- Number of cards found on page
- Batch processing information
- Title extraction attempts

```
[IMDBuddy] StreamingRatings: Found 12 cards to process
[IMDBuddy] StreamingRatings: Processing batch 1 (10 cards)
[IMDBuddy] TitleExtractor: Successfully extracted: {title: "Stranger Things", type: "series"}
```

#### 🌐 **API Request Logs**
- Cache hits/misses
- Request queue management
- API responses and errors

```
[IMDBuddy] ApiService: Cache miss for: Stranger Things
[IMDBuddy] ApiService: Adding to request queue: Stranger Things
[IMDBuddy] ApiService: Processing request for: Stranger Things
[IMDBuddy] Fetching from API: Stranger Things (attempt 1)
```

#### 💾 **Storage Logs**
- Cache operations
- Data retrieval and storage

```
[IMDBuddy] Storage: Getting data for key: imdb_cache
[IMDBuddy] Storage: Retrieved data for imdb_cache: 25 entries
[IMDBuddy] ApiService: Cache loaded, entries: 25
```

### Common Issues & Solutions

#### ❌ **Extension Not Loading**
**Symptoms:** No `[IMDBuddy]` logs in console

**Check:**
1. Extension is enabled in browser
2. Page is a supported streaming platform
3. Manifest permissions are correct

#### ❌ **No Cards Found**
**Symptoms:** `Found 0 cards to process`

**Check:**
1. Platform detection succeeded
2. Card selectors match current page structure
3. Page has finished loading (try refreshing)

#### ❌ **Title Extraction Failing**
**Symptoms:** `TitleExtractor: Extraction failed for element`

**Solutions:**
1. Check if platform selectors need updating
2. Examine page DOM structure changes
3. Review extraction failure logs for specific issues

#### ❌ **API Requests Failing**
**Symptoms:** `API Error` messages

**Check:**
1. Network connectivity
2. API service availability
3. Rate limiting (429 errors)

#### ❌ **Storage Issues**
**Symptoms:** `Storage get/set error` messages

**Check:**
1. Extension storage permissions
2. Available storage space
3. Browser storage settings

### Manual Debugging Commands

Open browser console and try these commands:

```javascript
// Check if extension is loaded
window.IMDBuddyLoaded

// Access extension instance
window.streamingRatings

// Check current platform
window.streamingRatings.platform

// Clear cache manually
window.streamingRatings.clearCache()

// Force process cards
window.streamingRatings.processExistingCards()

// Check API cache
window.streamingRatings.ApiService?.cache
```

### Platform-Specific Debugging

#### **Netflix**
Look for logs about aria-label extraction and fallback text elements.

#### **Hotstar/Disney+**
Check for swiper-slide detection and aria-label/img alt extraction.

#### **Prime Video**
Monitor card container detection and title link extraction.

### Performance Monitoring

Debug logs include timing information:
- Request queue processing rates
- Batch processing durations
- Cache hit ratios

### Reporting Issues

When reporting issues, please include:
1. Browser type and version
2. Streaming platform and URL
3. Complete console logs with `[IMDBuddy]` prefix
4. Steps to reproduce the issue

### Disabling Debug Mode

For production or improved performance:
1. Set `DEBUG: false` in `shared/core/config.js`
2. Rebuild extension with `./build-universal.sh`
3. Reload extension in browser

---

**Need help?** Check the logs first, then review this guide for common solutions.
