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
    
    // Update charts with real-time data
    updateInventoryTrendsChart(productsData);
    updateCategoryDistributionChart(productsData);
    updateHotSellingProducts(productsData);
    
    // Add inventory value over time chart
    addInventoryValueTimelineChart(productsData);
    
    // Add stock level chart
    addStockLevelChart(productsData);
    
  } catch (error) {
    console.error('Error loading analytics data:', error);
    showNotification('Error loading analytics data: ' + error.message, 'error');
  }
};

// Update inventory trends chart with real-time data
const updateInventoryTrendsChart = (products) => {
  // Calculate total inventory value
  const totalValue = products.reduce((sum, product) => {
    return sum + (product.current_stock * product.selling_price || 0);
  }, 0);
  
  // Sort products by value (product.current_stock * product.selling_price)
  const sortedProducts = [...products]
    .sort((a, b) => {
      const valueA = (a.current_stock * a.selling_price) || 0;
      const valueB = (b.current_stock * b.selling_price) || 0;
      return valueB - valueA; // Descending order
    })
    .slice(0, 10); // Top 10 products by value
  
  // Prepare data for the chart
  const labels = sortedProducts.map(p => p.name);
  const inventoryValues = sortedProducts.map(p => (p.current_stock * p.selling_price) || 0);
  const stockCounts = sortedProducts.map(p => p.current_stock || 0);
  
  // Update chart
  charts.inventoryTrends.data.labels = labels;
  charts.inventoryTrends.data.datasets[0].data = inventoryValues;
  charts.inventoryTrends.data.datasets[1].data = stockCounts;
  charts.inventoryTrends.update();
  
  // Update total inventory value card if exists
  const totalValueElement = document.getElementById('total-inventory-value');
  if (totalValueElement) {
    totalValueElement.textContent = `$${totalValue.toFixed(2)}`;
  }
};

