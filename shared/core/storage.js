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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Storage };
} else {
    window.Storage = Storage;
}
