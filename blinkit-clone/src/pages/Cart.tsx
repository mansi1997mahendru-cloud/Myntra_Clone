import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingBasket, Truck, ArrowRight, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, addToCart, removeFromCart, clearCart } = useCart();
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  const handlingCharge = cartItems.length > 0 ? 4 : 0;
  const deliveryCharge = cartItems.length > 0 ? 15 : 0;
  const tipAmount = selectedTip || 0;
  const grandTotal = cartTotal + handlingCharge + deliveryCharge + tipAmount;

  // --- EMPTY CART RENDER ---
  if (cartItems.length === 0) {
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
        <button 
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 font-black flex items-center space-x-1 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-3 md:gap-6 items-start w-full">
        
        {/* Left Column (spans 2 on desktop) */}
        <div className="w-full md:col-span-2 space-y-6">
          {/* Cart Items List */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
              Items in Cart
            </h3>
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center pb-3 border-b border-neutral-100 last:border-b-0 last:pb-0">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl select-none">{item.icon}</span>
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
                
                {/* Qty Selector */}
                <div className="bg-emerald-600 text-white rounded-lg flex items-center overflow-hidden shadow-sm">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="px-2.5 py-1 text-xs font-black hover:bg-emerald-700 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-2 py-1 text-xs font-black min-w-[12px] text-center">{item.qty}</span>
                  <button 
                    onClick={() => addToCart(item)}
                    className="px-2.5 py-1 text-xs font-black hover:bg-emerald-700 transition-colors"
                    disabled={item.qty >= item.stock}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Instructions Panel */}
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

          {/* Trust Seal */}
          <div className="flex items-center space-x-3 bg-neutral-100/80 p-4 rounded-2xl border border-neutral-200">
            <ShieldCheck className="h-6 w-6 text-neutral-500 flex-shrink-0" />
            <p className="text-[10px] text-neutral-500 font-bold leading-normal">
              We ensure contactless delivery. All orders are carefully packed with strict safety protocols.
            </p>
          </div>
        </div>

        {/* Right Column (spans 1 on desktop, sticky position) */}
        <div className="w-full md:col-span-1 space-y-6 mt-6 md:mt-0 md:sticky md:top-24">
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

      </div>
    </div>
  );
};
