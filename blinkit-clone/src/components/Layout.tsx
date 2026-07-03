import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
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
  ClipboardList
} from 'lucide-react';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount, cartTotal } = useCart();

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
      <header className="sticky top-0 z-50 bg-yellow-400 text-neutral-900 shadow-md">
        
        {/* Desktop Header Layout */}
        <div className="hidden md:flex items-center justify-between max-w-7xl mx-auto px-6 h-16 w-full gap-4">
          
          {/* Logo & Delivery Location */}
          <div className="flex items-center space-x-6 shrink-0">
            {/* Clickable Logo */}
            <div 
              onClick={() => navigate('/home')} 
              className="bg-black text-yellow-400 rounded-xl px-3.5 py-1.5 shadow-sm transform hover:scale-105 transition-transform cursor-pointer font-black tracking-tighter text-xl"
            >
              <span>blink</span>
              <span className="bg-yellow-400 text-black px-1 py-0.5 rounded ml-0.5 text-base">it</span>
            </div>

            {/* Delivery address */}
            <div className="flex items-center space-x-2 border-l border-yellow-500 pl-6 cursor-pointer">
              <MapPin className="h-5 w-5 text-neutral-800 animate-pulse shrink-0" />
              <div className="text-left">
                <div className="flex items-center space-x-0.5">
                  <span className="font-black text-[10px] uppercase tracking-wider text-neutral-700">Delivering in 10 mins</span>
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-700" />
                </div>
                <p className="text-xs font-bold truncate max-w-[180px] text-neutral-900">Home - Sector 62, Noida</p>
              </div>
            </div>
          </div>

          {/* Central Search Bar */}
          <div 
            onClick={() => navigate('/search')}
            className="flex-grow max-w-2xl relative cursor-pointer group"
          >
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-neutral-500 group-hover:text-neutral-800 transition-colors" />
            </span>
            <input 
              type="text" 
              placeholder='Search "milk", "bread" or "chips"'
              readOnly 
              className="w-full bg-white text-neutral-800 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-yellow-500/20 focus:outline-none shadow-sm group-hover:shadow placeholder-neutral-500 font-semibold cursor-pointer transition-shadow"
            />
          </div>

          {/* Right Action Links */}
          <div className="flex items-center space-x-6 shrink-0">
            {/* Orders Tab Link */}
            <button 
              onClick={() => navigate('/orders')}
              className={`flex items-center space-x-1.5 text-sm font-black hover:text-neutral-700 transition-colors ${
                location.pathname === '/orders' ? 'text-neutral-900 border-b-2 border-black pb-0.5' : 'text-neutral-700'
              }`}
            >
              <ClipboardList className="h-4.5 w-4.5" />
              <span>Orders</span>
            </button>

            {/* Profile Tab Link */}
            <button 
              onClick={() => navigate('/profile')}
              className={`flex items-center space-x-1.5 text-sm font-black hover:text-neutral-700 transition-colors ${
                location.pathname === '/profile' ? 'text-neutral-900 border-b-2 border-black pb-0.5' : 'text-neutral-700'
              }`}
            >
              <User className="h-4.5 w-4.5" />
              <span>Profile</span>
            </button>

            {/* Premium Cart Button */}
            <button 
              onClick={() => navigate('/cart')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 px-4 flex items-center space-x-2.5 shadow-sm active:scale-98 transition-transform font-black text-sm"
            >
              <div className="relative">
                <ShoppingCart className="h-4.5 w-4.5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-emerald-600">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="border-l border-emerald-500 pl-2">
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
                <p className="text-sm font-semibold truncate max-w-[200px]">Home - Sector 62, Noida</p>
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
              className="w-full bg-white text-neutral-800 text-sm pl-9 pr-4 py-2.5 rounded-xl border-none focus:outline-none shadow-inner placeholder-neutral-500 font-medium cursor-pointer"
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
