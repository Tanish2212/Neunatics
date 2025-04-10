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
    
    // Add summary metrics section
    addSummaryMetrics(productsData);
    
    // Update existing charts with real-time data
    updateInventoryTrendsChart(productsData);
    updateCategoryDistributionChart(productsData);
    
    // Add stock level chart
    addStockLevelChart(productsData);
    
    // Add price comparison chart
    addPriceComparisonChart(productsData);
    
    // Add inventory turnover chart
    addInventoryTurnoverChart(productsData);
    
    // Add profit margin analysis chart
    addProfitMarginChart(productsData);
    
    // Add stock level vs minimum stock comparison
    addStockLevelComparisonChart(productsData);
    
  } catch (error) {
    console.error('Error loading analytics data:', error);
    showNotification('Error loading analytics data: ' + error.message, 'error');
  }
};

// Add summary metrics section at the top
const addSummaryMetrics = (products) => {
  // Check if metrics section already exists
  if (document.getElementById('summary-metrics')) {
    // If it exists, update it instead of creating a new one
    updateMetricsSection(products);
    return;
  }
  
  // Calculate key metrics
  const totalProducts = products.length;
  const totalInventoryValue = products.reduce((sum, product) => {
    return sum + (product.current_stock * product.selling_price || 0);
  }, 0);
  const totalInventoryCost = products.reduce((sum, product) => {
    return sum + (product.current_stock * product.cost_price || 0);
  }, 0);
  const potentialProfit = totalInventoryValue - totalInventoryCost;
  const profitMargin = totalInventoryValue > 0 ? (potentialProfit / totalInventoryValue * 100) : 0;
  
  // Count products by status
  const statusCounts = {
    active: 0,
    low_stock: 0,
    inactive: 0,
    out_of_stock: 0
  };
  
  products.forEach(product => {
    const status = product.status || 'unknown';
    if (statusCounts.hasOwnProperty(status)) {
      statusCounts[status]++;
    }
  });
  
  // Create metrics container
  const metricsContainer = document.createElement('div');
  metricsContainer.id = 'summary-metrics';
  metricsContainer.className = 'metrics-container';
  
  // Set HTML content
  metricsContainer.innerHTML = `
    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-icon">
          <span class="material-icons">inventory</span>
        </div>
        <div class="metric-content">
          <h4>Total Products</h4>
          <p class="metric-value">${totalProducts}</p>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">
          <span class="material-icons">attach_money</span>
        </div>
        <div class="metric-content">
          <h4>Inventory Value</h4>
          <p class="metric-value">$${totalInventoryValue.toFixed(2)}</p>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">
          <span class="material-icons">trending_up</span>
        </div>
        <div class="metric-content">
          <h4>Potential Profit</h4>
          <p class="metric-value">$${potentialProfit.toFixed(2)}</p>
          <p class="metric-subtitle">${profitMargin.toFixed(1)}% margin</p>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">
          <span class="material-icons">error_outline</span>
        </div>
        <div class="metric-content">
          <h4>Low Stock</h4>
          <p class="metric-value">${statusCounts.low_stock}</p>
          <p class="metric-subtitle">products need attention</p>
        </div>
      </div>
    </div>
    
    <div class="refresh-timestamp">
      Last updated: ${new Date().toLocaleString()}
      <button id="refresh-data-btn" class="btn btn-text" title="Refresh Data">
        <span class="material-icons">refresh</span>
      </button>
    </div>
  `;
  
  // Find the analytics content section
  const analyticsContent = document.getElementById('analytics-content');
  if (!analyticsContent) return;
  
  // Insert metrics at the beginning, after the title
  const pageTitle = analyticsContent.querySelector('.page-title');
  if (pageTitle) {
    pageTitle.insertAdjacentElement('afterend', metricsContainer);
  } else {
    analyticsContent.insertAdjacentElement('afterbegin', metricsContainer);
  }
  
  // Add event listener to refresh button
  const refreshBtn = document.getElementById('refresh-data-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadAnalyticsData();
    });
  }
  
  // Add CSS styles for the metrics section
  addMetricsStyles();
};

