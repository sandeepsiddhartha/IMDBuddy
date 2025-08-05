#!/bin/bash

# IMDBuddy Content Script Builder
# Combines all modules into a single content.js file

SHARED_DIR="shared"
OUTPUT_FILE="$1"  # Path where to output the combined content.js

if [ -z "$OUTPUT_FILE" ]; then
    echo "Usage: $0 <output-file>"
    exit 1
fi

echo "Building content script from modular sources..."

# Create the combined content script
cat > "$OUTPUT_FILE" << 'EOF'
/**
 * IMDBuddy - Universal Streaming IMDB Ratings Extension
 * 
 * A modular, platform-agnostic extension that displays IMDB ratings
 * on streaming platforms like Netflix, Hotstar, Prime Video, etc.
 * 
 * This content script loads all the necessary modules and
 * initializes the extension for the current streaming platform.
 */

// Universal Streaming IMDB Ratings Extension - Modular Architecture
(() => {
    'use strict';

    // Check if modules are already loaded to avoid duplicates
    if (window.IMDBuddyLoaded) {
        console.log('IMDBuddy: Already loaded, skipping initialization');
        return;
    }

    // --- BEGIN SHARED MODULES ---
    
EOF

# Include each module file
echo "Including config module..."
echo "    // Configuration Module" >> "$OUTPUT_FILE"
echo "    // @include shared/core/config.js" >> "$OUTPUT_FILE"
cat "$SHARED_DIR/core/config.js" | grep -v "if (typeof module" | grep -v "module.exports" | grep -v "} else {" | grep -v "window\." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "Including platform configs..."
echo "    // Platform Configurations Module" >> "$OUTPUT_FILE"
echo "    // @include shared/platform-configs/platforms.js" >> "$OUTPUT_FILE"
cat "$SHARED_DIR/platform-configs/platforms.js" | grep -v "if (typeof module" | grep -v "module.exports" | grep -v "} else {" | grep -v "window\." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "Including storage module..."
echo "    // Storage Module" >> "$OUTPUT_FILE"
echo "    // @include shared/core/storage.js" >> "$OUTPUT_FILE"
cat "$SHARED_DIR/core/storage.js" | grep -v "if (typeof module" | grep -v "module.exports" | grep -v "} else {" | grep -v "window\." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "Including platform detector..."
echo "    // Platform Detection Module" >> "$OUTPUT_FILE"
echo "    // @include shared/core/platform-detector.js" >> "$OUTPUT_FILE"
cat "$SHARED_DIR/core/platform-detector.js" | grep -v "if (typeof module" | grep -v "module.exports" | grep -v "} else {" | grep -v "window\." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "Including title extractor..."
echo "    // Title Extractor Module" >> "$OUTPUT_FILE"
echo "    // @include shared/core/title-extractor.js" >> "$OUTPUT_FILE"
cat "$SHARED_DIR/core/title-extractor.js" | grep -v "if (typeof module" | grep -v "module.exports" | grep -v "} else {" | grep -v "window\." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "Including fuzzy matcher..."
echo "    // Fuzzy Matcher Module" >> "$OUTPUT_FILE"
echo "    // @include shared/core/fuzzy-matcher.js" >> "$OUTPUT_FILE"
cat "$SHARED_DIR/core/fuzzy-matcher.js" | grep -v "if (typeof module" | grep -v "module.exports" | grep -v "} else {" | grep -v "window\." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "Including API service..."
echo "    // API Service Module" >> "$OUTPUT_FILE"
echo "    // @include shared/core/api-service.js" >> "$OUTPUT_FILE"
cat "$SHARED_DIR/core/api-service.js" | grep -v "if (typeof module" | grep -v "module.exports" | grep -v "} else {" | grep -v "window\." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "Including overlay module..."
echo "    // Overlay Module" >> "$OUTPUT_FILE"
echo "    // @include shared/core/overlay.js" >> "$OUTPUT_FILE"
cat "$SHARED_DIR/core/overlay.js" | grep -v "if (typeof module" | grep -v "module.exports" | grep -v "} else {" | grep -v "window\." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "Including main extension..."
echo "    // Main Extension Module" >> "$OUTPUT_FILE"
echo "    // @include shared/core/main-extension.js" >> "$OUTPUT_FILE"
cat "$SHARED_DIR/core/main-extension.js" | grep -v "if (typeof module" | grep -v "module.exports" | grep -v "} else {" | grep -v "window\." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Add the initialization code
cat >> "$OUTPUT_FILE" << 'EOF'
    // --- END SHARED MODULES ---

    /**
     * Initialize the extension when DOM is ready
     */
    function initializeExtension() {
        if (!PlatformDetector.isSupportedPlatform()) {
            DEBUG_LOG.log('Platform not supported');
            return;
        }

        DEBUG_LOG.log('Starting StreamingRatings initialization...');
        StreamingRatings.init();
        window.streamingRatings = StreamingRatings;
        
        DEBUG_LOG.log('Extension loaded successfully');
    }

    // Message listener for popup communication
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        DEBUG_LOG.log('Received message:', message);
        if (message.type === 'CLEAR_CACHE' && window.streamingRatings) {
            DEBUG_LOG.log('Clearing cache...');
            window.streamingRatings.clearCache();
            sendResponse({ success: true });
        }
    });

    // Start extension
    DEBUG_LOG.log('Document ready state:', document.readyState);
    if (document.readyState === 'loading') {
        DEBUG_LOG.log('Waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', initializeExtension);
    } else {
        DEBUG_LOG.log('DOM already loaded, initializing immediately...');
        initializeExtension();
    }

    // Mark as loaded
    window.IMDBuddyLoaded = true;
})();
EOF

echo "Content script built successfully: $OUTPUT_FILE"
