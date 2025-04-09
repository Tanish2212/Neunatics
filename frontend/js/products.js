// Global variables
let currentPage = 1;
let totalPages = 1;
let products = [];
let searchQuery = '';
let categoryFilter = '';
let statusFilter = '';
let fakeData = null;
let updateInterval;

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Get search query from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    searchQuery = urlParams.get('search') || '';
    
    // Set search input value if query exists
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchQuery) {
        searchInput.value = searchQuery;
    }
    
    // Initial load
    await loadProducts();
    
    // Setup WebSocket connection
    setupWebSocketListeners();
    
    // Setup event listeners
    setupEventListeners();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    });
});

// Load products from API
const loadProducts = async () => {
    try {
        showLoading(true);

        // Get products from API
        let response;
        try {
            response = await productAPI.getAllProducts();
        } catch (error) {
            // If API call fails, try to load from backup data
            console.warn('API call failed, trying to load from backup data');
            
            try {
                // Try to load products from local JSON file in backend folder
                const backupResponse = await fetch('/backend/data/products.json');
                if (!backupResponse.ok) {
                    throw new Error('Backup data source not available');
                }
                const backupData = await backupResponse.json();
                response = { success: true, data: backupData };
            } catch (backupError) {
                console.error('Backup data fetch failed:', backupError);
                // Generate mock data as last resort
                response = { 
                    success: true, 
                    data: generateMockProducts() 
                };
            }
        }
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to load products');
        }
        
        // Filter products based on search query and filters
        let filteredProducts = response.data;
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredProducts = filteredProducts.filter(product => 
                product.name?.toLowerCase().includes(query) ||
                product.category?.toLowerCase().includes(query) ||
                product.sku?.toLowerCase().includes(query)
            );
        }
        
        if (categoryFilter) {
            filteredProducts = filteredProducts.filter(product => 
                product.category === categoryFilter
            );
        }
        
        if (statusFilter) {
            filteredProducts = filteredProducts.filter(product => 
                product.status === statusFilter
            );
        }
        
        products = filteredProducts;
        updateProductsUI();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products: ' + error.message, 'error');
        // In case of an error, show an empty state with the add product button
        products = [];
        updateProductsUI();
    } finally {
        showLoading(false);
    }
};

