// Analytics page functionality
let charts = {};
let lowStockItems = [];
let unreadLowStockCount = 0;
let productsData = [];

document.addEventListener('DOMContentLoaded', () => {
  // Initialize charts
  initializeCharts();
  
  // Load initial data
  loadAnalyticsData();
  
  // Load low stock alerts for notifications
  loadLowStockAlerts();
  
  // Setup WebSocket connection
  setupWebSocketListeners();
  
  // Setup notification button
  setupNotificationButton();
  
  // Set up periodic updates with different timers to avoid conflicts
  setInterval(() => {
    loadAnalyticsData();
  }, 30000); // Every 30 seconds
  
  setTimeout(() => {
    setInterval(loadLowStockAlerts, 60000); // Every 60 seconds, but staggered
  }, 10000);
});

// Setup notification button
const setupNotificationButton = () => {
  const notificationButton = document.getElementById('notifications-button');
  const notificationPanel = document.getElementById('stock-notification-panel');
  const closeNotifications = document.getElementById('close-notifications');
  
  if (notificationButton && notificationPanel && closeNotifications) {
    // Toggle notification panel
    notificationButton.addEventListener('click', () => {
      notificationPanel.classList.toggle('visible');
      
      // Mark notifications as read when panel is opened
      if (notificationPanel.classList.contains('visible')) {
        unreadLowStockCount = 0;
        updateNotificationBadge();
      }
    });
    
    // Close notification panel
    closeNotifications.addEventListener('click', () => {
      notificationPanel.classList.remove('visible');
    });
    
    // Close panel if clicked outside
    document.addEventListener('click', (event) => {
      if (!notificationPanel.contains(event.target) && 
          !notificationButton.contains(event.target) && 
          notificationPanel.classList.contains('visible')) {
        notificationPanel.classList.remove('visible');
      }
    });
  }
  
  // Add refresh button to inventory trends chart
  const chartHeader = document.querySelector('.card-header h3');
  if (chartHeader && chartHeader.textContent.includes('Inventory Value')) {
    // Create refresh button
    const refreshButton = document.createElement('button');
    refreshButton.className = 'btn btn-text';
    refreshButton.innerHTML = '<span class="material-icons">refresh</span>';
    refreshButton.style.marginLeft = '8px';
    refreshButton.title = 'Refresh Data';
    
    // Add click event
    refreshButton.addEventListener('click', () => {
      console.log('Manual refresh of analytics data triggered');
      loadAnalyticsData();
    });
    
    // Append to header
    chartHeader.appendChild(refreshButton);
  }
};

// Update notification badge
const updateNotificationBadge = () => {
  const badge = document.getElementById('nav-notification-badge');
  const stockAlertCount = document.getElementById('stock-alert-count');
  
  if (badge) {
    if (unreadLowStockCount > 0) {
      badge.textContent = unreadLowStockCount;
      badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }
  }
  
  if (stockAlertCount) {
    stockAlertCount.textContent = lowStockItems.length;
  }
};

// Initialize chart objects
const initializeCharts = () => {
  // Inventory value trends chart
  const inventoryTrendsCtx = document.getElementById('inventory-trends-chart').getContext('2d');
  charts.inventoryTrends = new Chart(inventoryTrendsCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Total Inventory Value ($)',
          data: [],
          borderColor: '#2E7D32',
          backgroundColor: 'rgba(46, 125, 50, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Product Count',
          data: [],
          borderColor: '#1976D2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderDashed: [5, 5],
          tension: 0.4,
          fill: false,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Real-time Inventory Value'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.dataset.yAxisID === 'y') {
                label += '$' + context.parsed.y.toFixed(2);
              } else {
                label += context.parsed.y;
              }
              return label;
            }
          }
        },
        legend: {
          position: 'top',
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Products'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Value ($)'
          },
          beginAtZero: true
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Count'
          },
          grid: {
            drawOnChartArea: false
          },
          beginAtZero: true
        }
      }
    }
  });
  
  // Category distribution chart
  const categoryDistributionCtx = document.getElementById('category-distribution-chart').getContext('2d');
  charts.categoryDistribution = new Chart(categoryDistributionCtx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF90C9',
          '#7A88FF',
          '#C9FF76',
          '#80E0D8'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Products by Category'
        }
      }
    }
  });
};

