/**
 * IMDBuddy - Popup Script
 * 
 * Handles popup functionality including debug tools
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Check if we should show debug section
    await checkDebugMode();
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Check if debug mode is enabled and show/hide debug section accordingly
 */
async function checkDebugMode() {
    try {
        // Get active tab to check the extension context
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Execute script to check BASE_CONFIG.DEBUG value
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Check if BASE_CONFIG exists and DEBUG is enabled
                return window.BASE_CONFIG && window.BASE_CONFIG.DEBUG;
            }
        });
        
        const debugMode = result[0]?.result || false;
        
        // Show/hide debug section based on debug mode
        const debugSection = document.getElementById('debugSection');
        if (debugMode) {
            debugSection.classList.add('visible');
            console.log('[IMDBuddy Popup] Debug mode enabled - showing debug tools');
        } else {
            debugSection.classList.remove('visible');
            console.log('[IMDBuddy Popup] Debug mode disabled - hiding debug tools');
        }
    } catch (error) {
        console.error('[IMDBuddy Popup] Error checking debug mode:', error);
        // Hide debug section on error
        const debugSection = document.getElementById('debugSection');
        debugSection.classList.remove('visible');
    }
}

/**
 * Set up event listeners for popup elements
 */
function setupEventListeners() {
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', handleClearCache);
    }
}

/**
 * Handle cache clearing functionality
 */
async function handleClearCache() {
    const button = document.getElementById('clearCacheBtn');
    const originalText = button.textContent;
    
    try {
        // Update button state
        button.textContent = 'Clearing...';
        button.disabled = true;
        button.classList.remove('success', 'error');
        
        // Clear the cache using storage API
        await chrome.storage.local.remove(['imdb_cache']);
        
        // Also try to call extension's clearCache if available
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    // Try to call the extension's clearCache method
                    if (window.streamingRatings && typeof window.streamingRatings.clearCache === 'function') {
                        window.streamingRatings.clearCache();
                        console.log('[IMDBuddy] Cache cleared via extension method');
                    }
                    if (window.ApiService && typeof window.ApiService.clearCache === 'function') {
                        window.ApiService.clearCache();
                        console.log('[IMDBuddy] Cache cleared via ApiService method');
                    }
                }
            });
        } catch (scriptError) {
            console.warn('[IMDBuddy Popup] Could not call extension clearCache method:', scriptError);
        }
        
        // Success state
        button.textContent = '✓ Cleared!';
        button.classList.add('success');
        
        console.log('[IMDBuddy Popup] Cache cleared successfully');
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
            button.classList.remove('success');
        }, 2000);
        
    } catch (error) {
        console.error('[IMDBuddy Popup] Error clearing cache:', error);
        
        // Error state
        button.textContent = '✗ Error';
        button.classList.add('error');
        
        // Reset button after 3 seconds
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
            button.classList.remove('error');
        }, 3000);
    }
}

/**
 * Handle any additional popup functionality
 */
function handlePopupActions() {
    // Future: Add more popup actions like showing stats, etc.
}
