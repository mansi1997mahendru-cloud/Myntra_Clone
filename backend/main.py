from fastapi import FastAPI, Depends, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Dict, Any
import os
import json
from datetime import datetime, timedelta
import random
import string
import uuid
from dotenv import load_dotenv
from openai import OpenAI
import jwt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests

load_dotenv()

import models
import schemas
from database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Blinkit Clone Backend API")

# Security Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "blinkit-super-secret-key-development-2026")
JWT_ALGORITHM = "HS256"

import bcrypt

# Lockout and rate limiting state (stored in-memory for demo/development simplicity)
failed_attempts_store: Dict[str, Dict[str, Any]] = {}

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    plain_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_bytes, hashed_bytes)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire, "refresh": True})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Optional[dict]:
    try:
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded_token
    except jwt.PyJWTError:
        return None

def verify_token_for_user(user_id: str, authorization: Optional[str] = Header(None)):
    # Bypass verification for mock/anonymous sessions
    if user_id.startswith("mock-uid-"):
        return
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    try:
        token = authorization.split(" ")[1]
        payload = decode_jwt_token(token)
        if not payload or payload.get("refresh") is True:
            raise HTTPException(status_code=401, detail="Invalid or Expired Token")
        token_sub = str(payload.get("sub"))
        if token_sub != user_id:
            raise HTTPException(status_code=403, detail="Access denied: User ID mismatch")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Token Format")

# Simulated local email inbox file
EMAIL_INBOX_FILE = "email_inbox.txt"

def send_real_email(to_email: str, subject: str, body_text: str) -> bool:
    # 1. Attempt sending via Resend API if API key is present
    resend_key = os.getenv("RESEND_API_KEY")
    if resend_key:
        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {resend_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": "Blinkit Clone <onboarding@resend.dev>",
                "to": [to_email],
                "subject": subject,
                "text": body_text
            }
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code in [200, 201]:
                print(f"Real email sent successfully via Resend API to {to_email}!")
                return True
            else:
                print(f"Resend API error: {response.status_code} - {response.text}")
        except Exception as resend_err:
            print(f"Failed to send email via Resend API: {str(resend_err)}")

    # 2. Fallback to standard SMTP if configured
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    
    if not smtp_host or not smtp_port or not smtp_user or not smtp_pass:
        print("Neither SMTP nor Resend variables are configured in backend/.env. Real email not sent.")
        return False
        
    try:
        port = int(smtp_port)
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body_text, 'plain', 'utf-8'))
        
        # Connect to SMTP server
        if port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port)
        else:
            server = smtplib.SMTP(smtp_host, port)
            server.starttls()
            
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_email, msg.as_string())
        server.quit()
        print(f"Real email sent successfully via SMTP to {to_email}!")
        return True
    except Exception as smtp_err:
        print(f"Failed to send real email via SMTP: {str(smtp_err)}")
        return False

def simulate_send_email(to_email: str, subject: str, body_text: str, body_html: str):
    # Log to terminal console (with encoding fallback to prevent crashes on Windows CP1252 console)
    try:
        safe_to = to_email.encode('ascii', 'replace').decode('ascii')
        safe_subject = subject.encode('ascii', 'replace').decode('ascii')
        safe_body = body_text.encode('ascii', 'replace').decode('ascii')
        print(f"\n================ [SIMULATED EMAIL SENT TO {safe_to}] ================")
        print(f"Subject: {safe_subject}")
        print(f"Body:\n{safe_body}")
        print("========================================================================\n")
    except Exception:
        pass
        
    # Attempt real email dispatch via SMTP
    send_real_email(to_email, subject, body_text)
    
    # Append to local email_inbox.txt log file (UTF-8 encoding preserves emojis)
    try:
        with open(EMAIL_INBOX_FILE, "a", encoding="utf-8") as f:
            f.write(f"\nTimestamp: {datetime.now().isoformat()}\n")
            f.write(f"To: {to_email}\n")
            f.write(f"Subject: {subject}\n")
            f.write(f"Text Content:\n{body_text}\n")
            f.write("------------------------------------------------------------------------\n")
    except Exception as e:
        print(f"Error writing to {EMAIL_INBOX_FILE}: {str(e)}")


