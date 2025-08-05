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
        } else {
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiService };
} else {
    window.ApiService = ApiService;
}