// Load all analytics data
const loadAnalyticsData = async () => {
  try {
    console.log('Loading analytics data...');
    
    // Load products data
    const productsResponse = await productAPI.getAllProducts();
    if (!productsResponse.success) {
      throw new Error('Failed to load products data');
    }
    
    productsData = productsResponse.data;
    console.log(`Loaded ${productsData.length} products for analytics`);
    
    // Update inventory trends chart with real-time product values
    updateInventoryValueChart(productsData);
    
    // Update category distribution chart
    updateCategoryDistributionChart(productsData);
    
    // Update hot selling products section
    updateHotSellingProducts(productsData);
    
  } catch (error) {
    console.error('Error loading analytics data:', error);
    showNotification('Error loading analytics data', 'error');
  }
};

// Update inventory value chart
const updateInventoryValueChart = (products) => {
  if (!products || products.length === 0 || !charts.inventoryTrends) return;
  
  // Sort products by inventory value (price * quantity) descending
  const sortedProducts = [...products].sort((a, b) => {
    const valueA = (a.current_stock || 0) * (a.selling_price || 0);
    const valueB = (b.current_stock || 0) * (b.selling_price || 0);
    return valueB - valueA;
  });
  
  // Calculate the total inventory value and prepare chart data
  const productNames = [];
  const inventoryValues = [];
  const productCounts = [];
  let cumulativeCount = 0;
  
  // Take top 20 products for readability
  const displayProducts = sortedProducts.slice(0, 20);
  
  displayProducts.forEach(product => {
    const value = (product.current_stock || 0) * (product.selling_price || 0);
    productNames.push(product.name);
    inventoryValues.push(value);
    
    cumulativeCount += 1;
    productCounts.push(cumulativeCount);
  });
  
  // Update chart data
  charts.inventoryTrends.data.labels = productNames;
  charts.inventoryTrends.data.datasets[0].data = inventoryValues;
  charts.inventoryTrends.data.datasets[1].data = productCounts;
  
  // Update chart
  charts.inventoryTrends.update();
  
  console.log('Inventory value chart updated with real-time data');
};

// Update category distribution chart
const updateCategoryDistributionChart = (products) => {
  if (!products || products.length === 0 || !charts.categoryDistribution) return;
  
  // Count products by category
  const categoryCounts = {};
  products.forEach(product => {
    if (product.category) {
      categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
    }
  });
  
  // Sort categories by count (descending)
  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [key, val]) => {
      obj[key] = val;
      return obj;
    }, {});
  
  // Update chart data
  charts.categoryDistribution.data.labels = Object.keys(sortedCategories);
  charts.categoryDistribution.data.datasets[0].data = Object.values(sortedCategories);
  
  // Update chart
  charts.categoryDistribution.update();
  
  console.log('Category distribution chart updated');
};

// Update hot selling products section
const updateHotSellingProducts = (products) => {
  const hotProductsList = document.getElementById('hot-products-list');
  
  if (!hotProductsList || !products || products.length === 0) return;
  
  // Sort products by sales count (descending)
  const hotProducts = [...products]
    .filter(product => product.sales_count !== undefined && product.sales_count > 0)
    .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
    .slice(0, 10); // Top 10 selling products
  
  if (hotProducts.length === 0) {
    hotProductsList.innerHTML = '<li class="hot-product-item"><div class="loading-indicator">No sales data available</div></li>';
    return;
  }
  
  // Generate hot products list HTML
  const hotProductsHTML = hotProducts.map((product, index) => `
    <li class="hot-product-item" data-id="${product.id}">
      <div class="hot-product-rank">${index + 1}</div>
      <div class="hot-product-info">
        <div class="hot-product-name">${product.name}</div>
        <div class="hot-product-category">${product.category}</div>
      </div>
      <div class="hot-product-sales">
        <div class="hot-product-count">${product.sales_count}</div>
        <div class="hot-product-label">units sold</div>
      </div>
    </li>
  `).join('');
  
  hotProductsList.innerHTML = hotProductsHTML;
  
  // Add click event to hot product items
  const hotProductItems = hotProductsList.querySelectorAll('.hot-product-item');
  hotProductItems.forEach(item => {
    item.addEventListener('click', () => {
      const productId = item.getAttribute('data-id');
      if (productId) {
        window.location.href = `product-detail.html?id=${productId}`;
      }
    });
  });
  
  console.log('Hot selling products section updated');
};

