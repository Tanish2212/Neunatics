from pymongo import MongoClient
import json
import logging
from tabulate import tabulate
import sys

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# MongoDB connection settings
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "neunatics_db"
COLLECTION_NAME = "products"

def query_products(limit=5, product_id=None, category=None):
    """Query products from MongoDB and display them"""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        products_collection = db[COLLECTION_NAME]
        
        # Build query filter
        query_filter = {}
        if product_id:
            query_filter["id"] = product_id
        if category:
            query_filter["category"] = category
            
        # Check if database exists
        if DB_NAME not in client.list_database_names():
            logging.error(f"Database '{DB_NAME}' does not exist!")
            return False
            
        # Check if collection exists
        if COLLECTION_NAME not in db.list_collection_names():
            logging.error(f"Collection '{COLLECTION_NAME}' does not exist!")
            return False
            
        # Count total products
        total_count = products_collection.count_documents({})
        logging.info(f"Total products in database: {total_count}")
        
        if total_count == 0:
            logging.info("No products found in the database.")
            return False
            
        # Fetch products
        cursor = products_collection.find(query_filter).limit(limit)
        products = list(cursor)
        
        if not products:
            logging.info("No products found matching the criteria.")
            return False
            
        # Display products in table format
        display_products_table(products)
        
        # Close connection
        client.close()
        return True
        
    except Exception as e:
        logging.error(f"Error querying MongoDB: {e}")
        return False

def display_products_table(products):
    """Display products in a formatted table"""
    # Select key fields to display
    table_data = []
    headers = ["ID", "Name", "Category", "Price", "Stock", "Status"]
    
    for product in products:
        row = [
            product.get("id", "N/A"),
            product.get("name", "N/A"),
            product.get("category", "N/A"),
            product.get("selling_price", "N/A"),
            product.get("current_stock", "N/A"),
            product.get("status", "N/A")
        ]
        table_data.append(row)
    
    # Print table
    print("\nProduct Information:")
    print(tabulate(table_data, headers=headers, tablefmt="grid"))
    
    # Ask if user wants to see full JSON for a product
    print("\nType product ID to see full details, or press Enter to exit")
    choice = input("> ")
    
    if choice:
        for product in products:
            if product.get("id") == choice:
                print("\nFull product details:")
                print(json.dumps(product, indent=2))
                break

def display_usage():
    """Display usage information"""
    print(f"Usage: python {sys.argv[0]} [OPTIONS]")
    print("\nOptions:")
    print("  --limit N       Limit results to N products (default: 5)")
    print("  --id ID         Filter by product ID")
    print("  --category CAT  Filter by product category")
    print("  --all           Show all products")
    print("  --help          Display this help message")

def parse_args():
    """Parse command line arguments"""
    limit = 5
    product_id = None
    category = None
    
    # Process command line arguments
    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == "--limit" and i + 1 < len(sys.argv):
            try:
                limit = int(sys.argv[i + 1])
                i += 2
            except ValueError:
                logging.error("Limit must be a number")
                display_usage()
                sys.exit(1)
        elif arg == "--id" and i + 1 < len(sys.argv):
            product_id = sys.argv[i + 1]
            i += 2
        elif arg == "--category" and i + 1 < len(sys.argv):
            category = sys.argv[i + 1]
            i += 2
        elif arg == "--all":
            limit = 0  # No limit
            i += 1
        elif arg == "--help":
            display_usage()
            sys.exit(0)
        else:
            logging.error(f"Unknown argument: {arg}")
            display_usage()
            sys.exit(1)
    
    return limit, product_id, category

if __name__ == "__main__":
    if len(sys.argv) > 1:
        limit, product_id, category = parse_args()
    else:
        limit, product_id, category = 5, None, None
    
    query_products(limit, product_id, category) 