import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Phone, MapPin, Store, Bike, User, Star } from 'lucide-react';

export const TrackOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [stage, setStage] = useState<'placed' | 'packed' | 'out' | 'delivered'>('placed');
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins in seconds
  const [distance, setDistance] = useState(1.8); // 1.8 km
  const timerRef = useRef<any>(null);

  // Delivery partner profile
  const partner = {
    name: 'Vikram Singh',
    phone: '+91 98765 43210',
    vehicle: 'Hero Electric Nyx (KA-51-EF-8890)',
    rating: 4.9,
    ratingCount: 1420
  };

  useEffect(() => {
    // Stage logic and partner coordinate simulation over 40 seconds for demo loop
    const totalDuration = 40000; // 40 seconds loop
    const start = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / totalDuration) * 100);
      setProgress(pct);

      // Stage updating
      if (pct < 15) {
        setStage('placed');
        setTimeLeft(300);
        setDistance(1.8);
      } else if (pct < 40) {
        setStage('packed');
        setTimeLeft(240);
        setDistance(1.5);
      } else if (pct < 90) {
        setStage('out');
        const remainingTime = Math.max(15, Math.round((1 - (pct - 40) / 50) * 180));
        setTimeLeft(remainingTime);
        const remainingDist = Math.max(0.1, Number((1.2 * (1 - (pct - 40) / 50)).toFixed(1)));
        setDistance(remainingDist);
      } else {
        setStage('delivered');
        setTimeLeft(0);
        setDistance(0);
      }

      if (elapsed >= totalDuration) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Compute rider SVG coordinates on custom route
  const getRiderCoords = () => {
    // Preset coordinates along a grid path
    // Path points: Store (80, 20) -> Corner 1 (80, 80) -> Corner 2 (20, 80) -> Customer (20, 160)
    const points = [
      { x: 300, y: 50 },  // Store
      { x: 300, y: 150 }, // Junction 1
      { x: 100, y: 150 }, // Junction 2
      { x: 100, y: 250 }  // Home
    ];

    if (progress <= 40) {
      // Packed or Placed (Rider is at the Store)
      return points[0];
    }
    if (progress >= 90) {
      // Delivered (Rider is at Home)
      return points[3];
    }

    // Out for delivery: interpolate coordinates between points[0] and points[3]
    // out progress is 40% to 90%, normalize to 0 to 1
    const t = (progress - 40) / 50;
    
    // We have three segments.
    // Segment 1: Store to Junction 1 (300, 50 to 300, 150)
    // Segment 2: Junction 1 to Junction 2 (300, 150 to 100, 150)
    // Segment 3: Junction 2 to Home (100, 150 to 100, 250)
    if (t < 0.33) {
      const segT = t / 0.33;
      return {
        x: points[0].x,
        y: points[0].y + (points[1].y - points[0].y) * segT
      };
    } else if (t < 0.66) {
      const segT = (t - 0.33) / 0.33;
      return {
        x: points[1].x + (points[2].x - points[1].x) * segT,
        y: points[1].y
      };
    } else {
      const segT = (t - 0.66) / 0.34;
      return {
        x: points[2].x,
        y: points[2].y + (points[3].y - points[2].y) * segT
      };
    }
  };

  const riderPos = getRiderCoords();

  return (
    <div className="max-w-md mx-auto p-4 space-y-5 text-left pb-12">
      {/* Header back button */}
      <div className="flex items-center space-x-3.5">
        <button 
          onClick={() => navigate('/orders')}
          className="p-2 hover:bg-neutral-100 rounded-full transition-colors active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-800" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-neutral-900 leading-tight">Track Delivery</h2>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Order ID: #{id}</p>
        </div>
      </div>

      {/* Main Simulated Map Block */}
      <div className="bg-emerald-50/50 rounded-3xl border border-neutral-200/60 overflow-hidden relative shadow-sm h-72">
        {/* Animated Map Background Grid */}
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Map Grid Roads */}
          <line x1="300" y1="0" x2="300" y2="300" stroke="#e5e5e5" strokeWidth="24" strokeLinecap="round" />
          <line x1="0" y1="150" x2="400" y2="150" stroke="#e5e5e5" strokeWidth="24" strokeLinecap="round" />
          <line x1="100" y1="100" x2="100" y2="300" stroke="#e5e5e5" strokeWidth="24" strokeLinecap="round" />

          {/* Dotted path route */}
          <path 
            d="M 300 50 L 300 150 L 100 150 L 100 250" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="3.5" 
            strokeDasharray="6,6"
            strokeLinecap="round"
          />

          {/* Store Pin */}
          <g transform="translate(300, 50)">
            <circle r="18" fill="#10b981" className="shadow" />
            <foreignObject x="-10" y="-10" width="20" height="20">
              <Store className="h-5 w-5 text-white" />
            </foreignObject>
            <text x="0" y="-24" textAnchor="middle" className="text-[9px] font-black fill-emerald-800 bg-white px-1">Blinkit Store</text>
          </g>

          {/* Home Pin */}
          <g transform="translate(100, 250)">
            <circle r="18" fill="#3b82f6" />
            <foreignObject x="-10" y="-10" width="20" height="20">
              <MapPin className="h-5 w-5 text-white" />
            </foreignObject>
            <text x="0" y="32" textAnchor="middle" className="text-[9px] font-black fill-blue-800 bg-white px-1">Your Location</text>
          </g>

          {/* Moving Delivery Partner Bike */}
          <g transform={`translate(${riderPos.x}, ${riderPos.y})`}>
            <circle r="16" fill="#facc15" className="animate-pulse shadow-md border-2 border-white" />
            <foreignObject x="-8" y="-8" width="16" height="16">
              <Bike className="h-4 w-4 text-neutral-900" />
            </foreignObject>
          </g>
        </svg>

        {/* Floating ETA overlay */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur shadow rounded-2xl p-3 flex items-center space-x-2.5 border border-neutral-100">
          <div className="h-9 w-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-neutral-900 leading-none">
              {stage === 'delivered' ? 'Delivered' : `Arriving in ${Math.round(timeLeft / 60)}m`}
            </h4>
            <p className="text-[9px] text-neutral-500 font-bold mt-0.5">{distance} km away • {stage.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Delivery Stages Status Tracker */}
      <div className="bg-white rounded-3xl border border-neutral-200/60 p-5 space-y-4 shadow-sm">
        <h3 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider">Delivery Steps</h3>
        
        <div className="flex flex-col space-y-5 relative pl-5">
          {/* Vertical Timeline bar */}
          <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-neutral-100" />
          <div 
            className="absolute left-1.5 top-2 w-0.5 bg-emerald-500 transition-all duration-500" 
            style={{ 
              height: stage === 'placed' ? '0%' 
                     : stage === 'packed' ? '33%' 
                     : stage === 'out' ? '66%' 
                     : '100%' 
            }} 
          />

          {/* Step 1: Placed */}
          <div className="flex items-center space-x-3.5 relative">
            <div className={`absolute -left-5 h-3.5 w-3.5 rounded-full border-2 ${
              stage !== 'placed' ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-emerald-500'
            }`} />
            <div>
              <h4 className={`text-xs font-extrabold ${stage === 'placed' ? 'text-neutral-900' : 'text-neutral-500'}`}>Order Confirmed</h4>
              <p className="text-[9px] text-neutral-400 font-medium">Payment received successfully</p>
            </div>
          </div>

          {/* Step 2: Packed */}
          <div className="flex items-center space-x-3.5 relative">
            <div className={`absolute -left-5 h-3.5 w-3.5 rounded-full border-2 ${
              stage === 'packed' || stage === 'out' || stage === 'delivered' ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-neutral-200'
            }`} />
            <div>
              <h4 className={`text-xs font-extrabold ${stage === 'packed' ? 'text-neutral-900' : 'text-neutral-500'}`}>Order Packed</h4>
              <p className="text-[9px] text-neutral-400 font-medium">Prepared carefully at nearby store</p>
            </div>
          </div>

          {/* Step 3: Out for Delivery */}
          <div className="flex items-center space-x-3.5 relative">
            <div className={`absolute -left-5 h-3.5 w-3.5 rounded-full border-2 ${
              stage === 'out' || stage === 'delivered' ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-neutral-200'
            }`} />
            <div>
              <h4 className={`text-xs font-extrabold ${stage === 'out' ? 'text-neutral-900' : 'text-neutral-500'}`}>Out for Delivery</h4>
              <p className="text-[9px] text-neutral-400 font-medium">Partner driving to your location</p>
            </div>
          </div>

          {/* Step 4: Delivered */}
          <div className="flex items-center space-x-3.5 relative">
            <div className={`absolute -left-5 h-3.5 w-3.5 rounded-full border-2 ${
              stage === 'delivered' ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-neutral-200'
            }`} />
            <div>
              <h4 className={`text-xs font-extrabold ${stage === 'delivered' ? 'text-neutral-900 font-bold text-emerald-600' : 'text-neutral-500'}`}>Delivered Successfully</h4>
              <p className="text-[9px] text-neutral-400 font-medium">Handed over to customer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Partner Profile Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/60 p-5 shadow-sm space-y-4">
        <h3 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider">Your Delivery Partner</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-xs font-black text-neutral-900">{partner.name}</h4>
              <div className="flex items-center space-x-1 mt-0.5">
                <Star className="h-3 w-3 text-amber-500 fill-current" />
                <span className="text-[10px] font-black text-neutral-700">{partner.rating}</span>
                <span className="text-[9px] text-neutral-400 font-bold">({partner.ratingCount} ratings)</span>
              </div>
              <p className="text-[9px] text-neutral-500 font-semibold mt-1">{partner.vehicle}</p>
            </div>
          </div>

          {/* Call Button */}
          <a 
            href={`tel:${partner.phone}`}
            onClick={(e) => {
              e.preventDefault();
              alert(`Calling delivery partner Vikram Singh at ${partner.phone}...`);
            }}
            className="h-10 w-10 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            <Phone className="h-4.5 w-4.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
