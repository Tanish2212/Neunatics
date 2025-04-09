// Dashboard page functionality
let updateInterval;

document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    loadDashboardData();
    
    // Setup WebSocket connection
    setupWebSocketListeners();
    
    // Set up periodic updates
    updateInterval = setInterval(loadDashboardData, 3000);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        clearInterval(updateInterval);
    });
});

// Load all dashboard data
const loadDashboardData = async () => {
    try {
        // Load summary statistics
        const summaryResponse = await dashboardAPI.getSummary();
        updateSummaryUI(summaryResponse.data);
        
        // Load recent activity
        const activityResponse = await dashboardAPI.getRecentActivity();
        updateActivityUI(activityResponse.data);
        
        // Load low stock alerts
        const alertsResponse = await dashboardAPI.getLowStockAlerts();
        updateAlertsUI(alertsResponse.data);
        
        // Load sales trends
        const trendsResponse = await dashboardAPI.getSalesTrends();
        updateTrendsUI(trendsResponse.data);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
};

// Update summary statistics UI
const updateSummaryUI = (data) => {
    document.getElementById('total-products').textContent = data.total_products;
    document.getElementById('total-categories').textContent = data.total_categories;
    document.getElementById('total-stock-value').textContent = formatCurrency(data.total_stock_value);
    document.getElementById('low-stock-items').textContent = data.low_stock_items;
};

// Update recent activity UI
const updateActivityUI = (activities) => {
    const activityList = document.getElementById('recent-activity-list');
    activityList.innerHTML = '';
    
    if (activities.length === 0) {
        activityList.innerHTML = '<li class="no-activity">No recent activity</li>';
        return;
    }
    
    activities.forEach(activity => {
        const activityItem = document.createElement('li');
        activityItem.className = 'activity-item';
        
        const activityDate = new Date(activity.timestamp).toLocaleString();
        const activityType = activity.event_type.toLowerCase();
        
        activityItem.innerHTML = `
            <div class="activity-header">
                <span class="activity-type ${activityType}">${activityType}</span>
                <span class="activity-date">${activityDate}</span>
            </div>
            <div class="activity-details">
                <p>${activity.description}</p>
                ${activity.quantity_change ? 
                    `<p class="quantity-change">Quantity: ${activity.quantity_change > 0 ? '+' : ''}${activity.quantity_change} ${activity.unit}</p>` 
                    : ''}
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
};

// Update low stock alerts UI
const updateAlertsUI = (alerts) => {
    const alertsList = document.getElementById('low-stock-alerts');
    alertsList.innerHTML = '';
    
    if (alerts.length === 0) {
        alertsList.innerHTML = '<li class="no-alerts">No low stock items</li>';
        return;
    }
    
    alerts.forEach(alert => {
        const alertItem = document.createElement('li');
        alertItem.className = 'alert-item';
        
        alertItem.innerHTML = `
            <div class="alert-header">
                <span class="material-icons">warning</span>
                <span class="alert-product">${alert.product_name}</span>
            </div>
            <div class="alert-details">
                <p>Current Stock: ${alert.current_stock} ${alert.unit}</p>
                <p>Minimum Required: ${alert.min_stock_level} ${alert.unit}</p>
            </div>
            <a href="pages/product-detail.html?id=${alert.product_id}" class="btn btn-text">
                View Details
            </a>
        `;
        
        alertsList.appendChild(alertItem);
    });
};

// Update sales trends UI
const updateTrendsUI = (trends) => {
    // Update the chart with new data
    updateSalesChart(trends);
};

// Setup WebSocket listeners
const setupWebSocketListeners = () => {
    // Listen for real-time updates
    subscribeToEvent('dashboard-update', (data) => {
        // Update specific sections based on the update type
        switch (data.type) {
            case 'product_added':
            case 'product_updated':
            case 'product_deleted':
                loadDashboardData();
                break;
            case 'stock_updated':
                updateSummaryUI(data.summary);
                updateAlertsUI(data.alerts);
                break;
            case 'sales_updated':
                updateTrendsUI(data.trends);
                break;
        }
    });
};