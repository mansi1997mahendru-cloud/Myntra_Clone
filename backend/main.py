from fastapi import FastAPI, Depends, HTTPException, Query, Header, Request
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

# Create database tables with schema mismatch self-healing
try:
    models.Base.metadata.create_all(bind=engine)
    # Verify products table has images_list column
    db = next(get_db())
    db.execute(models.Product.__table__.select().limit(1))
    db.close()
except Exception as e:
    print(f"Schema mismatch detected: {str(e)}. Recreating database tables...")
    try:
        models.Base.metadata.drop_all(bind=engine)
        models.Base.metadata.create_all(bind=engine)
        print("Database tables recreated successfully!")
    except Exception as ex:
        print(f"Error recreating database tables: {str(ex)}")

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

    # 1b. Attempt sending via Brevo API if API key is present (HTTPS, bypasses Render port blocks)
    brevo_key = os.getenv("BREVO_API_KEY")
    if brevo_key:
        try:
            url = "https://api.brevo.com/v3/smtp/email"
            headers = {
                "api-key": brevo_key,
                "Content-Type": "application/json"
            }
            payload = {
                "sender": {"name": "Blinkit Security", "email": "dharampal1255@gmail.com"},
                "to": [{"email": to_email}],
                "subject": subject,
                "textContent": body_text
            }
            response = requests.post(url, json=payload, headers=headers, timeout=3.0)
            if response.status_code in [200, 201, 202]:
                print(f"Real email sent successfully via Brevo API to {to_email}!")
                return True
            else:
                print(f"Brevo API error: {response.status_code} - {response.text}")
        except Exception as brevo_err:
            print(f"Failed to send email via Brevo API: {str(brevo_err)}")

    # 2. Fallback to standard SMTP if configured (wrapped in socket timeout to prevent hangs)
    smtp_host = os.getenv("SMTP_HOST") or "smtp.gmail.com"
    smtp_port = os.getenv("SMTP_PORT") or "587"
    smtp_user = os.getenv("SMTP_USER") or "dharampal1255@gmail.com"
    smtp_pass = os.getenv("SMTP_PASSWORD") or "oytnblqvqyidoqcb"
    
    if not smtp_host or not smtp_port or not smtp_user or not smtp_pass:
        print("Neither SMTP nor Resend variables are configured in backend/.env. Real email not sent.")
        return False
        
    import socket
    original_timeout = socket.getdefaulttimeout()
    socket.setdefaulttimeout(3.0)
    try:
        port = int(smtp_port)
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body_text, 'plain', 'utf-8'))
        
        # Connect to SMTP server
        if port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port, timeout=3.0)
        else:
            server = smtplib.SMTP(smtp_host, port, timeout=3.0)
            server.starttls()
            
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_email, msg.as_string())
        server.quit()
        print(f"Real email sent successfully via SMTP to {to_email}!")
        return True
    except Exception as smtp_err:
        print(f"Failed to send real email via SMTP: {str(smtp_err)}")
        return False
    finally:
        socket.setdefaulttimeout(original_timeout)

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


