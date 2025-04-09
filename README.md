# Food Inventory Management System

A web-based inventory management system for food products with real-time updates.

## Features

- Dashboard with key metrics and real-time activity updates
- Product management (add, edit, delete products)
- Stock level monitoring with low stock alerts
- Real-time updates using WebSockets
- Responsive UI that works on all devices

## Requirements

- Python 3.6 or higher
- Flask
- Flask-SocketIO
- Flask-CORS

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/food-inventory-management.git
cd food-inventory-management
```

2. Install the required dependencies:
```
pip install flask flask-socketio flask-cors
```

## Running the Application

To start the application, simply run:

```
python app.py
```

Then open your browser and navigate to:
```
http://localhost:5000
```

## Project Structure

- `app.py` - Main application entry point
- `backend/` - Backend Flask server code
  - `app.py` - API endpoints and WebSocket handlers
  - `data/` - Data storage
- `frontend/` - Frontend web application
  - `index.html` - Main dashboard page
  - `js/` - JavaScript files
  - `css/` - CSS stylesheets
  - `pages/` - HTML pages
  - `assets/` - Images and other assets 