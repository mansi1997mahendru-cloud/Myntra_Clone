from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    size: Optional[str] = None
    price: int
    original_price: Optional[int] = None
    icon: Optional[str] = None
    images_list: Optional[str] = None
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


class AddressCreate(BaseModel):
    house_flat_number: str
    building_name: str
    street: str
    landmark: Optional[str] = None
    area: str
    city: str
    state: str
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    label: str = "Home"  # Home, Work, Other
    is_default: Optional[bool] = False

class AddressResponse(BaseModel):
    id: int
    user_id: int
    house_flat_number: str
    building_name: str
    street: str
    landmark: Optional[str] = None
    area: str
    city: str
    state: str
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    label: str
    is_default: bool

    class Config:
        from_attributes = True


class WishlistItemResponse(BaseModel):
    id: int
    product_id: int
    product: ProductResponse

    class Config:
        from_attributes = True


class WishlistItemCreate(BaseModel):
    product_id: int


class CouponResponse(BaseModel):
    id: int
    code: str
    discount_percentage: int
    max_discount: Optional[int] = None
    min_order_value: int
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class CouponCreate(BaseModel):
    code: str
    discount_percentage: int
    max_discount: Optional[int] = None
    min_order_value: int
    description: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_name: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None


class NotificationResponse(BaseModel):
    id: int
    user_id: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True



