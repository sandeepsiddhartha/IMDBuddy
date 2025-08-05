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
    
    // Configuration Module
    // @include shared/core/config.js
/**
 * IMDBuddy - Base Configuration
 * 
 * This file contains all the core configuration settings used across
 * both Chrome and Safari extensions.
 * 
 */

// Base Configuration - Core settings for the extension
const BASE_CONFIG = {
    // Debug settings
    DEBUG: true, // Set to false for production
    
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

// Debug utility functions
const DEBUG_LOG = {
    log: (...args) => {
        if (BASE_CONFIG.DEBUG) {
            console.log(`[${BASE_CONFIG.NAME}]`, ...args);
        }
    },
    warn: (...args) => {
        if (BASE_CONFIG.DEBUG) {
            console.warn(`[${BASE_CONFIG.NAME}]`, ...args);
        }
    },
    error: (...args) => {
        if (BASE_CONFIG.DEBUG) {
            console.error(`[${BASE_CONFIG.NAME}]`, ...args);
        }
    },
    group: (label) => {
        if (BASE_CONFIG.DEBUG) {
            console.group(`[${BASE_CONFIG.NAME}] ${label}`);
        }
    },
    groupEnd: () => {
        if (BASE_CONFIG.DEBUG) {
            console.groupEnd();
        }
    }
};

// Export for use in other modules
}

    // Platform Configurations Module
    // @include shared/platform-configs/platforms.js
/**
 * IMDBuddy - Platform Configurations
 * 
 * This file contains platform-specific configurations for different
 * streaming services. Each platform has its own set of selectors
 * and extraction logic.
 * 
 * To add support for a new streaming service:
 * 1. Add a new configuration object with the platform key
 * 2. Specify hostnames, selectors, and extraction logic
 * 3. Test the selectors on the target streaming platform
 * 4. Update the host_permissions in shared-config.json
 * 
 */

// Platform-Specific Configurations
const PLATFORM_CONFIGS = {
    /**
     * Disney+ Hotstar Configuration
     * Supports both hotstar.com and disneyplus.com domains
     */
    hotstar: {
        name: 'Hotstar',
        hostnames: ['hotstar.com', 'disneyplus.com'],
        cardSelectors: [
            '.swiper-slide',
            '.tray-vertical-card', 
            '[data-horizontal-card-container-width]'
        ],
        titleSelectors: [
            '[aria-label]', 
            'img[alt]', 
            '[title]', 
            'a[aria-label]'
        ],
        imageContainerSelectors: [
            '[data-testid="hs-image"]', 
            '.rQ_gfJEdoJGvLVb_rKLtL', 
            'img', 
            '.image-container'
        ],
        extractTitle: (element, selectors) => {
            // Try all possible selectors for title extraction
            const allPossibleSelectors = [
                '[aria-label]',
                'img[alt]'
            ];

            const foundTitles = new Set(); // Track found titles to avoid duplicates

            for (const selector of allPossibleSelectors) {
                const elements = element.querySelectorAll(selector);
                
                for (const el of elements) {
                    let title = '';
                    
                    // Try different ways to get the title
                    if (el.hasAttribute('aria-label')) {
                        title = el.getAttribute('aria-label');
                    } else if (el.hasAttribute('alt')) {
                        title = el.getAttribute('alt');
                    } else if (el.hasAttribute('title')) {
                        title = el.getAttribute('title');
                        title = el.textContent?.trim();
                    }
                    
                    if (!title) continue;
                    
                    // Skip generic/non-title content
                    if (title.length < 2 || 
                        title.toLowerCase().includes('image') ||
                        title.toLowerCase().includes('logo') ||
                        title.toLowerCase().includes('icon')) {
                        continue;
                    }

                    // Normalize title for duplicate checking
                    const normalizedTitle = title.toLowerCase().trim();
                    if (foundTitles.has(normalizedTitle)) {
                        continue; // Skip if we've already found this title
                    }
                    
                    foundTitles.add(normalizedTitle);

                    // Parse Hotstar format: "Title, Type" or just "Title"
                    const parts = title.split(',').map(s => s.trim());
                    const mainTitle = parts[0];
                    const typeHint = parts[1];
                    
                    if (mainTitle.length > 0) {
                        return {
                            title: mainTitle,
                            type: typeHint?.toLowerCase() === 'movie' ? 'movie' : 
                                  typeHint?.toLowerCase() === 'series' ? 'series' : null
                        };
                    }
                }
            }
            return null;
        }
    },

    /**
     * Netflix Configuration
     * Supports netflix.com domain
     */
    netflix: {
        name: 'Netflix',
        hostnames: ['netflix.com'],
        cardSelectors: [
            '.slider-item',
            '.title-card',
            '.fallback-text-container',
            'a[aria-label]'
        ],
        titleSelectors: [
            'a[aria-label]',
            '.fallback-text',
            '.video-title'
        ],
        imageContainerSelectors: [
            '.boxart-image-in-padded-container',
            '.fallback-text-container',
            '.title-card-image-fallback'
        ],
        extractTitle: (element, selectors) => {
            // First try aria-label on links (most reliable for Netflix)
            const linkWithAriaLabel = element.querySelector('a[aria-label]');
            if (linkWithAriaLabel) {
                const ariaLabel = linkWithAriaLabel.getAttribute('aria-label');
                if (ariaLabel && ariaLabel.trim().length > 0) {
                    return {
                        title: ariaLabel.trim(),
                        type: null // Netflix doesn't clearly distinguish in DOM
                    };
                }
            }

            // Fallback to other selectors
            for (const selector of selectors) {
                const el = element.querySelector(selector);
                if (!el) continue;

                let title = el.textContent?.trim();
                if (!title && el.hasAttribute('aria-label')) {
                    title = el.getAttribute('aria-label')?.trim();
                }
                
                if (!title) continue;

                return {
                    title: title.split('•')[0].trim(), // Netflix format: "Title • Year"
                    type: null // Netflix doesn't clearly distinguish in DOM
                };
            }
            return null;
        }
    },

    /**
     * Amazon Prime Video Configuration
     * Supports primevideo.com and amazon.com domains
     */
    prime: {
        name: 'Prime Video',
        hostnames: ['primevideo.com', 'amazon.com'],
        cardSelectors: [
            '.tst-hover-container', 
            '.av-card-container'
        ],
        titleSelectors: [
            '[data-automation-id="title"]', 
            '.av-card-title'
        ],
        imageContainerSelectors: [
            '.av-card-image', 
            '.tst-packshot-image'
        ],
        extractTitle: (element, selectors) => {
            // Prime Video-specific title extraction logic
            for (const selector of selectors) {
                const el = element.querySelector(selector);
                if (!el) continue;

                const title = el.textContent?.trim() || el.getAttribute('title')?.trim();
                if (!title) continue;

                return { title, type: null };
            }
            return null;
        }
    }
};

