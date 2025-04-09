// Utility functions for the food inventory application

// Format date
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format time
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };
  
  // Format datetime
  const formatDateTime = (dateString) => {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
  // Generate status badge HTML
  const getStatusBadge = (status) => {
    return `<span class="status-chip status-${status}">${formatStatus(status)}</span>`;
  };
  
  // Format status text
  const formatStatus = (status) => {
    switch (status) {
      case 'active':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };
  
  // Truncate text
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  /**
   * Show a notification to the user
   * @param {string} message - The notification message
   * @param {string} type - The notification type (success, error, warning, info)
   */
  function showNotification(message, type = 'info') {
    // Check if notification container exists, create if not
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.backgroundColor = getColorForType(type);
    notification.style.color = '#fff';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '4px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.justifyContent = 'space-between';
    notification.style.animation = 'slideIn 0.3s forwards';
    
    // Add notification content
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = '#fff';
    closeButton.style.fontSize = '18px';
    closeButton.style.marginLeft = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    });
    
    notification.appendChild(messageSpan);
    notification.appendChild(closeButton);
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notificationContainer.contains(notification)) {
            notification.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                if (notificationContainer.contains(notification)) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
    
    // Add CSS animations if not already present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.innerHTML = `
            @keyframes slideIn {
                0% { transform: translateX(100%); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                0% { transform: translateX(0); opacity: 1; }
                100% { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
  }
  
  /**
   * Get color for notification type
   * @param {string} type - Notification type
   * @returns {string} - Color code
   */
  function getColorForType(type) {
    switch (type) {
        case 'success':
            return '#28a745';
        case 'error':
            return '#dc3545';
        case 'warning':
            return '#ffc107';
        case 'info':
        default:
            return '#17a2b8';
    }
  }
  
  // Show loading spinner
  const showLoading = (containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<div class="loading"></div>';
    }
  };
  
  // Show error message
  const showError = (containerId, message) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<div class="error-message">${message}</div>`;
    }
  };
  
  // Format event type for display
  const formatEventType = (eventType) => {
    switch (eventType) {
      case 'create':
        return 'Created';
      case 'update':
        return 'Updated';
      case 'delete':
        return 'Deleted';
      default:
        return eventType;
    }
  };
  
  // Get URL parameters
  const getUrlParams = () => {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    for (const [key, value] of urlParams.entries()) {
      params[key] = value;
    }
    
    return params;
  };

  /**
   * Format currency number
   * @param {number} amount - Amount to format
   * @returns {string} - Formatted currency string
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format date relative to now
   * @param {string} timestamp - ISO timestamp string
   * @returns {string} - Formatted string like "2 hours ago"
   */
  function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    // Invalid date
    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }
    
    // Just now
    if (seconds < 60) {
        return 'Just now';
    }
    
    // Minutes
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Hours
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Days
    const days = Math.floor(hours / 24);
    if (days < 30) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Months
    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    
    // Years
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }

  // Export functions to window object
  window.showNotification = showNotification;
  window.formatCurrency = formatCurrency;
  window.formatTimeAgo = formatTimeAgo;