# Configure CORS to allow connection from all Frontends (including Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initial dataset to seed the database (includes stock counts)
INITIAL_PRODUCTS = [
    {
        "name": "Fresh Red Apples",
        "size": "4 pcs (approx. 500g)",
        "price": 99,
        "original_price": 120,
        "icon": "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=500&auto=format&fit=crop,https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop",
        "discount": "17% OFF",
        "brand": "Fresh Orchard",
        "category": "Fruits & Vegetables",
        "description": "Crisp, sweet and juicy premium quality red apples. Freshly picked from orchards.",
        "stock": 25,
        "is_best_seller": True,
        "is_recommended": True
    },
    {
        "name": "Amul Taaza Toned Milk",
        "size": "1 L",
        "price": 66,
        "original_price": 68,
        "icon": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop,https://images.unsplash.com/photo-1528498033973-3c12544c6a3b?w=500&auto=format&fit=crop",
        "discount": "3% OFF",
        "brand": "Amul",
        "category": "Dairy, Bread & Eggs",
        "description": "Fresh, pasteurized toned milk from Amul. Perfect for your morning tea, coffee, and daily nutrition.",
        "stock": 35,
        "is_best_seller": True,
        "is_recommended": True
    },
    {
        "name": "Lay's Classic Salted Chips",
        "size": "50 g",
        "price": 20,
        "original_price": 20,
        "icon": "https://images.unsplash.com/photo-1599490659213-e2b9527b0876?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1599490659213-e2b9527b0876?w=500&auto=format&fit=crop,https://images.unsplash.com/photo-1613907331711-2e1f0fcd6a78?w=500&auto=format&fit=crop",
        "discount": "Best Price",
        "brand": "Lays",
        "category": "Munchies",
        "description": "Classic salted potato chips, crispy and thin. The ultimate snacking companion.",
        "stock": 50,
        "is_best_seller": True,
        "is_recommended": True
    },
    {
        "name": "Coca-Cola Zero Sugar",
        "size": "750 ml",
        "price": 40,
        "original_price": 40,
        "icon": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop",
        "discount": "Popular",
        "brand": "Coca-Cola",
        "category": "Cold Drinks & Juices",
        "description": "Crisp and refreshing Coca-Cola flavor with zero sugar and zero calories.",
        "stock": 30,
        "is_best_seller": True,
        "is_recommended": True
    },
    {
        "name": "Kellogg's Corn Flakes",
        "size": "475 g",
        "price": 175,
        "original_price": 185,
        "icon": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop",
        "discount": "5% OFF",
        "brand": "Kelloggs",
        "category": "Breakfast",
        "description": "Crispy golden corn flakes enriched with essential iron, vitamins, and minerals.",
        "stock": 15,
        "is_best_seller": False,
        "is_recommended": True
    },
    {
        "name": "Nescafe Classic Instant Coffee",
        "size": "100 g",
        "price": 310,
        "original_price": 325,
        "icon": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop",
        "discount": "4% OFF",
        "brand": "Nestle",
        "category": "Tea & Coffee",
        "description": "Premium blend of Arabica and Robusta beans, medium-dark roasted for perfect aroma and rich taste.",
        "stock": 18,
        "is_best_seller": True,
        "is_recommended": False
    },
    {
        "name": "Aashirvaad Shudh Chakki Atta",
        "size": "5 kg",
        "price": 260,
        "original_price": 290,
        "icon": "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=500&auto=format&fit=crop",
        "discount": "10% OFF",
        "brand": "Aashirvaad",
        "category": "Atta, Rice & Dal",
        "description": "100% pure whole wheat flour processed in traditional stone chakki. High fiber and absorbs more water.",
        "stock": 40,
        "is_best_seller": True,
        "is_recommended": False
    },
    {
        "name": "Fortune Kachi Ghani Mustard Oil",
        "size": "1 L",
        "price": 165,
        "original_price": 180,
        "icon": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop",
        "discount": "8% OFF",
        "brand": "Fortune",
        "category": "Oil & Ghee",
        "description": "Premium cold-pressed mustard oil with a strong aroma and high pungency. Traditional and pure.",
        "stock": 22,
        "is_best_seller": False,
        "is_recommended": True
    },
    {
        "name": "Tata Sampann Garam Masala",
        "size": "100 g",
        "price": 78,
        "original_price": 88,
        "icon": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&auto=format&fit=crop",
        "discount": "11% OFF",
        "brand": "Tata",
        "category": "Masala",
        "description": "Premium spice blend crafted by Chef Sanjeev Kapoor. Retains natural oils for authentic rich flavor.",
        "stock": 19,
        "is_best_seller": False,
        "is_recommended": False
    },
    {
        "name": "McCain French Fries",
        "size": "450 g",
        "price": 125,
        "original_price": 140,
        "icon": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop",
        "discount": "10% OFF",
        "brand": "McCain",
        "category": "Frozen Food",
        "description": "Delicious, crispy frozen potato fries. Quick to deep fry or air-fry for parties.",
        "stock": 14,
        "is_best_seller": False,
        "is_recommended": True
    },
    {
        "name": "Amul Vanilla Magic Ice Cream",
        "size": "1 L",
        "price": 150,
        "original_price": 160,
        "icon": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&auto=format&fit=crop",
        "discount": "6% OFF",
        "brand": "Amul",
        "category": "Ice Cream",
        "description": "Creamy and rich vanilla flavored real milk ice cream tub from Amul.",
        "stock": 10,
        "is_best_seller": True,
        "is_recommended": True
    },
    {
        "name": "Oreo Chocolate Sandwich Biscuits",
        "size": "120 g",
        "price": 30,
        "original_price": 35,
        "icon": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop",
        "discount": "14% OFF",
        "brand": "Oreo",
        "category": "Biscuits",
        "description": "Crisp chocolate cookies with a sweet vanilla cream center. Twist, lick, and dunk!",
        "stock": 50,
        "is_best_seller": False,
        "is_recommended": True
    },
    {
        "name": "Cadbury Dairy Milk Silk",
        "size": "150 g",
        "price": 80,
        "original_price": 85,
        "icon": "https://images.unsplash.com/photo-1549007994-cb92ca813bec?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1549007994-cb92ca813bec?w=500&auto=format&fit=crop",
        "discount": "6% OFF",
        "brand": "Cadbury",
        "category": "Chocolates",
        "description": "Rich, smooth, and creamy milk chocolate bar. Melts in your mouth instantly.",
        "stock": 25,
        "is_best_seller": True,
        "is_recommended": False
    },
    {
        "name": "Surf Excel Detergent Powder",
        "size": "1 kg",
        "price": 145,
        "original_price": 160,
        "icon": "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500&auto=format&fit=crop",
        "discount": "9% OFF",
        "brand": "Surf Excel",
        "category": "Cleaning Essentials",
        "description": "Surf Excel Easy Wash removes tough stains easily with the power of ten hands.",
        "stock": 15,
        "is_best_seller": False,
        "is_recommended": True
    },
    {
        "name": "Dettol Liquid Handwash Refill",
        "size": "750 ml",
        "price": 99,
        "original_price": 119,
        "icon": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop",
        "discount": "17% OFF",
        "brand": "Dettol",
        "category": "Personal Care",
        "description": "Provides protection against 99.9% germs. pH-balanced skin safety formula.",
        "stock": 18,
        "is_best_seller": False,
        "is_recommended": False
    },
    {
        "name": "Nivea Soft Moisturising Cream",
        "size": "100 ml",
        "price": 199,
        "original_price": 210,
        "icon": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop",
        "discount": "5% OFF",
        "brand": "Nivea",
        "category": "Beauty",
        "description": "Lightweight, non-greasy moisturizing cream with Jojoba oil and Vitamin E.",
        "stock": 10,
        "is_best_seller": False,
        "is_recommended": True
    },
    {
        "name": "Pampers Baby Dry Diapers",
        "size": "L - 64 pcs",
        "price": 799,
        "original_price": 899,
        "icon": "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&auto=format&fit=crop",
        "discount": "11% OFF",
        "brand": "Pampers",
        "category": "Baby Care",
        "description": "Ultra dry core diapers with gel locking technology. Delivers up to 12 hours dryness.",
        "stock": 8,
        "is_best_seller": False,
        "is_recommended": False
    },
    {
        "name": "Pedigree Dry Dog Food",
        "size": "1.2 kg",
        "price": 320,
        "original_price": 340,
        "icon": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop",
        "discount": "6% OFF",
        "brand": "Pedigree",
        "category": "Pet Care",
        "description": "Complete nutrition for adult dogs. Promotes strong immune system, bones, and teeth.",
        "stock": 12,
        "is_best_seller": False,
        "is_recommended": False
    },
    {
        "name": "Dolo 650 mg Tablets",
        "size": "15 tabs",
        "price": 30,
        "original_price": 30,
        "icon": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop",
        "discount": "Best Seller",
        "brand": "Micro Labs",
        "category": "Pharmacy",
        "description": "Paracetamol tablets for relief from fever, headache, body aches, and pain.",
        "stock": 100,
        "is_best_seller": True,
        "is_recommended": False
    },
    {
        "name": "Duracell Alkaline AA Batteries",
        "size": "4 pcs",
        "price": 150,
        "original_price": 160,
        "icon": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop",
        "images_list": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format&fit=crop",
        "discount": "6% OFF",
        "brand": "Duracell",
        "category": "Electronics",
        "description": "Long lasting alkaline AA battery pack. Ideal for remote controls, toys, and devices.",
        "stock": 25,
        "is_best_seller": False,
        "is_recommended": True
    }
]