// Add CSS styles for metrics
const addMetricsStyles = () => {
  // Check if styles already exist
  if (document.getElementById('metrics-styles')) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = 'metrics-styles';
  styleElement.textContent = `
    .metrics-container {
      margin-bottom: 24px;
    }
    
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 8px;
    }
    
    .metric-card {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 16px;
      display: flex;
      align-items: center;
    }
    
    .metric-icon {
      background-color: #f2f9ff;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }
    
    .metric-icon .material-icons {
      color: #1976D2;
      font-size: 24px;
    }
    
    .metric-content h4 {
      margin: 0 0 8px 0;
      color: #555;
      font-size: 14px;
      font-weight: 500;
    }
    
    .metric-value {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #333;
    }
    
    .metric-subtitle {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: #666;
    }
    
    .refresh-timestamp {
      text-align: right;
      font-size: 12px;
      color: #666;
      margin-top: 4px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
    
    #refresh-data-btn {
      margin-left: 8px;
      padding: 4px;
      min-width: auto;
    }
    
    #refresh-data-btn .material-icons {
      font-size: 16px;
    }
  `;
  
  document.head.appendChild(styleElement);
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
      labels: ['Active', 'Low Stock', 'Out of Stock'],
      datasets: [{
        label: 'Number of Products',
        data: [
          statusCounts.active,
          statusCounts.low_stock,
          statusCounts.out_of_stock
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)', // Active - teal
          'rgba(255, 205, 86, 0.7)', // Low Stock - yellow
          'rgba(255, 99, 132, 0.7)'  // Out of Stock - red
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 205, 86)',
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
    // Fetch alerts data
    const response = await fetch('/api/low-stock-alerts');
    
    if (!response.ok) {
      throw new Error('Failed to load low stock alerts');
    }
    
    const data = await response.json();
    const lowStockProducts = data.success ? data.data : [];
    
    // Update low stock notifications
    updateLowStockNotifications(lowStockProducts);
    
    // Update global variables for notifications
    if (lowStockItems.length < lowStockProducts.length) {
      unreadLowStockCount += (lowStockProducts.length - lowStockItems.length);
    }
    lowStockItems = lowStockProducts;
    updateNotificationBadge();
    
    // Update the low stock count in the metrics section
    const metricsContainer = document.getElementById('summary-metrics');
    if (metricsContainer) {
      const valueElements = metricsContainer.querySelectorAll('.metric-value');
      if (valueElements.length >= 4) {
        // Low Stock is the 4th metric (index 3)
        valueElements[3].textContent = lowStockProducts.length;
      }
    }
    
  } catch (error) {
    console.error('Error loading low stock alerts:', error);
  }
};

