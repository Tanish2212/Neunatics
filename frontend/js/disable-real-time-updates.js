/**
 * disable-real-time-updates.js
 * This script removes real-time update notifications and recent activity panels
 * from the product detail page.
 */

(function() {
    // Function to run when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Function to remove real-time update elements
        function removeRealTimeElements() {
            // Target all elements related to real-time updates and notifications
            const selectors = [
                // Real-time update notifications
                '.real-time-updates',
                '#real-time-updates',
                '[class*="real-time"]',
                '[id*="real-time"]',
                
                // Recent activity sections
                '.recent-activity',
                '#recent-activity',
                '.activity-list',
                '#activity-list',
                '#recent-activity-list',
                '.recent-activity-section',
                
                // Notification panels
                '.notification-panel',
                '#notification-panel',
                '#stock-notification-panel',
                '.notification-badge',
                '#notification-badge'
            ];
            
            // Find all matching elements
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el && el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                });
            });
            
            // Remove any recent activity headers
            document.querySelectorAll('h2, h3, h4').forEach(heading => {
                if (heading.textContent.includes('Recent Activity')) {
                    const card = heading.closest('.dashboard-card') || heading.parentNode;
                    if (card && card.parentNode) {
                        card.parentNode.removeChild(card);
                    }
                }
            });
        }
        
        // Override any existing notification functions
        window.showNotification = function(message, type) {
            // Only log to console but don't show UI notification
            console.log(`[Notification - ${type}] ${message}`);
            return false;
        };
        
        // Run initially
        removeRealTimeElements();
        
        // Run periodically to catch dynamically added elements
        setInterval(removeRealTimeElements, 500);
        
        // Observer to detect DOM changes and remove elements immediately
        const observer = new MutationObserver(function(mutations) {
            removeRealTimeElements();
        });
        
        // Start observing the document with the configured parameters
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    });
})(); 