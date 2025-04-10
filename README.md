# Food Inventory Management System

A comprehensive real-time web application for managing food inventory, designed to help businesses efficiently track products, monitor stock levels, and analyze inventory data with dynamic visualizations.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/Python-3.8+-brightgreen)
![Flask](https://img.shields.io/badge/Flask-2.x-red)

## 🌟 Features

- **Real-time Dashboard**
  - Live updates using WebSockets
  - Visual charts and analytics
  - Key metrics and performance indicators

- **Comprehensive Product Management**
  - Add, edit, and delete products
  - Customizable categories and units
  - Cost and selling price tracking
  - Support for setting selling prices below cost price

- **Stock Control**
  - Automated inventory level monitoring
  - Low stock and out-of-stock alerts
  - Minimum stock level settings
  - Real-time notifications

- **Advanced Analytics**
  - Category distribution analysis
  - Stock level visualizations
  - Profit margin calculations
  - Inventory value tracking

- **User Experience**
  - Intuitive, responsive design
  - Search and filtering capabilities
  - Activity history and audit log
  - Mobile-friendly interface

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection for initial dependency installation

### Quick Start Method

The application is designed to run with minimal setup. Simply:

```bash
# Navigate to the backend directory
cd Neunatics/backend

# Run the application
python app.py
```

This single command will:
1. Check and install all required dependencies
2. Generate sample data if none exists
3. Start the server with WebSocket support
4. Serve the frontend automatically

Then access the application at: **http://localhost:5000**

### Alternative Startup Methods

For convenience, the following alternative methods are available:

- **Windows users**:
  ```
  run.bat
  ```

- **Linux/Mac users**:
  ```
  ./run.sh
  ```

- **Setup and configuration**:
  ```
  python setup.py
  ```

## 📋 Data Structure

Products in the system follow this structure:

```json
{
  "id": "8", 
  "name": "Company Meat",
  "sku": "SKU-dY3234",
  "category": "meat",
  "description": "Product description here",
  "current_stock": 1.0,
  "min_stock_level": 13,
  "unit": "bottles",
  "cost_price": 5.45,
  "selling_price": 6.65,
  "status": "low_stock",
  "sales_count": 328,
  "created_at": "2025-03-15T02:41:21.605350"
}
```

## 🏗️ Project Structure

```
Neunatics/
├── frontend/                # Frontend static files
│   ├── index.html           # Main entry point
│   ├── css/                 # Styling
│   ├── js/                  # JavaScript files
│   │   ├── analytics.js     # Charts and analytics
│   │   ├── products.js      # Product management
│   │   └── websocket.js     # Real-time connections
│   └── pages/               # Application pages
├── backend/                 # Server-side code
│   ├── app.py               # Main application (Flask)
│   ├── requirements.txt     # Backend dependencies
│   └── data/                # Data storage
│       └── products.json    # Product database
├── run.bat                  # Windows startup script
├── run.sh                   # Linux/Mac startup script
├── setup.py                 # Setup utility
└── data_generator.py        # Sample data generation
```

## 🛠️ Development

To extend or modify the application:

### Frontend Changes

The frontend uses vanilla JavaScript with Chart.js for visualizations:

- Modify HTML in the `frontend/` and `frontend/pages/` directories
- Update styles in `frontend/css/`
- JavaScript logic is in `frontend/js/`
- Chart configurations are in `analytics.js`

### Backend Changes

The application uses Flask with SocketIO for real-time communication:

- Main server code is in `backend/app.py`
- API endpoints are RESTful and well-documented in the code
- WebSocket events for real-time updates

### Data Model Changes

- Product structure can be modified in `data_generator.py`
- Make sure to update corresponding frontend rendering logic

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| **Server won't start** | Check if port 5000 is already in use. Try `lsof -i:5000` (Unix) or check Task Manager (Windows) |
| **Missing dependencies** | Run `pip install -r requirements.txt` manually |
| **No products shown** | Delete `backend/data/products.json` and restart to regenerate sample data |
| **WebSocket connection fails** | Check browser console for errors. Ensure no firewall is blocking WebSocket connections |
| **Charts not rendering** | Verify Chart.js is loading correctly in browser console |

## 📝 License

MIT License

## 🙏 Acknowledgements

- Chart.js for data visualization
- Socket.IO for real-time communication
- Flask for the backend framework 