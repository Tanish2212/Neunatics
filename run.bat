@echo off
echo ===============================================
echo  Food Inventory Management System
echo ===============================================
echo.
echo Checking for Python...
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Python not found! Please install Python 3.8 or higher.
    goto :EOF
)

echo Checking for required packages...
python -c "import flask" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing required packages...
    python -m pip install -r requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install required packages.
        echo Please run: pip install -r requirements.txt
        goto :EOF
    )
)

echo Checking for data...
if not exist backend\data\products.json (
    echo Generating sample data...
    python data_generator.py
)

echo.
echo ===============================================
echo  Starting the server...
echo  Press Ctrl+C to stop
echo ===============================================
echo.

cd backend
python app.py 