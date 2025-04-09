// Product detail page functionality
let productId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Get product ID from URL
  const params = getUrlParams();
  productId = params.id;
  
  if (!productId) {
    // Redirect to products page if no ID specified
    window.location.href = 'products.html';
    return;
  }
  
  // Load product details
  loadProductDetails();
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup WebSocket connections
  setupWebSocketListeners();
});

// Load product details
const loadProductDetails = async () => {
  try {
    // Show loading state
    document.getElementById('product-name').textContent = 'Loading...';
    
    // Fetch product details
    const response = await productAPI.getProductById(productId);
    const product = response.data;
    
    // Update UI with product details
    updateProductUI(product);
    
    // Fetch product events history
    loadProductEvents();
    
  } catch (error) {
    showNotification(`Error loading product: ${error.message}`, 'error');
    // Redirect to products page if product not found
    setTimeout(() => {
      window.location.href = 'products.html';
    }, 2000);
  }
};

// Update product UI with data
const updateProductUI = (product) => {
  // Basic Information
  document.getElementById('product-name').textContent = product.name;
  document.getElementById('product-category').textContent = product.category;
  document.getElementById('product-sku').textContent = product.sku;
  document.getElementById('product-description').textContent = product.description || 'No description available';
  
  // Inventory Details
  document.getElementById('product-stock').textContent = `${product.current_stock} ${product.unit}`;
  document.getElementById('product-unit').textContent = product.unit;
  document.getElementById('product-min-stock').textContent = `${product.min_stock_level} ${product.unit}`;
  
  // Pricing
  document.getElementById('product-cost-price').textContent = formatCurrency(product.cost_price);
  document.getElementById('product-selling-price').textContent = formatCurrency(product.selling_price);
  
  // Status
  const statusElement = document.getElementById('product-status');
  statusElement.textContent = product.status;
  statusElement.className = `product-status status-${product.status.toLowerCase()}`;
  
  // Update page title
  document.title = `${product.name} - Food Inventory Management`;
};

// Load product events
const loadProductEvents = async () => {
  try {
    const response = await productAPI.getProductEvents(productId);
    updateEventsUI(response.data);
  } catch (error) {
    showNotification(`Error loading product events: ${error.message}`, 'error');
  }
};

// Update events UI
const updateEventsUI = (events) => {
  const eventsContainer = document.getElementById('product-events');
  eventsContainer.innerHTML = '';
  
  if (events.length === 0) {
    eventsContainer.innerHTML = '<p class="no-events">No recent activity</p>';
    return;
  }
  
  events.forEach(event => {
    const eventElement = document.createElement('div');
    eventElement.className = 'event-item';
    
    const eventDate = new Date(event.timestamp).toLocaleString();
    const eventType = event.event_type.toLowerCase();
    const quantityChange = event.quantity_change > 0 ? 
      `+${event.quantity_change}` : 
      event.quantity_change;
    
    eventElement.innerHTML = `
      <div class="event-header">
        <span class="event-type ${eventType}">${eventType}</span>
        <span class="event-date">${eventDate}</span>
      </div>
      <div class="event-details">
        <p>${event.description}</p>
        <p class="quantity-change">Quantity: ${quantityChange} ${event.unit}</p>
      </div>
    `;
    
    eventsContainer.appendChild(eventElement);
  });
};

// Setup event listeners
const setupEventListeners = () => {
  // Back button
  document.getElementById('back-button').addEventListener('click', () => {
    window.location.href = 'products.html';
  });
  
  // Edit button
  document.getElementById('edit-product').addEventListener('click', () => {
    window.location.href = `edit-product.html?id=${productId}`;
  });
  
  // Delete button
  document.getElementById('delete-product').addEventListener('click', confirmDeleteProduct);
};

// Confirm delete product
const confirmDeleteProduct = () => {
  const productName = document.getElementById('product-name').textContent;
  
  if (confirm(`Are you sure you want to delete ${productName}?`)) {
    deleteProduct();
  }
};

// Delete product
const deleteProduct = async () => {
  try {
    await productAPI.deleteProduct(productId);
    showNotification('Product deleted successfully', 'success');
    // Redirect to products page
    window.location.href = 'products.html';
  } catch (error) {
    showNotification(`Error deleting product: ${error.message}`, 'error');
  }
};

// Setup WebSocket listeners
const setupWebSocketListeners = () => {
  // Join product-specific room for real-time updates
  joinProductRoom(productId);
  
  // Listen for product detail updates
  subscribeToEvent('product-detail-update', (data) => {
    if (data.type === 'delete') {
      // Product was deleted
      showNotification('This product has been deleted', 'warning');
      setTimeout(() => {
        window.location.href = 'products.html';
      }, 2000);
    } else {
      // Product was updated
      loadProductDetails();
    }
  });
  
  // Listen for resource events
  subscribeToEvent('resource-event', (data) => {
    // Refresh events list
    loadProductEvents();
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    leaveProductRoom(productId);
  });
}; 