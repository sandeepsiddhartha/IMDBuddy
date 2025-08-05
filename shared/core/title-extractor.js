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
        const result = platformConfig.extractTitle(element, platformConfig.titleSelectors);
        
        // Debug logging when extraction fails
        if (!result) {
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
        console.log(`Title extraction failed for ${hostname}:`, element);
        
        // Platform-specific debug logging
        if (hostname.includes('hotstar.com') || hostname.includes('disneyplus.com')) {
            this.logHotstarDebugInfo(element);
        } else if (hostname.includes('netflix.com')) {
            this.logNetflixDebugInfo(element);
        }
    },

    /**
     * Log Hotstar-specific debugging information
     * @param {HTMLElement} element - The DOM element to analyze
     */
    logHotstarDebugInfo(element) {
        console.log('=== HOTSTAR DEBUG INFO ===');
        console.log('Available aria-label elements:', element.querySelectorAll('[aria-label]'));
        console.log('Available img elements with alt:', element.querySelectorAll('img[alt]'));
        console.log('Available elements with title attr:', element.querySelectorAll('[title]'));
        console.log('Available h3/h4 elements:', element.querySelectorAll('h3, h4'));
        console.log('Available a elements with aria-label:', element.querySelectorAll('a[aria-label]'));
        
        // Log all text content
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
            if (el.hasAttribute('alt')) {
                console.log(`${el.tagName} alt: "${el.getAttribute('alt')}"`);
            }
            if (el.hasAttribute('title')) {
                console.log(`${el.tagName} title: "${el.getAttribute('title')}"`);
            }
        });
        console.log('=== END HOTSTAR DEBUG ===');
    },

    /**
     * Log Netflix-specific debugging information
     * @param {HTMLElement} element - The DOM element to analyze
     */
    logNetflixDebugInfo(element) {
        console.log('Available aria-label links:', element.querySelectorAll('a[aria-label]'));
        console.log('Available fallback text:', element.querySelectorAll('.fallback-text'));
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TitleExtractor };
} else {
    window.TitleExtractor = TitleExtractor;
}
