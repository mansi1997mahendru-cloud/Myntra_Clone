import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { AIAssistant } from './AIAssistant';
import { 
  Home, 
  Search, 
  Grid, 
  ShoppingCart, 
  User, 
  MapPin, 
  ChevronDown, 
  Clock,
  ClipboardList,
  Sparkles
} from 'lucide-react';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount, cartTotal } = useCart();
  const { user, fetchAddresses } = useAuth();
  const [addressDisplay, setAddressDisplay] = useState('Home - Sector 62, Noida');

  useEffect(() => {
    if (!user) {
      setAddressDisplay('Guest Location');
      return;
    }
    const loadAddress = async () => {
      try {
        const addrs = await fetchAddresses();
        const def = addrs.find(a => a.is_default) || addrs[0];
        if (def) {
          setAddressDisplay(`${def.label} - ${def.area}, ${def.city}`);
        } else {
          setAddressDisplay('Configure Profile Address');
        }
      } catch (err) {
        console.error("Failed to load address for header", err);
      }
    };
    loadAddress();
  }, [user]);

  const navItems = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/categories', label: 'Categories', icon: Grid },
    { path: '/cart', label: 'Cart', icon: ShoppingCart, badge: itemCount },
    { path: '/orders', label: 'Orders', icon: ClipboardList },
    { path: '/profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col w-full text-neutral-800">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white text-neutral-800 border-b border-neutral-200/80 shadow-sm">
        
        {/* Desktop Header Layout */}
        <div className="hidden md:flex items-center justify-between max-w-7xl mx-auto px-6 h-16 w-full gap-4">
          
          {/* Logo & Delivery Location */}
          <div className="flex items-center space-x-5 shrink-0">
            {/* Clickable Logo */}
            <div 
              onClick={() => navigate('/home')} 
              className="cursor-pointer font-black tracking-tighter text-3xl select-none flex items-center"
            >
              <span className="text-[#3cbe3b]">blink</span>
              <span className="text-[#f8d030]">it</span>
            </div>

            {/* Delivery address */}
            <div className="flex items-center space-x-2 border-l border-neutral-200 pl-5 cursor-pointer">
              <div className="text-left">
                <h4 className="font-extrabold text-neutral-900 text-xs leading-none">Delivery in 8 minutes</h4>
                <div className="flex items-center space-x-0.5 mt-1">
                  <p className="text-[10px] font-bold text-neutral-500 truncate max-w-[170px]">{addressDisplay}</p>
                  <ChevronDown className="h-3 w-3 text-neutral-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Central Search Bar */}
          <div 
            onClick={() => navigate('/search')}
            className="flex-grow max-w-xl relative cursor-pointer group"
          >
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
            </span>
            <input 
              type="text" 
              placeholder='Search "milk", "bread" or "chips"'
              readOnly 
              className="w-full bg-[#f8f8f8] text-neutral-800 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200/60 focus:outline-none placeholder-neutral-450 font-bold cursor-pointer transition-shadow"
            />
          </div>

          {/* Right Action Links */}
          <div className="flex items-center space-x-5 shrink-0">
            {/* Login / Profile */}
            <button 
              onClick={() => navigate('/profile')}
              className="text-neutral-700 hover:text-neutral-900 font-extrabold text-sm transition-colors cursor-pointer"
            >
              {user ? `Hey, ${user.displayName?.split(' ')[0]}` : 'Login'}
            </button>

            {/* BlinkAI Tab Link */}
            <button 
              onClick={() => navigate('/blinkai')}
              className={`flex items-center space-x-1.5 text-xs font-black hover:text-[#3cbe3b] transition-colors py-1.5 px-3.5 rounded-full bg-yellow-100/50 border border-yellow-250/50 ${
                location.pathname === '/blinkai' ? 'text-[#3cbe3b] bg-emerald-50 border-[#3cbe3b]' : 'text-[#3cbe3b]'
              }`}
            >
              <Sparkles className="h-4 w-4 fill-current animate-pulse text-[#3cbe3b]" />
              <span>BlinkAI</span>
            </button>

            {/* Orders Tab Link */}
            <button 
              onClick={() => navigate('/orders')}
              className={`flex items-center space-x-1.5 text-xs font-black hover:text-neutral-700 transition-colors ${
                location.pathname === '/orders' ? 'text-neutral-900 border-b-2 border-neutral-900 pb-0.5' : 'text-neutral-500'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Orders</span>
            </button>

            {/* Dynamic Cart Button */}
            <button 
              onClick={() => navigate('/cart')}
              className={`rounded-xl py-2.5 px-4 flex items-center space-x-2 shadow-sm active:scale-98 transition-all font-black text-xs cursor-pointer ${
                itemCount > 0
                  ? 'bg-[#318625] text-white hover:bg-[#25661b]'
                  : 'bg-neutral-100 border border-neutral-200 text-neutral-500'
              }`}
            >
              <div className="relative">
                <ShoppingCart className="h-4.5 w-4.5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-emerald-600">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className={itemCount > 0 ? "border-l border-emerald-500 pl-2" : ""}>
                {itemCount > 0 ? `₹${cartTotal}` : 'My Cart'}
              </span>
            </button>
          </div>

        </div>

        {/* Mobile Header Layout */}
        <div className="flex md:hidden flex-col px-4 pt-3.5 pb-3.5 w-full">
          {/* Top Line: Location & ETA */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-neutral-800 animate-pulse" />
              <div className="text-left">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-xs uppercase tracking-wider text-neutral-700">Delivering To</span>
                  <ChevronDown className="h-3 w-3" />
                </div>
                <p className="text-sm font-semibold truncate max-w-[200px]">{addressDisplay}</p>
              </div>
            </div>
            
            {/* Quick ETA Badge */}
            <div className="bg-neutral-900 text-yellow-400 text-xs font-black px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-sm">
              <Clock className="h-3.5 w-3.5 fill-current" />
              <span>10 MINS</span>
            </div>
          </div>

          {/* Search Bar Placeholder */}
          <div className="relative cursor-pointer" onClick={() => navigate('/search')}>
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-500" />
            </span>
            <input 
              type="text" 
              placeholder='Search "milk", "bread" or "chips"'
              readOnly 
              className="w-full bg-[#f8f8f8] text-neutral-800 text-xs pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200/60 focus:outline-none placeholder-neutral-450 font-bold cursor-pointer"
            />
          </div>
        </div>

      </header>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Fixed Bottom Navigation (Mobile Only) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-neutral-200 py-2.5 px-6 flex md:hidden justify-between items-center z-50 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center space-y-1 relative focus:outline-none group transition-all duration-200"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-yellow-400 text-neutral-900 scale-110 shadow-sm' 
                  : 'text-neutral-500 group-hover:text-neutral-900 group-hover:bg-neutral-100'
              }`}>
                <Icon className="h-5 w-5 stroke-[2.25]" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide transition-all ${
                isActive ? 'text-neutral-900' : 'text-neutral-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Floating AI Assistant */}
      <AIAssistant />

    </div>
  );
};
