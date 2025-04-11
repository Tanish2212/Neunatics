// WebSocket connection handling
// Don't redeclare socket if it exists from api.js
let eventHandlers = {};
let reconnectTimer;
let isConnected = false;

// Initialize WebSocket connection
const initWebSocket = () => {
  // Use the existing socket if already connected from api.js
  if (window.socket) {
    socket = window.socket;
    isConnected = socket.connected;
  } else {
    // Connect to the backend WebSocket server
    const serverUrl = 'http://localhost:5000'; // Change in production
    socket = io(serverUrl);
    window.socket = socket;
  }
  
  // Connection event handlers
  socket.on('connect', () => {
    console.log('WebSocket connected');
    isConnected = true;
    
    // Clear any reconnect timers
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    // Dispatch connection event
    dispatchEvent('connection', { connected: true });
    
    // Re-subscribe to events if needed
    if (eventHandlers['product-update'] || eventHandlers['new-event']) {
      socket.emit('subscribe-events', { 
        products: !!eventHandlers['product-update'],
        events: !!eventHandlers['new-event']
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
    isConnected = false;
    
    // Dispatch disconnection event
    dispatchEvent('connection', { connected: false });
    
    // Try to reconnect
    reconnect();
  });
  
  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
    isConnected = false;
    
    // Try to reconnect
    reconnect();
  });
  
  // Event listeners
  socket.on('product-update', (data) => {
    dispatchEvent('product-update', data);
  });
  
  socket.on('product-detail-update', (data) => {
    dispatchEvent('product-detail-update', data);
  });
  
  socket.on('new-event', (data) => {
    dispatchEvent('new-event', data);
  });
  
  socket.on('resource-event', (data) => {
    dispatchEvent('resource-event', data);
  });
  
  // Handle custom product events
  socket.on('product-create', (data) => {
    console.log('WebSocket: Received product-create event', data);
    dispatchEvent('product-update', {
      type: 'create',
      data: data.data || data
    });
    dispatchEvent('new-event', {
      type: 'create',
      resourceType: 'product',
      data: data.data || data
    });
  });
  
  socket.on('product-delete', (data) => {
    console.log('WebSocket: Received product-delete event', data);
    dispatchEvent('product-update', {
      type: 'delete',
      id: data.id,
      data: data.product || data
    });
    dispatchEvent('new-event', {
      type: 'delete',
      resourceType: 'product',
      data: data.product || data
    });
  });
};

// Reconnect to the WebSocket server
const reconnect = () => {
  if (reconnectTimer) return;
  
  reconnectTimer = setTimeout(() => {
    console.log('Attempting to reconnect...');
    if (socket) {
      socket.connect();
    } else {
      initWebSocket();
    }
    reconnectTimer = null;
  }, 3000);
};

// Subscribe to WebSocket events
const subscribeToEvent = (eventName, callback) => {
  if (!eventHandlers[eventName]) {
    eventHandlers[eventName] = [];
  }
  eventHandlers[eventName].push(callback);
  
  return () => {
    // Return an unsubscribe function
    eventHandlers[eventName] = eventHandlers[eventName].filter(cb => cb !== callback);
  };
};

// Join a product detail room
const joinProductRoom = (productId) => {
  if (socket && isConnected) {
    socket.emit('join-product-room', productId);
  }
};

// Leave a product detail room
const leaveProductRoom = (productId) => {
  if (socket && isConnected) {
    socket.emit('leave-product-room', productId);
  }
};

// Dispatch event to all registered handlers
const dispatchEvent = (eventName, data) => {
  if (eventHandlers[eventName]) {
    eventHandlers[eventName].forEach(callback => callback(data));
  }
};

// Check connection status
const isSocketConnected = () => isConnected;

// Initialize connection when script is loaded
document.addEventListener('DOMContentLoaded', initWebSocket);