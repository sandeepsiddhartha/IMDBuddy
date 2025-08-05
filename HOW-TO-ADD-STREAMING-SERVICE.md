# How to Add Support for a New Streaming Service

This guide provides step-by-step instructions for adding IMDBuddy support to a new streaming platform. The modular architecture makes this process straightforward and requires minimal code changes.

## 📋 Prerequisites

Before adding a new streaming service, ensure you have:

1. **Access to the streaming platform** for testing
2. **Browser developer tools knowledge** for DOM inspection
3. **Basic JavaScript understanding** for configuration
4. **Git knowledge** for version control

## 🎯 Quick Start (5-Step Process)

### Step 1: Analyze the Target Platform

1. **Open the streaming platform** in your browser
2. **Navigate to the main page** with movie/show cards
3. **Open developer tools** (F12 or Cmd+Option+I)
4. **Identify the card structure** by inspecting elements

Look for:
- **Card containers**: Elements that wrap each movie/show
- **Title elements**: Where the title text is stored
- **Image containers**: Where poster images are displayed

### Step 2: Find the Right Selectors

Use the browser's element selector tool to find:

#### Card Selectors
These identify individual movie/show cards:
```javascript
// Examples from existing platforms:
'.movie-card'           // Generic movie card
'.content-item'         // Content item wrapper
'[data-testid="card"]'  // Data attribute selector
'.slider-item'          // Carousel items
```

#### Title Selectors
These contain the movie/show title:
```javascript
// Examples:
'[aria-label]'          // Accessible label (preferred)
'.title'                // Title class
'h3'                    // Heading elements
'[data-title]'          // Data attributes
'img[alt]'              // Image alt text
```

#### Image Container Selectors
These are where overlays will be positioned:
```javascript
// Examples:
'.poster-container'     // Poster wrapper
'.image-wrapper'        // Image wrapper
'[data-testid="image"]' // Image element
'.thumbnail'            // Thumbnail container
```

### Step 3: Create Platform Configuration

Add your platform configuration to `shared/platform-configs/platforms.js`:

```javascript
// Template for new platform
yourplatform: {
    name: 'Your Platform Name',
    hostnames: ['yourplatform.com', 'subdomain.yourplatform.com'],
    cardSelectors: [
        '.your-card-selector',
        '.alternative-card-selector'
    ],
    titleSelectors: [
        '[aria-label]',
        '.title-selector',
        'h3'
    ],
    imageContainerSelectors: [
        '.poster-container',
        '.image-wrapper'
    ],
    extractTitle: (element, selectors) => {
        // Your custom title extraction logic
        for (const selector of selectors) {
            const el = element.querySelector(selector);
            if (!el) continue;

            let title = '';
            
            // Try different methods to get title
            if (el.hasAttribute('aria-label')) {
                title = el.getAttribute('aria-label');
            } else if (el.hasAttribute('alt')) {
                title = el.getAttribute('alt');
            } else {
                title = el.textContent?.trim();
            }
            
            if (!title || title.length < 2) continue;
            
            // Clean up the title if needed
            title = title.split('|')[0].trim(); // Remove extra info
            
            return {
                title: title,
                type: null // or 'movie'/'series' if detectable
            };
        }
        return null;
    }
}
```

### Step 4: Update Permissions

Add the new domain to `shared-config.json`:

```json
{
  "permissions": {
    "host_permissions": [
      "https://*.hotstar.com/*",
      "https://*.netflix.com/*", 
      "https://*.primevideo.com/*",
      "https://*.yourplatform.com/*"
    ]
  },
  "content_scripts": [
    {
      "matches": [
        "https://*.hotstar.com/*",
        "https://*.netflix.com/*",
        "https://*.primevideo.com/*", 
        "https://*.yourplatform.com/*"
      ]
    }
  ]
}
```

### Step 5: Build and Test

1. **Build the extensions**:
   ```bash
   ./build-universal.sh
   ```

2. **Test in Chrome**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-extension/` directory

3. **Test in Safari** (if needed):
   - Follow the Safari setup instructions in `Safari-App/README.md`

4. **Verify functionality**:
   - Navigate to your streaming platform
   - Check browser console for debug messages
   - Confirm overlays appear on movie/show cards

## 🔧 Advanced Configuration

### Custom Title Extraction

For complex platforms, you may need custom extraction logic:

```javascript
extractTitle: (element, selectors) => {
    // Example: Platform with complex title format
    const titleElement = element.querySelector('.complex-title');
    if (titleElement) {
        const fullText = titleElement.textContent;
        
        // Parse "Title (Year) - Type" format
        const match = fullText.match(/^(.+?)\s*\((\d{4})\)\s*-\s*(.+)$/);
        if (match) {
            return {
                title: match[1].trim(),
                year: match[2],
                type: match[3].toLowerCase().includes('movie') ? 'movie' : 'series'
            };
        }
    }
    
    // Fallback to standard extraction
    // ... rest of extraction logic
}
```

### Debugging Your Configuration

Add debugging to your extraction function:

```javascript
extractTitle: (element, selectors) => {
    console.log('YourPlatform: Extracting title from element:', element);
    
    // Log available elements for debugging
    console.log('Available title elements:', element.querySelectorAll('[aria-label], .title, h3'));
    
    // Your extraction logic here...
    
    const result = { title: 'Found Title', type: null };
    console.log('YourPlatform: Extracted title:', result);
    return result;
}
```

### Handling Dynamic Content

For platforms with lazy-loaded content:

```javascript
// In your platform configuration
cardSelectors: [
    '.movie-card',
    '.movie-card[data-loaded="true"]', // Only loaded cards
    '.lazy-card.loaded'                // Lazy-loaded cards
]
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. No Overlays Appearing
```javascript
// Check if cards are being found
console.log('Cards found:', document.querySelectorAll('.your-card-selector'));

// Check if titles are being extracted
const testCard = document.querySelector('.your-card-selector');
const titleData = TitleExtractor.extract(testCard, platformConfig);
console.log('Title data:', titleData);
```