// Export for use in other modules
}

    // Storage Module
    // @include shared/core/storage.js
/**
 * IMDBuddy - Storage Module
 * 
 * Cross-browser compatible storage module that works with both
 * Chrome and Safari extension APIs.
 * 
 */

const Storage = {
    /**
     * Get data from extension storage
     * @param {string} key - The storage key to retrieve
     * @returns {Promise<Object>} The stored data or empty object
     */
    async get(key) {
        DEBUG_LOG.log(`Storage: Getting data for key: ${key}`);
        try {
            const result = await chrome.storage.local.get([key]);
            const data = result[key] ? JSON.parse(result[key]) : {};
            DEBUG_LOG.log(`Storage: Retrieved data for ${key}:`, Object.keys(data).length, 'entries');
            return data;
        } catch (error) {
            DEBUG_LOG.error('Storage get error:', error);
            return {};
        }
    },

    /**
     * Set data in extension storage
     * @param {string} key - The storage key
     * @param {Object} data - The data to store
     * @returns {Promise<void>}
     */
    async set(key, data) {
        DEBUG_LOG.log(`Storage: Setting data for key: ${key}`, Object.keys(data).length, 'entries');
        try {
            await chrome.storage.local.set({ [key]: JSON.stringify(data) });
            DEBUG_LOG.log(`Storage: Successfully stored data for ${key}`);
        } catch (error) {
            DEBUG_LOG.error('Storage set error:', error);
        }
    }
};

// Export for use in other modules
}

    // Platform Detection Module
    // @include shared/core/platform-detector.js
/**
 * IMDBuddy - Platform Detection Module
 * 
 * Detects the current streaming platform based on the hostname
 * and returns the appropriate configuration.
 * 
 */

