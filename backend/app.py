from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import json
import os
from datetime import datetime
import uuid
import threading
import time
from random import randint, choice, uniform

# Get the absolute path to the frontend directory
FRONTEND_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')

app = Flask(__name__, static_folder=None)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory storage for products
products = []

# Load initial data if available
def load_initial_data():
    global products
    try:
        with open('data/products.json', 'r') as f:
            products = json.load(f)
    except FileNotFoundError:
        products = []

# Save data to file
def save_data():
    os.makedirs('data', exist_ok=True)
    with open('data/products.json', 'w') as f:
        json.dump(products, f, indent=2)

# Initialize data
load_initial_data()

# Serve frontend static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path == "" or path == "index.html":
        return send_from_directory(FRONTEND_PATH, 'index.html')
    
    # Attempt to serve the file from the frontend directory
    try:
        return send_from_directory(FRONTEND_PATH, path)
    except:
        # If the file doesn't exist, return the index.html for SPA routing
        return send_from_directory(FRONTEND_PATH, 'index.html')

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join')
def handle_join(room):
    join_room(room)
    print(f'Client joined room: {room}')

@socketio.on('leave')
def handle_leave(room):
    leave_room(room)
    print(f'Client left room: {room}')

# Broadcast product updates
def broadcast_product_update(product_id, event_type, data):
    room = f'product-{product_id}'
    socketio.emit('product-update', {
        'type': event_type,
        'data': data
    }, room=room)

@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify({
        'success': True,
        'data': products
    })

