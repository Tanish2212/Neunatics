document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-product-form');
    const backButton = document.getElementById('back-button');
    const cancelButton = document.getElementById('cancel-button');

    // Generate a random SKU when the page loads
    generateSKU();

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const formData = new FormData(form);
            const productData = Object.fromEntries(formData.entries());
            
            // Convert numeric fields
            productData.current_stock = parseFloat(productData.current_stock);
            productData.min_stock_level = parseFloat(productData.min_stock_level);
            productData.cost_price = parseFloat(productData.cost_price);
            productData.selling_price = parseFloat(productData.selling_price);
            
            // Add status based on stock level
            productData.status = productData.current_stock <= productData.min_stock_level ? 
                'low_stock' : 'active';
            
            // Add timestamp
            productData.created_at = new Date().toISOString();
            
            // Submit the product
            const response = await productAPI.createProduct(productData);
            
            if (response.success) {
                showNotification('Product added successfully!', 'success');
                // Redirect to product detail page
                window.location.href = `product-detail.html?id=${response.data.id}`;
            } else {
                throw new Error(response.message || 'Failed to add product');
            }
        } catch (error) {
            showNotification(`Error: ${error.message}`, 'error');
        }
    });

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

    // Validate selling price is higher than cost price
    document.getElementById('product-selling-price').addEventListener('change', function() {
        const costPrice = parseFloat(document.getElementById('product-cost-price').value);
        const sellingPrice = parseFloat(this.value);
        
        if (sellingPrice < costPrice) {
            showNotification('Selling price should be higher than cost price', 'warning');
            this.value = costPrice;
        }
    });

    // Validate minimum stock level
    document.getElementById('product-min-stock').addEventListener('change', function() {
        const currentStock = parseFloat(document.getElementById('product-stock').value);
        const minStock = parseFloat(this.value);
        
        if (minStock > currentStock) {
            showNotification('Minimum stock level cannot be higher than current stock', 'warning');
            this.value = currentStock;
        }
    });
}); 