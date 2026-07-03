import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState(false);

  // Redirect to login if token is missing
  useEffect(() => {
    if (!token) {
      setAuthError('Invalid or missing password reset token.');
    }
  }, [token]);

  const isPasswordValid = password.length >= 6 && /\d/.test(password) && /[a-zA-Z]/.test(password);
  const isConfirmValid = password === confirmPassword;
  const isFormValid = !!token && isPasswordValid && isConfirmValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !token) return;

    setAuthError(null);
    setSuccessMsg(null);
    setLoadingState(true);

    try {
      await resetPassword(token, password, confirmPassword);
      setSuccessMsg('Your password has been successfully reset!');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex justify-center items-center px-4">
      {/* Mobile Scaffold Container */}
      <div className="w-full max-w-md min-h-screen md:min-h-0 md:h-[650px] bg-white shadow-2xl relative flex flex-col justify-between border-x border-neutral-200 md:border md:rounded-3xl overflow-hidden">
        
        {/* Yellow Top Banner Grid */}
        <div className="bg-yellow-400 p-6 pt-10 text-center space-y-3.5 relative flex-shrink-0">
          <div className="absolute right-3 top-3 bg-white/20 backdrop-blur-md rounded-full px-2.5 py-1 text-[9px] font-black text-neutral-800 uppercase tracking-widest flex items-center space-x-1">
            <Sparkles className="h-3 w-3" />
            <span>10 MINS DELIVERY</span>
          </div>

          <div className="inline-flex items-center justify-center bg-black text-yellow-400 rounded-2xl p-3 shadow-md transform -rotate-3 hover:rotate-0 transition-transform">
            <h1 className="text-2xl font-black tracking-tighter">
              <span>blink</span>
              <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded-lg ml-0.5">it</span>
            </h1>
          </div>

          <div className="space-y-0.5">
            <h2 className="text-base font-black text-neutral-900 tracking-tight">Reset Password</h2>
            <p className="text-[11px] text-neutral-700 font-bold">Set a new password for your account</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow p-6 flex flex-col justify-start space-y-5">
          {authError && (
            <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2.5">
              <AlertCircle className="h-4.5 w-4.5 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-250 p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
              <span>{successMsg} Redirecting to login...</span>
            </div>
          )}

          {token && !successMsg && (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block">
                  New Password (min 6 chars, letters & numbers)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 py-3 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={`w-full bg-neutral-50 border rounded-xl py-2.5 py-3 pl-9 pr-3 text-xs font-semibold focus:outline-none ${
                      confirmPassword && !isConfirmValid 
                        ? 'border-rose-450 focus:ring-1 focus:ring-rose-450' 
                        : 'border-neutral-200 focus:ring-1 focus:ring-yellow-400'
                    }`}
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={!isFormValid || loadingState}
                className={`w-full py-3.5 text-xs font-black rounded-xl shadow-md uppercase tracking-wider transition-all duration-200 active:scale-[0.98] ${
                  isFormValid && !loadingState
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                    : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                }`}
              >
                {loadingState ? 'Resetting Password...' : 'Reset Password'}
              </button>

            </form>
          )}

          {!token && (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-neutral-150 hover:bg-neutral-200 text-neutral-800 text-xs font-black rounded-xl transition-colors cursor-pointer"
            >
              Go Back to Login
            </button>
          )}
        </div>

        {/* Footer Policy Info */}
        <div className="p-4 text-center text-[10px] text-neutral-400 font-bold leading-normal border-t border-neutral-100 bg-neutral-50/50 flex-shrink-0">
          By continuing, you agree to our Terms of Service & Privacy Policy. 
        </div>

      </div>
    </div>
  );
};
