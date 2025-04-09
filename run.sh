#!/bin/bash

echo "==============================================="
echo " Food Inventory Management System"
echo "==============================================="
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python not found! Please install Python 3.8 or higher."
    exit 1
fi

# Check if required packages are installed
if ! python3 -c "import flask" &> /dev/null; then
    echo "Installing required packages..."
    python3 -m pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "Failed to install required packages."
        echo "Please run: pip install -r requirements.txt"
        exit 1
    fi
fi

# Check if data exists, generate if not
if [ ! -f "backend/data/products.json" ]; then
    echo "Generating sample data..."
    python3 data_generator.py
fi

echo
echo "==============================================="
echo " Starting the server..."
echo " Press Ctrl+C to stop"
echo "==============================================="
echo

# Run the application - using backend app.py directly
cd backend
python3 app.py 