#### 2. Wrong Elements Selected
```javascript
// Test your selectors in browser console
document.querySelectorAll('.your-selector'); // Should return card elements
```

#### 3. Title Extraction Failing
```javascript
// Add detailed logging to your extractTitle function
extractTitle: (element, selectors) => {
    console.log('=== DEBUGGING TITLE EXTRACTION ===');
    console.log('Element:', element);
    console.log('Available text content:', element.textContent);
    console.log('Available attributes:', Array.from(element.attributes));
    
    // Continue with your extraction logic...
}
```

#### 4. Overlays in Wrong Position
```javascript
// Test different image container selectors
imageContainerSelectors: [
    '.poster',           // Try different selectors
    '.image-container',  // until overlays position correctly
    '.thumbnail-wrapper'
]
```

### Performance Considerations

1. **Use specific selectors** to avoid matching unnecessary elements
2. **Test with large pages** to ensure good performance
3. **Avoid overly broad selectors** like `div` or `*`

## 📝 Testing Checklist

Before submitting your new platform support:

- [ ] Cards are correctly identified
- [ ] Titles are accurately extracted
- [ ] Overlays appear in the right position
- [ ] Extension works on different pages (home, search, genre pages)
- [ ] Performance is acceptable with many cards
- [ ] Console shows no errors
- [ ] Browser permissions are correctly set

## 🚀 Submitting Your Changes

1. **Test thoroughly** on the target platform
2. **Update documentation** if needed
3. **Add the platform to the README** supported platforms list
4. **Submit a pull request** with your changes

## 📚 Examples

### Example 1: Simple Platform

```javascript
simplestream: {
    name: 'SimpleStream',
    hostnames: ['simplestream.com'],
    cardSelectors: ['.movie-card'],
    titleSelectors: ['.title'],
    imageContainerSelectors: ['.poster'],
    extractTitle: (element, selectors) => {
        const titleEl = element.querySelector('.title');
        return titleEl ? { title: titleEl.textContent.trim(), type: null } : null;
    }
}
```

### Example 2: Complex Platform

```javascript
complexstream: {
    name: 'ComplexStream',
    hostnames: ['complexstream.com', 'cdn.complexstream.com'],
    cardSelectors: [
        '[data-testid="content-card"]',
        '.content-item',
        '.grid-item'
    ],
    titleSelectors: [
        '[aria-label]',
        '[data-title]',
        '.content-title',
        'h3'
    ],
    imageContainerSelectors: [
        '[data-testid="poster-container"]',
        '.image-wrapper',
        '.poster-frame'
    ],
    extractTitle: (element, selectors) => {
        // Try aria-label first (most reliable)
        const ariaElement = element.querySelector('[aria-label]');
        if (ariaElement) {
            const label = ariaElement.getAttribute('aria-label');
            if (label && label.length > 2) {
                // Parse "Watch Title" format
                const cleanTitle = label.replace(/^(Watch|Stream)\s+/i, '');
                return { title: cleanTitle, type: null };
            }
        }
        
        // Fallback to other selectors
        for (const selector of selectors) {
            const el = element.querySelector(selector);
            if (el && el.textContent && el.textContent.trim().length > 2) {
                return { 
                    title: el.textContent.trim(), 
                    type: null 
                };
            }
        }
        
        return null;
    }
}
```

## 🎉 Success!

Once you've successfully added support for a new streaming platform, you've:

1. ✅ Extended IMDBuddy to work on another platform
2. ✅ Helped users discover great content with IMDB ratings
3. ✅ Contributed to the open-source project
4. ✅ Learned about browser extension development

Your contribution helps make IMDBuddy more useful for everyone! 🌟

---

## 📞 Need Help?

If you run into issues:

1. **Check the browser console** for error messages
2. **Review existing platform configurations** for examples
3. **Test your selectors** in the browser developer tools
4. **Read the troubleshooting section** above

Remember: The modular architecture means you only need to focus on the platform-specific configuration—all the core functionality (API calls, caching, overlay creation) is handled automatically!