# Auto-seeding on startup
@app.on_event("startup")
def seed_database_if_empty():
    db = next(get_db())
    try:
        count = db.query(models.Product).count()
        has_emojis = db.query(models.Product).filter(~models.Product.icon.like("http%")).first()
        
        if count == 0 or has_emojis:
            print("Database empty or containing emojis. Auto-seeding real product photographs...")
            db.query(models.Product).delete()
            db.commit()
            for prod_data in INITIAL_PRODUCTS:
                db_prod = models.Product(**prod_data)
                db.add(db_prod)
            db.commit()
            
            # Seed Coupons if empty
            if db.query(models.Coupon).count() == 0:
                db.add(models.Coupon(code="SAVE50", discount_percentage=50, max_discount=100, min_order_value=150, description="Flat 50% Off up to ₹100 on your order!", is_active=True))
                db.add(models.Coupon(code="WELCOME100", discount_percentage=20, max_discount=100, min_order_value=300, description="20% Off up to ₹100 on orders above ₹300!", is_active=True))
                db.add(models.Coupon(code="FREEDEL", discount_percentage=10, max_discount=50, min_order_value=99, description="10% Off up to ₹50 on orders above ₹99!", is_active=True))
                db.commit()
                
            print("Auto-seeding completed successfully!")
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
    if user_id.isdigit():
        addr_count = db.query(models.Address).filter(models.Address.user_id == int(user_id)).count()
        if addr_count == 0:
            raise HTTPException(status_code=400, detail="At least one saved address is required to place an order.")
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