// Load low stock alerts
const loadLowStockAlerts = async () => {
  try {
    // Fetch products with low stock
    const response = await productAPI.getLowStockProducts();
    
    if (!response.success) {
      throw new Error('Failed to load low stock data');
    }
    
    // Get current number of alerts for comparison
    const previousAlertCount = lowStockItems.length;
    
    // Update low stock items list
    lowStockItems = response.data;
    
    // Update notification UI
    updateLowStockNotifications();
    
    // If there are new alerts, increment unread count
    if (lowStockItems.length > previousAlertCount) {
      unreadLowStockCount += (lowStockItems.length - previousAlertCount);
      updateNotificationBadge();
      
      // Show notification
      showNotification(`${lowStockItems.length - previousAlertCount} new low stock alerts`, 'warning');
    }
    
  } catch (error) {
    console.error('Error loading low stock alerts:', error);
  }
};

// Update low stock notifications panel
const updateLowStockNotifications = () => {
  const notificationsList = document.getElementById('stock-notifications');
  
  if (!notificationsList) return;
  
  if (!lowStockItems || lowStockItems.length === 0) {
    notificationsList.innerHTML = '<li class="notification-item">No inventory alerts</li>';
    return;
  }
  
  notificationsList.innerHTML = lowStockItems.map(item => {
    // Calculate how critical the stock level is
    const currentStock = parseFloat(item.current_stock);
    const minStock = parseFloat(item.min_stock_level);
    const ratio = currentStock / minStock;
    
    let severityClass = 'stock-alert warning'; // default yellow warning
    
    if (ratio <= 0) {
      severityClass = 'stock-alert critical'; // red - out of stock
    } else if (ratio < 0.5) {
      severityClass = 'stock-alert alert'; // orange - very low stock
    }
    
    return `
      <li class="notification-item">
        <div class="notification-header">
          <strong>${item.name}</strong>
          <span class="status-chip status-${item.status}">${formatStatus(item.status)}</span>
        </div>
        <div class="${severityClass}">
          <p>Current stock: <b>${item.current_stock}</b> ${item.unit}</p>
          <p>Minimum stock: ${item.min_stock_level} ${item.unit}</p>
        </div>
        <p class="notification-time">${formatTimeAgo(item.last_updated)}</p>
      </li>
    `;
  }).join('');
  
  // Update badge
  updateNotificationBadge();
};

// Format product status
const formatStatus = (status) => {
  if (!status) return 'Unknown';
  
  switch (status.toLowerCase()) {
    case 'active':
      return 'Active';
    case 'low_stock':
      return 'Low Stock';
    case 'out_of_stock':
      return 'Out of Stock';
    case 'discontinued':
      return 'Discontinued';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

// Format time ago
const formatTimeAgo = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  
  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }
};

// Setup WebSocket listeners
const setupWebSocketListeners = () => {
  // Connect to Socket.IO
  connectWebSocket();
  
  // Listen for product updates (new, updated, or deleted products)
  subscribeToEvent('product-update', (data) => {
    console.log('WebSocket received product update:', data);
    
    // Refresh analytics data when product data changes
    loadAnalyticsData();
    
    // Check for low stock updates
    loadLowStockAlerts();
  });
  
  // Listen for direct events from the events API
  subscribeToEvent('event', (data) => {
    console.log('WebSocket received event API event:', data);
    // Only reload if it's a product-related event
    if (data.resource_type === 'product') {
      loadAnalyticsData();
    }
  });
};