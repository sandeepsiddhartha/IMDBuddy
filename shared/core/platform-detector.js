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
        const hostname = window.location.hostname;
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlatformDetector };
} else {
    window.PlatformDetector = PlatformDetector;
}
