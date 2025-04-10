#!/usr/bin/env python3
import argparse
import logging
import subprocess
import sys
import os
import time
from multiprocessing import Process

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Script paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_SYNC_SCRIPT = os.path.join(CURRENT_DIR, "db_sync.py")
QUERY_SCRIPT = os.path.join(CURRENT_DIR, "query_mongo_products.py")
SIMULATE_SCRIPT = os.path.join(CURRENT_DIR, "simulate_product_changes.py")
TEST_CONNECTION_SCRIPT = os.path.join(CURRENT_DIR, "test_mongo_connection.py")

def run_db_sync():
    """Run the database sync process"""
    logging.info("Starting MongoDB synchronization process...")
    try:
        process = subprocess.Popen([sys.executable, DB_SYNC_SCRIPT],
                                  stdout=subprocess.PIPE,
                                  stderr=subprocess.STDOUT,
                                  text=True,
                                  bufsize=1)
        
        for line in iter(process.stdout.readline, ''):
            print(f"[DB_SYNC] {line}", end='')
            
        return process
    except Exception as e:
        logging.error(f"Failed to start DB sync process: {e}")
        return None

def run_query(args):
    """Run the query script to check MongoDB data"""
    cmd = [sys.executable, QUERY_SCRIPT]
    
    if args.limit:
        cmd.extend(["--limit", str(args.limit)])
    if args.category:
        cmd.extend(["--category", args.category])
    if args.id:
        cmd.extend(["--id", args.id])
    if args.all:
        cmd.append("--all")
    
    try:
        subprocess.run(cmd)
    except Exception as e:
        logging.error(f"Error running query: {e}")

def run_simulation(args):
    """Run the simulation script"""
    cmd = [sys.executable, SIMULATE_SCRIPT]
    
    if args.interval:
        cmd.extend(["--interval", str(args.interval)])
    if args.max_changes:
        cmd.extend(["--max-changes", str(args.max_changes)])
    
    try:
        subprocess.run(cmd)
    except Exception as e:
        logging.error(f"Error running simulation: {e}")

def test_connection():
    """Test MongoDB connection"""
    try:
        subprocess.run([sys.executable, TEST_CONNECTION_SCRIPT])
    except Exception as e:
        logging.error(f"Error testing connection: {e}")

def start_sync_and_simulate(args):
    """Start both sync and simulation processes"""
    # Start the DB sync process
    sync_process = run_db_sync()
    if not sync_process:
        return
    
    # Wait a bit to ensure MongoDB connection is established
    time.sleep(3)
    
    try:
        # Run the simulation
        run_simulation(args)
    finally:
        # Terminate the sync process when simulation is done
        logging.info("Terminating DB sync process...")
        sync_process.terminate()
        sync_process.wait()

def main():
    parser = argparse.ArgumentParser(description="MongoDB Sync Manager")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Sync command
    sync_parser = subparsers.add_parser("sync", help="Start MongoDB synchronization")
    
    # Query command
    query_parser = subparsers.add_parser("query", help="Query MongoDB products")
    query_parser.add_argument("--limit", type=int, help="Limit number of results")
    query_parser.add_argument("--id", help="Filter by product ID")
    query_parser.add_argument("--category", help="Filter by product category")
    query_parser.add_argument("--all", action="store_true", help="Show all products")
    
    # Simulate command
    simulate_parser = subparsers.add_parser("simulate", help="Simulate changes to products.json")
    simulate_parser.add_argument("--interval", type=int, default=5, help="Time interval between changes in seconds")
    simulate_parser.add_argument("--max-changes", type=int, default=10, help="Maximum number of changes to make")
    
    # Test connection command
    subparsers.add_parser("test", help="Test MongoDB connection")
    
    # Run both sync and simulate
    demo_parser = subparsers.add_parser("demo", help="Run both sync and simulation")
    demo_parser.add_argument("--interval", type=int, default=5, help="Time interval between changes in seconds")
    demo_parser.add_argument("--max-changes", type=int, default=10, help="Maximum number of changes to make")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    if args.command == "sync":
        process = run_db_sync()
        if process:
            try:
                process.wait()
            except KeyboardInterrupt:
                logging.info("Stopping sync process...")
                process.terminate()
    elif args.command == "query":
        run_query(args)
    elif args.command == "simulate":
        run_simulation(args)
    elif args.command == "test":
        test_connection()
    elif args.command == "demo":
        start_sync_and_simulate(args)

if __name__ == "__main__":
    main() 