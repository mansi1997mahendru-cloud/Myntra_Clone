import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, MapPin, CreditCard, Smartphone, Truck, ShieldCheck, 
  CheckCircle, Loader2, Sparkles, Plus, AlertCircle 
} from 'lucide-react';

interface SavedAddress {
  id: string;
  tag: 'Home' | 'Office' | 'Other';
  details: string;
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  // Steps: 'address' | 'payment' | 'confirming' | 'success'
  const [step, setStep] = useState<'address' | 'payment' | 'confirming' | 'success'>('address');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address States
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([
    { id: '1', tag: 'Home', details: 'Flat 405, Block B, Silver Palms, Sector 62, Noida, 201301' },
    { id: '2', tag: 'Office', details: 'T-Hub Building, Level 3, Sector 62, Noida, 201301' }
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState('1');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  
  // New Address Form fields
  const [flatNo, setFlatNo] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [city, setCity] = useState('');
  const [addressTag, setAddressTag] = useState<'Home' | 'Office' | 'Other'>('Home');

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

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNo || !area || !pinCode || !city) return;

    const newDetails = `${flatNo}, ${area}, ${landmark ? landmark + ', ' : ''}${city} - ${pinCode}`;
    const newAddr: SavedAddress = {
      id: Date.now().toString(),
      tag: addressTag,
      details: newDetails
    };

    setSavedAddresses(prev => [...prev, newAddr]);
    setSelectedAddressId(newAddr.id);
    setShowNewAddressForm(false);
    
    // Clear inputs
    setFlatNo('');
    setArea('');
    setLandmark('');
    setPinCode('');
    setCity('');
  };

  const handlePlaceOrder = async () => {
    setStep('confirming');
    setLoading(true);
    setError(null);

    const activeAddress = savedAddresses.find(a => a.id === selectedAddressId)?.details || 'Noida Delivery Point';

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
        // Post stripe-intent request
        const intentRes = await fetch('http://localhost:8000/api/orders/stripe-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: grandTotal })
        });
        if (!intentRes.ok) throw new Error('Failed to generate payment intent');
        // Simulate credit card handshake loader
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else if (paymentMethod === 'upi') {
        // Simulate UPI push notification confirmation
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 2. Push final order schema to PostgreSQL via FastAPI
      const uid = user?.uid || 'guest_user';
      const token = localStorage.getItem('access_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const orderRes = await fetch(`http://localhost:8000/api/orders/${uid}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload)
      });