# Configure CORS to allow connection from the Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initial dataset to seed the database (includes stock counts)
INITIAL_PRODUCTS = [
    # Best Sellers
    {
        "name": "Fresh Toned Milk",
        "size": "500 ml",
        "price": 27,
        "original_price": 30,
        "icon": "🥛",
        "discount": "10% OFF",
        "brand": "Amul",
        "category": "Dairy, Bread & Eggs",
        "description": "Fresh and pasteurized toned milk from Amul. High quality and nutritious for daily household consumption.",
        "stock": 25,
        "is_best_seller": True,
        "is_recommended": False
    },
    {
        "name": "Britannia Brown Bread",
        "size": "400 g",
        "price": 42,
        "original_price": 50,
        "icon": "🍞",
        "discount": "16% OFF",
        "brand": "Britannia",
        "category": "Dairy, Bread & Eggs",
        "description": "Healthy whole wheat brown bread, baked fresh and soft. Perfect source of daily dietary fiber.",
        "stock": 14,
        "is_best_seller": True,
        "is_recommended": False
    },
    {
        "name": "Amul Salted Butter",
        "size": "100 g",
        "price": 56,
        "original_price": 60,
        "icon": "🧈",
        "discount": "6% OFF",
        "brand": "Amul",
        "category": "Dairy, Bread & Eggs",
        "description": "Classic salted butter from Amul. Rich, creamy, and spreadable.",
        "stock": 18,
        "is_best_seller": True,
        "is_recommended": False
    },
    {
        "name": "Lay's Classic Salted",
        "size": "50 g",
        "price": 20,
        "original_price": 20,
        "icon": "🍟",
        "discount": "Best Price",
        "brand": "Lays",
        "category": "Snacks & Munchies",
        "description": "Crispy salted potato chips. Classic flavor, perfect snack for tea time or parties.",
        "stock": 40,
        "is_best_seller": True,
        "is_recommended": True
    },
    
    # Recommended / General
    {
        "name": "Fresh Country Tomatoes",
        "size": "500 g",
        "price": 34,
        "original_price": 45,
        "icon": "🍅",
        "discount": "24% OFF",
        "brand": "Local Farm",
        "category": "Fruits & Vegetables",
        "description": "Fresh red farm-picked tomatoes. Juiced with vitamins and organic sweetness.",
        "stock": 30,
        "is_best_seller": False,
        "is_recommended": True
    },
    {
        "name": "Coca-Cola Zero Sugar",
        "size": "750 ml",
        "price": 40,
        "original_price": 40,
        "icon": "🥤",
        "discount": "Popular",
        "brand": "Coca-Cola",
        "category": "Cold Drinks & Juices",
        "description": "Crisp and refreshing Coca-Cola flavor with zero calories and zero sugar.",
        "stock": 20,
        "is_best_seller": False,
        "is_recommended": True
    },
    {
        "name": "Oreo Chocolate Biscuits",
        "size": "120 g",
        "price": 30,
        "original_price": 35,
        "icon": "🍪",
        "discount": "14% OFF",
        "brand": "Oreo",
        "category": "Snacks & Munchies",
        "description": "Double chocolate cookies with a rich sweet vanilla cream center.",
        "stock": 5,
        "is_best_seller": False,
        "is_recommended": True
    },
    {
        "name": "Farm Fresh White Eggs",
        "size": "6 pcs",
        "price": 48,
        "original_price": 55,
        "icon": "🥚",
        "discount": "12% OFF",
        "brand": "Eggo",
        "category": "Dairy, Bread & Eggs",
        "description": "High protein farm fresh white eggs. Cleaned, sorted, and securely packaged.",
        "stock": 15,
        "is_best_seller": False,
        "is_recommended": True
    },
    {
        "name": "Maggi 2-Minute Noodles",
        "size": "70 g",
        "price": 14,
        "original_price": 14,
        "icon": "🍜",
        "discount": "Best Price",
        "brand": "Nestle",
        "category": "Instant & Frozen",
        "description": "The beloved instant noodles with magic tastemaker masala spices. Cooks in 2 minutes.",
        "stock": 50,
        "is_best_seller": False,
        "is_recommended": False
    },
    {
        "name": "Bru Instant Coffee",
        "size": "100 g",
        "price": 185,
        "original_price": 200,
        "icon": "☕",
        "discount": "7% OFF",
        "brand": "Bru",
        "category": "Tea & Coffee",
        "description": "Rich aroma premium quality instant coffee blend made from fine roasted coffee beans.",
        "stock": 8,
        "is_best_seller": False,
        "is_recommended": False
    },
    {
        "name": "Dettol Liquid Handwash",
        "size": "200 ml",
        "price": 99,
        "original_price": 110,
        "icon": "🧼",
        "discount": "10% OFF",
        "brand": "Dettol",
        "category": "Baby Care Products",
        "description": "Dettol Liquid Handwash protects against 99.9% germs, leaving hands clean and soft.",
        "stock": 12,
        "is_best_seller": False,
        "is_recommended": False
    },
    {
        "name": "Organic Bananas",
        "size": "500 g",
        "price": 45,
        "original_price": 50,
        "icon": "🍌",
        "discount": "10% OFF",
        "brand": "Local Farm",
        "category": "Fruits & Vegetables",
        "description": "Fresh, sweet, and healthy organic yellow bananas sourced from sustainable local farms.",
        "stock": 22,
        "is_best_seller": False,
        "is_recommended": False
    }
]

