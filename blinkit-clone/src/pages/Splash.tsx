import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShoppingCart, Zap } from 'lucide-react';

export const Splash: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => {
    // Hold splash screen for at least 2 seconds
    const timer = setTimeout(() => {
      setTimerDone(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Navigate only after the 2s timer finishes AND Firebase Auth has resolved its loading state
    if (timerDone && !loading) {
      if (user) {
        navigate('/home', { replace: true });
      } else {
        const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding') === 'true';
        if (hasSeenOnboarding) {
          navigate('/login', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      }
    }
  }, [timerDone, loading, user, navigate]);

  return (
    <div className="min-h-screen bg-yellow-400 flex flex-col justify-center items-center px-4 relative select-none">
      {/* Main Logo Container */}
      <div className="text-center space-y-4 animate-fade-in">
        {/* Animated Brand Icon */}
        <div className="inline-flex items-center justify-center bg-black text-yellow-400 rounded-3xl p-5 shadow-2xl relative animate-bounce">
          <ShoppingCart className="h-14 w-14 fill-current stroke-[1.5]" />
          <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 border-4 border-yellow-400 shadow-md">
            <Zap className="h-5 w-5 fill-current" />
          </div>
        </div>
        
        {/* Brand Text */}
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-black flex items-center justify-center">
            <span>blink</span>
            <span className="bg-neutral-900 text-yellow-400 px-2.5 py-0.5 rounded-xl ml-1 shadow-sm">it</span>
          </h1>
          <p className="text-xs font-black tracking-widest text-neutral-800 uppercase">
            10 MINUTE DELIVERY
          </p>
        </div>
      </div>

      {/* Loading Animation Bottom */}
      <div className="absolute bottom-16 flex flex-col items-center space-y-3">
        <div className="flex space-x-1.5">
          <span className="w-2.5 h-2.5 bg-black rounded-full animate-bounce delay-0"></span>
          <span className="w-2.5 h-2.5 bg-black rounded-full animate-bounce [animation-delay:0.2s]"></span>
          <span className="w-2.5 h-2.5 bg-black rounded-full animate-bounce [animation-delay:0.4s]"></span>
        </div>
        <span className="text-[10px] font-black tracking-widest text-neutral-700 uppercase">
          Initializing Secure Connection...
        </span>
      </div>
    </div>
  );
};
