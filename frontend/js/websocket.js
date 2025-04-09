// WebSocket connection handling
let socket;
let eventHandlers = {};
let reconnectTimer;
let isConnected = false;

// Initialize WebSocket connection
const initWebSocket = () => {
  // Connect to the backend WebSocket server
  const serverUrl = 'http://localhost:5000'; // Change in production
  socket = io(serverUrl);
  
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

// Real-time notifications handling
let notifications = [];
let unreadCount = 0;

// Add new notification
const addNotification = (notification) => {
  notifications.unshift(notification);
  unreadCount++;
  
  // Limit to the most recent 50 notifications
  if (notifications.length > 50) {
    notifications.pop();
  }
  
  // Update notification UI
  updateNotificationUI();
};

// Update notification UI
const updateNotificationUI = () => {
  const notificationsEl = document.getElementById('notifications');
  const unreadCountEl = document.getElementById('unread-count');
  
  if (notificationsEl) {
    if (notifications.length === 0) {
      notificationsEl.innerHTML = '<li class="notification-item">No recent updates</li>';
    } else {
      notificationsEl.innerHTML = notifications.map(notif => `
        <li class="notification-item ${notif.read ? '' : 'unread'}">
          <span class="notification-time">${formatTime(notif.time)}</span>
          <p>${notif.message}</p>
        </li>
      `).join('');
    }
  }
  
  if (unreadCountEl) {
    unreadCountEl.textContent = unreadCount;
    unreadCountEl.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }
};

// Format time
const formatTime = (time) => {
  const date = new Date(time);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Mark all notifications as read
const clearNotifications = () => {
  notifications.forEach(notif => notif.read = true);
  unreadCount = 0;
  updateNotificationUI();
};

// Toggle notifications panel
const toggleNotificationsPanel = () => {
  const panel = document.getElementById('real-time-panel');
  const content = document.getElementById('notifications-content');
  const toggleIcon = document.getElementById('toggle-panel');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    toggleIcon.textContent = 'expand_less';
  } else {
    content.style.display = 'none';
    toggleIcon.textContent = 'expand_more';
  }
};

// Setup notification panel event listeners
document.addEventListener('DOMContentLoaded', () => {
  const clearBtn = document.getElementById('clear-notifications');
  const toggleBtn = document.getElementById('toggle-panel');
  
  if (clearBtn) {
    clearBtn.addEventListener('click', clearNotifications);
  }
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleNotificationsPanel);
  }
  
  // Listen for product updates
  subscribeToEvent('product-update', (data) => {
    let message = '';
    
    switch (data.type) {
      case 'insert':
        message = `New product added: ${data.data.name}`;
        break;
      case 'update':
        message = `Product updated: ${data.data.name}`;
        break;
      case 'delete':
        message = `Product deleted: ID ${data.id}`;
        break;
    }
    
    addNotification({
      type: 'product',
      message,
      time: new Date(),
      read: false,
      data
    });
  });
  
  // Listen for new events
  subscribeToEvent('new-event', (data) => {
    let message = '';
    
    switch (data.type) {
      case 'create':
        message = `New ${data.resourceType} created`;
        break;
      case 'update':
        message = `${data.resourceType} updated`;
        break;
      case 'delete':
        message = `${data.resourceType} deleted`;
        break;
    }
    
    addNotification({
      type: 'event',
      message,
      time: new Date(),
      read: false,
      data
    });
  });
});