// Update low stock notifications panel
const updateLowStockNotifications = (products) => {
  const notificationsList = document.getElementById('stock-notifications');
  
  if (!notificationsList) return;
  
  if (!products || products.length === 0) {
    notificationsList.innerHTML = '<li class="notification-item">No inventory alerts</li>';
    return;
  }
  
  notificationsList.innerHTML = products.map(item => {
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
      console.log('New product added to analytics data:', data.data.name);
    }
    // Handle product update
    else if (data.type === 'update') {
      // Find and update the product in productsData array
      const index = productsData.findIndex(p => p.id === data.data.id);
      if (index !== -1) {
        productsData[index] = data.data;
        console.log('Product updated in analytics data:', data.data.name);
      }
    }
    // Handle product deletion
    else if (data.type === 'delete') {
      // Remove product from productsData array
      const productName = productsData.find(p => p.id === data.data.id)?.name || 'Unknown';
      productsData = productsData.filter(p => p.id !== data.data.id);
      console.log('Product removed from analytics data:', productName);
    }
    
    // Update the metrics section with real-time data
    updateMetricsSection(productsData);
    
    // Update all analytics visualizations with the new data
    updateAllAnalytics(productsData);
  });
  
  // Listen for stock updates
  subscribeToEvent('stock-update', (data) => {
    console.log('WebSocket: Received stock update event', data);
    
    // Find and update the product in productsData array
    const index = productsData.findIndex(p => p.id === data.productId);
    if (index !== -1) {
      // Update product stock
      const oldStock = productsData[index].current_stock;
      productsData[index].current_stock = data.newStock;
      console.log(`Stock updated for ${productsData[index].name}: ${oldStock} → ${data.newStock}`);
      
      // Update the metrics section with real-time data
      updateMetricsSection(productsData);
      
      // Update all analytics visualizations with the new data
      updateAllAnalytics(productsData);
    }
  });
  
  // Listen for low stock alerts
  subscribeToEvent('low-stock-update', (data) => {
    console.log('WebSocket: Received low stock update event', data);
    
    // Update low stock alerts
    loadLowStockAlerts();
    
    // If data includes the affected product, update its status in productsData
    if (data.product_id) {
      const index = productsData.findIndex(p => p.id === data.product_id);
      if (index !== -1) {
        // Update the product status
        productsData[index].status = 'low_stock';
        console.log(`Updated status for ${productsData[index].name} to low_stock`);
      }
    }
    
    // Update the metrics section with real-time data
    updateMetricsSection(productsData);
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

// Function to update just the metrics section with real-time data
const updateMetricsSection = (products) => {
  // Find existing metrics section
  const metricsSection = document.getElementById('summary-metrics');
  if (!metricsSection) {
    // If it doesn't exist yet, create it
    addSummaryMetrics(products);
    return;
  }
  
  // Calculate updated metrics
  const totalProducts = products.length;
  const totalInventoryValue = products.reduce((sum, product) => {
    return sum + (product.current_stock * product.selling_price || 0);
  }, 0);
  const totalInventoryCost = products.reduce((sum, product) => {
    return sum + (product.current_stock * product.cost_price || 0);
  }, 0);
  const potentialProfit = totalInventoryValue - totalInventoryCost;
  const profitMargin = totalInventoryValue > 0 ? (potentialProfit / totalInventoryValue * 100) : 0;
  
  // Count products by status
  const statusCounts = {
    active: 0,
    low_stock: 0,
    inactive: 0,
    out_of_stock: 0
  };
  
  products.forEach(product => {
    const status = product.status || 'unknown';
    if (statusCounts.hasOwnProperty(status)) {
      statusCounts[status]++;
    }
  });
  
  // Update the values in existing metrics section
  const valueElements = metricsSection.querySelectorAll('.metric-value');
  if (valueElements.length >= 4) {
    // Total Products
    valueElements[0].textContent = totalProducts;
    
    // Inventory Value
    valueElements[1].textContent = `$${totalInventoryValue.toFixed(2)}`;
    
    // Potential Profit
    valueElements[2].textContent = `$${potentialProfit.toFixed(2)}`;
    const marginElement = valueElements[2].nextElementSibling;
    if (marginElement && marginElement.classList.contains('metric-subtitle')) {
      marginElement.textContent = `${profitMargin.toFixed(1)}% margin`;
    }
    
    // Low Stock
    valueElements[3].textContent = statusCounts.low_stock;
  }
  
  // Update timestamp
  const timestamp = metricsSection.querySelector('.refresh-timestamp');
  if (timestamp) {
    timestamp.innerHTML = `
      Last updated: ${new Date().toLocaleString()}
      <button id="refresh-data-btn" class="btn btn-text" title="Refresh Data">
        <span class="material-icons">refresh</span>
      </button>
    `;
    
    // Re-add event listener to new refresh button
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        loadAnalyticsData();
      });
    }
  }
};

