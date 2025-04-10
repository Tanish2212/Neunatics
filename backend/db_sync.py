import json
import os
import time
from datetime import datetime
from pymongo import MongoClient
import logging
import hashlib

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# MongoDB connection settings
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "neunatics_db"
COLLECTION_NAME = "products"

# Path to products.json file
PRODUCTS_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "products.json")

def connect_to_mongodb():
    """Establish connection to MongoDB"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        products_collection = db[COLLECTION_NAME]
        
        # Create index on product ID for faster lookups
        products_collection.create_index("id", unique=True)
        
        logging.info(f"Successfully connected to MongoDB: {DB_NAME}.{COLLECTION_NAME}")
        return client, products_collection
    except Exception as e:
        logging.error(f"Failed to connect to MongoDB: {e}")
        raise

def get_file_hash(file_path):
    """Calculate MD5 hash of file contents"""
    with open(file_path, 'rb') as f:
        file_hash = hashlib.md5(f.read()).hexdigest()
    return file_hash

def load_products_from_json():
    """Load products from JSON file"""
    try:
        with open(PRODUCTS_JSON_PATH, 'r') as file:
            products = json.load(file)
        return products
    except Exception as e:
        logging.error(f"Error loading products from JSON: {e}")
        return None

def sync_products_to_mongodb(products_collection):
    """Synchronize products from JSON file to MongoDB"""
    products = load_products_from_json()
    if not products:
        return False
    
    try:
        # First clear the collection
        products_collection.delete_many({})
        
        # Insert all products with a sync timestamp
        for product in products:
            product["last_synced"] = datetime.now().isoformat()
        
        # Insert all products
        result = products_collection.insert_many(products)
        logging.info(f"Synchronized {len(result.inserted_ids)} products to MongoDB")
        return True
    except Exception as e:
        logging.error(f"Error syncing products to MongoDB: {e}")
        return False

def update_existing_product(products_collection, product):
    """Update a single product in MongoDB"""
    try:
        product["last_synced"] = datetime.now().isoformat()
        result = products_collection.replace_one({"id": product["id"]}, product, upsert=True)
        if result.modified_count > 0:
            logging.info(f"Updated product {product['id']} in MongoDB")
        elif result.upserted_id:
            logging.info(f"Inserted new product {product['id']} in MongoDB")
        return True
    except Exception as e:
        logging.error(f"Error updating product {product['id']}: {e}")
        return False

def monitor_json_file(products_collection):
    """Monitor products.json file for changes and update MongoDB accordingly"""
    last_hash = get_file_hash(PRODUCTS_JSON_PATH)
    
    while True:
        try:
            # Sleep to avoid high CPU usage
            time.sleep(1)
            
            # Check if file has changed
            current_hash = get_file_hash(PRODUCTS_JSON_PATH)
            if current_hash != last_hash:
                logging.info("Detected change in products.json")
                sync_products_to_mongodb(products_collection)
                last_hash = current_hash
        except Exception as e:
            logging.error(f"Error monitoring file: {e}")
            # Wait before trying again
            time.sleep(5)

def main():
    """Main function to start MongoDB synchronization"""
    try:
        client, products_collection = connect_to_mongodb()
        
        # Initial sync
        logging.info("Performing initial synchronization...")
        sync_products_to_mongodb(products_collection)
        
        # Start monitoring for changes
        logging.info("Starting real-time monitoring of products.json...")
        monitor_json_file(products_collection)
    except KeyboardInterrupt:
        logging.info("Process interrupted. Shutting down...")
    except Exception as e:
        logging.error(f"An error occurred: {e}")
    finally:
        if 'client' in locals():
            client.close()
            logging.info("MongoDB connection closed")

if __name__ == "__main__":
    main() 