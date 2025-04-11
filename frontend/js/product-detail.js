// Product detail page functionality
let productId = null;
let productData = null;

document.addEventListener('DOMContentLoaded', () => {
  // Get product ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  productId = urlParams.get('id');
  
  if (!productId) {
    // Redirect to products page if no ID specified
    window.location.href = 'products.html';
    return;
  }
  
  // Load product details
  loadProductDetails();
  
  // Setup event listeners
  setupEventListeners();
});

// Load product details
const loadProductDetails = async () => {
  try {
    // Show loading state
    document.getElementById('product-name').textContent = 'Loading...';
    
    // Fetch product details from API
    const response = await productAPI.getProductById(productId);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to load product details');
    }
    
    productData = response.data;
    
    // Update UI with product details
    updateProductUI(productData);
    
  } catch (error) {
    console.error('Error loading product details:', error);
    showNotification(`Error loading product: ${error.message}`, 'error');
    // Redirect to products page if product not found after a delay
    setTimeout(() => {
      window.location.href = 'products.html';
    }, 2000);
  }
};

// Update product UI with data
const updateProductUI = (product) => {
  if (!product) return;
  
  // Basic Information
  document.getElementById('product-name').textContent = product.name || 'Unknown Product';
  document.getElementById('product-category').textContent = product.category || 'Uncategorized';
  document.getElementById('product-sku').textContent = product.sku || 'N/A';
  document.getElementById('product-description').textContent = product.description || 'No description available';
  
  // Inventory Details
  const stockElement = document.getElementById('product-stock');
  stockElement.textContent = `${product.current_stock} ${product.unit}`;
  
  // Add stock alert indicator if low stock
  if (product.status === 'low_stock') {
    // Calculate what percentage of min_stock_level the current stock is
    const stockRatio = product.current_stock / product.min_stock_level;
    
    let alertClass = 'warning'; // Default yellow warning
    
    if (product.current_stock === 0) {
      alertClass = 'critical'; // Red - out of stock
    } else if (stockRatio <= 0.5) {
      alertClass = 'alert'; // Orange - very low stock
    }
    
    const stockAlertSpan = document.createElement('span');
    stockAlertSpan.className = `stock-alert ${alertClass}`;
    stockAlertSpan.textContent = 'Low Stock';
    stockElement.appendChild(stockAlertSpan);
  }
  
  document.getElementById('product-unit').textContent = product.unit || 'N/A';
  document.getElementById('product-min-stock').textContent = `${product.min_stock_level} ${product.unit}`;
  
  // Pricing
  document.getElementById('product-cost-price').textContent = formatCurrency(product.cost_price);
  document.getElementById('product-selling-price').textContent = formatCurrency(product.selling_price);
  
  // Status with appropriate class
  const statusElement = document.getElementById('product-status');
  statusElement.textContent = product.status || 'Unknown';
  statusElement.className = `product-status status-${(product.status || '').toLowerCase()}`;
  
  // Update page title
  document.title = `${product.name} - Food Inventory Management`;
};

// Setup event listeners
const setupEventListeners = () => {
  // Back button should navigate to products page
  document.getElementById('back-button').addEventListener('click', () => {
    window.location.href = 'products.html';
  });
  
  // Edit button logic
  document.getElementById('edit-product').addEventListener('click', () => {
    if (!productData) return;
    window.location.href = `add-product.html?id=${productId}&mode=edit`;
  });

  // Delete button logic
  document.getElementById('delete-product').addEventListener('click', confirmDeleteProduct);
};

// Confirm delete product
const confirmDeleteProduct = () => {
  const productName = document.getElementById('product-name').textContent;
  
  if (confirm(`Are you sure you want to delete ${productName}?`)) {
    deleteProduct();
  }
}

// Delete product
const deleteProduct = async (id) => {
  try {
    const response = await productAPI.deleteProduct(productId);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete product');
    }
    
    // Create a delete event
    try {
      await eventAPI.createEvent({
        action: 'delete',
        resource_type: 'product',
        resource_id: productId,
        product_id: productId,
        product_name: productData.name,
        description: `Product "${productData.name}" was deleted from the system`
      });
    } catch (eventError) {
      console.error('Error creating delete event:', eventError);
    }
    
    showNotification('Product deleted successfully', 'success');
    
    // Redirect to products page after a short delay
    setTimeout(() => {
      window.location.href = 'products.html';
    }, 1500);
  } catch (error) {
    console.error('Error deleting product:', error);
    showNotification(`Error deleting product: ${error.message}`, 'error');
  }
};

// Format currency
const formatCurrency = (amount) => {
  // Ensure amount is a valid number
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return '$0.00';
  }
  return '$' + numAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

// Format event type
const formatEventType = (type) => {
  if (!type) return 'Updated';
  
  switch (type.toLowerCase()) {
    case 'create':
      return 'Added';
    case 'update':
      return 'Updated';
    case 'delete':
      return 'Deleted';
    case 'stock_increase':
      return 'Stock Added';
    case 'stock_decrease':
      return 'Stock Removed';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}; 