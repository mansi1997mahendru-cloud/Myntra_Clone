import os
import sys
import random

sys.path.append(r"c:\Users\mansi\OneDrive\Desktop\Myntra_Clone\backend")

from database import SessionLocal, engine
import models
from main import hash_password

db = SessionLocal()

# Drop and recreate base tables
models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

# Definitions of categories with exact Unsplash URLs
PRODUCT_TEMPLATES = [
    # 1. Fruits & Vegetables
    {
        "category": "Fruits & Vegetables",
        "brand": "Fresh Farms",
        "base_name": "Royal Gala Red Apples",
        "icon": "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=500&auto=format&fit=crop",
        "base_price": 80,
        "sizes": ["4 units (approx. 500g)", "8 units (approx. 1kg)", "Family Box (2kg)"]
    },
    {
        "category": "Fruits & Vegetables",
        "brand": "Fresh Farms",
        "base_name": "Organic Cavendish Bananas",
        "icon": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop",
        "base_price": 40,
        "sizes": ["6 units", "12 units (1 dozen)", "Mini Pack (3 units)"]
    },
    {
        "category": "Fruits & Vegetables",
        "brand": "Fresh Farms",
        "base_name": "Hybrid Juicy Tomatoes",
        "icon": "https://images.unsplash.com/photo-1595855759920-86582396756a?w=500&auto=format&fit=crop",
        "base_price": 30,
        "sizes": ["500 g", "1 kg", "Value Pack (2 kg)"]
    },
    {
        "category": "Fruits & Vegetables",
        "brand": "Fresh Farms",
        "base_name": "New Crop Potatoes",
        "icon": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop",
        "base_price": 25,
        "sizes": ["1 kg", "2 kg", "Bulk Pack (5 kg)"]
    },
    {
        "category": "Fruits & Vegetables",
        "brand": "Fresh Farms",
        "base_name": "Desi Pink Onions",
        "icon": "https://images.unsplash.com/photo-1508747703725-719ae2c73ee0?w=500&auto=format&fit=crop",
        "base_price": 35,
        "sizes": ["1 kg", "2 kg", "Value Pack (5 kg)"]
    },
    # 2. Dairy, Bread & Eggs
    {
        "category": "Dairy, Bread & Eggs",
        "brand": "Amul",
        "base_name": "Gold Full Cream Milk",
        "icon": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
        "base_price": 33,
        "sizes": ["500 ml", "1 L", "Family Combo (Pack of 4)"]
    },
    {
        "category": "Dairy, Bread & Eggs",
        "brand": "Mother Dairy",
        "base_name": "Classic Toned Milk",
        "icon": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop",
        "base_price": 27,
        "sizes": ["500 ml", "1 L", "Monthly Value Pack (12 L)"]
    },
    {
        "category": "Dairy, Bread & Eggs",
        "brand": "Amul",
        "base_name": "Pasteurised Salted Butter",
        "icon": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop",
        "base_price": 56,
        "sizes": ["100 g", "500 g", "Twin Saver Pack (2 x 500g)"]
    },
    {
        "category": "Dairy, Bread & Eggs",
        "brand": "Amul",
        "base_name": "Fresh Malai Paneer",
        "icon": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop",
        "base_price": 85,
        "sizes": ["200 g", "500 g", "Catering Slab (1 kg)"]
    },
    {
        "category": "Dairy, Bread & Eggs",
        "brand": "Harvest Gold",
        "base_name": "Premium White Bread",
        "icon": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop",
        "base_price": 45,
        "sizes": ["400 g", "700 g (Family Pack)", "Jumbo Toast (800g)"]
    },
    # 3. Munchies
    {
        "category": "Munchies",
        "brand": "Lay's",
        "base_name": "Classic Salted Potato Chips",
        "icon": "https://images.unsplash.com/photo-1613907331711-2e1f0fcd6a78?w=500&auto=format&fit=crop",
        "base_price": 20,
        "sizes": ["50 g", "95 g", "Party Size Pack (150g)"]
    },
    {
        "category": "Munchies",
        "brand": "Kurkure",
        "base_name": "Masala Munch Crunchy Snacks",
        "icon": "https://images.unsplash.com/photo-1599490659213-e2b9527b0876?w=500&auto=format&fit=crop",
        "base_price": 20,
        "sizes": ["45 g", "90 g", "Mega Pack (180g)"]
    },
    {
        "category": "Munchies",
        "brand": "Haldiram's",
        "base_name": "Classic Aloo Bhujia Namkeen",
        "icon": "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=500&auto=format&fit=crop",
        "base_price": 35,
        "sizes": ["150 g", "400 g", "Saver Pack (1 kg)"]
    },
    # 4. Cold Drinks & Juices
    {
        "category": "Cold Drinks & Juices",
        "brand": "Coca-Cola",
        "base_name": "Original Taste Aerated Drink",
        "icon": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop",
        "base_price": 40,
        "sizes": ["300 ml (Can)", "750 ml (Bottle)", "2.25 L (Mega Bottle)"]
    },
    {
        "category": "Cold Drinks & Juices",
        "brand": "Pepsi",
        "base_name": "Black Zero Sugar Soda",
        "icon": "https://images.unsplash.com/photo-1533007424480-29c426033480?w=500&auto=format&fit=crop",
        "base_price": 35,
        "sizes": ["330 ml", "600 ml", "Pack of 6 Cans (6 x 330ml)"]
    },
    {
        "category": "Cold Drinks & Juices",
        "brand": "Red Bull",
        "base_name": "Energy Drink Liquid Power",
        "icon": "https://images.unsplash.com/photo-1622543953490-0b70039a23f9?w=500&auto=format&fit=crop",
        "base_price": 125,
        "sizes": ["250 ml (Can)", "Pack of 4 Cans", "Bulk Pack of 24 Cans"]
    },
    # 5. Breakfast
    {
        "category": "Breakfast",
        "brand": "Kellogg's",
        "base_name": "Original Iron Rich Corn Flakes",
        "icon": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop",
        "base_price": 190,
        "sizes": ["300 g", "875 g (Big Saver)", "Jumbo Pack (1.2 kg)"]
    },
    {
        "category": "Breakfast",
        "brand": "Dr. Oetker",
        "base_name": "Creamy Crunchy Peanut Butter",
        "icon": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&auto=format&fit=crop",
        "base_price": 165,
        "sizes": ["340 g", "500 g", "Mega Jar (1 kg)"]
    },
    # 6. Tea & Coffee
    {
        "category": "Tea & Coffee",
        "brand": "Nescafe",
        "base_name": "Classic Instant Soluble Coffee",
        "icon": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop",
        "base_price": 170,
        "sizes": ["50 g (Glass Jar)", "100 g (Glass Jar)", "Eco Pouch (200g)"]
    },
    {
        "category": "Tea & Coffee",
        "brand": "Tata Tea",
        "base_name": "Gold Premium Leaf Tea",
        "icon": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop",
        "base_price": 140,
        "sizes": ["250 g", "500 g", "Saver Pack (1 kg)"]
    },
    # 7. Atta, Rice & Dal
    {
        "category": "Atta, Rice & Dal",
        "brand": "Aashirvaad",
        "base_name": "Shudh Chakki Whole Wheat Atta",
        "icon": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop",
        "base_price": 260,
        "sizes": ["5 kg", "10 kg", "Twin Family Pack (2 x 10kg)"]
    },
    {
        "category": "Atta, Rice & Dal",
        "brand": "India Gate",
        "base_name": "Premium Basmati Rice",
        "icon": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop",
        "base_price": 110,
        "sizes": ["1 kg", "5 kg (Super Saver)", "Premium Feast (10 kg)"]
    },
    # 8. Oil & Ghee
    {
        "category": "Oil & Ghee",
        "brand": "Fortune",
        "base_name": "Soyabean Health Refined Oil",
        "icon": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop",
        "base_price": 135,
        "sizes": ["1 L (Pouch)", "1 L (Pet Bottle)", "5 L (Cane)"]
    },
    {
        "category": "Oil & Ghee",
        "brand": "Amul",
        "base_name": "Pure Cow Ghee Tin",
        "icon": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop",
        "base_price": 340,
        "sizes": ["500 ml", "1 L", "Tin Box (5 L)"]
    },
    # 9. Masala
    {
        "category": "Masala",
        "brand": "Everest",
        "base_name": "Tikhalal Fine Red Chilli Powder",
        "icon": "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=500&auto=format&fit=crop",
        "base_price": 55,
        "sizes": ["100 g", "200 g", "Combo Pack (Pack of 3)"]
    },
    # 10. Frozen Food
    {
        "category": "Frozen Food",
        "brand": "McCain",
        "base_name": "Super Saver French Fries",
        "icon": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop",
        "base_price": 120,
        "sizes": ["450 g", "750 g", "Mega Party Pack (1.25 kg)"]
    },
    # 11. Ice Cream
    {
        "category": "Ice Cream",
        "brand": "Amul",
        "base_name": "Classic Creamy Vanilla Magic",
        "icon": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&auto=format&fit=crop",
        "base_price": 90,
        "sizes": ["700 ml (1+1 Offer)", "1.2 L Family Tub", "Party Brick (2 L)"]
    },
    # 12. Biscuits
    {
        "category": "Biscuits",
        "brand": "Britannia",
        "base_name": "Good Day Butter Cookies",
        "icon": "https://images.unsplash.com/photo-1558961313-7f820013d690?w=500&auto=format&fit=crop",
        "base_price": 25,
        "sizes": ["100 g", "250 g", "Family Value Pack (600g)"]
    },
    # 13. Chocolates
    {
        "category": "Chocolates",
        "brand": "Cadbury",
        "base_name": "Dairy Milk Silk Chocolate",
        "icon": "https://images.unsplash.com/photo-1549007994-cb92ca813bec?w=500&auto=format&fit=crop",
        "base_price": 80,
        "sizes": ["60 g", "150 g", "Bumper Gift Box (350g)"]
    },
    # 14. Cleaning Essentials
    {
        "category": "Cleaning Essentials",
        "brand": "Surf Excel",
        "base_name": "Easy Wash Detergent Powder",
        "icon": "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500&auto=format&fit=crop",
        "base_price": 140,
        "sizes": ["1 kg", "3 kg (Super Saver)", "Mega Tub Pack (5 kg)"]
    },
    {
        "category": "Cleaning Essentials",
        "brand": "Lizol",
        "base_name": "Disinfectant Citrus Floor Cleaner",
        "icon": "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500&auto=format&fit=crop",
        "base_price": 99,
        "sizes": ["500 ml", "975 ml", "Eco Refill Can (2 L)"]
    },
    # 15. Personal Care
    {
        "category": "Personal Care",
        "brand": "Dettol",
        "base_name": "Liquid Soap Handwash Refill",
        "icon": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop",
        "base_price": 85,
        "sizes": ["175 ml (Pouch)", "675 ml (Super Saver)", "Eco Refill Jar (1.5 L)"]
    },
    # 16. Beauty
    {
        "category": "Beauty",
        "brand": "Nivea",
        "base_name": "Soft Light Moisturizer Cream",
        "icon": "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&auto=format&fit=crop",
        "base_price": 120,
        "sizes": ["100 ml", "200 ml", "Travel Tin Pack (50ml)"]
    },
    # 17. Baby Care
    {
        "category": "Baby Care",
        "brand": "Pampers",
        "base_name": "Active Baby Diapers Pants",
        "icon": "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&auto=format&fit=crop",
        "base_price": 499,
        "sizes": ["M - 28 units", "L - 42 units (Monthly)", "XL - 36 units"]
    },
    # 18. Pet Care
    {
        "category": "Pet Care",
        "brand": "Pedigree",
        "base_name": "Dry Dog Food Chicken & Vegetables",
        "icon": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop",
        "base_price": 220,
        "sizes": ["1.2 kg", "3 kg (Super Saver)", "Mega Jumbo Pack (10 kg)"]
    },
    # 19. Pharmacy
    {
        "category": "Pharmacy",
        "brand": "Dolo",
        "base_name": "650 Fast Relief Tablets",
        "icon": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop",
        "base_price": 30,
        "sizes": ["Strip of 15 Tabs", "Box of 10 Strips", "Emergency Carry Pack"]
    },
    # 20. Electronics
    {
        "category": "Electronics",
        "brand": "Duracell",
        "base_name": "Chalao Ultra AA Alkaline Batteries",
        "icon": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop",
        "base_price": 150,
        "sizes": ["Pack of 4", "Pack of 8 (Value)", "Mega Family Pack of 16"]
    }
]

