import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Smartphone, ShieldCheck, Heart, Tag, Settings, Shield } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Error signing out', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  // Redirect to login if user session does not exist
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.email === 'mansi1997mahendru@gmail.com' || user.email.includes('admin');

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 text-left pb-16">
      <h2 className="text-lg font-extrabold text-neutral-800 tracking-tight">Your Profile</h2>

      <div className="bg-emerald-50 text-emerald-900 border border-emerald-250 p-4 rounded-2xl flex items-start space-x-3 shadow-sm">
        <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-extrabold">Active Secure Session</h4>
          <p className="font-medium text-emerald-800">
            Authenticated via secure custom JSON Web Tokens (JWT).
          </p>
        </div>
      </div>

      {/* Logged In View */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-neutral-150 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-3.5 pb-4 border-b border-neutral-100">
            <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xl shadow-inner shrink-0">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-800">{user.displayName}</h3>
              <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">User ID: #{user.uid}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs font-semibold text-neutral-600">
            <div className="flex items-center space-x-2.5">
              <Mail className="h-4.5 w-4.5 text-neutral-450 shrink-0" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <Smartphone className="h-4.5 w-4.5 text-neutral-450 shrink-0" />
              <span>+91 {user.phoneNumber}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-150 p-5 shadow-sm space-y-1.5 text-neutral-700">
          <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-2">Account Options</h4>
          
          <button
            onClick={() => navigate('/wishlist')}
            className="w-full flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0 text-left font-bold text-xs cursor-pointer hover:text-yellow-600"
          >
            <span className="flex items-center"><Heart className="h-4 w-4 mr-2.5 text-rose-500" /> Saved Wishlist</span>
            <span>&rarr;</span>
          </button>

          <button
            onClick={() => navigate('/offers')}
            className="w-full flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0 text-left font-bold text-xs cursor-pointer hover:text-yellow-600"
          >
            <span className="flex items-center"><Tag className="h-4 w-4 mr-2.5 text-emerald-600" /> Offers & Coupons</span>
            <span>&rarr;</span>
          </button>

          <button
            onClick={() => navigate('/complete-profile')}
            className="w-full flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0 text-left font-bold text-xs cursor-pointer hover:text-yellow-600"
          >
            <span className="flex items-center"><Settings className="h-4 w-4 mr-2.5 text-blue-500" /> Manage Delivery Addresses</span>
            <span>&rarr;</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0 text-left font-bold text-xs cursor-pointer hover:text-yellow-600"
            >
              <span className="flex items-center"><Shield className="h-4 w-4 mr-2.5 text-amber-500" /> Admin Control Dashboard</span>
              <span>&rarr;</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between py-2.5 text-rose-600 hover:text-rose-700 font-bold text-xs cursor-pointer text-left"
          >
            <span className="flex items-center"><LogOut className="h-4 w-4 mr-2.5" /> Sign Out</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