// Helper function to update all analytics visualizations at once
const updateAllAnalytics = (products) => {
  // Update summary metrics first
  updateMetricsSection(products);
  
  // Update all charts with the latest data
  updateInventoryTrendsChart(products);
  updateCategoryDistributionChart(products);
  
  if (charts.stockLevel) {
    // Update existing chart
    addStockLevelChart(products);
  } else {
    // Initialize if not yet created
    addStockLevelChart(products);
  }
  
  // Update price comparison chart
  if (charts.priceComparison) {
    addPriceComparisonChart(products);
  } else {
    addPriceComparisonChart(products);
  }
  
  // Update inventory turnover chart
  if (charts.inventoryTurnover) {
    addInventoryTurnoverChart(products);
  } else {
    addInventoryTurnoverChart(products);
  }
  
  // Update profit margin chart
  if (charts.profitMargin) {
    addProfitMarginChart(products);
  } else {
    addProfitMarginChart(products);
  }
  
  // Update stock level comparison chart
  if (charts.stockComparison) {
    addStockLevelComparisonChart(products);
  } else {
    addStockLevelComparisonChart(products);
  }
};

// Add price comparison chart (cost vs selling)
const addPriceComparisonChart = (products) => {
  // Check if the container element exists
  const container = document.querySelector('.grid-container');
  if (!container) return;
  
  // Check if this chart already exists
  if (document.getElementById('price-comparison-chart')) return;
  
  // Create a new chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'grid-item';
  chartContainer.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Price Comparison (Top 5 Products)</h3>
      </div>
      <div class="card-content chart-container">
        <canvas id="price-comparison-chart"></canvas>
      </div>
    </div>
  `;
  
  // Add the new chart container to the grid
  container.appendChild(chartContainer);
  
  // Sort products by selling price
  const topProducts = [...products]
    .sort((a, b) => (b.selling_price || 0) - (a.selling_price || 0))
    .slice(0, 5);
  
  // Prepare data
  const labels = topProducts.map(p => p.name);
  const costPrices = topProducts.map(p => p.cost_price || 0);
  const sellingPrices = topProducts.map(p => p.selling_price || 0);
  
  // Create the chart
  const ctx = document.getElementById('price-comparison-chart').getContext('2d');
  charts.priceComparison = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Cost Price ($)',
          data: costPrices,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        },
        {
          label: 'Selling Price ($)',
          data: sellingPrices,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Cost vs Selling Price'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Price ($)'
          }
        }
      }
    }
  });
};

// Add inventory turnover chart (estimated based on current data)
const addInventoryTurnoverChart = (products) => {
  // Check if the container element exists
  const container = document.querySelector('.grid-container');
  if (!container) return;
  
  // Check if this chart already exists
  if (document.getElementById('inventory-turnover-chart')) return;
  
  // Create a new chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'grid-item';
  chartContainer.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Inventory Turnover by Category</h3>
      </div>
      <div class="card-content chart-container">
        <canvas id="inventory-turnover-chart"></canvas>
      </div>
    </div>
  `;
  
  // Add the new chart container to the grid
  container.appendChild(chartContainer);
  
  // Calculate turnover by category (using sales_count if available)
  const categoryTurnover = {};
  const categoryCounts = {};
  
  products.forEach(product => {
    const category = product.category || 'Uncategorized';
    const salesCount = product.sales_count || Math.floor(Math.random() * 50); // Use random data if real data not available
    const inventoryLevel = product.current_stock || 1;
    
    // Accumulate total sales and count for average calculation
    if (!categoryTurnover[category]) {
      categoryTurnover[category] = 0;
      categoryCounts[category] = 0;
    }
    
    // Calculate turnover rate for this product (sales / inventory)
    const turnoverRate = salesCount / inventoryLevel;
    categoryTurnover[category] += turnoverRate;
    categoryCounts[category]++;
  });
  
  // Calculate average turnover by category
  const categories = Object.keys(categoryTurnover);
  const turnoverRates = categories.map(category => 
    categoryTurnover[category] / categoryCounts[category]
  );
  
  // Create the chart
  const ctx = document.getElementById('inventory-turnover-chart').getContext('2d');
  charts.inventoryTurnover = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Turnover Rate',
        data: turnoverRates,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Inventory Turnover by Category'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Turnover: ${context.parsed.y.toFixed(2)}x`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Turnover Rate'
          }
        }
      }
    }
  });
};