# Modifiers for product descriptions and templates to multiply them up to 500+ items
ADJECTIVES = [
    "Premium", "Fresh", "Classic", "Selected", "Organic", "Rich taste", "Natural", 
    "Value Pack", "Super Value", "Imported Quality", "Daily Nutrition", "Home Pack"
]

delivery_times = ["9-11 Mins", "10-12 Mins", "12-15 Mins", "15-20 Mins"]

generated_count = 0
products_to_add = []

# Generate variations until we hit at least 500 products
while len(products_to_add) < 520:
    for base_template in PRODUCT_TEMPLATES:
        if len(products_to_add) >= 520:
            break
            
        # We want to create multiple variants for each base template
        for size in base_template["sizes"]:
            # Randomize variations slightly
            adj = random.choice(ADJECTIVES)
            name = f"{adj} {base_template['brand']} {base_template['base_name']}"
            
            # Pricing variations
            factor = 1.0
            if "500 ml" in size or "500 g" in size or "50 g" in size or "60 g" in size:
                factor = 0.6
            elif "1 L" in size or "1 kg" in size or "100 g" in size or "250 g" in size:
                factor = 1.0
            elif "2 L" in size or "2 kg" in size or "500 g" in size or "400 g" in size:
                factor = 1.8
            elif "5 kg" in size or "5 L" in size:
                factor = 4.2
            elif "10 kg" in size:
                factor = 8.0
                
            mrp = round(base_template["base_price"] * factor)
            # Add discount rate
            discount_pct = random.choice([0, 5, 10, 15, 20, 25, 30, 40])
            price = mrp
            discount_str = ""
            if discount_pct > 0:
                price = round(mrp * (1 - discount_pct / 100.0))
                discount_str = f"{discount_pct}% OFF"
                
            stock = random.choice([0, 4, 8, 15, 25, 40, 50])
            rating = round(random.uniform(4.0, 4.9), 1)
            review_count = random.randint(5, 450)
            
            # Construct a fully realistic item
            prod_data = {
                "name": name,
                "size": size,
                "price": price,
                "original_price": mrp,
                "icon": base_template["icon"],
                "images_list": f"{base_template['icon']},{base_template['icon']},{base_template['icon']}",
                "discount": discount_str,
                "brand": base_template["brand"],
                "category": base_template["category"],
                "description": f"High quality, premium {base_template['base_name']} selected by Blinkit experts. Centered product packaging with 100% freshness guarantee. Store in cool, dry conditions.",
                "stock": stock,
                "is_best_seller": random.choice([True, False, False, False]),
                "is_recommended": random.choice([True, False, False, False])
            }
            
            products_to_add.append(prod_data)