      if (!orderRes.ok) {
        throw new Error('Failed to save order to database');
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
              <span className="font-extrabold text-neutral-800">Paid Via:</span> {placedOrder.payment_method} ({placedOrder.payment_status})
            </p>
            <p className="text-[11px]">
              <span className="font-extrabold text-neutral-800">Grand Total:</span> ₹{placedOrder.grand_total}
            </p>
          </div>
        </div>

        <div className="flex w-full space-x-3.5 pt-4">
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 py-3.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-black rounded-2xl text-xs transition-colors cursor-pointer"
          >
            Track Order
          </button>
          <button
            onClick={() => navigate('/home')}
            className="flex-1 py-3.5 px-4 bg-yellow-400 hover:bg-yellow-500 text-neutral-900 font-black rounded-2xl text-xs shadow-md transition-all cursor-pointer active:scale-95"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // --- STEP 3: PROCESSING / CONFIRMING VIEW ---
  if (step === 'confirming') {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col justify-center items-center text-center min-h-[calc(100vh-140px)] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <h3 className="text-base font-black text-neutral-850">Securing Payment & Placing Order...</h3>
        <p className="text-xs text-neutral-400 font-semibold">Please do not refresh this page or click back.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6 text-left pb-16">
      
      {/* Checkout Header */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => {
            if (step === 'payment') setStep('address');
            else navigate('/cart');
          }}
          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
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
              <div className="grid grid-cols-1 gap-3.5">
                {savedAddresses.map((addr) => (
                  <div 
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 shadow-sm ${
                      selectedAddressId === addr.id
                        ? 'border-yellow-400 bg-yellow-50/10 ring-1 ring-yellow-400'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="h-8 w-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
                      <MapPin className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5 text-left flex-grow">
                      <span className="text-[10px] font-black uppercase text-neutral-450 tracking-wider">
                        {addr.tag}
                      </span>
                      <p className="text-xs font-semibold text-neutral-700 leading-normal">
                        {addr.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {!showNewAddressForm ? (
                <button
                  onClick={() => setShowNewAddressForm(true)}
                  className="w-full py-3.5 px-4 bg-white hover:bg-neutral-50 border border-dashed border-neutral-300 rounded-2xl text-xs font-black text-neutral-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Delivery Address</span>
                </button>
              ) : (
                <form 
                  onSubmit={handleAddNewAddress}
                  className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm"
                >
                  <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                    New Address Details
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="House/Flat/Office No. *" 
                      value={flatNo}
                      onChange={e => setFlatNo(e.target.value)}
                      required
                      className="col-span-2 text-xs border border-neutral-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-yellow-400 font-semibold"
                    />
                    <input 
                      type="text" 
                      placeholder="Street, Sector or Area *" 
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      required
                      className="col-span-2 text-xs border border-neutral-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-yellow-400 font-semibold"
                    />
                    <input 
                      type="text" 
                      placeholder="Landmark (Optional)" 
                      value={landmark}
                      onChange={e => setLandmark(e.target.value)}
                      className="col-span-2 text-xs border border-neutral-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-yellow-400 font-semibold"
                    />
                    <input 
                      type="text" 
                      placeholder="Pin Code *" 
                      value={pinCode}
                      onChange={e => setPinCode(e.target.value)}
                      required
                      className="text-xs border border-neutral-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-yellow-400 font-semibold"
                    />
                    <input 
                      type="text" 
                      placeholder="City *" 
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      required
                      className="text-xs border border-neutral-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-yellow-400 font-semibold"
                    />
                  </div>

                  <div className="flex items-center space-x-2.5">
                    {(['Home', 'Office', 'Other'] as const).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setAddressTag(tag)}
                        className={`px-4 py-2 border rounded-xl text-xs font-black transition-all cursor-pointer ${
                          addressTag === tag 
                            ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm' 
                            : 'bg-white border-neutral-200 hover:border-neutral-350 text-neutral-700'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="flex space-x-3.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="flex-1 py-3 text-xs font-black bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 text-xs font-black bg-yellow-400 hover:bg-yellow-500 rounded-xl transition-colors cursor-pointer"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}

              <button
                onClick={() => setStep('payment')}
                disabled={!selectedAddressId}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs tracking-wider uppercase transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Proceed to Payment
              </button>
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD CONFIG */}
          {step === 'payment' && (
            <div className="space-y-6">
              
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2.5 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                  Select Payment Option
                </h3>

                <div className="space-y-3">
                  
                  {/* Stripe Card Selection */}
                  <div 
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === 'stripe'
                        ? 'border-yellow-400 bg-yellow-50/10 ring-1 ring-yellow-400'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <CreditCard className={`h-5 w-5 ${paymentMethod === 'stripe' ? 'text-neutral-900' : 'text-neutral-400'}`} />
                      <div className="text-left">
                        <h4 className="text-xs font-black text-neutral-800">Credit / Debit Card</h4>
                        <p className="text-[10px] text-neutral-450 font-bold">Stripe Secure Card Payment (Test Mode)</p>
                      </div>
                    </div>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      paymentMethod === 'stripe' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'
                    }`}>
                      {paymentMethod === 'stripe' && <span className="h-2 w-2 rounded-full bg-yellow-400" />}
                    </div>
                  </div>

                  {/* UPI Selection */}
                  <div 
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === 'upi'
                        ? 'border-yellow-400 bg-yellow-50/10 ring-1 ring-yellow-400'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <Smartphone className={`h-5 w-5 ${paymentMethod === 'upi' ? 'text-neutral-900' : 'text-neutral-400'}`} />
                      <div className="text-left">
                        <h4 className="text-xs font-black text-neutral-800">UPI (GPay, Paytm, PhonePe)</h4>
                        <p className="text-[10px] text-neutral-450 font-bold">Pay instantly using any UPI App</p>
                      </div>
                    </div>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      paymentMethod === 'upi' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'
                    }`}>
                      {paymentMethod === 'upi' && <span className="h-2 w-2 rounded-full bg-yellow-400" />}
                    </div>
                  </div>

                  {/* Cash on Delivery Selection */}
                  <div 
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === 'cod'
                        ? 'border-yellow-400 bg-yellow-50/10 ring-1 ring-yellow-400'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <Truck className={`h-5 w-5 ${paymentMethod === 'cod' ? 'text-neutral-900' : 'text-neutral-400'}`} />
                      <div className="text-left">
                        <h4 className="text-xs font-black text-neutral-800">Cash on Delivery (COD)</h4>
                        <p className="text-[10px] text-neutral-450 font-bold">Pay cash or scan QR at your doorstep</p>
                      </div>
                    </div>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      paymentMethod === 'cod' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'
                    }`}>
                      {paymentMethod === 'cod' && <span className="h-2 w-2 rounded-full bg-yellow-400" />}
                    </div>
                  </div>

                </div>
              </div>

              {/* Step-Specific Inputs */}
              {paymentMethod === 'stripe' && (
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                    Enter Card Details (Test Mode)
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <input 
                      type="text" 
                      placeholder="Card Number (4242 4242 4242 4242) *" 
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                      required
                      className="col-span-3 text-xs border border-neutral-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-yellow-400 font-semibold"
                    />
                    <input 
                      type="text" 
                      placeholder="MM/YY *" 
                      value={expiry}
                      onChange={e => setExpiry(e.target.value.substring(0, 5))}
                      required
                      className="col-span-2 text-xs border border-neutral-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-yellow-400 font-semibold"
                    />
                    <input 
                      type="text" 
                      placeholder="CVC *" 
                      value={cvc}
                      onChange={e => setCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
                      required
                      className="text-xs border border-neutral-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-yellow-400 font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 font-bold">Use the standard test credit card 4242... for mock checkout confirmation</p>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4 text-center flex flex-col items-center">
                  <h3 className="text-xs font-black text-neutral-800 uppercase tracking-wider self-start">
                    UPI Payment
                  </h3>
                  
                  <div className="bg-neutral-100 p-4 rounded-xl border border-neutral-200 flex flex-col items-center max-w-[200px] mb-2 select-none">
                    {/* Simulated QR Code */}
                    <div className="h-32 w-32 bg-white rounded border border-neutral-300 flex items-center justify-center text-4xl mb-2">
                      📱
                    </div>
                    <span className="text-[9px] text-neutral-450 font-black uppercase tracking-wider">Scan QR to pay</span>
                  </div>

                  <span className="text-xs text-neutral-400 font-bold">OR Enter UPI ID</span>
                  <input 
                    type="text" 
                    placeholder="user@upi *" 
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-yellow-400 font-semibold"
                  />
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm flex items-center space-x-3.5">
                  <span className="text-3xl select-none">💵</span>
                  <p className="text-xs font-semibold text-neutral-600">
                    No advance payment required. Please pay cash or request UPI scan when the delivery partner arrives.
                  </p>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={loading || (paymentMethod === 'stripe' && (!cardNumber || !expiry || !cvc))}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs tracking-wider uppercase transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Pay & Place Order
              </button>

            </div>
          )}

        </div>

        {/* Right Bill Details Column (Sticky panel) */}
        <div className="w-full md:col-span-1 space-y-6 mt-6 md:mt-0 md:sticky md:top-24">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">
              Selected Address
            </h3>
            <div className="flex items-start space-x-2 text-xs font-semibold text-neutral-600">
              <MapPin className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
              <p className="leading-normal">
                {savedAddresses.find(a => a.id === selectedAddressId)?.details || 'Noida Delivery Point'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
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
              <div className="flex justify-between">
                <span>Handling Charge</span>
                <span>₹{handlingCharge}</span>
              </div>
              <hr className="border-neutral-100" />
              <div className="flex justify-between text-neutral-900 font-black text-sm pt-1">
                <span>Total Bill</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>
          </div>

          {/* Contact Details Trust */}
          <div className="flex items-center space-x-3 bg-neutral-100/80 p-4 rounded-2xl border border-neutral-200">
            <ShieldCheck className="h-6 w-6 text-neutral-500 flex-shrink-0" />
            <p className="text-[10px] text-neutral-500 font-bold leading-normal">
              Secure checkout guaranteed. Stripe systems are PCI-DSS compliant.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
