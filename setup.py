#!/usr/bin/env python
"""
Setup script for Food Inventory Management System
This script:
1. Installs required dependencies
2. Generates sample data
3. Provides instructions to run the application
"""

import os
import sys
import subprocess
import platform

def install_requirements():
    """Install required packages from requirements.txt."""
    print("Installing required dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError:
        print("Failed to install dependencies. Please try manually with:")
        print("pip install -r requirements.txt")
        return False

def generate_sample_data():
    """Generate sample product data."""
    print("Generating sample product data...")
    try:
        subprocess.check_call([sys.executable, "data_generator.py"])
        print("Sample data generated successfully!")
        return True
    except subprocess.CalledProcessError:
        print("Failed to generate sample data. Please run manually:")
        print("python data_generator.py")
        return False

def show_instructions():
    """Show instructions to run the application."""
    print("\n===============================================")
    print(" Food Inventory Management System")
    print("===============================================")
    print(" Setup completed!")
    print(" To run the application:")
    print(" 1. Navigate to backend directory: cd backend")
    print(" 2. Execute: python app.py")
    print(" 3. Access the application at http://localhost:5000")
    print("===============================================\n")
    print(" OR use the provided scripts:")
    print("   - Windows: run.bat")
    print("   - Linux/Mac: ./run.sh")
    print("===============================================\n")

if __name__ == "__main__":
    # Ensure we're in the correct directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print("\n===============================================")
    print(" Food Inventory Management System - Setup")
    print("===============================================\n")
    
    # Install dependencies
    deps_installed = install_requirements()
    
    # Generate sample data if dependencies installed
    if deps_installed:
        generate_sample_data()
    
    # Show instructions
    show_instructions()
    
    # Offer to run the application immediately
    if deps_installed:
        choice = input("Would you like to run the application now? (y/n): ")
        if choice.lower() == 'y':
            print("Starting the application...")
            try:
                # Use the correct Python interpreter and path
                backend_dir = os.path.join(script_dir, "backend")
                os.chdir(backend_dir)
                subprocess.call([sys.executable, "app.py"])
            except KeyboardInterrupt:
                print("\nApplication stopped.") 