# Auto-seeding on startup
@app.on_event("startup")
def seed_database_if_empty():
    db = next(get_db())
    try:
        count = db.query(models.Product).count()
        if count == 0:
            print("Database empty. Auto-seeding default products...")
            for prod_data in INITIAL_PRODUCTS:
                db_prod = models.Product(**prod_data)
                db.add(db_prod)
            db.commit()
            print("Auto-seeding completed!")
    except Exception as e:
        print(f"Error seeding database on startup: {str(e)}")

# API Root / Health Check
@app.get("/")
def read_root():
    return {"status": "ok", "message": "Blinkit Search, Details & Cart API is running"}

# Seeding Endpoint
@app.post("/api/products/seed", response_model=List[schemas.ProductResponse])
def seed_products(db: Session = Depends(get_db)):
    db.query(models.Product).delete()
    db.commit()
    
    seeded_list = []
    for prod_data in INITIAL_PRODUCTS:
        db_prod = models.Product(**prod_data)
        db.add(db_prod)
        seeded_list.append(db_prod)
    
    db.commit()
    for item in seeded_list:
        db.refresh(item)
    return seeded_list

# Autocomplete Endpoint
@app.get("/api/products/autocomplete", response_model=List[str])
def get_autocomplete(q: str = Query("", min_length=1), db: Session = Depends(get_db)):
    if not q.strip():
        return []
    
    pattern = f"%{q}%"
    
    names = db.query(models.Product.name).filter(models.Product.name.ilike(pattern)).distinct().limit(5).all()
    categories = db.query(models.Product.category).filter(models.Product.category.ilike(pattern)).distinct().limit(3).all()
    brands = db.query(models.Product.brand).filter(models.Product.brand.ilike(pattern)).distinct().limit(3).all()
    
    suggestions = set()
    for n in names:
        suggestions.add(n[0])
    for c in categories:
        if c[0]:
            suggestions.add(c[0])
    for b in brands:
        if b[0]:
            suggestions.add(b[0])
            
    return list(sorted(suggestions))[:8]

# Search Endpoint
@app.get("/api/products/search", response_model=List[schemas.ProductResponse])
def search_products(q: str = Query(""), db: Session = Depends(get_db)):
    if not q.strip():
        return db.query(models.Product).limit(30).all()
    
    search_pattern = f"%{q}%"
    
    products = db.query(models.Product).filter(
        or_(
            models.Product.name.ilike(search_pattern),
            models.Product.brand.ilike(search_pattern),
            models.Product.category.ilike(search_pattern),
            models.Product.description.ilike(search_pattern)
        )
    ).all()
    
    return products

