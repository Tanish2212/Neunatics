import json
import os
import random
import time
import logging
from datetime import datetime, timedelta

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Path to products.json file
PRODUCTS_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "products.json")

def load_products():
    """Load products from JSON file"""
    try:
        with open(PRODUCTS_JSON_PATH, 'r') as file:
            products = json.load(file)
        return products
    except Exception as e:
        logging.error(f"Error loading products: {e}")
        return None

def save_products(products):
    """Save products to JSON file"""
    try:
        with open(PRODUCTS_JSON_PATH, 'w') as file:
            json.dump(products, file, indent=2)
        return True
    except Exception as e:
        logging.error(f"Error saving products: {e}")
        return False

def update_random_product(products):
    """Update a random product in the products list"""
    if not products:
        return False
        
    # Select a random product
    product = random.choice(products)
    product_id = product["id"]
    
    # Randomly choose what to update
    update_type = random.choice(["stock", "price", "status"])
    
    if update_type == "stock":
        # Update stock level
        old_stock = product["current_stock"]
        change = random.uniform(-5.0, 10.0)
        new_stock = max(0, old_stock + change)
        product["current_stock"] = round(new_stock, 1)
        
        # Update status if needed
        if new_stock <= product["min_stock_level"]:
            product["status"] = "low_stock"
        else:
            product["status"] = "active"
            
        logging.info(f"Updated product {product_id} stock: {old_stock} → {product['current_stock']}")
        
    elif update_type == "price":
        # Update selling price
        old_price = product["selling_price"]
        change_percent = random.uniform(-0.05, 0.08)  # -5% to +8%
        new_price = old_price * (1 + change_percent)
        product["selling_price"] = round(new_price, 2)
        logging.info(f"Updated product {product_id} price: {old_price} → {product['selling_price']}")
        
    elif update_type == "status":
        # Update status
        old_status = product["status"]
        new_status = random.choice(["active", "low_stock", "out_of_stock"])
        product["status"] = new_status
        logging.info(f"Updated product {product_id} status: {old_status} → {new_status}")
    
    # Add updated_at timestamp
    product["updated_at"] = datetime.now().isoformat()
    
    return True

def add_new_product(products):
    """Add a new product to the products list"""
    # Generate a new product ID
    existing_ids = set(p["id"] for p in products)
    new_id = str(random.randint(1, 1000))
    while new_id in existing_ids:
        new_id = str(random.randint(1, 1000))
        
    # Generate random product data
    categories = ["fruits", "vegetables", "meat", "bakery", "dairy", "snacks", "beverages", "canned goods", "spices"]
    units = ["g", "kg", "lb", "boxes", "packages", "bottles", "cans"]
    
    new_product = {
        "id": new_id,
        "name": f"New Product {new_id}",
        "sku": f"SKU-{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}{random.randint(1000, 9999)}",
        "category": random.choice(categories),
        "description": "New product added for testing",
        "current_stock": round(random.uniform(10, 100), 1),
        "min_stock_level": random.randint(5, 20),
        "unit": random.choice(units),
        "cost_price": round(random.uniform(5, 50), 2),
        "selling_price": round(random.uniform(10, 75), 2),
        "status": "active",
        "sales_count": 0,
        "created_at": datetime.now().isoformat()
    }
    
    products.append(new_product)
    logging.info(f"Added new product: {new_product['name']} (ID: {new_id})")
    
    return True

def delete_random_product(products):
    """Delete a random product from the products list"""
    if not products or len(products) <= 5:  # Keep at least 5 products
        return False
        
    # Select a random product
    product = random.choice(products)
    product_id = product["id"]
    product_name = product["name"]
    
    # Remove the product
    products.remove(product)
    
    logging.info(f"Deleted product: {product_name} (ID: {product_id})")
    
    return True

def simulate_changes(interval=5, max_changes=10):
    """Simulate changes to the products.json file"""
    changes_made = 0
    
    logging.info(f"Starting simulation. Will make up to {max_changes} changes.")
    logging.info(f"Press Ctrl+C to stop the simulation.")
    
    try:
        while changes_made < max_changes:
            # Load current products
            products = load_products()
            if not products:
                break
                
            # Choose a random action
            action = random.choices(
                ["update", "add", "delete"], 
                weights=[0.7, 0.2, 0.1]
            )[0]
            
            if action == "update":
                update_random_product(products)
            elif action == "add":
                add_new_product(products)
            elif action == "delete":
                delete_random_product(products)
                
            # Save changes
            save_products(products)
            changes_made += 1
            
            # Wait before making the next change
            logging.info(f"Change {changes_made}/{max_changes} completed. Waiting {interval} seconds...")
            time.sleep(interval)
            
        logging.info(f"Simulation completed. Made {changes_made} changes.")
        
    except KeyboardInterrupt:
        logging.info(f"Simulation stopped by user. Made {changes_made} changes.")
    except Exception as e:
        logging.error(f"Error during simulation: {e}")
        
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Simulate changes to products.json file")
    parser.add_argument("--interval", type=int, default=5, help="Time interval between changes in seconds")
    parser.add_argument("--max-changes", type=int, default=10, help="Maximum number of changes to make")
    
    args = parser.parse_args()
    
    simulate_changes(interval=args.interval, max_changes=args.max_changes) 