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
        LOGGER.group('StreamingRatings Initialization');
        LOGGER.debug('Starting initialization...');
        
        // Check if platform is supported
        const platformData = PlatformDetector.getCurrentPlatform();
        if (!platformData) {
            LOGGER.warn('Unsupported platform, exiting');
            LOGGER.groupEnd();
            return;
        }
        
        this.platform = platformData;
        LOGGER.debug('Platform detected:', this.platform.config.name);
        
        // Initialize API service
        try {
            await ApiService.init();
            LOGGER.debug('API service initialized');
        } catch (error) {
            LOGGER.error('Failed to initialize API service:', error);
            LOGGER.groupEnd();
            return;
        }
        
        // Start observing for cards
        this.startObserver();
        LOGGER.debug('Initialization complete');
        LOGGER.groupEnd();
    },

    /**
     * Start DOM observation and initial card processing
     */
    startObserver() {
        LOGGER.debug('Starting DOM observation...');
        
        // Process existing cards immediately
        this.processExistingCards();
        
        // Set up observer for new content
        this.setupObserver();
        
        // Set up periodic processing (for dynamic content)
        setTimeout(() => {
            this.processExistingCards();
        }, BASE_CONFIG.OBSERVER_DELAY);
    },

    /**
     * Set up MutationObserver to watch for new content
     * Uses debouncing to avoid excessive processing
     */
    setupObserver() {
        LOGGER.verbose('StreamingRatings: Setting up MutationObserver');
        
        const observer = new MutationObserver((mutations) => {
            LOGGER.debug(`StreamingRatings: DOM mutations detected: ${mutations.length}`);
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                LOGGER.debug('StreamingRatings: Processing cards after DOM change');
                this.processExistingCards();
            }, 1000);
        });

        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        LOGGER.debug('StreamingRatings: MutationObserver active');
    },

    /**
     * Process all existing cards on the page
     * Finds cards and processes them in batches
     */
    async processExistingCards() {
        LOGGER.verbose('StreamingRatings: Processing existing cards...');
        const cards = this.findCards();
        LOGGER.debug(`StreamingRatings: Found ${cards.length} cards to process`);
        
        if (cards.length === 0) {
            LOGGER.debug('StreamingRatings: No cards found');
            return;
        }
        
        // Process cards in batches to avoid overwhelming the API
        const batchSize = 10;
        for (let i = 0; i < cards.length; i += batchSize) {
            const batch = cards.slice(i, i + batchSize);
            LOGGER.verbose(`StreamingRatings: Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(cards.length/batchSize)} (${batch.length} cards)`);
            await this.processBatch(batch);
            
            // Small delay between batches
            if (i + batchSize < cards.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        LOGGER.verbose('StreamingRatings: Finished processing all cards');
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
        const hostname = window.location.hostname;
        
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
            LOGGER.debug('IMDBuddy: Processing card with title:', titleData.title);
            
            const rating = await ApiService.getRating(titleData);
            LOGGER.debug('IMDBuddy: Received rating:', rating);

            if (rating) {
                const overlay = Overlay.create(rating);
                Overlay.addTo(element, overlay, this.platform.config);
                LOGGER.verbose('IMDBuddy: Added rating overlay for:', titleData.title);
            } else {
                LOGGER.debug('IMDBuddy: No rating found for:', titleData.title);
            }
        } catch (error) {
            LOGGER.error('IMDBuddy: Error processing card:', error, titleData);
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
    window.streamingRatings = StreamingRatings;
    
    console.log('IMDBuddy: Extension loaded successfully');
}

window.StreamingRatings = StreamingRatings;