# Fetch Specific Product Details
@app.get("/api/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# Fetch Similar Products in the same category
@app.get("/api/products/{product_id}/similar", response_model=List[schemas.ProductResponse])
def get_similar_products(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    similar = db.query(models.Product).filter(
        models.Product.category == product.category,
        models.Product.id != product_id
    ).limit(5).all()
    
    return similar

# Fetch User Cart
@app.get("/api/cart/{user_id}", response_model=List[schemas.CartItemResponse])
def get_cart(user_id: str, db: Session = Depends(get_db)):
    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == user_id).all()
    return cart_items

# Save User Cart (Overwrite and Sync)
@app.post("/api/cart/{user_id}", response_model=List[schemas.CartItemResponse])
def update_cart(user_id: str, cart_updates: List[schemas.CartItemUpdate], db: Session = Depends(get_db)):
    try:
        # Delete old items
        db.query(models.CartItem).filter(models.CartItem.user_id == user_id).delete()
        
        # Insert updated items
        for update in cart_updates:
            if update.qty > 0:
                prod = db.query(models.Product).filter(models.Product.id == update.product_id).first()
                if prod:
                    db_item = models.CartItem(user_id=user_id, product_id=update.product_id, qty=update.qty)
                    db.add(db_item)
                    
        db.commit()
        return db.query(models.CartItem).filter(models.CartItem.user_id == user_id).all()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# AI Chat Assistant Endpoint
@app.post("/api/chat", response_model=schemas.ChatResponse)
def chat_assistant(req: schemas.ChatRequest, db: Session = Depends(get_db)):
    user_msg = req.message.strip()
    history = req.chat_history or []
    
    # 1. Fetch current inventory from database
    db_products = db.query(models.Product).all()
    
    # Format a concise summary of our products for the prompt context
    products_context = []
    for p in db_products:
        products_context.append({
            "id": p.id,
            "name": p.name,
            "brand": p.brand,
            "size": p.size,
            "price": p.price,
            "original_price": p.original_price,
            "category": p.category,
            "description": p.description,
            "stock": p.stock
        })
        
    # Check if API keys are present
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if not gemini_key and not openai_key:
        # --- RESILIENT FALLBACK: KEYWORD SEARCH ---
        words = user_msg.lower().split()
        matched_ids = []
        for word in words:
            if len(word) < 3:
                continue
            for p in db_products:
                if (word in p.name.lower() or 
                    (p.brand and word in p.brand.lower()) or 
                    (p.category and word in p.category.lower()) or 
                    (p.description and word in p.description.lower())):
                    if p.id not in matched_ids:
                        matched_ids.append(p.id)
                        
        matched_prods = [p for p in db_products if p.id in matched_ids]
        
        reply = (
            "⚠️ **No AI API Key is configured.**\n\n"
            "To unlock fully semantic chat responses (e.g. recipe ideas, budgets, ingredients matching), "
            "please set the `GEMINI_API_KEY` or `OPENAI_API_KEY` environment variable in a `.env` file in the `backend/` directory.\n\n"
            f"In the meantime, here are products matching keywords from your query **'{user_msg}'**:"
        )
        if not matched_prods:
            reply += "\n\nNo direct keyword matches found. Try searching for 'milk', 'bread', 'chips', or 'butter'!"
            
        return schemas.ChatResponse(reply=reply, products=matched_prods)

    try:
        # --- API CALL INITIALIZATION ---
        import httpx
        http_client = httpx.Client(verify=False)
        
        if gemini_key:
            client = OpenAI(
                api_key=gemini_key,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                http_client=http_client
            )
            model_name = "gemini-2.5-flash"
        else:
            client = OpenAI(
                api_key=openai_key,
                http_client=http_client
            )
            model_name = "gpt-4o-mini"
        
        # Prepare system prompt
        system_instruction = (
            "You are Blinkit AI, a helpful, friendly local grocery shopping assistant. "
            "Your goal is to guide users to find and select matching grocery products from our current inventory. "
            "Here is the complete inventory of products available in our database:\n"
            f"{json.dumps(products_context)}\n\n"
            "Rules:\n"
            "1. ONLY recommend products that exist in the inventory list above. Do not invent products.\n"
            "2. Understand queries about recipes, meals (like pasta, breakfast), dietary requests (healthy, sugar-free), and budgets (e.g. under ₹500).\n"
            "3. Format your response STRICTLY as a JSON object containing two keys:\n"
            "   - 'reply': A short, friendly markdown message explaining your suggestions (use bullet points, bold text, etc.).\n"
            "   - 'product_ids': A JSON array of integers representing the product IDs you recommend matching the request.\n"
            "4. Do not include any other text, no markdown code block fences (like ```json), no backticks. Reply ONLY with the raw JSON string so it can be parsed directly."
        )
        
        # Build messages including history
        messages = [{"role": "system", "content": system_instruction}]
        for h in history:
            role = "user" if h.get("sender") == "user" else "assistant"
            messages.append({"role": role, "content": h.get("text", "")})
            
        messages.append({"role": "user", "content": user_msg})
        
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.2
        )
        
        content = response.choices[0].message.content.strip()
        
        # Strip code block decorators if GPT returned them
        if content.startswith("```"):
            lines = content.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines).strip()
            
        result = json.loads(content)
        reply = result.get("reply", "Here are the matching products:")
        rec_ids = result.get("product_ids", [])
        
        # Fetch matching product details from DB
        matched_prods = db.query(models.Product).filter(models.Product.id.in_(rec_ids)).all()
        
        return schemas.ChatResponse(reply=reply, products=matched_prods)
        
    except Exception as e:
        print(f"Error calling OpenAI API: {str(e)}")
        words = user_msg.lower().split()
        matched_ids = []
        for word in words:
            if len(word) < 3:
                continue
            for p in db_products:
                if (word in p.name.lower() or 
                    (p.brand and word in p.brand.lower()) or 
                    (p.category and word in p.category.lower())):
                    if p.id not in matched_ids:
                        matched_ids.append(p.id)
        matched_prods = [p for p in db_products if p.id in matched_ids]
        
        err_msg = (
            f"⚠️ **AI Assistant is experiencing issues.** ({str(e)})\n\n"
            "We have fallen back to basic keyword matching. Here are some results:"
        )
        return schemas.ChatResponse(reply=err_msg, products=matched_prods)

