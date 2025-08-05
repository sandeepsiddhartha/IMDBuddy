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
        LOGGER.verbose('TitleExtractor: Attempting extraction from element:', element);
        const result = platformConfig.extractTitle(element, platformConfig.titleSelectors);
        
        if (result) {
            LOGGER.debug('TitleExtractor: Successfully extracted:', result);
        } else {
            LOGGER.warn('TitleExtractor: Extraction failed for element');
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
        const hostname = window.location.hostname;
        LOGGER.group(`Title extraction failed for ${hostname}`);
        LOGGER.debug('Failed element:', element);
        LOGGER.verbose('Platform config:', platformConfig);
        
        // Platform-specific debug logging
        if (hostname.includes('hotstar.com') || hostname.includes('disneyplus.com')) {
            this.logHotstarDebugInfo(element);
        } else if (hostname.includes('netflix.com')) {
            this.logNetflixDebugInfo(element);
        }
        
        LOGGER.groupEnd();
    },

    /**
     * Log Hotstar-specific debugging information
     * @param {HTMLElement} element - The DOM element to analyze
     */
    logHotstarDebugInfo(element) {
        LOGGER.verbose('=== HOTSTAR DEBUG INFO ===');
        LOGGER.verbose('Available aria-label elements:', element.querySelectorAll('[aria-label]'));
        LOGGER.verbose('Available img elements with alt:', element.querySelectorAll('img[alt]'));
        LOGGER.verbose('Available text content:', element.textContent);
        LOGGER.verbose('Element classes:', element.className);
    },

    /**
     * Log Netflix-specific debugging information
     * @param {HTMLElement} element - The DOM element to analyze
     */
    logNetflixDebugInfo(element) {
        LOGGER.verbose('=== NETFLIX DEBUG INFO ===');
        LOGGER.verbose('Available aria-label links:', element.querySelectorAll('a[aria-label]'));
        LOGGER.verbose('Available fallback text:', element.querySelectorAll('.fallback-text'));
        DEBUG_LOG.log('Element structure:', element.innerHTML.substring(0, 500));
    }
};

window.TitleExtractor = TitleExtractor;
