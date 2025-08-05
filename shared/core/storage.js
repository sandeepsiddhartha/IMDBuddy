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
        try {
            const result = await chrome.storage.local.get([key]);
            return result[key] ? JSON.parse(result[key]) : {};
        } catch (error) {
            console.error('Storage get error:', error);
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
        try {
            await chrome.storage.local.set({ [key]: JSON.stringify(data) });
        } catch (error) {
            console.error('Storage set error:', error);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Storage };
} else {
    window.Storage = Storage;
}