# Seed products into database
print(f"Generated {len(products_to_add)} products for seeder.")
for prod_data in products_to_add:
    db_prod = models.Product(**prod_data)
    db.add(db_prod)
db.commit()
print("Products seeded successfully!")

# Seed coupons
print("Seeding coupons...")
db.add(models.Coupon(code="SAVE50", discount_percentage=50, max_discount=100, min_order_value=150, description="Flat 50% Off up to ₹100 on your order!", is_active=True))
db.add(models.Coupon(code="WELCOME100", discount_percentage=20, max_discount=100, min_order_value=300, description="20% Off up to ₹100 on orders above ₹300!", is_active=True))
db.add(models.Coupon(code="FREEDEL", discount_percentage=10, max_discount=50, min_order_value=99, description="10% Off up to ₹50 on orders above ₹99!", is_active=True))
db.commit()

# Seed user
email = "mansi1997mahendru@gmail.com"
print(f"Creating user {email} inside the database...")
new_user = models.User(
    full_name="Mansi Mahendru",
    email=email,
    mobile="9999999999",
    hashed_password=hash_password("Password123"),
    is_active=True
)
db.add(new_user)
db.commit()
print("User created successfully!")

# Seed notification
print("Seeding initial notifications...")
db.add(models.Notification(
    user_id=str(new_user.id),
    title="Welcome to Blinkit Clone!",
    message="Enjoy flat 50% discount on fresh fruits & dairy products using code SAVE50."
))
db.commit()

db.close()
print("Complete database seed completed successfully!")
