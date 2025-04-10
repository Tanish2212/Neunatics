from pymongo import MongoClient
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def test_connection():
    """Test MongoDB connection"""
    try:
        # Connect to MongoDB
        client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=5000)
        
        # Force connection to verify server is accessible
        client.admin.command('ping')
        
        logging.info("MongoDB connection successful!")
        
        # Print available databases
        dbs = client.list_database_names()
        logging.info(f"Available databases: {dbs}")
        
        client.close()
        return True
    except Exception as e:
        logging.error(f"Failed to connect to MongoDB: {e}")
        return False

if __name__ == "__main__":
    test_connection() 