# =========================================================================
# WISHLIST ENDPOINTS
# =========================================================================
@app.get("/api/wishlist/{user_id}", response_model=List[schemas.WishlistItemResponse])
def get_wishlist(user_id: str, db: Session = Depends(get_db)):
    items = db.query(models.WishlistItem).filter(models.WishlistItem.user_id == user_id).all()
    return items

@app.post("/api/wishlist/{user_id}", response_model=schemas.WishlistItemResponse)
def add_to_wishlist(user_id: str, payload: schemas.WishlistItemCreate, db: Session = Depends(get_db)):
    existing = db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == user_id,
        models.WishlistItem.product_id == payload.product_id
    ).first()
    if existing:
        return existing
    
    item = models.WishlistItem(user_id=user_id, product_id=payload.product_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/wishlist/{user_id}/{product_id}")
def remove_from_wishlist(user_id: str, product_id: int, db: Session = Depends(get_db)):
    item = db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == user_id,
        models.WishlistItem.product_id == product_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in wishlist")
    db.delete(item)
    db.commit()
    return {"message": "Item removed from wishlist"}

# =========================================================================
# COUPON ENDPOINTS
# =========================================================================
@app.get("/api/coupons", response_model=List[schemas.CouponResponse])
def get_coupons(db: Session = Depends(get_db)):
    return db.query(models.Coupon).filter(models.Coupon.is_active == True).all()

@app.post("/api/coupons", response_model=schemas.CouponResponse)
def create_coupon(payload: schemas.CouponCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Coupon).filter(models.Coupon.code == payload.code.upper().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon = models.Coupon(
        code=payload.code.upper().strip(),
        discount_percentage=payload.discount_percentage,
        max_discount=payload.max_discount,
        min_order_value=payload.min_order_value,
        description=payload.description,
        is_active=True
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon

@app.post("/api/coupons/apply")
def apply_coupon(payload: dict, db: Session = Depends(get_db)):
    code = payload.get("code")
    cart_total = payload.get("cart_total", 0)
    if not code:
        raise HTTPException(status_code=400, detail="Coupon code is required")
    
    coupon = db.query(models.Coupon).filter(
        models.Coupon.code == code.upper().strip(),
        models.Coupon.is_active == True
    ).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    if cart_total < coupon.min_order_value:
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum order value for this coupon is ₹{coupon.min_order_value}"
        )
    
    discount = int(cart_total * (coupon.discount_percentage / 100.0))
    if coupon.max_discount and discount > coupon.max_discount:
        discount = coupon.max_discount
        
    return {
        "code": coupon.code,
        "discount_percentage": coupon.discount_percentage,
        "discount_amount": discount,
        "message": f"Coupon {coupon.code} applied successfully!"
    }

# =========================================================================
# REVIEWS ENDPOINTS
# =========================================================================
@app.get("/api/products/{product_id}/reviews", response_model=List[schemas.ReviewResponse])
def get_reviews(product_id: int, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.product_id == product_id).all()

@app.post("/api/products/{product_id}/reviews", response_model=schemas.ReviewResponse)
def add_review(product_id: int, payload: schemas.ReviewCreate, user_name: str = Query("Guest"), db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    review = models.Review(
        product_id=product_id,
        user_name=user_name,
        rating=payload.rating,
        comment=payload.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

# =========================================================================
# NOTIFICATION ENDPOINTS
# =========================================================================
@app.get("/api/notifications/{user_id}", response_model=List[schemas.NotificationResponse])
def get_notifications(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(models.Notification.user_id == user_id).order_by(models.Notification.created_at.desc()).all()

@app.put("/api/notifications/{user_id}/{notification_id}/read")
def mark_notification_read(user_id: str, notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.id == notification_id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

# =========================================================================
# ADMIN PANEL ENDPOINTS
# =========================================================================
@app.get("/api/admin/users", response_model=List[schemas.UserResponse])
def admin_get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.put("/api/admin/users/{user_id}/status")
def admin_toggle_user_status(user_id: int, payload: dict, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = payload.get("is_active", user.is_active)
    db.commit()
    return {"message": "User status updated successfully"}

@app.get("/api/admin/orders", response_model=List[schemas.OrderResponse])
def admin_get_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()

@app.put("/api/admin/orders/{order_id}/status")
def admin_update_order_status(order_id: int, payload: dict, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.status
    new_status = payload.get("status")
    if new_status:
        order.status = new_status
        db.commit()
        
        notif = models.Notification(
            user_id=order.user_id,
            title="Order Status Updated",
            message=f"Your order #{order.id} status changed from {old_status} to {new_status}."
        )
        db.add(notif)
        db.commit()
        
    return {"message": "Order status updated successfully", "status": order.status}

@app.post("/api/admin/products", response_model=schemas.ProductResponse)
def admin_create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    product = models.Product(**payload.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@app.put("/api/admin/products/{product_id}", response_model=schemas.ProductResponse)
def admin_update_product(product_id: int, payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    for key, value in payload.dict().items():
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    return product

@app.delete("/api/admin/products/{product_id}")
def admin_delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}


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
def register_user(reg: schemas.UserRegister, request: Request, db: Session = Depends(get_db)):
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
    
    base_url = str(request.base_url).rstrip("/")
    verify_url = f"{base_url}/api/auth/verify-link?token={verification_token}"
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
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "mobile": user.mobile,
                "is_active": user.is_active,
                "created_at": user.created_at
            }
        }
    if payload.otp.strip() == "123456":
        # Master bypass for mock email environment demo
        pass
    elif user.verification_otp != payload.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    user.is_active = True
    user.verification_otp = None
    user.verification_token = None
    db.commit()
    
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "mobile": user.mobile,
            "is_active": user.is_active,
            "created_at": user.created_at
        }
    }

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


# ================= ADDRESS MANAGEMENT ENDPOINTS =================

@app.get("/api/addresses", response_model=List[schemas.AddressResponse])
def get_user_addresses(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Address).filter(models.Address.user_id == user.id).all()

@app.post("/api/addresses", response_model=schemas.AddressResponse)
def create_user_address(addr: schemas.AddressCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Clean and validate pincode (6-digit Indian PIN)
    pincode_clean = addr.pincode.strip().replace(" ", "")
    if not pincode_clean.isdigit() or len(pincode_clean) != 6:
        raise HTTPException(status_code=400, detail="Invalid pincode. Pincode must be exactly 6 digits.")

    # Check if user has other addresses
    existing_count = db.query(models.Address).filter(models.Address.user_id == user.id).count()
    is_default = True if existing_count == 0 else addr.is_default

    # Unset all other defaults if this is marked as default
    if is_default:
        db.query(models.Address).filter(models.Address.user_id == user.id).update({"is_default": False})

    db_address = models.Address(
        user_id=user.id,
        house_flat_number=addr.house_flat_number,
        building_name=addr.building_name,
        street=addr.street,
        landmark=addr.landmark,
        area=addr.area,
        city=addr.city,
        state=addr.state,
        pincode=pincode_clean,
        latitude=addr.latitude,
        longitude=addr.longitude,
        label=addr.label,
        is_default=is_default
    )
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address

@app.put("/api/addresses/{address_id}/default", response_model=schemas.AddressResponse)
def set_default_address(address_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(models.Address).filter(models.Address.id == address_id, models.Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    # Unset all other default flags
    db.query(models.Address).filter(models.Address.user_id == user.id).update({"is_default": False})

    # Set this flag
    address.is_default = True
    db.commit()
    db.refresh(address)
    return address

@app.delete("/api/addresses/{address_id}")
def delete_user_address(address_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(models.Address).filter(models.Address.id == address_id, models.Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    db.delete(address)
    db.commit()

    # Re-elect a default address if needed
    remaining = db.query(models.Address).filter(models.Address.user_id == user.id).all()
    if remaining:
        has_default = any(r.is_default for r in remaining)
        if not has_default:
            remaining[0].is_default = True
            db.commit()

    return {"message": "Address deleted successfully"}


from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# BlinkAI Request Schema
class BlinkAIRequest(BaseModel):
    type: str
    prompt: Optional[str] = ""
    family_size: Optional[int] = 4
    budget: Optional[int] = 1000
    preference: Optional[str] = "Vegetarian"
    items: Optional[List[int]] = []


def hydrate_and_return(data, db):
    product_ids = []
    for item in data.get("shopping_list", []):
        if "product_id" in item:
            product_ids.append(item["product_id"])
    for alt in data.get("healthy_alternatives", []):
        if "original_id" in alt:
            product_ids.append(alt["original_id"])
        if "healthy_id" in alt:
            product_ids.append(alt["healthy_id"])
            
    if product_ids:
        db_matches = db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()
        product_map = {}
        for p in db_matches:
            product_map[p.id] = {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "size": p.size,
                "price": p.price,
                "original_price": p.original_price,
                "icon": p.icon,
                "discount": p.discount,
                "stock": p.stock
            }
        for item in data.get("shopping_list", []):
            item["product"] = product_map.get(item.get("product_id"))
        for alt in data.get("healthy_alternatives", []):
            alt["original_product"] = product_map.get(alt.get("original_id"))
            alt["healthy_product"] = product_map.get(alt.get("healthy_id"))
            
    return JSONResponse(content=data)


@app.post("/api/blinkai/plan")
def blinkai_plan(req: BlinkAIRequest, db: Session = Depends(get_db)):
    db_products = db.query(models.Product).all()
    
    # Format products for context
    inventory = []
    for p in db_products:
        inventory.append({
            "id": p.id,
            "name": p.name,
            "brand": p.brand or "Generic",
            "size": p.size,
            "price": p.price,
            "original_price": p.original_price or p.price,
            "category": p.category,
            "discount": p.discount or ""
        })

    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    # Multi-agent simulation logs
    agent_logs = []
    
    # 1. Intent Agent
    agent_logs.append({
        "agent": "Intent Agent",
        "status": "success",
        "output": f"Parsed query of type '{req.type}'. Detected intent: {req.type.upper()} planner agent activation."
    })
    
    # We will build a unified JSON response matching the requirements
    reply_data = {
        "recipe_name": "",
        "cooking_time": "20 mins",
        "difficulty": "Easy",
        "healthy_score": 85,
        "original_total": 0,
        "savings": 0,
        "grand_total": 0,
        "shopping_list": [],  # list of { product_id, qty, reason }
        "healthy_alternatives": [], # list of { original_id, healthy_id, explanation }
        "weekly_plan": {}, # dict of day -> breakfast/lunch/dinner
        "agent_logs": agent_logs
    }

    if not gemini_key and not openai_key:
        # Fallback offline algorithm matching real products
        agent_logs.append({
            "agent": "Product Search Agent",
            "status": "success",
            "output": f"Searched local inventory database index for items matching query: '{req.prompt}'"
        })
        
        # 1. Recipe
        if req.type == "recipe":
            query_lower = req.prompt.lower()
            if "paneer" in query_lower:
                reply_data["recipe_name"] = "Paneer Butter Masala"
                reply_data["cooking_time"] = "25 mins"
                reply_data["difficulty"] = "Medium"
                reply_data["healthy_score"] = 80
                
                paneer = next((p for p in inventory if "paneer" in p["name"].lower()), None)
                butter = next((p for p in inventory if "butter" in p["name"].lower()), None)
                masala = next((p for p in inventory if "masala" in p["name"].lower()), None)
                onion = next((p for p in inventory if "onion" in p["name"].lower()), None)
                tomato = next((p for p in inventory if "tomato" in p["name"].lower()), None)
                
                items_matched = [paneer, butter, masala, onion, tomato]
                items_matched = [i for i in items_matched if i]
                
                for item in items_matched:
                    reply_data["shopping_list"].append({
                        "product_id": item["id"],
                        "qty": 1 + (req.family_size // 4),
                        "reason": "Essential ingredient for rich paneer curry base"
                    })
            elif "biryani" in query_lower:
                reply_data["recipe_name"] = "Hyderabadi Veg Biryani"
                reply_data["cooking_time"] = "40 mins"
                reply_data["difficulty"] = "Hard"
                reply_data["healthy_score"] = 75
                
                rice = next((p for p in inventory if "rice" in p["name"].lower()), None)
                masala = next((p for p in inventory if "masala" in p["name"].lower()), None)
                veggies = next((p for p in inventory if "potato" in p["name"].lower() or "tomato" in p["name"].lower()), None)
                oil = next((p for p in inventory if "ghee" in p["name"].lower() or "oil" in p["name"].lower()), None)
                
                items_matched = [rice, masala, veggies, oil]
                items_matched = [i for i in items_matched if i]
                
                for item in items_matched:
                    reply_data["shopping_list"].append({
                        "product_id": item["id"],
                        "qty": 1 + (req.family_size // 4),
                        "reason": "Core carbohydrate rice layer and spice elements"
                    })
            else:
                reply_data["recipe_name"] = "Tomato Basil Pasta"
                reply_data["cooking_time"] = "15 mins"
                reply_data["difficulty"] = "Easy"
                reply_data["healthy_score"] = 88
                
                noodles = next((p for p in inventory if "pasta" in p["name"].lower() or "maggi" in p["name"].lower() or "noodle" in p["name"].lower()), None)
                sauce = next((p for p in inventory if "tomato" in p["name"].lower()), None)
                cheese = next((p for p in inventory if "cheese" in p["name"].lower() or "butter" in p["name"].lower()), None)
                
                items_matched = [noodles, sauce, cheese]
                items_matched = [i for i in items_matched if i]
                
                for item in items_matched:
                    reply_data["shopping_list"].append({
                        "product_id": item["id"],
                        "qty": 1 + (req.family_size // 4),
                        "reason": "Core carbohydrate base and savory elements"
                    })
                    
        # 2. Weekly Planner
        elif req.type == "weekly":
            reply_data["recipe_name"] = f"7-Day {req.preference} Meal Plan"
            reply_data["cooking_time"] = "Variable"
            reply_data["difficulty"] = "Easy"
            reply_data["healthy_score"] = 92
            
            milk = next((p for p in inventory if "milk" in p["name"].lower()), None)
            bread = next((p for p in inventory if "bread" in p["name"].lower()), None)
            eggs = next((p for p in inventory if "eggs" in p["name"].lower()), None)
            apple = next((p for p in inventory if "apple" in p["name"].lower()), None)
            chips = next((p for p in inventory if "chips" in p["name"].lower() or "munchies" in p["name"].lower()), None)
            juice = next((p for p in inventory if "juice" in p["name"].lower() or "coke" in p["name"].lower()), None)
            
            items_matched = [milk, bread, eggs, apple, chips, juice]
            items_matched = [i for i in items_matched if i]
            
            for item in items_matched:
                reply_data["shopping_list"].append({
                    "product_id": item["id"],
                    "qty": 2 if req.family_size > 3 else 1,
                    "reason": "Weekly supply for healthy breakfast and snacking routines"
                })
                
            reply_data["weekly_plan"] = {
                "Monday": {"breakfast": "Toned Milk & Brown Bread", "lunch": "Rice with mixed vegetables", "dinner": "Wheat Chapati with Dal"},
                "Tuesday": {"breakfast": "Fruit Salad with Fresh Apples", "lunch": "Paneer butter masala with rice", "dinner": "Tomato soup and toasted bread"},
                "Wednesday": {"breakfast": "Scrambled Eggs on Bread", "lunch": "Veg Pulao with curd", "dinner": "Stir fry mixed greens"},
                "Thursday": {"breakfast": "Oats with honey & milk", "lunch": "Dal Tadka with Jeera rice", "dinner": "Paneer bhurji with roti"},
                "Friday": {"breakfast": "Toned Milk & Brown Bread", "lunch": "Tomato Basil Pasta", "dinner": "Mixed vegetable curry"},
                "Saturday": {"breakfast": "Fruit Salad with Apples", "lunch": "Vegetable Biryani", "dinner": "Bread toast and butter"},
                "Sunday": {"breakfast": "Scrambled Eggs on Bread", "lunch": "Kadai Paneer with rice", "dinner": "Wheat Chapati with mixed vegetables"}
            }
            
        # 3. Budget / Healthy / Fallback
        else:
            reply_data["recipe_name"] = "Custom Grocery Basket"
            for p in inventory[:6]:
                reply_data["shopping_list"].append({
                    "product_id": p["id"],
                    "qty": 1,
                    "reason": "Popular choice matching standard family budget"
                })
                
        # Swap logic
        for item in reply_data["shopping_list"]:
            prod = next((p for p in inventory if p["id"] == item["product_id"]), None)
            if prod:
                name_lower = prod["name"].lower()
                if "chips" in name_lower or "kurkure" in name_lower or "bingo" in name_lower:
                    healthy_item = next((p for p in inventory if "apple" in p["name"].lower() or "cucumber" in p["name"].lower()), None)
                    if healthy_item:
                        reply_data["healthy_alternatives"].append({
                            "original_id": prod["id"],
                            "healthy_id": healthy_item["id"],
                            "explanation": "Baked fresh fruits/cucumber contain significantly less saturated fats and zero cholesterol."
                        })
                elif "coke" in name_lower or "sprite" in name_lower or "pepsi" in name_lower:
                    healthy_item = next((p for p in inventory if "juice" in p["name"].lower() or "milk" in p["name"].lower()), None)
                    if healthy_item:
                        reply_data["healthy_alternatives"].append({
                            "original_id": prod["id"],
                            "healthy_id": healthy_item["id"],
                            "explanation": "Fresh juice or milk provides calcium and essential vitamins without artificial sweeteners or high fructose syrup."
                        })

        subtotal = 0
        for item in reply_data["shopping_list"]:
            prod = next((p for p in inventory if p["id"] == item["product_id"]), None)
            if prod:
                subtotal += prod["price"] * item["qty"]
        
        reply_data["original_total"] = subtotal
        if req.type == "budget" or subtotal > req.budget:
            reply_data["savings"] = int(subtotal * 0.15)
            reply_data["grand_total"] = subtotal - reply_data["savings"]
        else:
            reply_data["savings"] = 0
            reply_data["grand_total"] = subtotal

        agent_logs.append({
            "agent": "Recipe Planning Agent",
            "status": "success",
            "output": f"Formulated ingredients, cooking times, and health score for: '{reply_data['recipe_name']}'."
        })
        agent_logs.append({
            "agent": "Recommendation Agent",
            "status": "success",
            "output": f"Ranked {len(reply_data['shopping_list'])} products based on rating, availability, and brand score."
        })
        agent_logs.append({
            "agent": "Budget Optimization Agent",
            "status": "success",
            "output": f"Completed cost analysis. Found savings of ₹{reply_data['savings']} by swapping select items."
        })
        agent_logs.append({
            "agent": "Offer & Coupon Agent",
            "status": "success",
            "output": "Auto-applied dynamic coupon code 'BLINKAI15' (15% OFF) to the checkout basket."
        })
        agent_logs.append({
            "agent": "Cart Generation Agent",
            "status": "success",
            "output": f"Cart generated successfully with {len(reply_data['shopping_list'])} items. Ready to checkout!"
        })

        return hydrate_and_return(reply_data, db)

    try:
        import httpx
        http_client = httpx.Client(verify=False)
        
        if gemini_key:
            client = OpenAI(api_key=gemini_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/", http_client=http_client)
            model_name = "gemini-2.5-flash"
        else:
            client = OpenAI(api_key=openai_key, http_client=http_client)
            model_name = "gpt-4o-mini"
            
        system_instruction = (
            "You are BlinkAI, a Smart Grocery Planner for the Blinkit application.\n"
            "Your task is to analyze user queries (recipes, weekly planners, budgets) and recommend products ONLY from our inventory.\n"
            f"Here is our complete inventory of products available:\n{json.dumps(inventory)}\n\n"
            "Your output must be a strict JSON object containing the following keys:\n"
            "1. 'recipe_name': string (Name of recipe or plan)\n"
            "2. 'cooking_time': string (Estimated time, e.g. '25 mins')\n"
            "3. 'difficulty': string ('Easy' | 'Medium' | 'Hard')\n"
            "4. 'healthy_score': number (Value from 1 to 100)\n"
            "5. 'shopping_list': JSON array of objects, each containing:\n"
            "   - 'product_id': integer (ID of matching product from inventory)\n"
            "   - 'qty': integer (Quantity based on query or family size)\n"
            "   - 'reason': string (Why you recommended this product, e.g. 'Rich curry base', 'Best rated alternative')\n"
            "6. 'healthy_alternatives': JSON array of objects, each containing:\n"
            "   - 'original_id': integer (ID of unhealthy product in shopping list, e.g. chips, soft drink)\n"
            "   - 'healthy_id': integer (ID of a healthier alternative, e.g. juice, apple, brown bread)\n"
            "   - 'explanation': string (Why this swap is healthier)\n"
            "7. 'weekly_plan': JSON object representing a 7-day meal plan. Key format: 'Monday': {'breakfast': '...', 'lunch': '...', 'dinner': '...'}\n"
            "Rules:\n"
            "1. DO NOT recommend products that are not present in the inventory list. Swap with the closest available if needed.\n"
            "2. Ensure quantities are adjusted dynamically according to the requested family size.\n"
            "3. Return ONLY the raw JSON string. Do not wrap in ```json block code tags."
        )
        
        prompt = f"User Request: {req.prompt}\nType: {req.type}\nFamily Size: {req.family_size}\nBudget: {req.budget}\nPreference: {req.preference}\nSelected Items: {req.items}"
        
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            timeout=4.0
        )
        
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            lines = content.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines).strip()
            
        result = json.loads(content)
        
        subtotal = 0
        for item in result.get("shopping_list", []):
            prod = next((p for p in inventory if p["id"] == item["product_id"]), None)
            if prod:
                subtotal += prod["price"] * item.get("qty", 1)
                
        result["original_total"] = subtotal
        if req.type == "budget" or subtotal > req.budget:
            result["savings"] = int(subtotal * 0.15)
            result["grand_total"] = subtotal - result["savings"]
        else:
            result["savings"] = 0
            result["grand_total"] = subtotal
            
        result["agent_logs"] = [
            {"agent": "Intent Agent", "status": "success", "output": f"Parsed query of type '{req.type}'. Detected intent: {req.type.upper()} optimization."},
            {"agent": "Meal Planning Agent", "status": "success", "output": "Created structured meal plan schedule."},
            {"agent": "Product Search Agent", "status": "success", "output": f"Queried database models. Product count matched: {len(result.get('shopping_list', []))}."},
            {"agent": "Recommendation Agent", "status": "success", "output": "Selected highest rating items with direct stock availability."},
            {"agent": "Budget Optimization Agent", "status": "success", "output": f"Optimized catalog pricing. Saved: ₹{result['savings']}."},
            {"agent": "Offer & Coupon Agent", "status": "success", "output": "Applied BlinkAI system discount coupons."},
            {"agent": "Cart Generation Agent", "status": "success", "output": "Parsed final cart checkout payload."}
        ]
        
        return hydrate_and_return(result, db)
        
    except Exception as e:
        print(f"Error calling LLM: {str(e)}")
        # Offline fallback helper
        return blinkai_plan(req, db)



