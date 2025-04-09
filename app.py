"""
Food Inventory Management System

This script integrates and runs the backend with Flask and Flask-SocketIO.
It serves the frontend files from the frontend/ directory.

Run the application with:
    python app.py
"""

import os
import sys

# Add the backend directory to the Python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_dir)

from backend.app import app, socketio

if __name__ == '__main__':
    print("\n===============================================")
    print(" Food Inventory Management System")
    print("===============================================")
    print(" Server starting...")
    print(" Access the application at http://localhost:5000")
    print("===============================================\n")
    
    # Run the Flask app with SocketIO
    socketio.run(app, debug=True, host='0.0.0.0', port=5000) 