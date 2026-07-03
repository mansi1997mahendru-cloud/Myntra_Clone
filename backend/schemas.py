from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    size: Optional[str] = None
    price: int
    original_price: Optional[int] = None
    icon: Optional[str] = None
    discount: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    stock: Optional[int] = 15
    is_best_seller: Optional[bool] = False
    is_recommended: Optional[bool] = False

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

class CartItemUpdate(BaseModel):
    product_id: int
    qty: int

class CartItemResponse(BaseModel):
    product_id: int
    qty: int
    product: ProductResponse

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[Dict[str, Any]]] = []

class ChatResponse(BaseModel):
    reply: str
    products: List[ProductResponse]

class OrderItemBase(BaseModel):
    product_id: int
    qty: int
    price: int

class OrderItemResponse(OrderItemBase):
    id: int
    product: ProductResponse

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    address: str
    payment_method: str
    payment_status: Optional[str] = "Pending"
    subtotal: int
    delivery_charge: int
    handling_charge: int
    tip: int
    grand_total: int
    items: List[OrderItemBase]

class OrderResponse(BaseModel):
    id: int
    user_id: str
    address: str
    payment_method: str
    payment_status: str
    subtotal: int
    delivery_charge: int
    handling_charge: int
    tip: int
    grand_total: int
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    full_name: str
    mobile: str
    email: str
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    login_id: str
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    mobile: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserVerify(BaseModel):
    email: str
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str
    confirm_password: str

class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

