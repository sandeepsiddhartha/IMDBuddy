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

    // Note: In a production build system, these would be bundled together
    // For now, we include all modules inline for compatibility
    
    // --- BEGIN SHARED MODULES ---
    
    // Configuration Module
    // @include shared/core/config.js
    const BASE_CONFIG = {
        API_URL: 'https://api.imdbapi.dev/search/titles',
        REQUEST_DELAY: 110,
        MAX_CONCURRENT_REQUESTS: 5,
        STORAGE_KEY: 'imdb_cache',
        CACHE_MAX_AGE: 30 * 24 * 60 * 60 * 1000,
        MIN_MATCH_SCORE: 0.7,
        OBSERVER_DELAY: 3000,
        VERSION: '3.0.0',
        NAME: 'IMDBuddy'
    };

    // Platform Configurations Module
    // @include shared/platform-configs/platforms.js
    const PLATFORM_CONFIGS = {
        hotstar: {
            name: 'Hotstar',
            hostnames: ['hotstar.com', 'disneyplus.com'],
            cardSelectors: ['.swiper-slide', '.tray-vertical-card', '[data-horizontal-card-container-width]'],
            titleSelectors: ['[aria-label]', 'img[alt]', '[title]', 'a[aria-label]'],
            imageContainerSelectors: ['[data-testid="hs-image"]', '.rQ_gfJEdoJGvLVb_rKLtL', 'img', '.image-container'],
            extractTitle: (element, selectors) => {
                const allPossibleSelectors = ['[aria-label]', 'img[alt]'];
                const foundTitles = new Set();

                for (const selector of allPossibleSelectors) {
                    const elements = element.querySelectorAll(selector);
                    
                    for (const el of elements) {
                        let title = '';
                        
                        if (el.hasAttribute('aria-label')) {
                            title = el.getAttribute('aria-label');
                        } else if (el.hasAttribute('alt')) {
                            title = el.getAttribute('alt');
                        } else if (el.hasAttribute('title')) {
                            title = el.getAttribute('title');
                        } else {
                            title = el.textContent?.trim();
                        }
                        
                        if (!title) continue;
                        
                        if (title.length < 2 || 
                            title.toLowerCase().includes('image') ||
                            title.toLowerCase().includes('logo') ||
                            title.toLowerCase().includes('icon')) {
                            continue;
                        }

                        const normalizedTitle = title.toLowerCase().trim();
                        if (foundTitles.has(normalizedTitle)) {
                            continue;
                        }
                        
                        foundTitles.add(normalizedTitle);

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

        netflix: {
            name: 'Netflix',
            hostnames: ['netflix.com'],
            cardSelectors: ['.slider-item', '.title-card', '.fallback-text-container', 'a[aria-label]'],
            titleSelectors: ['a[aria-label]', '.fallback-text', '.video-title'],
            imageContainerSelectors: ['.boxart-image-in-padded-container', '.fallback-text-container', '.title-card-image-fallback'],
            extractTitle: (element, selectors) => {
                const linkWithAriaLabel = element.querySelector('a[aria-label]');
                if (linkWithAriaLabel) {
                    const ariaLabel = linkWithAriaLabel.getAttribute('aria-label');
                    if (ariaLabel && ariaLabel.trim().length > 0) {
                        return {
                            title: ariaLabel.trim(),
                            type: null
                        };
                    }
                }

                for (const selector of selectors) {
                    const el = element.querySelector(selector);
                    if (!el) continue;

                    let title = el.textContent?.trim();
                    if (!title && el.hasAttribute('aria-label')) {
                        title = el.getAttribute('aria-label')?.trim();
                    }
                    
                    if (!title) continue;

                    return {
                        title: title.split('•')[0].trim(),
                        type: null
                    };
                }
                return null;
            }
        },

        prime: {
            name: 'Prime Video',
            hostnames: ['primevideo.com', 'amazon.com'],
            cardSelectors: ['.tst-hover-container', '.av-card-container'],
            titleSelectors: ['[data-automation-id="title"]', '.av-card-title'],
            imageContainerSelectors: ['.av-card-image', '.tst-packshot-image'],
            extractTitle: (element, selectors) => {
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

    // Storage Module
    // @include shared/core/storage.js
    const Storage = {
        async get(key) {
            try {
                const result = await chrome.storage.local.get([key]);
                return result[key] ? JSON.parse(result[key]) : {};
            } catch (error) {
                console.error('Storage get error:', error);
                return {};
            }
        },

        async set(key, data) {
            try {
                await chrome.storage.local.set({ [key]: JSON.stringify(data) });
            } catch (error) {
                console.error('Storage set error:', error);
            }
        }
    };

    // Platform Detection Module
    // @include shared/core/platform-detector.js
    const PlatformDetector = {
        getCurrentPlatform() {
            const hostname = window.location.hostname;
            for (const [key, config] of Object.entries(PLATFORM_CONFIGS)) {
                if (config.hostnames.some(host => hostname.includes(host))) {
                    return { key, config };
                }
            }
            return null;
        },

        isSupportedPlatform() {
            return this.getCurrentPlatform() !== null;
        },

        getSupportedPlatforms() {
            return Object.values(PLATFORM_CONFIGS).map(config => config.name);
        }
    };

    // Title Extractor Module
    // @include shared/core/title-extractor.js
    const TitleExtractor = {
        extract(element, platformConfig) {
            const result = platformConfig.extractTitle(element, platformConfig.titleSelectors);
            
            if (!result) {
                this.logExtractionFailure(element, platformConfig);
            }
            
            return result;
        },

        logExtractionFailure(element, platformConfig) {
            const hostname = window.location.hostname;
            console.log(`Title extraction failed for ${hostname}:`, element);
            
            if (hostname.includes('hotstar.com') || hostname.includes('disneyplus.com')) {
                console.log('=== HOTSTAR DEBUG INFO ===');
                const allElements = element.querySelectorAll('*');
                console.log('All elements with text content:');
                allElements.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && text.length > 2 && text.length < 100) {
                        console.log(`${el.tagName}: "${text}"`);
                    }
                    if (el.hasAttribute('aria-label')) {
                        console.log(`${el.tagName} aria-label: "${el.getAttribute('aria-label')}"`);
                    }
                });
                console.log('=== END HOTSTAR DEBUG ===');
            }
        }
    };

    // Fuzzy Matcher Module (simplified for inline inclusion)
    // @include shared/core/fuzzy-matcher.js
    const FuzzyMatcher = {
        getSimilarity(str1, str2) {
            const normalized1 = this.normalize(str1);
            const normalized2 = this.normalize(str2);
            
            if (normalized1 === normalized2) return 1.0;
            
            const levenshtein = this.levenshteinSimilarity(normalized1, normalized2);
            const jaro = this.jaroSimilarity(normalized1, normalized2);
            
            return (levenshtein * 0.5 + jaro * 0.5);
        },

        normalize(str) {
            return str.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        },

        levenshteinSimilarity(s1, s2) {
            const distance = this.levenshteinDistance(s1, s2);
            const maxLength = Math.max(s1.length, s2.length);
            return maxLength === 0 ? 1 : 1 - (distance / maxLength);
        },

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
                    } else {
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

        jaroSimilarity(s1, s2) {
            if (s1 === s2) return 1.0;
            
            const len1 = s1.length;
            const len2 = s2.length;
            
            if (len1 === 0 || len2 === 0) return 0.0;
            
            const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
            const s1Matches = new Array(len1).fill(false);
            const s2Matches = new Array(len2).fill(false);
            
            let matches = 0;
            
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
            
            return matches / len1 * 0.33 + matches / len2 * 0.33 + matches * 0.34;
        },

        findBestMatch(searchTitle, results, expectedType = null) {
            if (!results || results.length === 0) return null;
            
            let bestMatch = null;
            let bestScore = 0;
            
            for (const result of results) {
                if (!result.title) continue;
                
                let score = this.getSimilarity(searchTitle, result.title);
                
                if (expectedType && result.type === expectedType) {
                    score += 0.1;
                }
                
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

    // API Service Module
    // @include shared/core/api-service.js
    const ApiService = {
        cache: {},
        requestQueue: [],
        activeRequests: 0,
        lastRequestTime: 0,

        async init() {
            this.cache = await Storage.get(BASE_CONFIG.STORAGE_KEY);
            await this.cleanExpiredEntries();
        },

        async cleanExpiredEntries() {
            const now = Date.now();
            let hasExpiredEntries = false;

            for (const [key, entry] of Object.entries(this.cache)) {
                if (!entry.timestamp || (now - entry.timestamp) > BASE_CONFIG.CACHE_MAX_AGE) {
                    delete this.cache[key];
                    hasExpiredEntries = true;
                }
            }

            if (hasExpiredEntries) {
                await this.saveCache();
            }
        },

        async clearCache() {
            this.cache = {};
            await Storage.set(BASE_CONFIG.STORAGE_KEY, {});
        },

        async getRating(titleData) {
            if (!titleData || !titleData.title) return null;

            const { title, type } = titleData;
            const cacheKey = `${title.toLowerCase()}_${type || 'unknown'}`;

            const cachedResult = this.cache[cacheKey];
            if (cachedResult && this.isCacheEntryValid(cachedResult)) {
                return cachedResult.data;
            }

            return new Promise((resolve) => {
                this.requestQueue.push({ title, type, cacheKey, resolve });
                this.processQueue();
            });
        },

        isCacheEntryValid(entry) {
            if (!entry || !entry.timestamp) return false;
            return (Date.now() - entry.timestamp) <= BASE_CONFIG.CACHE_MAX_AGE;
        },

        async processQueue() {
            if (this.activeRequests >= BASE_CONFIG.MAX_CONCURRENT_REQUESTS || this.requestQueue.length === 0) {
                return;
            }

            const request = this.requestQueue.shift();
            this.activeRequests++;

            try {
                await this.processRequest(request);
            } finally {
                this.activeRequests--;
                setTimeout(() => this.processQueue(), BASE_CONFIG.REQUEST_DELAY);
            }
        },

        async processRequest({ title, type, cacheKey, resolve }) {
            try {
                await this.waitForRateLimit();
                
                const result = await this.fetchFromApi(title, type, cacheKey);
                
                this.cache[cacheKey] = {
                    data: result,
                    timestamp: Date.now()
                };
                await this.saveCache();
                
                resolve(result);
            } catch (error) {
                console.error('API request failed:', error);
                resolve(null);
            }
        },

        async waitForRateLimit() {
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            
            if (timeSinceLastRequest < BASE_CONFIG.REQUEST_DELAY) {
                const waitTime = BASE_CONFIG.REQUEST_DELAY - timeSinceLastRequest;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            
            this.lastRequestTime = Date.now();
        },

        async fetchFromApi(title, expectedType, cacheKey) {
            try {
                const response = await fetch(`${BASE_CONFIG.API_URL}?query=${encodeURIComponent(title)}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data.results || data.results.length === 0) {
                    return null;
                }
                
                const bestMatch = FuzzyMatcher.findBestMatch(title, data.results, expectedType);
                
                if (!bestMatch) {
                    return null;
                }
                
                return {
                    score: bestMatch.rating || 'N/A',
                    votes: bestMatch.votes ? this.formatVotes(bestMatch.votes) : 'N/A',
                    title: bestMatch.title,
                    year: bestMatch.year
                };
                
            } catch (error) {
                console.error('API Error:', error);
                return null;
            }
        },

        formatVotes(votes) {
            if (votes >= 1000000) return (votes / 1000000).toFixed(1) + 'M';
            if (votes >= 1000) return (votes / 1000).toFixed(1) + 'K';
            return votes.toString();
        },

        async saveCache() {
            await Storage.set(BASE_CONFIG.STORAGE_KEY, this.cache);
        }
    };

    // Overlay Module
    // @include shared/core/overlay.js
    const Overlay = {
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

        addTo(element, overlay, platformConfig) {
            const container = this.findContainer(element, platformConfig);
            
            if (container) {
                container.style.position = 'relative';
                container.appendChild(overlay);
            } else {
                console.warn('No suitable container found for overlay:', element);
            }
        },

        findContainer(element, platformConfig) {
            for (const selector of platformConfig.imageContainerSelectors) {
                const container = element.querySelector(selector);
                if (container) return container;
            }
            
            const imageParent = element.querySelector('img')?.parentElement;
            if (imageParent) return imageParent;
            
            return element;
        },

        hasOverlay(element) {
            return element.querySelector('.imdb-rating-overlay') !== null;
        }
    };

    // Main Extension Module
    // @include shared/core/main-extension.js
    const StreamingRatings = {
        processedElements: new WeakSet(),
        debounceTimer: null,
        platform: null,

        async init() {
            this.platform = PlatformDetector.getCurrentPlatform();
            if (!this.platform) {
                console.log('IMDBuddy: Unsupported streaming platform');
                return;
            }

            console.log(`IMDBuddy: Initialized for ${this.platform.config.name}`);
            
            await ApiService.init();
            this.setupObserver();
            setTimeout(() => this.processExistingCards(), BASE_CONFIG.OBSERVER_DELAY);
        },

        setupObserver() {
            const observer = new MutationObserver(() => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => this.processExistingCards(), 1000);
            });

            observer.observe(document.body, { 
                childList: true, 
                subtree: true 
            });
        },

        async processExistingCards() {
            const cards = this.findCards();
            console.log(`IMDBuddy: Found ${cards.length} cards to process`);
            
            if (cards.length === 0) return;
            
            const batchSize = 10;
            for (let i = 0; i < cards.length; i += batchSize) {
                const batch = cards.slice(i, i + batchSize);
                await this.processBatch(batch);
                
                if (i + batchSize < cards.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        },

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

        findCards() {
            const cards = [];
            
            for (const selector of this.platform.config.cardSelectors) {
                const foundCards = document.querySelectorAll(selector);
                cards.push(...foundCards);
            }
            
            const filteredCards = cards.filter(card => !Overlay.hasOverlay(card));
            
            return filteredCards;
        },

        async processCard(element, titleData) {
            try {
                console.log('IMDBuddy: Processing card with title:', titleData.title);
                
                const rating = await ApiService.getRating(titleData);
                
                if (rating) {
                    const overlay = Overlay.create(rating);
                    Overlay.addTo(element, overlay, this.platform.config);
                    console.log('IMDBuddy: Added rating overlay for:', titleData.title);
                }
            } catch (error) {
                console.error('IMDBuddy: Error processing card:', error, titleData);
            }
        },

        async clearCache() {
            await ApiService.clearCache();
            console.log('IMDBuddy: Cache cleared');
        },

        addPlatform(key, config) {
            PLATFORM_CONFIGS[key] = config;
            console.log(`IMDBuddy: Added platform configuration for ${config.name}`);
        }
    };

    // --- END SHARED MODULES ---

    /**
     * Initialize the extension when DOM is ready
     */
    function initializeExtension() {
        if (!PlatformDetector.isSupportedPlatform()) {
            console.log('IMDBuddy: Platform not supported');
            return;
        }

        StreamingRatings.init();
        window.streamingRatings = StreamingRatings;
        
        console.log('IMDBuddy: Extension loaded successfully');
    }

    // Message listener for popup communication
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'CLEAR_CACHE' && window.streamingRatings) {
            window.streamingRatings.clearCache();
            sendResponse({ success: true });
        }
    });

    // Start extension
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExtension);
    } else {
        initializeExtension();
    }

    // Mark as loaded
    window.IMDBuddyLoaded = true;
})();
// Test comment
