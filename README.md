# Food Inventory Management System

A comprehensive web-based system for managing food inventory, designed to help businesses track products, monitor stock levels, and analyze inventory data.

## Features

- Product management (add, edit, delete)
- Stock level tracking with alerts for low stock
- Dashboard with real-time updates
- Search and filtering capabilities
- Activity history and reporting
- Mobile-responsive design

## Quick Start (Simplest Method)

The application has been updated to handle all setup automatically. Simply navigate to the backend directory and run the app:

```bash
cd backend
python app.py
```

This will:
1. Check and install all required dependencies
2. Generate sample data if none exists
3. Start the server

## Alternative Methods

You can also use the provided scripts:
- Windows: `run.bat`
- Linux/Mac: `./run.sh`

Or use the setup script:
```bash
python setup.py
```

## Manual Setup (If Needed)

If you prefer to set up manually:

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Generate Sample Data

```bash
python data_generator.py
```

### 3. Run the Application

```bash
cd backend
python app.py
```

Access the application at: http://localhost:5000

## System Requirements

- Python 3.8 or higher
- Modern web browser (Chrome, Firefox, Edge, etc.)

## Project Structure

- `/frontend` - UI components, HTML, CSS, and JavaScript
- `/backend` - Flask server, API endpoints, and business logic
  - `/backend/app.py` - Main application file (run this)
  - `/backend/data` - Product data stored in JSON format

## Development

To modify or extend the application:

1. Frontend changes: Edit files in the `/frontend` directory
2. Backend changes: Update the Flask application in `/backend/app.py`
3. Data model changes: Modify the data structure in `data_generator.py`

## Troubleshooting

- **Problem**: Cannot connect to the application
  **Solution**: Ensure the server is running and check if port 5000 is available

- **Problem**: No products displayed
  **Solution**: The system should automatically generate sample data, but if there are issues, delete the backend/data/products.json file and restart the application

- **Problem**: Dependencies installation fails
  **Solution**: Try installing dependencies manually using `pip install -r requirements.txt`

## License

MIT License 