// Update category distribution chart with real-time data
const updateCategoryDistributionChart = (products) => {
  // Calculate product counts by category
  const categoryCounts = {};
  products.forEach(product => {
    const category = product.category || 'Uncategorized';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  // Prepare data for the chart
  const categories = Object.keys(categoryCounts);
  const counts = categories.map(category => categoryCounts[category]);
  
  // Update chart
  charts.categoryDistribution.data.labels = categories;
  charts.categoryDistribution.data.datasets[0].data = counts;
  charts.categoryDistribution.update();
};

// Update hot selling products list
const updateHotSellingProducts = (products) => {
  // Sort products by sales_count (if available) or random for demo
  const hotProducts = [...products]
    .sort((a, b) => {
      // Use sales_count if available, otherwise use a random sort
      const salesA = a.sales_count || Math.random() * 100;
      const salesB = b.sales_count || Math.random() * 100;
      return salesB - salesA;
    })
    .slice(0, 5); // Top 5 products
  
  // Get the container element
  const hotProductsList = document.getElementById('hot-products-list');
  if (!hotProductsList) return;
  
  // Generate HTML for each hot product
  hotProductsList.innerHTML = hotProducts.map((product, index) => {
    const salesCount = product.sales_count || Math.floor(Math.random() * 500);
    return `
      <li class="hot-product-item">
        <div class="rank">#${index + 1}</div>
        <div class="hot-product-info">
          <h4>${product.name}</h4>
          <div class="hot-product-details">
            <span class="category">${product.category || 'Uncategorized'}</span>
            <span class="sales-count">${salesCount} sold</span>
          </div>
        </div>
      </li>
    `;
  }).join('');
};

// Add inventory value timeline chart (new chart)
const addInventoryValueTimelineChart = (products) => {
  // Check if the container element exists
  const container = document.querySelector('.grid-container');
  if (!container) return;
  
  // Check if this chart already exists
  if (document.getElementById('inventory-timeline-chart')) return;
  
  // Create a new chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'grid-item full-width';
  chartContainer.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Inventory Value Timeline</h3>
      </div>
      <div class="card-content chart-container">
        <canvas id="inventory-timeline-chart"></canvas>
      </div>
    </div>
  `;
  
  // Add the new chart container to the grid
  container.appendChild(chartContainer);
  
  // Generate time series data for the last 30 days
  const dates = [];
  const values = [];
  
  // Current date
  const now = new Date();
  
  // Generate data for the last 30 days
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dates.push(date.toLocaleDateString());
    
    // Generate a value based on the current total with some random variation
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.current_stock * product.selling_price || 0);
    }, 0);
    
    // Add some random variation (±15%)
    const randomFactor = 0.85 + (Math.random() * 0.3); // Between 0.85 and 1.15
    values.push(totalValue * randomFactor);
  }
  
  // Create the chart
  const ctx = document.getElementById('inventory-timeline-chart').getContext('2d');
  charts.inventoryTimeline = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Total Inventory Value ($)',
        data: values,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Inventory Value Over Time (Last 30 Days)'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return '$' + context.parsed.y.toFixed(2);
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Value ($)'
          },
          beginAtZero: true
        }
      }
    }
  });
};

// Add stock level chart (new chart)
const addStockLevelChart = (products) => {
  // Check if the container element exists
  const container = document.querySelector('.grid-container');
  if (!container) return;
  
  // Check if this chart already exists
  if (document.getElementById('stock-level-chart')) return;
  
  // Create a new chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'grid-item full-width';
  chartContainer.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Stock Levels by Status</h3>
      </div>
      <div class="card-content chart-container">
        <canvas id="stock-level-chart"></canvas>
      </div>
    </div>
  `;
  
  // Add the new chart container to the grid
  container.appendChild(chartContainer);
  
  // Count products by status
  const statusCounts = {
    'active': 0,
    'low_stock': 0,
    'inactive': 0,
    'out_of_stock': 0
  };
  
  products.forEach(product => {
    const status = product.status || 'unknown';
    if (statusCounts.hasOwnProperty(status)) {
      statusCounts[status]++;
    }
  });
  
  // Create the chart
  const ctx = document.getElementById('stock-level-chart').getContext('2d');
  charts.stockLevel = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Active', 'Low Stock', 'Inactive', 'Out of Stock'],
      datasets: [{
        label: 'Number of Products',
        data: [
          statusCounts.active,
          statusCounts.low_stock,
          statusCounts.inactive,
          statusCounts.out_of_stock
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)', // Active - teal
          'rgba(255, 205, 86, 0.7)', // Low Stock - yellow
          'rgba(201, 203, 207, 0.7)', // Inactive - gray
          'rgba(255, 99, 132, 0.7)'  // Out of Stock - red
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 205, 86)',
          'rgb(201, 203, 207)',
          'rgb(255, 99, 132)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Products by Inventory Status'
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Status'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Number of Products'
          },
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
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
    
    if (ratio <= 0 || currentStock === 0) {
      severityClass = 'stock-alert critical'; // red - out of stock
    } else if (ratio < 0.5) {
      severityClass = 'stock-alert alert'; // orange - very low stock
    }
    
    // Determine status badge text and class
    let statusText = formatStatus(item.status);
    let statusClass = `status-${item.status}`;
    
    // Override status for zero stock
    if (currentStock === 0) {
      statusText = 'NO STOCK';
      statusClass = 'status-out-of-stock';
    }
    
    return `
      <li class="notification-item">
        <div class="notification-header">
          <strong>${item.name}</strong>
          <span class="status-chip ${statusClass}">${statusText}</span>
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
  // Check if timestamp is valid
  if (!timestamp || timestamp === 'undefined' || timestamp === 'null') {
    const now = new Date();
    return now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }
  
  const date = new Date(timestamp);
  
  // Check if date is invalid
  if (isNaN(date.getTime())) {
    const now = new Date();
    return now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }
  
  // Format as a fixed date and time
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString(undefined, options);
};

// Setup WebSocket listeners
const setupWebSocketListeners = () => {
  // Connect to Socket.IO
  connectWebSocket();
  
  // Listen for product updates
  subscribeToEvent('product-update', (data) => {
    console.log('WebSocket: Received product update event', data);
    
    // Handle product creation
    if (data.type === 'create') {
      // Add new product to productsData array
      productsData.push(data.data);
      // Update inventory trends chart immediately to reflect the new product
      updateInventoryTrendsChart(productsData);
    }
    // Handle product update
    else if (data.type === 'update') {
      // Find and update the product in productsData array
      const index = productsData.findIndex(p => p.id === data.data.id);
      if (index !== -1) {
        productsData[index] = data.data;
        // Update inventory trends chart to reflect changes
        updateInventoryTrendsChart(productsData);
      }
    }
    // Handle product deletion
    else if (data.type === 'delete') {
      // Remove product from productsData array
      productsData = productsData.filter(p => p.id !== data.data.id);
      // Update inventory trends chart to reflect deletion
      updateInventoryTrendsChart(productsData);
    }
    
    // Also update other charts if needed
    updateCategoryDistributionChart(productsData);
    updateHotSellingProducts(productsData);
    
    // Check for low stock updates
    loadLowStockAlerts();
  });
  
  // Listen for stock updates
  subscribeToEvent('stock-update', (data) => {
    console.log('WebSocket: Received stock update event', data);
    
    // Find and update the product in productsData array
    const index = productsData.findIndex(p => p.id === data.productId);
    if (index !== -1) {
      // Update product stock
      productsData[index].current_stock = data.newStock;
      // Update inventory trends chart to reflect stock changes
      updateInventoryTrendsChart(productsData);
    }
  });
  
  // Listen for direct events from the events API
  subscribeToEvent('event', (data) => {
    console.log('WebSocket received event API event:', data);
    // Only reload if it's a product-related event
    if (data.resource_type === 'product') {
      // For events not already handled by product-update
      if (!data.already_processed) {
        loadAnalyticsData();
      }
    }
  });
};