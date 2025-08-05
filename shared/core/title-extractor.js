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
        } else {
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
        const hostname = window.location.hostname;
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TitleExtractor };
} else {
    window.TitleExtractor = TitleExtractor;
}
