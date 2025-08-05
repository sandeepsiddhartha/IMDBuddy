/**
 * IMDBuddy - Main Entry Point
 * 
 * This file initializes the extension after all modules are loaded.
 * It depends on all the other scripts being loaded first.
 */

// Wait for DOM and all modules to be ready
function initializeIMDBuddy() {
    'use strict';
    
    // Check if already loaded to avoid duplicates
    if (window.IMDBuddyLoaded) {
        LOGGER.debug('IMDBuddy: Already loaded, skipping initialization');
        return;
    }
    
    // Verify all required modules are loaded
    const requiredModules = ['BASE_CONFIG', 'LOGGER', 'PLATFORM_CONFIGS', 'PlatformDetector', 'Storage', 'TitleExtractor', 'FuzzyMatcher', 'ApiService', 'Overlay', 'StreamingRatings'];
    const missingModules = requiredModules.filter(module => typeof window[module] === 'undefined');
    
    if (missingModules.length > 0) {
        console.error('IMDBuddy: Missing required modules:', missingModules);
        return;
    }
    
    LOGGER.debug('IMDBuddy: All modules loaded, starting initialization...');
    
    // Check if platform is supported
    if (!PlatformDetector.isSupportedPlatform()) {
        LOGGER.debug('IMDBuddy: Platform not supported');
        return;
    }
    
    // Initialize the extension
    LOGGER.debug('IMDBuddy: Starting StreamingRatings initialization...');
    StreamingRatings.init();
    
    // Expose for popup communication
    window.streamingRatings = StreamingRatings;
    
    LOGGER.debug('IMDBuddy: Extension loaded successfully');
    
    // Mark as loaded
    window.IMDBuddyLoaded = true;
}

// Message listener for popup communication
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        LOGGER.debug('IMDBuddy: Received message:', message);
        if (message.type === 'CLEAR_CACHE' && window.streamingRatings) {
            LOGGER.debug('IMDBuddy: Clearing cache...');
            window.streamingRatings.clearCache();
            sendResponse({ success: true });
        }
    });
}

// Initialize when DOM is ready
LOGGER.debug('IMDBuddy: Document ready state:', document.readyState);
if (document.readyState === 'loading') {
    LOGGER.debug('IMDBuddy: Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initializeIMDBuddy);
} else {
    LOGGER.debug('IMDBuddy: DOM already loaded, initializing immediately...');
    initializeIMDBuddy();
}