@app.route('/api/products', methods=['POST'])
def create_product():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'category', 'sku', 'unit', 'current_stock', 
                         'min_stock_level', 'cost_price', 'selling_price']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Create new product
        product = {
            'id': str(uuid.uuid4()),
            'name': data['name'],
            'category': data['category'],
            'sku': data['sku'],
            'unit': data['unit'],
            'current_stock': float(data['current_stock']),
            'min_stock_level': float(data['min_stock_level']),
            'cost_price': float(data['cost_price']),
            'selling_price': float(data['selling_price']),
            'description': data.get('description', ''),
            'status': 'low_stock' if float(data['current_stock']) <= float(data['min_stock_level']) else 'active',
            'created_at': datetime.now().isoformat()
        }
        
        products.append(product)
        save_data()
        
        # Broadcast the new product
        broadcast_product_update(product['id'], 'create', product)
        
        return jsonify({
            'success': True,
            'data': product
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    product = next((p for p in products if p['id'] == product_id), None)
    if product:
        return jsonify({
            'success': True,
            'data': product
        })
    return jsonify({
        'success': False,
        'message': 'Product not found'
    }), 404

@app.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.json
        product = next((p for p in products if p['id'] == product_id), None)
        
        if not product:
            return jsonify({
                'success': False,
                'message': 'Product not found'
            }), 404
        
        # Update product fields
        for key, value in data.items():
            if key in product:
                if key in ['current_stock', 'min_stock_level', 'cost_price', 'selling_price']:
                    product[key] = float(value)
                else:
                    product[key] = value
        
        # Update status based on stock level
        product['status'] = 'low_stock' if product['current_stock'] <= product['min_stock_level'] else 'active'
        
        save_data()
        
        # Broadcast the update
        broadcast_product_update(product_id, 'update', product)
        
        return jsonify({
            'success': True,
            'data': product
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    global products
    product = next((p for p in products if p['id'] == product_id), None)
    
    if not product:
        return jsonify({
            'success': False,
            'message': 'Product not found'
        }), 404
    
    products = [p for p in products if p['id'] != product_id]
    save_data()
    
    # Broadcast the deletion
    broadcast_product_update(product_id, 'delete', {'id': product_id})
    
    return jsonify({
        'success': True,
        'message': 'Product deleted successfully'
    })

@app.route('/api/products/low-stock', methods=['GET'])
def get_low_stock_products():
    low_stock_products = [p for p in products if p['status'] == 'low_stock']
    return jsonify({
        'success': True,
        'data': low_stock_products
    })

@app.route('/api/products/stats', methods=['GET'])
def get_product_stats():
    total_products = len(products)
    total_categories = len(set(p['category'] for p in products))
    total_stock_value = sum(p['current_stock'] * p['cost_price'] for p in products)
    low_stock_count = len([p for p in products if p['status'] == 'low_stock'])
    
    return jsonify({
        'success': True,
        'data': {
            'total_products': total_products,
            'total_categories': total_categories,
            'total_stock_value': total_stock_value,
            'low_stock_count': low_stock_count
        }
    })

@app.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    try:
        # Calculate total products
        total_products = len(products)
        
        # Calculate total categories
        categories = set(product['category'] for product in products)
        total_categories = len(categories)
        
        # Calculate total stock value
        total_stock_value = sum(
            product['current_stock'] * product['cost_price']
            for product in products
        )
        
        # Calculate low stock items
        low_stock_items = sum(
            1 for product in products
            if product['current_stock'] <= product['min_stock_level']
        )
        
        return jsonify({
            'success': True,
            'data': {
                'total_products': total_products,
                'total_categories': total_categories,
                'total_stock_value': round(total_stock_value, 2),
                'low_stock_items': low_stock_items
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/dashboard/activity', methods=['GET'])
def get_recent_activity():
    try:
        # Get the 10 most recent activities
        activities = []
        for product in products:
            if 'created_at' in product:
                activities.append({
                    'timestamp': product['created_at'],
                    'event_type': 'create',
                    'description': f"Added new product: {product['name']}",
                    'quantity_change': product['current_stock'],
                    'unit': product['unit']
                })
        
        # Sort by timestamp and get most recent
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        recent_activities = activities[:10]
        
        return jsonify({
            'success': True,
            'data': recent_activities
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/dashboard/alerts', methods=['GET'])
def get_low_stock_alerts():
    try:
        alerts = []
        for product in products:
            if product['current_stock'] <= product['min_stock_level']:
                alerts.append({
                    'product_id': product['id'],
                    'name': product['name'],
                    'current_stock': product['current_stock'],
                    'min_stock_level': product['min_stock_level'],
                    'unit': product['unit']
                })
        
        return jsonify({
            'success': True,
            'data': alerts
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/dashboard/trends', methods=['GET'])
def get_sales_trends():
    try:
        # Generate some sample sales data
        trends = {
            'labels': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'data': [120, 190, 150, 170, 200, 250, 180]
        }
        
        return jsonify({
            'success': True,
            'data': trends
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

def generate_fake_update():
    global products
    if not products:
        return
    
    # Randomly select a product to update
    product = choice(products)
    
    # Randomly modify stock level
    stock_change = randint(-5, 5)
    product['current_stock'] = max(0, product['current_stock'] + stock_change)
    
    # Update status based on stock level
    product['status'] = 'low_stock' if product['current_stock'] <= product['min_stock_level'] else 'active'
    
    # Save changes
    save_data()
    
    # Broadcast the update
    broadcast_product_update(product['id'], 'update', product)

def periodic_updates():
    while True:
        try:
            generate_fake_update()
            time.sleep(3)  # Update every 3 seconds
        except Exception as e:
            print(f"Error in periodic updates: {e}")
            time.sleep(3)  # Wait before retrying

def generate_initial_products():
    if not products:
        categories = ['Fruits', 'Vegetables', 'Dairy', 'Meat', 'Beverages', 'Snacks']
        units = ['kg', 'pcs', 'litres', 'packets']
        
        for i in range(10):  # Generate 10 initial products
            product = {
                'id': str(uuid.uuid4()),
                'name': f"Product {i+1}",
                'category': choice(categories),
                'sku': f"SKU{i+1:03d}",
                'unit': choice(units),
                'current_stock': randint(5, 100),
                'min_stock_level': randint(10, 20),
                'cost_price': round(uniform(10, 50), 2),
                'selling_price': round(uniform(50, 100), 2),
                'description': f"Description for Product {i+1}",
                'created_at': datetime.now().isoformat()
            }
            product['status'] = 'low_stock' if product['current_stock'] <= product['min_stock_level'] else 'active'
            products.append(product)
        
        save_data()

if __name__ == '__main__':
    # Generate initial data if none exists
    generate_initial_products()
    
    # Start periodic updates in a background thread
    update_thread = threading.Thread(target=periodic_updates, daemon=True)
    update_thread.start()
    
    print("Starting server. Access the application at http://localhost:5000")
    
    # Run the Flask app
    socketio.run(app, debug=True, port=5000) 