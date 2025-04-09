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
  
  // Show notification/toast
  const showNotification = (message, type = 'info') => {
    // Check if notification container exists, create if not
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      document.body.appendChild(container);
    }
  
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-message">${message}</span>
      <span class="notification-close">&times;</span>
    `;
  
    // Add to container
    container.appendChild(notification);
  
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
  
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  };
  
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