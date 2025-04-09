// Analytics page functionality
let charts = {};

document.addEventListener('DOMContentLoaded', () => {
  // Initialize charts
  initializeCharts();
  
  // Load initial data
  loadAnalyticsData();
  
  // Setup WebSocket connection
  setupWebSocketListeners();
  
  // Set up periodic updates
  setInterval(loadAnalyticsData, 3000);
});

// Initialize chart objects
const initializeCharts = () => {
  // Inventory trends chart
  const inventoryTrendsCtx = document.getElementById('inventory-trends-chart').getContext('2d');
  charts.inventoryTrends = new Chart(inventoryTrendsCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Total Products',
          data: [],
          borderColor: '#2E7D32',
          backgroundColor: 'rgba(46, 125, 50, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Low Stock',
          data: [],
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Out of Stock',
          data: [],
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Inventory Trends (Last 7 Days)'
        },
        tooltip: {
          mode: 'index',
          intersect: false
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
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Products'
          }
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
          '#FF9F40'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
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
    // Load products data
    const productsResponse = await productAPI.getAllProducts();
    const products = productsResponse.data;
    
    // Update inventory trends chart
    updateInventoryTrendsChart(products);
    
    // Update category distribution chart
    updateCategoryDistributionChart(products);
    
  } catch (error) {
    console.error('Error loading data:', error);
    showNotification('Error loading analytics data', 'error');
  }
};

// Update inventory trends chart
const updateInventoryTrendsChart = (products) => {
  if (!products || products.length === 0) return;
  
  // Calculate total inventory value for each product
  const inventoryValues = products.map(product => 
    product.current_stock * product.cost_price
  );
  
  // Update chart data
  charts.inventoryTrends.data.labels = products.map(p => p.name);
  charts.inventoryTrends.data.datasets[0].data = inventoryValues;
  charts.inventoryTrends.update();
};

// Update category distribution chart
const updateCategoryDistributionChart = (products) => {
  if (!products || products.length === 0) return;
  
  // Count products by category
  const categoryCounts = {};
  products.forEach(product => {
    categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
  });
  
  // Update chart data
  charts.categoryDistribution.data.labels = Object.keys(categoryCounts);
  charts.categoryDistribution.data.datasets[0].data = Object.values(categoryCounts);
  charts.categoryDistribution.update();
};

// Load inventory trends (simulated data)
const loadInventoryTrends = async () => {
  try {
    // In a real application, this would be an API call to get historical data
    // For demo purposes, we'll generate random data for the last 7 days
    
    const dates = [];
    const totalData = [];
    const lowStockData = [];
    const outOfStockData = [];
    
    // Generate dates for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(formatDate(date));
      
      // Generate random data (in real app, this would be real historical data)
      const total = Math.floor(Math.random() * 50) + 50; // 50-100
      const outOfStock = Math.floor(Math.random() * 10); // 0-10
      const lowStock = Math.floor(Math.random() * 15); // 0-15
      
      totalData.push(total);
      lowStockData.push(lowStock);
      outOfStockData.push(outOfStock);
    }
    
    // Update chart data
    charts.inventoryTrends.data.labels = dates;
    charts.inventoryTrends.data.datasets[0].data = totalData;
    charts.inventoryTrends.data.datasets[1].data = lowStockData;
    charts.inventoryTrends.data.datasets[2].data = outOfStockData;
    charts.inventoryTrends.update();
    
  } catch (error) {
    console.error('Error loading inventory trends:', error);
  }
};

// Load low stock items for the table
const loadLowStockItems = async () => {
  try {
    // Fetch products with low stock or out of stock
    const response = await productAPI.getProducts(1, 20, {
      status: ['low_stock', 'out_of_stock']
    });
    
    const products = response.data;
    updateLowStockTable(products);
    
  } catch (error) {
    console.error('Error loading low stock items:', error);
    document.getElementById('low-stock-table-body').innerHTML = 
      `<tr><td colspan="5" class="text-center error-message">Error loading data: ${error.message}</td></tr>`;
  }
};

// Update low stock table
const updateLowStockTable = (products) => {
  const tableBody = document.getElementById('low-stock-table-body');
  
  if (!products || products.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No low stock items found</td></tr>';
    return;
  }
  
  tableBody.innerHTML = products.map(product => `
    <tr data-id="${product._id}">
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${product.quantity}</td>
      <td>${product.minQuantity || 10}</td>
      <td>${getStatusBadge(product.status)}</td>
    </tr>
  `).join('');
  
  // Add click listener for rows
  const rows = tableBody.querySelectorAll('tr');
  rows.forEach(row => {
    row.addEventListener('click', () => {
      const productId = row.getAttribute('data-id');
      if (productId) {
        window.location.href = `product-detail.html?id=${productId}`;
      }
    });
  });
};

// Setup WebSocket listeners for real-time updates
const setupWebSocketListeners = () => {
  // Listen for product updates to refresh data
  subscribeToEvent('product-update', () => {
    // Refresh analytics data
    loadAnalyticsData();
  });
};