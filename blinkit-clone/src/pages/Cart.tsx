import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { 
  ShoppingBasket, 
  Truck, 
  ArrowRight, 
  ShieldCheck, 
  ShoppingBag, 
  Trash2, 
  Tag, 
  Percent, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  size: string;
  price: number;
  original_price: number;
  icon: string;
  images_list?: string;
  discount: string;
  brand: string;
  category: string;
  description: string;
  stock: number;
}

interface Coupon {
  id: number;
  code: string;
  discount_percentage: number;
  max_discount: number | null;
  min_order_value: number;
  description: string;
  is_active: boolean;
}

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, addToCart, removeFromCart, clearCart } = useCart();
  
  // Tip state
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Saved For Later state (Local Storage based)
  const [savedLaterItems, setSavedLaterItems] = useState<Product[]>(() => {
    const saved = localStorage.getItem('blinkit_saved_later');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('blinkit_saved_later', JSON.stringify(savedLaterItems));
  }, [savedLaterItems]);

  // Load available coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/coupons");
        if (res.ok) {
          const data = await res.json();
          setAvailableCoupons(data);
        }
      } catch (err) {
        console.error("Failed to load coupons", err);
      }
    };
    fetchCoupons();
  }, []);

  // Recalculate applied coupon if cartTotal changes
  useEffect(() => {
    if (appliedCoupon) {
      if (cartTotal < appliedCoupon.min_order_value) {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponError(`Coupon ${appliedCoupon.code} removed (Cart total fell below ₹${appliedCoupon.min_order_value})`);
        setCouponSuccess(null);
      } else {
        let disc = Math.round(cartTotal * (appliedCoupon.discount_percentage / 100.0));
        if (appliedCoupon.max_discount && disc > appliedCoupon.max_discount) {
          disc = appliedCoupon.max_discount;
        }
        setCouponDiscount(disc);
      }
    }
  }, [cartTotal, appliedCoupon]);

  const handleApplyCoupon = async (codeStr: string) => {
    setCouponError(null);
    setCouponSuccess(null);
    const code = codeStr.toUpperCase().trim();
    
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, cart_total: cartTotal })
      });
      
      const data = await res.json();
      if (res.ok) {
        // Find coupon object
        const couponObj = availableCoupons.find(c => c.code === code);
        if (couponObj) {
          setAppliedCoupon(couponObj);
          setCouponDiscount(data.discount_amount);
          setCouponSuccess(`Coupon ${code} applied successfully! Saving ₹${data.discount_amount}`);
        }
      } else {
        setCouponError(data.detail || "Invalid coupon code");
      }
    } catch (err) {
      setCouponError("Failed to apply coupon");
    }
  };

  const handleAutoApplyBest = () => {
    setCouponError(null);
    setCouponSuccess(null);
    
    // Filter coupons user is eligible for
    const eligible = availableCoupons.filter(c => cartTotal >= c.min_order_value);
    if (eligible.length === 0) {
      setCouponError("No eligible coupons found for your current cart value.");
      return;
    }

    // Calculate discount for each coupon
    let bestCoupon: Coupon | null = null;
    let maxDisc = 0;

    eligible.forEach(c => {
      let disc = Math.round(cartTotal * (c.discount_percentage / 100.0));
      if (c.max_discount && disc > c.max_discount) {
        disc = c.max_discount;
      }
      if (disc > maxDisc) {
        maxDisc = disc;
        bestCoupon = c;
      }
    });

    if (bestCoupon) {
      setAppliedCoupon(bestCoupon);
      setCouponDiscount(maxDisc);
      setCouponSuccess(`Auto-applied best coupon: ${(bestCoupon as Coupon).code}! Saved ₹${maxDisc}`);
    }
  };

  const handleSaveForLater = (item: any) => {
    // Add to saved
    if (!savedLaterItems.some(p => p.id === item.id)) {
      const prodObj: Product = {
        id: Number(item.id),
        name: item.name,
        size: item.size,
        price: item.price,
        original_price: item.original_price || item.price,
        icon: item.icon,
        discount: item.discount || '',
        brand: '',
        category: '',
        description: '',
        stock: item.stock
      };
      setSavedLaterItems([...savedLaterItems, prodObj]);
    }
    // Remove from cart
    removeFromCart(item.id);
  };

  const handleMoveToCart = (product: Product) => {
    // Add to cart
    addToCart(product);
    // Remove from saved
    setSavedLaterItems(savedLaterItems.filter(p => p.id !== product.id));
  };

  const handleRemoveSaved = (productId: number) => {
    setSavedLaterItems(savedLaterItems.filter(p => p.id !== productId));
  };

  const handlingCharge = cartItems.length > 0 ? 4 : 0;
  const deliveryCharge = cartItems.length > 0 ? 15 : 0;
  const tipAmount = selectedTip || 0;
  const grandTotal = Math.max(0, cartTotal + handlingCharge + deliveryCharge + tipAmount - couponDiscount);

  // --- EMPTY CART & NO SAVED ITEMS RENDER ---
  if (cartItems.length === 0 && savedLaterItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 flex flex-col justify-center items-center text-center space-y-5 min-h-[calc(100vh-200px)]">
        <div className="h-20 w-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-black text-neutral-800 text-lg">Your Cart is Empty</h3>
          <p className="text-xs text-neutral-500 font-semibold max-w-[280px] leading-relaxed">
            Looks like you haven't added anything to your cart yet. Explore our fresh collections now!
          </p>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="py-3.5 px-6 bg-yellow-400 hover:bg-yellow-500 text-neutral-900 font-black rounded-2xl shadow-md text-xs active:scale-95 transition-transform"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 text-left pb-12 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-neutral-800 tracking-tight">Checkout Cart</h2>
        {cartItems.length > 0 && (
          <button 
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-700 font-black flex items-center space-x-1 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      <div className="flex flex-col md:grid md:grid-cols-3 md:gap-6 items-start w-full">
        
        {/* Left Column (spans 2 on desktop) */}
        <div className="w-full md:col-span-2 space-y-6">
          
          {/* Cart Items List */}
          {cartItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                Items in Cart
              </h3>
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center pb-3.5 border-b border-neutral-100 last:border-b-0 last:pb-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden shrink-0 p-1">
                      <img 
                        src={item.icon} 
                        alt={item.name} 
                        className="h-full w-full object-contain mix-blend-multiply" 
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&auto=format&fit=crop";
                        }}
                      />
                    </div>
                    <div>
                      <h4 
                        onClick={() => navigate(`/product/${item.id}`)}
                        className="text-xs font-extrabold text-neutral-800 cursor-pointer hover:text-yellow-600 transition-colors"
                      >
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-medium">{item.size}</p>
                      <span className="text-xs font-black text-neutral-800">₹{item.price * item.qty}</span>
                    </div>
                  </div>
                  
                  {/* Action block */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleSaveForLater(item)}
                      className="text-[10px] font-black text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100/50 px-2 py-1.5 rounded-lg border border-yellow-200 transition-all cursor-pointer"
                    >
                      Save Later
                    </button>

                    {/* Qty Selector */}
                    <div className="bg-emerald-600 text-white rounded-lg flex items-center overflow-hidden shadow-sm">
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="px-2.5 py-1 text-xs font-black hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 py-1 text-xs font-black min-w-[12px] text-center select-none">{item.qty}</span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="px-2.5 py-1 text-xs font-black hover:bg-emerald-700 transition-colors cursor-pointer"
                        disabled={item.qty >= item.stock}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Saved For Later items Section */}
          {savedLaterItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-neutral-450 uppercase tracking-widest flex items-center space-x-1.5">
                <Percent className="h-4.5 w-4.5 text-yellow-600" />
                <span>Saved For Later ({savedLaterItems.length})</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedLaterItems.map((prod) => (
                  <div 
                    key={prod.id} 
                    className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="h-10 w-10 p-0.5 border border-neutral-100 rounded-lg overflow-hidden flex items-center justify-center bg-white shrink-0">
                        <img src={prod.icon} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-extrabold text-neutral-800 line-clamp-1">{prod.name}</h4>
                        <p className="text-[9.5px] text-neutral-500 font-semibold">{prod.size} | ₹{prod.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRemoveSaved(prod.id)}
                        className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveToCart(prod)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-[10px] px-2.5 py-1 rounded-lg border border-emerald-300"
                      >
                        Move to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Partner Tip Panel */}
          {cartItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                  Delivery Partner Tip
                </h3>
                {selectedTip !== null && (
                  <button 
                    onClick={() => setSelectedTip(null)}
                    className="text-[10px] text-neutral-450 hover:text-neutral-700 font-bold"
                  >
                    Remove Tip
                  </button>
                )}
              </div>
              <div className="flex justify-between space-x-2">
                {[10, 20, 30, 50].map((tip) => (
                  <button 
                    key={tip}
                    onClick={() => setSelectedTip(tip)}
                    className={`flex-1 py-2.5 text-center text-xs font-black border rounded-xl transition-all shadow-sm cursor-pointer ${
                      selectedTip === tip
                        ? 'bg-yellow-400 border-yellow-500 text-neutral-900 scale-102 shadow'
                        : 'bg-white border-neutral-200 hover:border-yellow-400 hover:bg-yellow-50/30 text-neutral-700'
                    }`}
                  >
                    +₹{tip}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-neutral-400 font-medium">100% of the tip goes directly to your delivery partner</p>
            </div>
          )}

          {/* Trust Seal */}
          <div className="flex items-center space-x-3 bg-neutral-100/80 p-4 rounded-2xl border border-neutral-200">
            <ShieldCheck className="h-6 w-6 text-neutral-500 flex-shrink-0" />
            <p className="text-[10px] text-neutral-500 font-bold leading-normal">
              We ensure contactless delivery. All orders are carefully packed with strict safety protocols.
            </p>
          </div>
        </div>

        {/* Right Column (spans 1 on desktop, sticky position) */}
        {cartItems.length > 0 && (
          <div className="w-full md:col-span-1 space-y-6 mt-6 md:mt-0 md:sticky md:top-24">
            
            {/* Promo & Coupons Box */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider flex items-center space-x-1">
                <Tag className="h-4 w-4 text-emerald-600" />
                <span>Apply Promo Coupon</span>
              </h3>
              
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Enter Code (e.g. SAVE50)" 
                  value={couponCode} 
                  onChange={e => setCouponCode(e.target.value)}
                  className="flex-grow p-2 border border-neutral-200 rounded-xl focus:outline-none text-xs uppercase font-extrabold placeholder-neutral-400"
                />
                <button 
                  onClick={() => handleApplyCoupon(couponCode)}
                  className="bg-neutral-900 hover:bg-neutral-850 text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {couponError && (
                <div className="flex items-center space-x-1 text-[10px] font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}

              {couponSuccess && (
                <div className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>{couponSuccess}</span>
                </div>
              )}

              <button
                onClick={handleAutoApplyBest}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-black cursor-pointer"
              >
                Auto-Apply Best Coupon
              </button>
            </div>

            {/* Bill Details */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                Bill Details
              </h3>
              
              <div className="space-y-2.5 text-xs font-semibold text-neutral-600">
                <div className="flex justify-between">
                  <span className="flex items-center"><ShoppingBasket className="h-3.5 w-3.5 mr-1.5 stroke-[1.8]" /> Item Total</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center"><Truck className="h-3.5 w-3.5 mr-1.5 stroke-[1.8]" /> Delivery Charge</span>
                  <span>₹{deliveryCharge}</span>
                </div>
                <div className="flex justify-between">
                  <span>Handling Charge</span>
                  <span>₹{handlingCharge}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-extrabold bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}
                {selectedTip !== null && (
                  <div className="flex justify-between text-yellow-750 font-bold">
                    <span>Driver Tip Contribution</span>
                    <span>+₹{selectedTip}</span>
                  </div>
                )}
                <hr className="border-neutral-100" />
                <div className="flex justify-between text-neutral-900 font-black text-sm pt-1">
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Place Order CTA Container */}
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-5 rounded-2xl flex justify-between items-center shadow-lg active:scale-98 transition-transform cursor-pointer"
            >
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-emerald-100 font-bold">Total Bill: ₹{grandTotal}</span>
                <span className="text-xs font-extrabold uppercase tracking-wide">Place Order</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