# Stripe Payment intent creation
stripe_key = os.getenv("STRIPE_SECRET_KEY")
if stripe_key:
    import stripe
    stripe.api_key = stripe_key

@app.post("/api/orders/stripe-intent")
def create_stripe_intent(payload: dict):
    amount = payload.get("amount", 0)
    if not amount or amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
        
    if not os.getenv("STRIPE_SECRET_KEY"):
        # Return a mock clientSecret for Stripe Test Mode simulation
        return {"clientSecret": "mock_secret_intent_" + os.urandom(8).hex()}
        
    try:
        import stripe
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100), # amount in paise
            currency="inr",
            automatic_payment_methods={"enabled": True}
        )
        return {"clientSecret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Save Order in PostgreSQL
@app.post("/api/orders/{user_id}", response_model=schemas.OrderResponse)
def create_order(user_id: str, order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        db_order = models.Order(
            user_id=user_id,
            address=order_data.address,
            payment_method=order_data.payment_method,
            payment_status=order_data.payment_status,
            subtotal=order_data.subtotal,
            delivery_charge=order_data.delivery_charge,
            handling_charge=order_data.handling_charge,
            tip=order_data.tip,
            grand_total=order_data.grand_total,
            status="Placed"
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        
        for item in order_data.items:
            db_item = models.OrderItem(
                order_id=db_order.id,
                product_id=item.product_id,
                qty=item.qty,
                price=item.price
            )
            db.add(db_item)
            
            # Subtract from Product Stock
            prod = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if prod:
                prod.stock = max(0, prod.stock - item.qty)
                
        # Empty user's Cart on success
        db.query(models.CartItem).filter(models.CartItem.user_id == user_id).delete()
        
        db.commit()
        db.refresh(db_order)
        return db_order
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Fetch User Orders list
@app.get("/api/orders/{user_id}", response_model=List[schemas.OrderResponse])
def get_user_orders(user_id: str, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    verify_token_for_user(user_id, authorization)
    orders = db.query(models.Order).filter(models.Order.user_id == user_id).order_by(models.Order.created_at.desc()).all()
    return orders


# ================= AUTHENTICATION ENDPOINTS =================

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    try:
        token = authorization.split(" ")[1]
        payload = decode_jwt_token(token)
        if not payload or payload.get("refresh") is True:
            raise HTTPException(status_code=401, detail="Invalid or Expired Token")
        user_id = payload.get("sub")
        user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if not user.is_active:
            raise HTTPException(status_code=401, detail="Account is inactive")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Token Format")

@app.post("/api/auth/register")
def register_user(reg: schemas.UserRegister, db: Session = Depends(get_db)):
    if not reg.full_name or not reg.full_name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
        
    from email_validator import validate_email, EmailNotValidError
    try:
        validate_email(reg.email)
    except EmailNotValidError as e:
        raise HTTPException(status_code=400, detail=f"Invalid email: {str(e)}")
        
    import re
    cleaned_mobile = re.sub(r"\D", "", reg.mobile)
    if len(cleaned_mobile) != 10:
        raise HTTPException(status_code=400, detail="Mobile number must be exactly 10 digits")
        
    if len(reg.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    if not any(c.isdigit() for c in reg.password) or not any(c.isalpha() for c in reg.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one letter and one number")
        
    if reg.password != reg.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    if db.query(models.User).filter(models.User.email == reg.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered")
    if db.query(models.User).filter(models.User.mobile == cleaned_mobile).first():
        raise HTTPException(status_code=400, detail="Mobile number is already registered")
        
    otp = "".join(random.choices(string.digits, k=6))
    verification_token = str(uuid.uuid4())
    
    new_user = models.User(
        full_name=reg.full_name.strip(),
        email=reg.email.strip().lower(),
        mobile=cleaned_mobile,
        hashed_password=hash_password(reg.password),
        is_active=False,
        verification_otp=otp,
        verification_token=verification_token
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    verify_url = f"http://localhost:8000/api/auth/verify-link?token={verification_token}"
    body_text = (
        f"Hi {new_user.full_name},\n\n"
        f"Thank you for registering at Blinkit Clone! Please verify your email using either option below:\n\n"
        f"Option 1: Enter this 6-digit OTP code on the verification screen:\n"
        f"👉  {otp}  👈\n\n"
        f"Option 2: Click this link to activate your account directly:\n"
        f"🔗  {verify_url}\n\n"
        f"Regards,\nBlinkit Security Team"
    )
    simulate_send_email(new_user.email, "Verify Your Blinkit Account", body_text, "")
    
    return {"message": "Registration successful! Please check your email for the verification link/OTP."}

@app.post("/api/auth/verify")
def verify_user(payload: schemas.UserVerify, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_active:
        return {"message": "Account is already active."}
    if user.verification_otp != payload.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    user.is_active = True
    user.verification_otp = None
    user.verification_token = None
    db.commit()
    return {"message": "Account activated successfully! You can now log in."}

@app.post("/api/auth/resend-otp")
def resend_otp(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    user = db.query(models.User).filter(models.User.email == email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_active:
        return {"message": "Account is already active."}
        
    otp = "".join(random.choices(string.digits, k=6))
    user.verification_otp = otp
    db.commit()
    
    body_text = (
        f"Hi {user.full_name},\n\n"
        f"Here is your new 6-digit verification OTP code:\n"
        f"👉  {otp}  👈\n\n"
        f"Regards,\nBlinkit Security Team"
    )
    simulate_send_email(user.email, "Your New Blinkit Verification Code", body_text, "")
    return {"message": "Verification code resent successfully!"}


from fastapi.responses import HTMLResponse

@app.get("/api/auth/verify-link", response_class=HTMLResponse)
def verify_user_link(token: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        return """
        <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px;">
                <h2 style="color: #e11d48;">Verification Failed</h2>
                <p>The verification link is invalid or has expired.</p>
            </body>
        </html>
        """
        
    user.is_active = True
    user.verification_otp = None
    user.verification_token = None
    db.commit()
    
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px; background-color: #f9fafb;">
            <div style="max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="font-size: 48px; color: #16a34a; margin-bottom: 20px;">✓</div>
                <h2 style="color: #1f2937; margin: 0 0 10px 0;">Email Verified!</h2>
                <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px;">Hi {user.full_name}, your account is now active and ready. You can go back to the app and log in.</p>
                <a href="http://localhost:5173/login" style="display: inline-block; background-color: #059669; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">Go to Login</a>
            </div>
        </body>
    </html>
    """

@app.post("/api/auth/login", response_model=schemas.TokenSchema)
def login_user(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    login_id = payload.login_id.strip().lower()
    now = datetime.utcnow()
    
    if login_id in failed_attempts_store:
        tracker = failed_attempts_store[login_id]
        if tracker["lockout_until"] and tracker["lockout_until"] > now:
            seconds_left = int((tracker["lockout_until"] - now).total_seconds())
            raise HTTPException(
                status_code=403,
                detail=f"Too many failed login attempts. Locked out. Try again in {seconds_left} seconds."
            )
            
    import re
    cleaned_id = re.sub(r"\D", "", login_id)
    user = db.query(models.User).filter(
        or_(models.User.email == login_id, models.User.mobile == cleaned_id)
    ).first()
    
    def register_failure():
        if login_id not in failed_attempts_store:
            failed_attempts_store[login_id] = {"attempts": 0, "lockout_until": None}
            
        tracker = failed_attempts_store[login_id]
        tracker["attempts"] += 1
        
        if tracker["attempts"] >= 5:
            tracker["lockout_until"] = datetime.utcnow() + timedelta(minutes=5)
            tracker["attempts"] = 0
            raise HTTPException(
                status_code=403,
                detail="Too many failed attempts. Account locked for 5 minutes."
            )
        else:
            remaining = 5 - tracker["attempts"]
            raise HTTPException(
                status_code=400,
                detail=f"Invalid credentials. {remaining} attempts remaining before lockout."
            )
            
    if not user:
        register_failure()
        
    if user.lockout_until and user.lockout_until > now:
        seconds_left = int((user.lockout_until - now).total_seconds())
        raise HTTPException(
            status_code=403,
            detail=f"Account temporarily locked. Please try again in {seconds_left} seconds."
        )
        
    if not verify_password(payload.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.lockout_until = datetime.utcnow() + timedelta(minutes=5)
            user.failed_login_attempts = 0
            db.commit()
            raise HTTPException(
                status_code=403,
                detail="Too many failed attempts. Account locked for 5 minutes."
            )
        db.commit()
        register_failure()
        
    if not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Account inactive. Please complete your email verification first."
        )
        
    user.failed_login_attempts = 0
    user.lockout_until = None
    db.commit()
    if login_id in failed_attempts_store:
        del failed_attempts_store[login_id]
        
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@app.post("/api/auth/refresh")
def refresh_token(payload: dict, db: Session = Depends(get_db)):
    ref_token = payload.get("refresh_token")
    if not ref_token:
        raise HTTPException(status_code=400, detail="Missing refresh token")
        
    decoded = decode_jwt_token(ref_token)
    if not decoded or decoded.get("refresh") is not True:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    user_id = decoded.get("sub")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
        
    new_access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@app.post("/api/auth/forgot-password")
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.strip().lower()).first()
    if not user:
        return {"message": "If the email is registered, a password reset link has been sent."}
        
    reset_token = str(uuid.uuid4())
    user.reset_token = reset_token
    db.commit()
    
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
    body_text = (
        f"Hi {user.full_name},\n\n"
        f"We received a request to reset your password for your Blinkit account.\n"
        f"Please click the link below to set a new password:\n\n"
        f"🔗  {reset_url}\n\n"
        f"If you did not request this, you can safely ignore this email.\n\n"
        f"Regards,\nBlinkit Security Team"
    )
    simulate_send_email(user.email, "Reset Your Blinkit Password", body_text, "")
    
    return {"message": "If the email is registered, a password reset link has been sent."}

@app.post("/api/auth/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.reset_token == payload.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token")
        
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    user.hashed_password = hash_password(payload.password)
    user.reset_token = None
    user.failed_login_attempts = 0
    user.lockout_until = None
    db.commit()
    
    return {"message": "Password changed successfully! You can now log in with your new password."}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_current_user_profile(user: models.User = Depends(get_current_user)):
    return user

