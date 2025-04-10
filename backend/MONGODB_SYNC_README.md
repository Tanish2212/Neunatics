# MongoDB Products Sync

This functionality syncs the `products.json` data with a MongoDB database in real-time. Any changes made to the products.json file will be automatically reflected in the MongoDB database.

## Prerequisites

1. MongoDB Server must be installed and running on your system
2. Python 3.6+ with the dependencies listed in `requirements.txt`

## Installation

1. Ensure MongoDB server is installed and running on your system
   - For Windows: https://www.mongodb.com/try/download/community
   - For macOS: `brew install mongodb-community`
   - For Linux: Follow the official documentation based on your distribution

2. Install required Python dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

The `mongo_sync_manager.py` script provides several commands to manage the MongoDB synchronization:

### Test MongoDB Connection

To verify that MongoDB is running and accessible:

```
python mongo_sync_manager.py test
```

### Start MongoDB Synchronization

To start the synchronization process (this will run continuously until stopped):

```
python mongo_sync_manager.py sync
```

The sync process will:
1. Load all products from products.json
2. Import them into MongoDB
3. Monitor the file for changes and update the database automatically

### Query MongoDB Products

To check the products stored in MongoDB:

```
python mongo_sync_manager.py query
```

Options:
- `--limit N`: Limit results to N products (default: 5)
- `--id ID`: Filter by product ID
- `--category CATEGORY`: Filter by product category
- `--all`: Show all products

Examples:
```
python mongo_sync_manager.py query --limit 10
python mongo_sync_manager.py query --category fruits
python mongo_sync_manager.py query --id 5
python mongo_sync_manager.py query --all
```

### Simulate Changes to products.json

To simulate random changes to the products.json file:

```
python mongo_sync_manager.py simulate
```

Options:
- `--interval N`: Time interval between changes in seconds (default: 5)
- `--max-changes N`: Maximum number of changes to make (default: 10)

Example:
```
python mongo_sync_manager.py simulate --interval 3 --max-changes 20
```

### Run Demo Mode (Sync + Simulation)

To run both the sync process and simulation together:

```
python mongo_sync_manager.py demo
```

This will:
1. Start the MongoDB sync process
2. Wait for a few seconds to ensure connection is established
3. Start making random changes to products.json
4. Automatically stop the sync process when simulation finishes

## Monitoring the Synchronization

You can use the query command to check if the changes are being reflected in MongoDB:

```
python mongo_sync_manager.py query
```

## Database Structure

- **Database**: `neunatics_db`
- **Collection**: `products`
- Each product document includes all fields from the original JSON plus a `last_synced` timestamp

## Troubleshooting

1. **Connection Issues**: If you encounter connection issues, make sure MongoDB is running:
   ```
   mongo --eval "db.adminCommand('ping')"
   ```

2. **Port Conflicts**: By default, MongoDB runs on port 27017. If you've configured it to use a different port, update the `MONGO_URI` in `db_sync.py`.

3. **Permissions**: Ensure your user has appropriate permissions to read/write to the database.

4. **File Monitoring**: If file changes aren't detected, try manually running the sync process again. 