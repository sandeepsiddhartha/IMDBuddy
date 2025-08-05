/**
 * IMDBuddy - Base Configuration
 * 
 * This file contains all the core configuration settings used across
 * both Chrome and Safari extensions.
 * 
 */

// Base Configuration - Core settings for the extension
const BASE_CONFIG = {
    // API settings
    API_URL: 'https://api.imdbapi.dev/search/titles',
    REQUEST_DELAY: 110, // Slightly over 100ms to stay safely under 10 req/sec
    MAX_CONCURRENT_REQUESTS: 5, // Allow multiple requests in parallel
    
    // Storage settings
    STORAGE_KEY: 'imdb_cache',
    CACHE_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    
    // Matching settings
    MIN_MATCH_SCORE: 0.7,
    
    // UI settings
    OBSERVER_DELAY: 3000,
    
    // Extension metadata
    VERSION: '3.0.0',
    NAME: 'IMDBuddy'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BASE_CONFIG };
} else {
    window.BASE_CONFIG = BASE_CONFIG;
}
