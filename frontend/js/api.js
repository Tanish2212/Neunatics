// API service for communicating with the backend

// API configuration
const API_BASE_URL = '/api';

// Socket.IO connection
let socket = null;

// Generic fetch function with error handling
const fetchWithErrorHandling = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }
        
        return data;
    } catch (error) {
        console.error(`API Error: ${error.message}`);
        throw error;
    }
};

// API utility functions
const api = {
    get: async (endpoint) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    },
    
    post: async (endpoint, data) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    },
    
    put: async (endpoint, data) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    },
    
    delete: async (endpoint) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }
};

// Product API
const productAPI = {
    getAllProducts: () => api.get('/products'),
    getProductById: (id) => api.get(`/products/${id}`),
    createProduct: (data) => api.post('/products', data),
    updateProduct: (id, data) => api.put(`/products/${id}`, data),
    deleteProduct: (id) => api.delete(`/products/${id}`),
    getProductEvents: (id) => api.get(`/products/${id}/events`),
    updateStock: (id, quantity) => api.put(`/products/${id}/stock`, { quantity }),
    getLowStockProducts: () => api.get('/products/low-stock'),
    getProductStats: () => api.get('/products/stats')
};

// Dashboard API
const dashboardAPI = {
    getSummary: () => api.get('/dashboard/summary'),
    getRecentActivity: () => api.get('/dashboard/activity'),
    getLowStockAlerts: () => api.get('/dashboard/alerts'),
    getSalesTrends: () => api.get('/dashboard/trends')
};

// Event API
const eventAPI = {
    getEvents: () => api.get('/events'),
    createEvent: (data) => api.post('/events', data)
};

// Connect to Socket.IO server
const connectWebSocket = () => {
    if (socket) return socket;
    
    socket = io();
    
    socket.on('connect', () => {
        console.log('Socket.IO connected');
    });
    
    socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        socket = null;
    });
    
    socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
    });
    
    return socket;
};

// Subscribe to events
const subscribeToEvent = (event, callback) => {
    if (!socket) {
        connectWebSocket();
    }
    
    socket.on(event, (data) => {
        callback(data);
    });
};

// Unsubscribe from events
const unsubscribeFromEvent = (event) => {
    if (socket) {
        socket.off(event);
    }
};

// Join product-specific room
const joinProductRoom = (productId) => {
    if (!socket) {
        connectWebSocket();
    }
    socket.emit('join', `product-${productId}`);
};

// Leave product-specific room
const leaveProductRoom = (productId) => {
    if (socket) {
        socket.emit('leave', `product-${productId}`);
    }
};

// Export API objects
window.productAPI = productAPI;
window.dashboardAPI = dashboardAPI;
window.eventAPI = eventAPI;
window.subscribeToEvent = subscribeToEvent;
window.unsubscribeFromEvent = unsubscribeFromEvent;
window.joinProductRoom = joinProductRoom;
window.leaveProductRoom = leaveProductRoom;

// Export WebSocket functions
window.connectWebSocket = connectWebSocket;
window.subscribeToEvent = subscribeToEvent;
window.unsubscribeFromEvent = unsubscribeFromEvent;
window.joinProductRoom = joinProductRoom;
window.leaveProductRoom = leaveProductRoom;

// Fetch data from Open Food Facts API
const fetchFoodData = async (barcode) => {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status !== 1) {
      throw new Error('Product not found');
    }
    
    // Map Open Food Facts data to our product model
    const product = data.product;
    
    return {
      name: product.product_name,
      brand: product.brands,
      category: product.categories ? product.categories.split(',')[0].trim() : 'Other',
      nutritionalInfo: {
        calories: parseFloat(product.nutriments.energy_value) || 0,
        protein: parseFloat(product.nutriments.proteins) || 0,
        carbs: parseFloat(product.nutriments.carbohydrates) || 0,
        fat: parseFloat(product.nutriments.fat) || 0
      }
    };
  } catch (error) {
    console.error(`Error fetching food data: ${error.message}`);
    throw error;
  }
};