const PlatformDetector = {
    /**
     * Detect the current streaming platform
     * @returns {Object|null} Platform configuration object or null if unsupported
     */
    getCurrentPlatform() {
        DEBUG_LOG.log(`PlatformDetector: Checking hostname: ${hostname}`);
        
        for (const [key, config] of Object.entries(PLATFORM_CONFIGS)) {
            if (config.hostnames.some(host => hostname.includes(host))) {
                DEBUG_LOG.log(`PlatformDetector: Detected platform: ${config.name} (${key})`);
                return { key, config };
            }
        }
        
        DEBUG_LOG.warn(`PlatformDetector: Unsupported platform: ${hostname}`);
        return null;
    },

    /**
     * Check if current platform is supported
     * @returns {boolean} True if platform is supported
     */
    isSupportedPlatform() {
        const isSupported = this.getCurrentPlatform() !== null;
        DEBUG_LOG.log(`PlatformDetector: Platform supported: ${isSupported}`);
        return isSupported;
    },

    /**
     * Get supported platform names
     * @returns {Array<string>} Array of supported platform names
     */
    getSupportedPlatforms() {
        return Object.values(PLATFORM_CONFIGS).map(config => config.name);
    }
};

// Export for use in other modules
}

    // Title Extractor Module
    // @include shared/core/title-extractor.js
/**
 * IMDBuddy - Title Extractor Module
 * 
 * Platform-agnostic title extraction with debugging capabilities.
 * Handles the extraction of movie/show titles from DOM elements
 * based on platform-specific configurations.
 */

const TitleExtractor = {
    /**
     * Extract title information from a DOM element
     * @param {HTMLElement} element - The DOM element to extract from
     * @param {Object} platformConfig - Platform-specific configuration
     * @returns {Object|null} Title data object or null if extraction failed
     */
    extract(element, platformConfig) {
        DEBUG_LOG.log('TitleExtractor: Attempting extraction from element:', element);
        const result = platformConfig.extractTitle(element, platformConfig.titleSelectors);
        
        if (result) {
            DEBUG_LOG.log('TitleExtractor: Successfully extracted:', result);
            DEBUG_LOG.warn('TitleExtractor: Extraction failed for element');
            this.logExtractionFailure(element, platformConfig);
        }
        
        return result;
    },

    /**
     * Log detailed debugging information when title extraction fails
     * @param {HTMLElement} element - The DOM element that failed extraction
     * @param {Object} platformConfig - Platform configuration
     */
    logExtractionFailure(element, platformConfig) {
        DEBUG_LOG.group(`Title extraction failed for ${hostname}`);
        DEBUG_LOG.log('Failed element:', element);
        DEBUG_LOG.log('Platform config:', platformConfig);
        
        // Platform-specific debug logging
        if (hostname.includes('hotstar.com') || hostname.includes('disneyplus.com')) {
            this.logHotstarDebugInfo(element);
        } else if (hostname.includes('netflix.com')) {
            this.logNetflixDebugInfo(element);
        }
        
        DEBUG_LOG.groupEnd();
    },

    /**
     * Log Hotstar-specific debugging information
     * @param {HTMLElement} element - The DOM element to analyze
     */
    logHotstarDebugInfo(element) {
        DEBUG_LOG.log('=== HOTSTAR DEBUG INFO ===');
        DEBUG_LOG.log('Available aria-label elements:', element.querySelectorAll('[aria-label]'));
        DEBUG_LOG.log('Available img elements with alt:', element.querySelectorAll('img[alt]'));
        DEBUG_LOG.log('Available text content:', element.textContent);
        DEBUG_LOG.log('Element classes:', element.className);
    },

    /**
     * Log Netflix-specific debugging information
     * @param {HTMLElement} element - The DOM element to analyze
     */
    logNetflixDebugInfo(element) {
        DEBUG_LOG.log('=== NETFLIX DEBUG INFO ===');
        DEBUG_LOG.log('Available aria-label links:', element.querySelectorAll('a[aria-label]'));
        DEBUG_LOG.log('Available fallback text:', element.querySelectorAll('.fallback-text'));
        DEBUG_LOG.log('Element structure:', element.innerHTML.substring(0, 500));
    }
};

// Export for use in other modules
}

    // Fuzzy Matcher Module
    // @include shared/core/fuzzy-matcher.js
/**
 * IMDBuddy - Fuzzy Matching Module
 * 
 * Advanced fuzzy string matching algorithms for finding the best
 * match between search results and target titles. Combines multiple
 * algorithms for optimal accuracy.
 */

