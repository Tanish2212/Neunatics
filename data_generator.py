from faker import Faker
import random
import json
from datetime import datetime, timedelta

fake = Faker()

def generate_company():
    return {
        "id": fake.uuid4(),
        "name": fake.company(),
        "industry": fake.random_element(elements=('Technology', 'Healthcare', 'Retail', 'Manufacturing', 'Finance')),
        "location": fake.country(),
        "founded_year": fake.year(),
        "employee_count": random.randint(50, 10000)
    }

def generate_product(company_id):
    return {
        "id": fake.uuid4(),
        "company_id": company_id,
        "name": fake.catch_phrase(),
        "category": fake.random_element(elements=('Electronics', 'Clothing', 'Food', 'Furniture', 'Books')),
        "price": round(random.uniform(10, 1000), 2),
        "description": fake.text(max_nb_chars=200),
        "created_at": (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat()
    }

def generate_inventory(product_id):
    return {
        "id": fake.uuid4(),
        "product_id": product_id,
        "quantity": random.randint(0, 1000),
        "last_updated": datetime.now().isoformat(),
        "status": fake.random_element(elements=('In Stock', 'Low Stock', 'Out of Stock'))
    }

def generate_fake_data(num_companies=10, products_per_company=5):
    companies = []
    products = []
    inventory = []
    
    # Generate companies
    for _ in range(num_companies):
        company = generate_company()
        companies.append(company)
        
        # Generate products for each company
        for _ in range(products_per_company):
            product = generate_product(company["id"])
            products.append(product)
            
            # Generate inventory for each product
            inv = generate_inventory(product["id"])
            inventory.append(inv)
    
    return {
        "companies": companies,
        "products": products,
        "inventory": inventory
    }

def save_to_json(data, filename="fake_data.json"):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)

if __name__ == "__main__":
    # Generate data with 5 companies, each having 3 products
    fake_data = generate_fake_data(num_companies=5, products_per_company=3)
    save_to_json(fake_data)
    print("Fake data generated and saved to fake_data.json") 