import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Save, AlertCircle } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth as firebaseAuth, db } from '../services/firebase';

export const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const { isMock } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = name.trim().length >= 2;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError(null);
    setSaving(true);

    try {
      if (isMock) {
        // Mock save -> update local storage session
        const mockUser = localStorage.getItem('mock_user_session');
        if (mockUser) {
          const userObj = JSON.parse(mockUser);
          userObj.displayName = name;
          userObj.email = email;
          localStorage.setItem('mock_user_session', JSON.stringify(userObj));
        }
      } else {
        // Real Firebase profile update
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
          // 1. Update Auth display name
          await updateProfile(currentUser, { displayName: name });

          // 2. Save user profile records to Firestore (Auth & metadata connection)
          await setDoc(
            doc(db, 'users', currentUser.uid),
            {
              uid: currentUser.uid,
              name,
              email: email || currentUser.email || '',
              phoneNumber: currentUser.phoneNumber || '',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } else {
          throw new Error("No authenticated session found.");
        }
      }

      // Route to Home on completion
      navigate('/home', { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex justify-center items-center px-4">
      {/* Mobile Scaffold Container */}
      <div className="w-full max-w-md min-h-screen md:min-h-0 md:h-[650px] bg-white shadow-2xl relative flex flex-col justify-between border-x border-neutral-200 md:border md:rounded-3xl p-6 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center space-x-2 pt-2 pb-4 border-b border-neutral-100 flex-shrink-0 text-left">
          <span className="text-sm font-black text-neutral-800">Complete Profile</span>
        </div>

        {/* Content Body */}
        <div className="flex-grow flex flex-col justify-start pt-8 space-y-6 text-left">
          <div>
            <h2 className="text-xl font-black text-neutral-800 tracking-tight">Tell us about yourself</h2>
            <p className="text-xs text-neutral-500 font-semibold leading-relaxed mt-1">
              Add your name and email to save your orders, get invoices, and earn coupons.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2">
              <AlertCircle className="h-4.5 w-4.5 text-rose-600 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Full Name input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest block">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-neutral-400" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400"
                />
              </div>
            </div>

            {/* Email Address input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-neutral-400 uppercase tracking-widest block">
                Email Address (Optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-neutral-400" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400"
                />
              </div>
            </div>

            {/* Save CTA Button */}
            <button
              type="submit"
              disabled={!isFormValid || saving}
              className={`w-full py-3.5 text-sm font-black rounded-xl shadow-md flex justify-center items-center space-x-2 transition-all duration-200 active:scale-[0.98] ${
                isFormValid && !saving
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
              }`}
            >
              <Save className="h-4.5 w-4.5" />
              <span>{saving ? 'Saving profile...' : 'Save & Continue'}</span>
            </button>
          </form>
        </div>

        {/* Demo Mode Notice */}
        {isMock && (
          <div className="text-center text-[10px] text-neutral-400 font-bold py-2">
            ⚡ Offline profile save. Syncs to browser local session storage.
          </div>
        )}

      </div>
    </div>
  );
};