const FuzzyMatcher = {
    /**
     * Get similarity score between two strings using multiple algorithms
     * @param {string} str1 - First string to compare
     * @param {string} str2 - Second string to compare
     * @returns {number} Similarity score between 0 and 1
     */
    getSimilarity(str1, str2) {
        const normalized1 = this.normalize(str1);
        const normalized2 = this.normalize(str2);
        
        if (normalized1 === normalized2) return 1.0;
        
        // Combine multiple similarity algorithms for better accuracy
        const levenshtein = this.levenshteinSimilarity(normalized1, normalized2);
        const jaro = this.jaroSimilarity(normalized1, normalized2);
        const substring = this.substringScore(normalized1, normalized2);
        const wordOverlap = this.wordOverlapScore(normalized1, normalized2);
        
        // Weighted combination of different similarity measures
        return (levenshtein * 0.3 + jaro * 0.3 + substring * 0.2 + wordOverlap * 0.2);
    },

    /**
     * Normalize string for comparison
     * @param {string} str - String to normalize
     * @returns {string} Normalized string
     */
    normalize(str) {
        return str.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ')     // Normalize spaces
            .trim();
    },

    /**
     * Calculate Levenshtein distance-based similarity
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {number} Similarity score between 0 and 1
     */
    levenshteinSimilarity(s1, s2) {
        const distance = this.levenshteinDistance(s1, s2);
        const maxLength = Math.max(s1.length, s2.length);
        return maxLength === 0 ? 1 : 1 - (distance / maxLength);
    },

    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {number} Edit distance
     */
    levenshteinDistance(s1, s2) {
        const matrix = [];
        
        for (let i = 0; i <= s2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= s1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= s2.length; i++) {
            for (let j = 1; j <= s1.length; j++) {
                if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[s2.length][s1.length];
    },

    /**
     * Calculate Jaro similarity
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {number} Jaro similarity score
     */
    jaroSimilarity(s1, s2) {
        if (s1 === s2) return 1.0;
        
        const len1 = s1.length;
        const len2 = s2.length;
        
        if (len1 === 0 || len2 === 0) return 0.0;
        
        const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
        const s1Matches = new Array(len1).fill(false);
        const s2Matches = new Array(len2).fill(false);
        
        let matches = 0;
        let transpositions = 0;
        
        // Find matches
        for (let i = 0; i < len1; i++) {
            const start = Math.max(0, i - matchWindow);
            const end = Math.min(i + matchWindow + 1, len2);
            
            for (let j = start; j < end; j++) {
                if (s2Matches[j] || s1[i] !== s2[j]) continue;
                s1Matches[i] = true;
                s2Matches[j] = true;
                matches++;
                break;
            }
        }
        
        if (matches === 0) return 0.0;
        
        // Find transpositions
        let k = 0;
        for (let i = 0; i < len1; i++) {
            if (!s1Matches[i]) continue;
            while (!s2Matches[k]) k++;
            if (s1[i] !== s2[k]) transpositions++;
            k++;
        }
        
        return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3.0;
    },

    /**
     * Calculate substring-based similarity score
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {number} Substring similarity score
     */
    substringScore(s1, s2) {
        if (s1.includes(s2) || s2.includes(s1)) return 0.9;
        
        const shorter = s1.length < s2.length ? s1 : s2;
        const longer = s1.length < s2.length ? s2 : s1;
        
        let maxSubstring = 0;
        
        for (let i = 0; i < shorter.length; i++) {
            for (let j = i + 1; j <= shorter.length; j++) {
                const substring = shorter.substring(i, j);
                if (longer.includes(substring) && substring.length > maxSubstring) {
                    maxSubstring = substring.length;
                }
            }
        }
        
        return maxSubstring / Math.max(s1.length, s2.length);
    },

    /**
     * Calculate word overlap similarity score
     * @param {string} s1 - First string
     * @param {string} s2 - Second string
     * @returns {number} Word overlap score
     */
    wordOverlapScore(s1, s2) {
        const words1 = s1.split(' ').filter(w => w.length > 1);
        const words2 = s2.split(' ').filter(w => w.length > 1);
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        
        return intersection.length / union.length;
    },

    /**
     * Find the best match from search results
     * @param {string} searchTitle - The title to match against
     * @param {Array} results - Array of search results
     * @param {string|null} expectedType - Expected content type (movie/series)
     * @returns {Object|null} Best matching result or null
     */
    findBestMatch(searchTitle, results, expectedType = null) {
        if (!results || results.length === 0) return null;
        
        let bestMatch = null;
        let bestScore = 0;
        
        for (const result of results) {
            if (!result.title) continue;
            
            const similarity = this.getSimilarity(searchTitle, result.title);
            let score = similarity;
            
            // Boost score for type match
            if (expectedType && result.type === expectedType) {
                score += 0.1;
            }
            
            // Boost score for exact title match
            if (this.normalize(searchTitle) === this.normalize(result.title)) {
                score += 0.2;
            }
            
            if (score > bestScore && score >= BASE_CONFIG.MIN_MATCH_SCORE) {
                bestScore = score;
                bestMatch = result;
            }
        }
        
        return bestMatch;
    }
};

// Export for use in other modules
}

    // API Service Module
    // @include shared/core/api-service.js
/**
 * IMDBuddy - API Service Module
 * 
 * Handles all communication with the IMDB API, including caching,
 * rate limiting, and request queue management.
 */

const ApiService = {
    cache: {},
    requestQueue: [],
    activeRequests: 0,
    lastRequestTime: 0,
    requestTimes: [], // Track recent request times for better rate limiting

    /**
     * Initialize the API service
     * Loads cache from storage and cleans expired entries
     */
    async init() {
        DEBUG_LOG.log('ApiService: Initializing...');
        try {
            this.cache = await Storage.get(BASE_CONFIG.STORAGE_KEY);
            DEBUG_LOG.log('ApiService: Cache loaded, entries:', Object.keys(this.cache).length);
            await this.cleanExpiredEntries();
            DEBUG_LOG.log('ApiService: Initialization complete');
        } catch (error) {
            DEBUG_LOG.error('ApiService: Initialization failed:', error);
            throw error;
        }
    },

    /**
     * Clean expired cache entries
     * Removes entries older than CACHE_MAX_AGE
     */
    async cleanExpiredEntries() {
        DEBUG_LOG.log('ApiService: Cleaning expired cache entries...');
        const now = Date.now();
        let hasExpiredEntries = false;
        let expiredCount = 0;

        for (const [key, entry] of Object.entries(this.cache)) {
            if (!entry.timestamp || (now - entry.timestamp) > BASE_CONFIG.CACHE_MAX_AGE) {
                delete this.cache[key];
                hasExpiredEntries = true;
                expiredCount++;
            }
        }

        if (hasExpiredEntries) {
            DEBUG_LOG.log(`ApiService: Cleaned ${expiredCount} expired entries`);
            await this.saveCache();
            DEBUG_LOG.log('ApiService: No expired entries found');
        }
    },

    /**
     * Check if cache entry is valid
     * @param {Object} entry - Cache entry to validate
     * @returns {boolean} True if entry is valid
     */
    isCacheEntryValid(entry) {
        if (!entry || !entry.timestamp) return false;
        return (Date.now() - entry.timestamp) <= BASE_CONFIG.CACHE_MAX_AGE;
    },

    /**
     * Clear all cache data
     */
    async clearCache() {
        this.cache = {};
        await Storage.set(BASE_CONFIG.STORAGE_KEY, {});
    },

    /**
     * Get rating for a title with caching and fuzzy matching
     * @param {Object} titleData - Object containing title and type
     * @returns {Promise<Object|null>} Rating data or null
     */
    async getRating(titleData) {
        DEBUG_LOG.log('ApiService: getRating called with:', titleData);
        
        if (!titleData || !titleData.title) {
            DEBUG_LOG.warn('ApiService: Invalid titleData provided');
            return null;
        }

        const { title, type } = titleData;
        const cacheKey = `${title.toLowerCase()}_${type || 'unknown'}`;
        DEBUG_LOG.log(`ApiService: Cache key: ${cacheKey}`);

        // Check cache first
        const cachedResult = this.cache[cacheKey];
        if (cachedResult && this.isCacheEntryValid(cachedResult)) {
            DEBUG_LOG.log('ApiService: Cache hit for:', title);
            return cachedResult.data;
        }
        DEBUG_LOG.log('ApiService: Cache miss for:', title);

        // Add to request queue
        return new Promise((resolve) => {
            DEBUG_LOG.log('ApiService: Adding to request queue:', title);
            this.requestQueue.push({ title, type, cacheKey, resolve });
            this.processQueue();
        });
    },

    /**
     * Process the request queue with rate limiting
     */
    async processQueue() {
        DEBUG_LOG.log(`ApiService: Processing queue (${this.requestQueue.length} pending, ${this.activeRequests} active)`);
        
        if (this.activeRequests >= BASE_CONFIG.MAX_CONCURRENT_REQUESTS || this.requestQueue.length === 0) {
            DEBUG_LOG.log('ApiService: Queue processing skipped - rate limit or empty queue');
            return;
        }

        const request = this.requestQueue.shift();
        this.activeRequests++;
        DEBUG_LOG.log(`ApiService: Processing request for: ${request.title}`);

        try {
            await this.processRequest(request);
        } finally {
            this.activeRequests--;
            // Process next request in queue
            setTimeout(() => this.processQueue(), BASE_CONFIG.REQUEST_DELAY);
        }
    },

    /**
     * Process a single API request
     * @param {Object} request - Request object containing title, type, cacheKey, resolve
     */
    async processRequest({ title, type, cacheKey, resolve }) {
        DEBUG_LOG.group(`Processing API request: ${title}`);
        try {
            await this.waitForRateLimit();
            
            const result = await this.fetchFromApi(title, type, cacheKey);
            DEBUG_LOG.log('API result:', result);
            
            // Cache the result
            this.cache[cacheKey] = {
                data: result,
                timestamp: Date.now()
            };
            await this.saveCache();
            DEBUG_LOG.log('Result cached successfully');
            
            resolve(result);
        } catch (error) {
            DEBUG_LOG.error('API request failed:', error);
            resolve(null);
        } finally {
            DEBUG_LOG.groupEnd();
        }
    },

    /**
     * Wait for rate limit compliance
     */
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < BASE_CONFIG.REQUEST_DELAY) {
            const waitTime = BASE_CONFIG.REQUEST_DELAY - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
        
        // Track request times for advanced rate limiting
        this.requestTimes.push(this.lastRequestTime);
        this.requestTimes = this.requestTimes.filter(time => 
            this.lastRequestTime - time < 1000 // Keep only requests from last second
        );
    },

    /**
     * Fetch data from IMDB API with fuzzy matching
     * @param {string} title - Movie/show title
     * @param {string|null} expectedType - Expected content type
     * @param {string} cacheKey - Cache key for the request
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<Object|null>} Rating data or null
     */
    async fetchFromApi(title, expectedType, cacheKey, retryCount = 0) {
        DEBUG_LOG.log(`Fetching from API: ${title} (attempt ${retryCount + 1})`);
        try {
            const url = `${BASE_CONFIG.API_URL}?query=${encodeURIComponent(title)}`;
            DEBUG_LOG.log('API URL:', url);
            
            const response = await fetch(url);
            DEBUG_LOG.log('API response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            DEBUG_LOG.log('API response data:', data);
            
            if (!data.results || data.results.length === 0) {
                DEBUG_LOG.warn('No results found for:', title);
                return null;
            }
            
            // Use fuzzy matching to find the best result
            const bestMatch = FuzzyMatcher.findBestMatch(title, data.results, expectedType);
            DEBUG_LOG.log('Best match found:', bestMatch);
            
            if (!bestMatch) {
                DEBUG_LOG.warn('No suitable match found for:', title);
                return null;
            }
            
            const result = {
                score: bestMatch.rating || 'N/A',
                votes: bestMatch.votes ? this.formatVotes(bestMatch.votes) : 'N/A',
                title: bestMatch.title,
                year: bestMatch.year
            };
            DEBUG_LOG.log('Formatted result:', result);
            
            return result;
            
        } catch (error) {
            DEBUG_LOG.error(`API Error (attempt ${retryCount + 1}):`, error);
            
            // Retry logic for temporary failures
            if (retryCount < 2 && (error.message.includes('429') || error.message.includes('500'))) {
                const backoffDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                DEBUG_LOG.log(`Retrying in ${backoffDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                return this.fetchFromApi(title, expectedType, cacheKey, retryCount + 1);
            }
            
            return null;
        }
    },

    /**
     * Format vote counts for display (e.g., 1500000 -> 1.5M)
     * @param {number} votes - Raw vote count
     * @returns {string} Formatted vote count
     */
    formatVotes(votes) {
        if (votes >= 1000000) return (votes / 1000000).toFixed(1) + 'M';
        if (votes >= 1000) return (votes / 1000).toFixed(1) + 'K';
        return votes.toString();
    },

    /**
     * Save cache to storage
     */
    async saveCache() {
        await Storage.set(BASE_CONFIG.STORAGE_KEY, this.cache);
    }
};

// Export for use in other modules
}

    // Overlay Module
    // @include shared/core/overlay.js
/**
 * IMDBuddy - Overlay Module
 * 
 * Creates and manages IMDB rating overlays on streaming platform cards.
 * Platform-agnostic overlay creation and positioning.
 */

const Overlay = {
    /**
     * Create an IMDB rating overlay element
     * @param {Object} rating - Rating data containing score, votes, etc.
     * @returns {HTMLElement} The created overlay element
     */
    create(rating) {
        const overlay = document.createElement('div');
        overlay.className = 'imdb-rating-overlay';
        overlay.setAttribute('role', 'img');
        overlay.setAttribute('aria-label', `IMDb rating: ${rating.score} out of 10, ${rating.votes} votes`);
        
        overlay.innerHTML = `
            <div class="imdb-rating-content">
                <div class="imdb-logo">IMDb</div>
                <div class="imdb-rating-score">${rating.score}</div>
                <div class="imdb-votes">${rating.votes}</div>
            </div>
        `;
        
        return overlay;
    },

    /**
     * Add overlay to a streaming platform card
     * @param {HTMLElement} element - The card element
     * @param {HTMLElement} overlay - The overlay element to add
     * @param {Object} platformConfig - Platform-specific configuration
     */
    addTo(element, overlay, platformConfig) {
        const container = this.findContainer(element, platformConfig);
        
        if (container) {
            // Ensure container has relative positioning for overlay
            container.style.position = 'relative';
            container.appendChild(overlay);
            
            // Debug logging
            this.logOverlayPlacement(container, platformConfig);
            console.warn('No suitable container found for overlay:', element);
        }
    },

    /**
     * Find the appropriate container for the overlay
     * @param {HTMLElement} element - The card element
     * @param {Object} platformConfig - Platform-specific configuration
     * @returns {HTMLElement|null} The container element or null
     */
    findContainer(element, platformConfig) {
        // Try platform-specific image container selectors first
        for (const selector of platformConfig.imageContainerSelectors) {
            const container = element.querySelector(selector);
            if (container) return container;
        }
        
        // Fallback to generic image container
        const imageParent = element.querySelector('img')?.parentElement;
        if (imageParent) return imageParent;
        
        // Last resort: use the element itself
        return element;
    },

    /**
     * Log overlay placement for debugging
     * @param {HTMLElement} container - The container where overlay was placed
     * @param {Object} platformConfig - Platform configuration
     */
    logOverlayPlacement(container, platformConfig) {
        
        if (hostname.includes('hotstar.com') || hostname.includes('disneyplus.com')) {
            console.log('Added overlay to Hotstar container:', container);
        } else if (hostname.includes('netflix.com')) {
            console.log('Added overlay to Netflix container:', container);
        } else if (hostname.includes('primevideo.com') || hostname.includes('amazon.com')) {
            console.log('Added overlay to Prime Video container:', container);
        }
    },

    /**
     * Check if element already has an overlay
     * @param {HTMLElement} element - The element to check
     * @returns {boolean} True if overlay exists
     */
    hasOverlay(element) {
        return element.querySelector('.imdb-rating-overlay') !== null;
    },

    /**
     * Remove overlay from element
     * @param {HTMLElement} element - The element to remove overlay from
     */
    removeOverlay(element) {
        const overlay = element.querySelector('.imdb-rating-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
};

// Export for use in other modules
}

    // Main Extension Module
    // @include shared/core/main-extension.js
/**
 * IMDBuddy - Main Extension Module
 * 
 * The main application logic that orchestrates all the modules
 * to provide IMDB ratings on streaming platforms.
 */

const StreamingRatings = {
    // Extension state
    processedElements: new WeakSet(),
    debounceTimer: null,
    platform: null,

    /**
     * Initialize the extension
     * Sets up platform detection, API service, and DOM observation
     */
    async init() {
        DEBUG_LOG.log('StreamingRatings: Starting initialization...');
        
        // Detect current platform
        this.platform = PlatformDetector.getCurrentPlatform();
        if (!this.platform) {
            DEBUG_LOG.warn('StreamingRatings: Unsupported streaming platform, extension not loaded');
            return;
        }

        DEBUG_LOG.log(`StreamingRatings: Initialized for ${this.platform.config.name}`);
        
        try {
            // Initialize API service
            await ApiService.init();
            DEBUG_LOG.log('StreamingRatings: API service initialized');
            
            // Set up DOM observation
            this.setupObserver();
            DEBUG_LOG.log('StreamingRatings: Observer set up');
            
            // Process existing cards after a delay
            setTimeout(() => {
                DEBUG_LOG.log('StreamingRatings: Processing existing cards...');
                this.processExistingCards();
            }, BASE_CONFIG.OBSERVER_DELAY);
            
            DEBUG_LOG.log('StreamingRatings: Initialization complete');
        } catch (error) {
            DEBUG_LOG.error('StreamingRatings: Initialization failed:', error);
        }
    },

    /**
     * Set up MutationObserver to watch for new content
     * Uses debouncing to avoid excessive processing
     */
    setupObserver() {
        DEBUG_LOG.log('StreamingRatings: Setting up MutationObserver');
        
        const observer = new MutationObserver((mutations) => {
            DEBUG_LOG.log(`StreamingRatings: DOM mutations detected: ${mutations.length}`);
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                DEBUG_LOG.log('StreamingRatings: Processing cards after DOM change');
                this.processExistingCards();
            }, 1000);
        });

        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        DEBUG_LOG.log('StreamingRatings: MutationObserver active');
    },

    /**
     * Process all existing cards on the page
     * Finds cards and processes them in batches
     */
    async processExistingCards() {
        DEBUG_LOG.log('StreamingRatings: Looking for cards to process...');
        const cards = this.findCards();
        DEBUG_LOG.log(`StreamingRatings: Found ${cards.length} cards to process`);
        
        if (cards.length === 0) {
            DEBUG_LOG.log('StreamingRatings: No cards found');
            return;
        }
        
        // Process cards in batches to avoid overwhelming the API
        const batchSize = 10;
        for (let i = 0; i < cards.length; i += batchSize) {
            const batch = cards.slice(i, i + batchSize);
            DEBUG_LOG.log(`StreamingRatings: Processing batch ${Math.floor(i/batchSize) + 1} (${batch.length} cards)`);
            await this.processBatch(batch);
            
            // Small delay between batches
            if (i + batchSize < cards.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        DEBUG_LOG.log('StreamingRatings: Finished processing all cards');
    },

    /**
     * Process a batch of cards
     * @param {Array<HTMLElement>} cardBatch - Array of card elements to process
     */
    async processBatch(cardBatch) {
        const promises = cardBatch.map(async (card) => {
            if (this.processedElements.has(card)) return;
            
            this.processedElements.add(card);
            
            const titleData = TitleExtractor.extract(card, this.platform.config);
            if (titleData) {
                await this.processCard(card, titleData);
            }
        });
        
        await Promise.all(promises);
    },

    /**
     * Find all streaming platform cards on the page
     * @returns {Array<HTMLElement>} Array of card elements
     */
    findCards() {
        const cards = [];
        
        // Use platform-specific selectors to find cards
        for (const selector of this.platform.config.cardSelectors) {
            const foundCards = document.querySelectorAll(selector);
            cards.push(...foundCards);
            
            // Debug logging
            if (foundCards.length > 0) {
                console.log(`IMDBuddy: Found ${foundCards.length} cards with selector: ${selector}`);
            }
        }
        
        // Filter out cards that already have overlays
        const filteredCards = cards.filter(card => !Overlay.hasOverlay(card));
        
        console.log(`IMDBuddy: Total cards found: ${cards.length}, New cards: ${filteredCards.length}`);
        
        return filteredCards;
    },

    /**
     * Process a single card - extract title and add rating overlay
     * @param {HTMLElement} element - The card element
     * @param {Object} titleData - Extracted title data
     */
    async processCard(element, titleData) {
        try {
            console.log('IMDBuddy: Processing card with title:', titleData.title);
            
            const rating = await ApiService.getRating(titleData);
            
            if (rating) {
                const overlay = Overlay.create(rating);
                Overlay.addTo(element, overlay, this.platform.config);
                console.log('IMDBuddy: Added rating overlay for:', titleData.title);
                console.log('IMDBuddy: No rating found for:', titleData.title);
            }
        } catch (error) {
            console.error('IMDBuddy: Error processing card:', error, titleData);
        }
    },

    /**
     * Clear cache - exposed for popup interface
     * @returns {Promise<void>}
     */
    async clearCache() {
        await ApiService.clearCache();
        console.log('IMDBuddy: Cache cleared');
    },

    /**
     * Get extension statistics
     * @returns {Object} Extension statistics
     */
    getStats() {
        return {
            platform: this.platform?.config?.name || 'Unknown',
            cacheSize: Object.keys(ApiService.cache || {}).length,
            processedElements: this.processedElements ? 'Available' : 'Not Available'
        };
    },

    /**
     * Public API for adding new platform configurations
     * @param {string} key - Platform key
     * @param {Object} config - Platform configuration
     */
    addPlatform(key, config) {
        PLATFORM_CONFIGS[key] = config;
        console.log(`IMDBuddy: Added platform configuration for ${config.name}`);
    }
};

/**
 * Initialize the extension when DOM is ready
 */
function initializeExtension() {
    // Check if platform is supported
    if (!PlatformDetector.isSupportedPlatform()) {
        console.log('IMDBuddy: Platform not supported');
        return;
    }

    // Initialize the main extension
    StreamingRatings.init();
    
    // Expose extension instance globally for debugging and popup communication
    
    console.log('IMDBuddy: Extension loaded successfully');
}

// Export for use in other modules
}

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
