document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-product-form');
    const backButton = document.getElementById('back-button');
    const cancelButton = document.getElementById('cancel-button');
    const productIdParam = new URLSearchParams(window.location.search).get('id');
    const isEditMode = new URLSearchParams(window.location.search).get('mode') === 'edit';
    
    // Populate the category dropdown with all available categories
    populateCategoryDropdown();
    
    // If in edit mode, load existing product data
    if (isEditMode && productIdParam) {
        loadProductData(productIdParam);
        document.querySelector('.page-header h1').textContent = 'Edit Product';
    } else {
        // Generate a random SKU for new products
        generateSKU();
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        try {
            const formData = new FormData(form);
            const productData = Object.fromEntries(formData.entries());
            
            // Convert numeric fields
            productData.current_stock = parseFloat(productData.current_stock) || 0;
            productData.min_stock_level = parseFloat(productData.min_stock_level) || 0;
            productData.cost_price = parseFloat(productData.cost_price) || 0;
            productData.selling_price = parseFloat(productData.selling_price) || 0;
            
            // Add status based on stock level
            productData.status = productData.current_stock <= productData.min_stock_level ? 
                'low_stock' : productData.current_stock === 0 ? 'inactive' : 'active';
            
            // Add timestamp
            if (!isEditMode) {
                productData.created_at = new Date().toISOString();
            }
            
            let response;
            
            // Update existing product or create new one
            if (isEditMode && productIdParam) {
                response = await productAPI.updateProduct(productIdParam, productData);
                if (response.success) {
                    // Create update event
                    try {
                        console.log('Creating update event for product:', productData.name);
                        const eventResponse = await eventAPI.createEvent({
                            action: 'update',
                            resource_type: 'product',
                            resource_id: productIdParam,
                            product_id: productIdParam,
                            product_name: productData.name,
                            description: `Product "${productData.name}" was updated`,
                            initiated_by: 'user',
                            timestamp: new Date().toISOString()
                        });
                        console.log('Update event created successfully:', eventResponse);
                        
                        // Emit socket event for update
                        if (window.socket) {
                            window.socket.emit('product-update', {
                                type: 'update',
                                data: response.data
                            });
                        }
                    } catch (eventError) {
                        console.error('Error creating update event:', eventError);
                    }
                    
                    showNotification('Product updated successfully!', 'success');
                }
            } else {
                response = await productAPI.createProduct(productData);
                if (response.success) {
                    // Create event for new product creation
                    try {
                        console.log('Creating event for new product:', productData.name);
                        const eventResponse = await eventAPI.createEvent({
                            action: 'create',
                            resource_type: 'product',
                            resource_id: response.data?.id,
                            product_id: response.data?.id,
                            product_name: productData.name,
                            description: `New product "${productData.name}" was added`,
                            initiated_by: 'user',
                            timestamp: new Date().toISOString()
                        });
                        console.log('Creation event created successfully:', eventResponse);
                        
                        // Emit socket event for creation
                        if (window.socket) {
                            window.socket.emit('product-create', {
                                type: 'create',
                                data: response.data
                            });
                        }
                    } catch (eventError) {
                        console.error('Error creating product event:', eventError);
                    }
                    
                    showNotification('Product added successfully!', 'success');
                }
            }
            
            if (response.success) {
                // Redirect to product detail page or back to products list
                if (response.data?.id) {
                    window.location.href = `product-detail.html?id=${response.data.id}`;
                } else {
                    window.location.href = 'products.html';
                }
            } else {
                throw new Error(response.message || 'Failed to save product');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification(`Error: ${error.message || 'Unknown error occurred'}`, 'error');
        }
    });

    // Form validation
    function validateForm() {
        let isValid = true;
        
        // Reset previous validation errors
        document.querySelectorAll('.validation-error').forEach(el => el.remove());
        
        // Validate required fields
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                showFieldError(field, 'This field is required');
                isValid = false;
            }
        });
        
        // Validate numeric fields are positive
        const numericFields = ['product-stock', 'product-min-stock', 'product-cost-price', 'product-selling-price'];
        numericFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && parseFloat(field.value) < 0) {
                showFieldError(field, 'Value must be positive');
                isValid = false;
            }
        });
        
        // Validate selling price is higher than cost price
        const costPrice = parseFloat(document.getElementById('product-cost-price').value) || 0;
        const sellingPrice = parseFloat(document.getElementById('product-selling-price').value) || 0;
        if (sellingPrice < costPrice) {
            showFieldError(document.getElementById('product-selling-price'), 'Selling price should be higher than cost price');
            isValid = false;
        }
        
        return isValid;
    }
    
    // Show validation error for a field
    function showFieldError(field, message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-error';
        errorElement.textContent = message;
        errorElement.style.color = 'red';
        errorElement.style.fontSize = '0.8rem';
        errorElement.style.marginTop = '4px';
        field.parentNode.appendChild(errorElement);
        field.style.borderColor = 'red';
    }

    // Load existing product data for editing
    async function loadProductData(productId) {
        try {
            const response = await productAPI.getProductById(productId);
            
            if (!response.success) {
                throw new Error('Failed to load product data');
            }
            
            const product = response.data;
            
            // Fill form fields with product data
            document.getElementById('product-name').value = product.name || '';
            document.getElementById('product-category').value = product.category || '';
            document.getElementById('product-sku').value = product.sku || '';
            document.getElementById('product-unit').value = product.unit || '';
            document.getElementById('product-stock').value = product.current_stock || 0;
            document.getElementById('product-min-stock').value = product.min_stock_level || 0;
            document.getElementById('product-cost-price').value = product.cost_price || 0;
            document.getElementById('product-selling-price').value = product.selling_price || 0;
            document.getElementById('product-description').value = product.description || '';
            
        } catch (error) {
            console.error('Error loading product data:', error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // Handle back and cancel buttons
    backButton.addEventListener('click', () => {
        window.location.href = 'products.html';
    });

    cancelButton.addEventListener('click', () => {
        window.location.href = 'products.html';
    });

    // Auto-generate SKU
    function generateSKU() {
        const prefix = 'PRD';
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const timestamp = Date.now().toString().slice(-4);
        document.getElementById('product-sku').value = `${prefix}-${randomNum}-${timestamp}`;
    }

    // Show notification
    function showNotification(message, type) {
        // Use global notification function if available
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback notification
        alert(message);
    }

    // Function to populate category dropdown with all available categories from products
    async function populateCategoryDropdown() {
        const categorySelect = document.getElementById('product-category');
        if (!categorySelect) return;
        
        // Keep the first "Select Category" option
        const defaultOption = categorySelect.options[0];
        
        try {
            // Get all available categories from products
            const response = await productAPI.getAllProducts();
            
            if (response.success && Array.isArray(response.data)) {
                // Extract unique categories
                const categories = [...new Set(response.data.map(p => p.category).filter(Boolean))];
                
                // Sort categories alphabetically
                categories.sort();
                
                // Clear existing options except the first one
                categorySelect.innerHTML = '';
                categorySelect.appendChild(defaultOption);
                
                // Add category options
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                    categorySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error fetching categories for dropdown:', error);
        }
    }
}); 