// Helper function to generate mock products if everything else fails
function generateMockProducts() {
    const categories = ['fruits', 'vegetables', 'dairy', 'meat', 'beverages', 'snacks', 'bakery', 'canned goods', 'frozen foods', 'spices'];
    const statuses = ['active', 'low_stock', 'out_of_stock'];
    const units = ['kg', 'g', 'l', 'ml', 'pcs', 'bottles', 'boxes', 'cans', 'packages'];
    
    const mockProducts = [];
    
    for (let i = 0; i < 30; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const unit = units[Math.floor(Math.random() * units.length)];
        
        const costPrice = parseFloat((Math.random() * 50).toFixed(2));
        const sellingPrice = parseFloat((costPrice * (1 + Math.random() * 0.5)).toFixed(2));
        const currentStock = Math.floor(Math.random() * 100);
        
        // Add sales count for hot selling tracking
        const salesCount = Math.floor(Math.random() * 500);
        
        mockProducts.push({
            id: 'mock-' + (i + 1),
            name: `Sample ${category.charAt(0).toUpperCase() + category.slice(1)} ${i + 1}`,
            sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            category: category,
            current_stock: currentStock,
            min_stock_level: 10,
            unit: unit,
            cost_price: costPrice,
            selling_price: sellingPrice,
            status: status,
            sales_count: salesCount,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return mockProducts;
}

// Update products UI
const updateProductsUI = () => {
    const productsList = document.getElementById('products-list');
    const noProducts = document.getElementById('no-products');
    
    if (!productsList) return;
    
    if (products.length === 0) {
        productsList.style.display = 'none';
        noProducts.style.display = 'block';
        return;
    }
    
    productsList.style.display = 'grid';
    noProducts.style.display = 'none';
    
    productsList.innerHTML = products.map(product => {
        // Determine stock alert level based on the relationship between current stock and min stock level
        let stockAlertHtml = '';
        if (product.status === 'low_stock') {
            // Calculate what percentage of min_stock_level the current stock is
            const stockRatio = product.current_stock / product.min_stock_level;
            
            let alertClass = 'warning'; // Default yellow warning
            
            if (product.current_stock === 0) {
                alertClass = 'critical'; // Red - out of stock
            } else if (stockRatio <= 0.5) {
                alertClass = 'alert'; // Orange - very low stock
            }
            
            stockAlertHtml = `<span class="stock-alert ${alertClass}">Low Stock</span>`;
        }
        
        return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-header">
                <h3>${product.name}</h3>
                <span class="product-status status-${product.status}">${product.status}</span>
            </div>
            <div class="product-details">
                <div class="detail-item">
                    <label>Category:</label>
                    <span>${product.category}</span>
                </div>
                <div class="detail-item">
                    <label>SKU:</label>
                    <span>${product.sku}</span>
                </div>
                <div class="detail-item">
                    <label>Stock:</label>
                    <span>${product.current_stock} ${product.unit} ${stockAlertHtml}</span>
                </div>
                <div class="detail-item">
                    <label>Price:</label>
                    <span>$${product.selling_price}</span>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn btn-text view-product" title="View Details">
                    <span class="material-icons">visibility</span>
                </button>
                <button class="btn btn-text edit-product" title="Edit">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-text delete-product" title="Delete">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        </div>
    `;
    }).join('');
};

// Setup WebSocket listeners
const setupWebSocketListeners = () => {
    subscribeToEvent('product-update', (data) => {
        if (data.type === 'create') {
            products.push(data.data);
        } else if (data.type === 'update') {
            const index = products.findIndex(p => p.id === data.data.id);
            if (index !== -1) {
                products[index] = data.data;
            }
        } else if (data.type === 'delete') {
            products = products.filter(p => p.id !== data.data.id);
        }
        updateProductsUI();
    });
};

// Setup event listeners
const setupEventListeners = () => {
    // Add product button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            // Navigate to the add product page
            window.location.href = 'add-product.html';
        });
    }

    // Add first product button (for empty state)
    const addFirstProductBtn = document.getElementById('add-first-product');
    if (addFirstProductBtn) {
        addFirstProductBtn.addEventListener('click', () => {
            // Navigate to the add product page
            window.location.href = 'add-product.html';
        });
    }
    
    // Search input with debounce
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let debounceTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                searchQuery = e.target.value.trim();
                loadProducts();
            }, 300); // 300ms delay for better performance
        });
    }
    
    // Category filter
    const categoryFilterSelect = document.getElementById('category-filter');
    if (categoryFilterSelect) {
        categoryFilterSelect.addEventListener('change', (e) => {
            categoryFilter = e.target.value;
            loadProducts();
        });
    }
    
    // Status filter
    const statusFilterSelect = document.getElementById('status-filter');
    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', (e) => {
            statusFilter = e.target.value;
            loadProducts();
        });
    }
    
    // Product card actions with event delegation
    const productsList = document.getElementById('products-list');
    if (productsList) {
        productsList.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;
            
            const productId = card.getAttribute('data-id');
            
            // Handle view product
            if (e.target.closest('.view-product')) {
                window.location.href = `product-detail.html?id=${productId}`;
            } 
            // Handle edit product
            else if (e.target.closest('.edit-product')) {
                window.location.href = `add-product.html?id=${productId}&mode=edit`;
            } 
            // Handle delete product
            else if (e.target.closest('.delete-product')) {
                confirmDeleteProduct(productId);
            }
        });
    }
    
    // Delete modal buttons
    const closeModalBtn = document.getElementById('close-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    
    // Close modal handlers
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('delete-modal').classList.remove('active');
        });
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            document.getElementById('delete-modal').classList.remove('active');
        });
    }
    
    // Confirm delete handler
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            const productId = confirmDeleteBtn.getAttribute('data-product-id');
            if (productId) {
                await deleteProduct(productId);
                document.getElementById('delete-modal').classList.remove('active');
            }
        });
    }
};

// Show loading indicator
const showLoading = (show) => {
    const loadingIndicator = document.getElementById('loading-indicator');
    const productsList = document.getElementById('products-list');
    
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }
    
    if (productsList) {
        productsList.style.display = show ? 'none' : 'grid';
    }
};

// Show notification
const showNotification = (message, type = 'info') => {
    // Implementation depends on your notification system
    console.log(`${type}: ${message}`);
};

// Confirm delete product
const confirmDeleteProduct = (productId) => {
    const modal = document.getElementById('delete-modal');
    const confirmBtn = document.getElementById('confirm-delete');
    
    if (modal && confirmBtn) {
        confirmBtn.dataset.productId = productId;
        modal.classList.add('active');
    }
};

// Delete product
const deleteProduct = async (productId) => {
    try {
        showLoading(true);
        
        // First get the product details before deleting it
        const productDetails = products.find(p => p.id === productId);
        console.log('Deleting product:', productDetails);
        
        // Create a user activity event for the deletion BEFORE actually deleting
        // This ensures we have product data to use
        try {
            console.log('Creating deletion event for product:', productDetails?.name);
            const eventData = {
                action: 'delete',
                resource_type: 'product',
                resource_id: productId,
                product_id: productId,
                product_name: productDetails?.name || 'Unknown Product',
                description: `Product "${productDetails?.name || 'Unknown'}" was deleted from the system`,
                initiated_by: 'user',
                timestamp: new Date().toISOString()
            };
            
            const eventResponse = await eventAPI.createEvent(eventData);
            console.log('Deletion event created successfully:', eventResponse);
        } catch (eventError) {
            console.error('Error creating delete event:', eventError);
        }
        
        // Now actually delete the product
        const response = await productAPI.deleteProduct(productId);
        if (!response.success) {
            throw new Error(response.message || 'Failed to delete product');
        }
        
        showNotification('Product deleted successfully', 'success');
        
        // Emit a websocket event for the deletion
        if (window.socket) {
            window.socket.emit('product-delete', { 
                id: productId, 
                product: productDetails 
            });
        }
        
        // Reload the products list
        await loadProducts();
        
    } catch (error) {
        showNotification('Error deleting product: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
};

// Navigate to specific page
const navigateToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadProducts();
};

// Add form submit event listener
const productForm = document.getElementById('product-form');
if (productForm) {
    productForm.addEventListener('submit', handleProductFormSubmit);
}

// Handle form submission
const handleProductFormSubmit = async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode;
    const productId = form.dataset.productId;
    
    try {
        showLoading(true);
        
        const formData = new FormData(form);
        const productData = Object.fromEntries(formData.entries());
        
        const url = mode === 'add' ? '/api/products' : `/api/products/${productId}`;
        const method = mode === 'add' ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to ${mode} product`);
        }
        
        showNotification(`Product ${mode === 'add' ? 'added' : 'updated'} successfully`, 'success');
        
        // Close modal and refresh list
        const modal = bootstrap.Modal.getInstance(document.getElementById('product-modal'));
        modal.hide();
        loadProducts();
        
    } catch (error) {
        showNotification(`Error ${mode === 'add' ? 'adding' : 'updating'} product: ` + error.message, 'error');
    } finally {
        showLoading(false);
    }
};

// Open add product modal
const openAddProductModal = () => {
    // Clear form
    const form = document.getElementById('product-form');
    if (form) {
        form.reset();
        form.dataset.mode = 'add';
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('product-modal'));
    modal.show();
};

// Open edit product modal
const openEditProductModal = async (productId) => {
    try {
        showLoading(true);
        
        // Fetch product details
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch product details');
        }
        
        const product = await response.json();
        
        // Fill form with product data
        const form = document.getElementById('product-form');
        if (form) {
            form.dataset.mode = 'edit';
            form.dataset.productId = productId;
            
            // Fill form fields
            form.elements['name'].value = product.name;
            form.elements['category'].value = product.category;
            form.elements['quantity'].value = product.quantity;
            form.elements['price'].value = product.price;
            form.elements['status'].value = product.status;
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('product-modal'));
        modal.show();
        
    } catch (error) {
        showNotification('Error loading product details: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
};

// Update pagination UI
const updatePaginationUI = () => {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
    }
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
}; 