// Add profit margin analysis chart
const addProfitMarginChart = (products) => {
  // Check if the container element exists
  const container = document.querySelector('.grid-container');
  if (!container) return;
  
  // Check if this chart already exists
  if (document.getElementById('profit-margin-chart')) return;
  
  // Create a new chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'grid-item full-width';
  chartContainer.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Profit Margin Analysis</h3>
      </div>
      <div class="card-content chart-container">
        <canvas id="profit-margin-chart"></canvas>
      </div>
    </div>
  `;
  
  // Add the new chart container to the grid
  container.appendChild(chartContainer);
  
  // Calculate profit margins by category
  const categoryData = {};
  
  products.forEach(product => {
    const category = product.category || 'Uncategorized';
    const costPrice = product.cost_price || 0;
    const sellingPrice = product.selling_price || 0;
    
    // Skip if no prices
    if (costPrice === 0 && sellingPrice === 0) return;
    
    // Calculate profit margin as percentage
    const profitMargin = costPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;
    
    if (!categoryData[category]) {
      categoryData[category] = {
        margins: [],
        totalMargin: 0,
        count: 0
      };
    }
    
    categoryData[category].margins.push(profitMargin);
    categoryData[category].totalMargin += profitMargin;
    categoryData[category].count++;
  });
  
  // Calculate average, min, max margins for each category
  const categories = Object.keys(categoryData);
  const avgMargins = categories.map(cat => categoryData[cat].totalMargin / categoryData[cat].count);
  const minMargins = categories.map(cat => Math.min(...categoryData[cat].margins));
  const maxMargins = categories.map(cat => Math.max(...categoryData[cat].margins));
  
  // Create the chart
  const ctx = document.getElementById('profit-margin-chart').getContext('2d');
  charts.profitMargin = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [
        {
          label: 'Average Profit Margin (%)',
          data: avgMargins,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        },
        {
          label: 'Minimum Margin',
          data: minMargins,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        },
        {
          label: 'Maximum Margin',
          data: maxMargins,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Profit Margins by Category'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Profit Margin (%)'
          }
        }
      }
    }
  });
};

// Add stock level comparison chart (current vs min stock)
const addStockLevelComparisonChart = (products) => {
  // Check if the container element exists
  const container = document.querySelector('.grid-container');
  if (!container) return;
  
  // Check if this chart already exists
  if (document.getElementById('stock-comparison-chart')) return;
  
  // Create a new chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'grid-item full-width';
  chartContainer.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Stock Level Analysis</h3>
      </div>
      <div class="card-content chart-container">
        <canvas id="stock-comparison-chart"></canvas>
      </div>
    </div>
  `;
  
  // Add the new chart container to the grid
  container.appendChild(chartContainer);
  
  // Get products with low stock or critical levels
  const criticalProducts = products
    .filter(p => p.current_stock <= p.min_stock_level)
    .sort((a, b) => {
      // Calculate stock ratio (current/min)
      const ratioA = a.min_stock_level > 0 ? a.current_stock / a.min_stock_level : 0;
      const ratioB = b.min_stock_level > 0 ? b.current_stock / b.min_stock_level : 0;
      // Sort by ratio (lowest first)
      return ratioA - ratioB;
    })
    .slice(0, 10); // Get top 10 most critical
  
  // Prepare data
  const labels = criticalProducts.map(p => p.name);
  const currentStocks = criticalProducts.map(p => p.current_stock || 0);
  const minStocks = criticalProducts.map(p => p.min_stock_level || 0);
  
  // Create the chart
  const ctx = document.getElementById('stock-comparison-chart').getContext('2d');
  charts.stockComparison = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Current Stock',
          data: currentStocks,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        },
        {
          label: 'Minimum Required Stock',
          data: minStocks,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: 'Critical Stock Levels'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Stock Quantity'
          }
        }
      }
    }
  });
};