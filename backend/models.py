from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    size = Column(String(50), nullable=True)
    price = Column(Integer, nullable=False)
    original_price = Column(Integer, nullable=True)
    icon = Column(String(50), nullable=True)
    discount = Column(String(50), nullable=True)
    brand = Column(String(100), nullable=True, index=True)
    category = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    stock = Column(Integer, default=15, nullable=False)
    is_best_seller = Column(Boolean, default=False)
    is_recommended = Column(Boolean, default=False)

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    qty = Column(Integer, nullable=False, default=1)

    # Establish relation to easily join product details
    product = relationship("Product")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    address = Column(Text, nullable=False)
    payment_method = Column(String(50), nullable=False)
    payment_status = Column(String(50), nullable=False, default="Pending")
    subtotal = Column(Integer, nullable=False)
    delivery_charge = Column(Integer, nullable=False, default=15)
    handling_charge = Column(Integer, nullable=False, default=4)
    tip = Column(Integer, nullable=False, default=0)
    grand_total = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default="Placed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    qty = Column(Integer, nullable=False)
    price = Column(Integer, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    mobile = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    verification_otp = Column(String(6), nullable=True)
    verification_token = Column(String(255), nullable=True)
    reset_token = Column(String(255), nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    lockout_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

