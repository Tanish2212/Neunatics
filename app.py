"""
Food Inventory Management System

This is a redirection script to help users use the correct application.
The main application is now located in the backend directory.

Run the application with:
    cd backend
    python app.py
"""

import os
import sys
import subprocess

print("\n===============================================")
print(" Food Inventory Management System")
print("===============================================")
print(" NOTICE: The application structure has changed.")
print(" Please use one of the following methods to run the app:")
print("")
print(" 1. cd backend")
print("    python app.py")
print("")
print(" 2. Use the provided scripts:")
print("    - Windows: run.bat")
print("    - Linux/Mac: ./run.sh")
print("===============================================\n")

# Ask if user wants to run the app now
choice = input("Would you like to run the application now? (y/n): ")
if choice.lower() == 'y':
    print("Starting the application...")
    try:
        # Navigate to backend and run the app
        backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
        os.chdir(backend_dir)
        subprocess.call([sys.executable, "app.py"])
    except KeyboardInterrupt:
        print("\nApplication stopped.") 