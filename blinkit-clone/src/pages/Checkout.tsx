import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, MapPin, CreditCard, Smartphone, Truck, ShieldCheck, 
  CheckCircle, Loader2, Sparkles, Plus, AlertCircle 
} from 'lucide-react';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user, fetchAddresses } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  // Steps: 'address' | 'payment' | 'confirming' | 'success'
  const [step, setStep] = useState<'address' | 'payment' | 'confirming' | 'success'>('address');
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address States
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'upi' | 'cod'>('stripe');
  
  // Stripe form fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  
  // UPI fields
  const [upiId, setUpiId] = useState('');

  // Placed Order details
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  const handlingCharge = cartItems.length > 0 ? 4 : 0;
  const deliveryCharge = cartItems.length > 0 ? 15 : 0;
  const grandTotal = cartTotal + handlingCharge + deliveryCharge;

  // Sync back to cart page if cart is empty on mount
  useEffect(() => {
    if (cartItems.length === 0 && step !== 'success') {
      navigate('/cart');
    }
  }, [cartItems, navigate, step]);

  // Load saved addresses from backend
  useEffect(() => {
    const loadSavedAddresses = async () => {
      try {
        const addrList = await fetchAddresses();
        setAddresses(addrList);
        const def = addrList.find((a: any) => a.is_default);
        if (def) {
          setSelectedAddressId(String(def.id));
        } else if (addrList.length > 0) {
          setSelectedAddressId(String(addrList[0].id));
        }
      } catch (err) {
        console.error("Failed to load addresses:", err);
      }
    };
    loadSavedAddresses();
  }, []);

  const handlePlaceOrder = async () => {
    setStep('confirming');
    setLoading(true);
    setError(null);

    const selectedAddr = addresses.find(a => String(a.id) === String(selectedAddressId));
    const activeAddress = selectedAddr 
      ? `${selectedAddr.house_flat_number}, ${selectedAddr.building_name}, ${selectedAddr.street}, ${selectedAddr.area}, ${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode}` 
      : 'Noida Delivery Point';

    // Build items payload
    const orderItems = cartItems.map(item => ({
      product_id: typeof item.id === 'string' ? parseInt(item.id.replace(/\D/g, '')) || 1 : item.id,
      qty: item.qty,
      price: item.price
    }));

    const orderPayload = {
      address: activeAddress,
      payment_method: paymentMethod.toUpperCase(),
      payment_status: paymentMethod === 'cod' ? 'PENDING' : 'PAID',
      subtotal: cartTotal,
      delivery_charge: deliveryCharge,
      handling_charge: handlingCharge,
      tip: 0,
      grand_total: grandTotal,
      items: orderItems
    };

    try {
      // 1. Simulating payment gateways processing first for Stripe/UPI
      if (paymentMethod === 'stripe') {
        const intentRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/orders/stripe-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: grandTotal })
        });
        if (!intentRes.ok) throw new Error('Failed to generate payment intent');
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else if (paymentMethod === 'upi') {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 2. Push final order schema to PostgreSQL via FastAPI
      const uid = user?.uid || 'guest_user';
      const token = localStorage.getItem('access_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const orderRes = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:8000') + ''}/api/orders/${uid}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload)
      });

      if (!orderRes.ok) {
        const errObj = await orderRes.json();
        throw new Error(errObj.detail || 'Failed to save order to database');
      }

      const orderData = await orderRes.json();
      setPlacedOrder(orderData);
      
      // Clear front-end cart state
      clearCart();
      setStep('success');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Payment or order creation failed.');
      setStep('payment');
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 4: ORDER SUCCESS VIEW ---
  if (step === 'success' && placedOrder) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col justify-center items-center text-center min-h-[calc(100vh-140px)] space-y-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-500 scale-in animate-in">
            <CheckCircle className="h-14 w-14 stroke-[1.5]" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4 bg-yellow-400 rounded-full items-center justify-center animate-bounce shadow">
            <Sparkles className="h-2.5 w-2.5 text-neutral-900 fill-current" />
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-neutral-900 tracking-tight">Order Placed Successfully!</h2>
          <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
            Order ID: #{placedOrder.id}
          </p>
        </div>

        {/* Order ETA Tracker Box */}
        <div className="w-full bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm text-left space-y-3.5">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
            <div>
              <span className="text-[10px] text-neutral-450 uppercase font-black tracking-wider">Delivery ETA</span>
              <h4 className="text-base font-black text-neutral-850">12 Mins</h4>
            </div>
            <div className="h-9 w-9 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-750">
              <Truck className="h-5 w-5" />
            </div>
          </div>

          <div className="text-xs font-semibold text-neutral-600 space-y-1.5">
            <p className="text-[11px]">
              <span className="font-extrabold text-neutral-800">Deliver To:</span> {placedOrder.address}
            </p>
            <p className="text-[11px]">
              <span className="font-extrabold text-neutral-800">Payment Status:</span> {placedOrder.payment_status}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/track-order/${placedOrder.id}`)}
          className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-500 text-neutral-900 text-xs font-black rounded-2xl shadow-md uppercase tracking-wider tracking-wide transition-all duration-200 active:scale-[0.97]"
        >
          Track on Map & Keep Shopping
        </button>
      </div>
    );
  }

  // Loader overlay for checking payment gates
  if (step === 'confirming') {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col justify-center items-center text-center min-h-[calc(100vh-140px)] space-y-4">
        <Loader2 className="h-12 w-12 text-yellow-500 animate-spin stroke-[2]" />
        <h3 className="text-sm font-black text-neutral-800 tracking-tight">Authenticating Secure Transaction...</h3>
        <p className="text-xs text-neutral-500 font-semibold">Please do not refresh or click back</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
      
      {/* Back button header */}
      <div className="flex items-center space-x-2.5 pb-2 border-b border-neutral-100">
        <button 
          onClick={() => step === 'payment' ? setStep('address') : navigate('/cart')}
          className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-black text-neutral-800 tracking-tight">
          {step === 'address' ? 'Delivery Address' : 'Choose Payment Mode'}
        </h2>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-3 md:gap-6 items-start w-full">
        
        {/* Left Form side (spans 2) */}
        <div className="w-full md:col-span-2 space-y-6">
          
          {/* STEP 1: ADDRESS SELECTION SECTION */}
          {step === 'address' && (
            <div className="space-y-4">
              {addresses.length === 0 ? (
                <div className="bg-rose-50 text-rose-800 border border-rose-200 p-6 rounded-2xl text-xs font-semibold space-y-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto shadow-inner">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-neutral-800">No Saved Address Found</h3>
                    <p className="text-neutral-500 font-medium max-w-sm mx-auto leading-normal">
                      Blinkit requires a configured delivery address to calculate delivery parameters. You cannot place orders without one.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/complete-profile')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer mx-auto block"
                  >
                    Configure Delivery Profile Address
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3.5">
                    {addresses.map((addr) => (
                      <div 
                        key={addr.id}
                        onClick={() => setSelectedAddressId(String(addr.id))}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 shadow-sm ${
                          selectedAddressId === String(addr.id)
                            ? 'border-yellow-400 bg-yellow-50/10 ring-1 ring-yellow-400'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div className="h-8 w-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
                          <MapPin className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-0.5 text-left flex-grow">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black uppercase text-neutral-450 tracking-wider">
                              {addr.label}
                            </span>
                            {addr.is_default && (
                              <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-neutral-700 leading-normal">
                            {addr.house_flat_number}, {addr.building_name}, {addr.street}, {addr.area}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate('/complete-profile')}
                    className="w-full py-3.5 px-4 bg-white hover:bg-neutral-50 border border-dashed border-neutral-300 rounded-2xl text-xs font-black text-neutral-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Delivery Address</span>
                  </button>

                  <button
                    onClick={() => setStep('payment')}
                    disabled={!selectedAddressId}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs tracking-wider uppercase transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Proceed to Payment Mode Selection
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD CONFIG */}
          {step === 'payment' && (
            <div className="space-y-6">
              
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2.5 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Stripe Credit Card Section */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')}
                    className="text-yellow-400 focus:ring-yellow-400 h-4.5 w-4.5"
                  />
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-neutral-500" />
                    <span className="text-xs font-black text-neutral-800 uppercase tracking-wider">Stripe Credit Card</span>
                  </div>
                </label>

                {paymentMethod === 'stripe' && (
                  <div className="grid grid-cols-3 gap-3.5 pt-2 max-w-md text-left">
                    <div className="col-span-3 space-y-1">
                      <span className="text-[9px] font-black text-neutral-450 uppercase tracking-wider">Card Number</span>
                      <input
                        type="text"
                        placeholder="4242 •••• •••• 4242"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                        className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-yellow-400 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-neutral-450 uppercase tracking-wider">Expiry</span>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={e => setExpiry(e.target.value.substring(0, 5))}
                        className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-yellow-400 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-neutral-450 uppercase tracking-wider">CVC</span>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cvc}
                        onChange={e => setCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
                        className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-yellow-400 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* UPI Section */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="text-yellow-400 focus:ring-yellow-400 h-4.5 w-4.5"
                  />
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5 text-neutral-500" />
                    <span className="text-xs font-black text-neutral-800 uppercase tracking-wider">Instant UPI Payment</span>
                  </div>
                </label>

                {paymentMethod === 'upi' && (
                  <div className="pt-2 max-w-md text-left space-y-1">
                    <span className="text-[9px] font-black text-neutral-450 uppercase tracking-wider">UPI ID</span>
                    <input
                      type="text"
                      placeholder="username@okhdfcbank"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-yellow-400 font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Cash On Delivery */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="text-yellow-400 focus:ring-yellow-400 h-4.5 w-4.5"
                  />
                  <div className="flex items-center space-x-2">
                    <Truck className="h-5 w-5 text-neutral-500" />
                    <span className="text-xs font-black text-neutral-800 uppercase tracking-wider">Cash / Pay on Delivery (COD)</span>
                  </div>
                </label>
              </div>

              {/* Final Place Order button */}
              <button
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs tracking-wider uppercase transition-all shadow-md active:scale-98 cursor-pointer"
              >
                Place Order (₹{grandTotal})
              </button>
            </div>
          )}

        </div>

        {/* Right Bill Details Column (Sticky panel) */}
        <div className="w-full md:col-span-1 space-y-6 mt-6 md:mt-0 md:sticky md:top-24">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4 text-left">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
              Selected Address
            </h3>
            <div className="flex items-start space-x-2 text-xs font-semibold text-neutral-600">
              <MapPin className="h-4.5 w-4.5 text-neutral-450 shrink-0" />
              <p className="leading-normal">
                {(() => {
                  const selectedAddr = addresses.find(a => String(a.id) === String(selectedAddressId));
                  return selectedAddr 
                    ? `${selectedAddr.house_flat_number}, ${selectedAddr.building_name}, ${selectedAddr.street}, ${selectedAddr.area}, ${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode}` 
                    : 'No address selected';
                })()}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4 text-left">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
              Payment Summary
            </h3>
            <div className="space-y-2.5 text-xs font-semibold text-neutral-600">
              <div className="flex justify-between">
                <span>Items Total</span>
                <span>₹{cartTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>₹{deliveryCharge}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span>Handling Charge</span>
                <span>₹{handlingCharge}</span>
              </div>
              <div className="flex justify-between text-neutral-900 font-black text-sm pt-1">
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl flex items-start space-x-3 text-left">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-neutral-800 text-[10px] leading-relaxed">
              <h5 className="font-extrabold uppercase text-emerald-700 tracking-wider">Safe & Secure Payments</h5>
              <p className="font-semibold text-neutral-500">
                100% safe checkout. Your payment details are fully encrypted before transmission.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
