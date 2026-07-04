import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Percent, Sparkles, Tag, Gift, CheckCircle, ArrowLeft } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  discount_percentage: number;
  max_discount: number | null;
  min_order_value: number;
  description: string;
  is_active: boolean;
}

export const Offers: React.FC = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/coupons");
        if (res.ok) {
          const data = await res.json();
          setCoupons(data);
        }
      } catch (err) {
        console.error("Failed to load coupons", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const bankOffers = [
    { id: 1, title: "Flat ₹50 Off on HDFC Bank", desc: "Get flat ₹50 discount on orders above ₹600 using HDFC Bank Credit/Debit Cards.", code: "HDFC50" },
    { id: 2, title: "10% Cashback on Paytm Wallet", desc: "Get up to ₹100 cashback on payment using Paytm Wallet or Postpaid. Valid twice per user.", code: "PAYTM100" },
    { id: 3, title: "Free Delivery via OneCard", desc: "Enjoy completely free delivery and zero handling fees with OneCard credit payments.", code: "ONECARD" }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20 text-left">
      <div className="flex items-center space-x-2">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-neutral-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-neutral-600" />
        </button>
        <h1 className="text-xl md:text-2xl font-black text-neutral-900 flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-yellow-500 fill-current" />
          <span>Blinkit Special Offers & Coupons</span>
        </h1>
      </div>

      {/* Hero promo card */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-3xl p-6 text-neutral-900 shadow-md space-y-2 relative overflow-hidden">
        <div className="absolute right-4 bottom-[-10px] opacity-10 pointer-events-none select-none">
          <Percent className="h-32 w-32 stroke-[3]" />
        </div>
        <span className="bg-black text-yellow-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
          Deal of the Season
        </span>
        <h2 className="text-2xl font-black tracking-tight leading-none pt-1">
          Flat 50% Off on Fresh Fruits!
        </h2>
        <p className="text-xs font-bold opacity-90 max-w-[280px]">
          Get healthy, farm-fresh apples, bananas, and organic items at absolute half price. Use coupon <span className="font-extrabold underline">SAVE50</span>.
        </p>
      </div>

      {/* Available Store Coupons section */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-neutral-450 uppercase tracking-widest flex items-center space-x-1.5">
          <Tag className="h-4.5 w-4.5 text-yellow-600" />
          <span>Active Promo Coupons</span>
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
          </div>
        ) : coupons.length === 0 ? (
          <p className="text-xs text-neutral-500 font-semibold">No store coupons available right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map((c) => (
              <div 
                key={c.id} 
                className="bg-white rounded-2xl border border-neutral-200 p-4 flex justify-between items-center shadow-sm relative overflow-hidden"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="bg-yellow-100 text-yellow-800 text-[11px] font-black px-2.5 py-0.5 rounded-lg border border-yellow-250">
                      {c.code}
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-600">
                      {c.discount_percentage}% OFF
                    </span>
                  </div>
                  <p className="text-xs font-black text-neutral-800 leading-tight">{c.description}</p>
                  <p className="text-[9.5px] text-neutral-450 font-bold">
                    Min order: ₹{c.min_order_value} {c.max_discount ? `| Max discount: ₹${c.max_discount}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(c.code)}
                  className={`py-2 px-4 rounded-xl font-extrabold text-xs transition-colors shadow-sm cursor-pointer shrink-0 ${
                    copiedCode === c.code 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                      : 'bg-neutral-900 hover:bg-neutral-850 text-white'
                  }`}
                >
                  {copiedCode === c.code ? (
                    <span className="flex items-center space-x-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </span>
                  ) : 'Copy Code'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bank & Payment Offers section */}
      <div className="space-y-3 pt-4">
        <h3 className="text-xs font-black text-neutral-450 uppercase tracking-widest flex items-center space-x-1.5">
          <Gift className="h-4.5 w-4.5 text-yellow-600" />
          <span>Bank & Wallet Partnerships</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bankOffers.map((offer) => (
            <div 
              key={offer.id}
              className="bg-white rounded-2xl border border-neutral-200 p-4 flex flex-col justify-between shadow-sm space-y-3"
            >
              <div className="space-y-1">
                <h4 className="text-xs font-black text-neutral-800">{offer.title}</h4>
                <p className="text-[10px] text-neutral-500 leading-relaxed font-semibold">{offer.desc}</p>
              </div>
              <button
                onClick={() => handleCopy(offer.code)}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-center font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {copiedCode === offer.code ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
