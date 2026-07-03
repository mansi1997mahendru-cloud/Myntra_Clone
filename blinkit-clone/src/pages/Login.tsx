import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Smartphone, Sparkles, User, Mail, Lock, Check, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, forgotPassword } = useAuth();

  // Mode state: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Common UI states
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Fields
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot password Fields
  const [forgotEmail, setForgotEmail] = useState('');

  // Show a success message if redirected from verification page
  useEffect(() => {
    const state = location.state as { successMessage?: string };
    if (state?.successMessage) {
      setSuccessMsg(state.successMessage);
      window.history.replaceState({}, document.title); // Clear state
    }
  }, [location]);

  // Reset errors and notifications when switching modes
  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setAuthError(null);
    setSuccessMsg(null);
  };

  // Validations
  const isRegMobileValid = /^\d{10}$/.test(regMobile);
  const isRegEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail);

  // Login Submit handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg(null);

    if (!emailOrMobile.trim()) {
      setAuthError("Email ID or Mobile Number is required.");
      return;
    }
    if (loginPassword.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    setLoadingState(true);

    try {
      await login(emailOrMobile, loginPassword);
      navigate('/home', { replace: true });
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoadingState(false);
    }
  };

  // Register Submit handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setAuthError("Full Name is required.");
      return;
    }
    if (!/^\d{10}$/.test(regMobile)) {
      setAuthError("Mobile number must be exactly 10 digits.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (regPassword.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }
    if (!/\d/.test(regPassword) || !/[a-zA-Z]/.test(regPassword)) {
      setAuthError("Password must contain at least one letter and one number.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setLoadingState(true);

    try {
      await register(regName, regMobile, regEmail, regPassword, regConfirmPassword);
      navigate('/otp', { state: { email: regEmail } });
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setLoadingState(false);
    }
  };

  // Forgot Password Submit handler
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    setLoadingState(true);

    try {
      await forgotPassword(forgotEmail);
      setSuccessMsg('If the email is registered, a password reset link has been sent. Open backend/email_inbox.txt to view!');
      setForgotEmail('');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Failed to submit request.');
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex justify-center items-center px-4 py-8">
      {/* Mobile Scaffold Container */}
      <div className="w-full max-w-md min-h-screen md:min-h-0 md:h-[650px] bg-white shadow-2xl relative flex flex-col justify-between border-x border-neutral-200 md:border md:rounded-3xl overflow-hidden">
        
        {/* Yellow Top Banner Grid (Decorative Blinkit style) */}
        <div className="bg-yellow-400 p-6 pt-10 text-center space-y-3.5 relative flex-shrink-0">
          <div className="absolute right-3 top-3 bg-white/20 backdrop-blur-md rounded-full px-2.5 py-1 text-[9px] font-black text-neutral-800 uppercase tracking-widest flex items-center space-x-1">
            <Sparkles className="h-3 w-3" />
            <span>10 MINS DELIVERY</span>
          </div>

          {/* Logo */}
          <div className="inline-flex items-center justify-center bg-black text-yellow-400 rounded-2xl p-3 shadow-md transform -rotate-3 hover:rotate-0 transition-transform">
            <h1 className="text-2xl font-black tracking-tighter">
              <span>blink</span>
              <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded-lg ml-0.5">it</span>
            </h1>
          </div>

          <div className="space-y-0.5">
            <h2 className="text-base font-black text-neutral-900 tracking-tight">India's last minute app</h2>
            <p className="text-[11px] text-neutral-700 font-bold">
              {mode === 'login' && 'Sign in to order groceries instantly'}
              {mode === 'register' && 'Create your new developer account'}
              {mode === 'forgot' && 'Reset your password'}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow p-5 flex flex-col justify-start space-y-4 overflow-y-auto max-h-[420px]">
          
          {authError && (
            <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-xl text-[11px] font-semibold text-left">
              {authError}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-250 p-3 rounded-xl text-[11px] font-semibold text-left">
              {successMsg}
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left">
              
              {/* Email or Phone Input */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block">
                  Email ID or Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Smartphone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={emailOrMobile}
                    onChange={(e) => setEmailOrMobile(e.target.value)}
                    placeholder="name@email.com or 10-digit mobile"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password (min 6 chars)"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-9 pr-9 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-450 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                disabled={loadingState}
                className={`w-full py-3 text-xs font-black rounded-xl shadow-md uppercase tracking-wider transition-all duration-200 active:scale-[0.98] ${
                  !loadingState
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                    : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                }`}
              >
                {loadingState ? 'Logging in...' : 'Sign In'}
              </button>

              <p className="text-center text-xs text-neutral-500 font-semibold pt-1">
                New to Blinkit?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-emerald-600 font-black hover:underline"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-left">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Smartphone className="h-4 w-4" />
                  </span>
                  <input
                    type="tel"
                    required
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    placeholder="10-digit mobile number"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                  {isRegMobileValid && (
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-600">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                  {isRegEmailValid && (
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-600">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block">
                  Password (At least 1 letter, 1 number, 6+ chars)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-9 pr-9 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-450 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
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
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full bg-neutral-50 border rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold focus:outline-none ${
                      regConfirmPassword && regPassword !== regConfirmPassword 
                        ? 'border-rose-450 focus:ring-1 focus:ring-rose-450' 
                        : 'border-neutral-200 focus:ring-1 focus:ring-yellow-400'
                    }`}
                  />
                </div>
              </div>

              {/* Register CTA Button */}
              <button
                type="submit"
                disabled={loadingState}
                className={`w-full py-3 text-xs font-black rounded-xl shadow-md uppercase tracking-wider transition-all duration-200 active:scale-[0.98] ${
                  !loadingState
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                    : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                }`}
              >
                {loadingState ? 'Registering...' : 'Register'}
              </button>

              <p className="text-center text-xs text-neutral-500 font-semibold pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-emerald-600 font-black hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingState}
                className={`w-full py-3 text-xs font-black rounded-xl shadow-md uppercase tracking-wider transition-all duration-200 active:scale-[0.98] ${
                  !loadingState
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                    : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                }`}
              >
                {loadingState ? 'Sending Reset Link...' : 'Send Password Reset Link'}
              </button>

              <p className="text-center text-xs text-neutral-500 font-semibold pt-1">
                Back to{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-emerald-600 font-black hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
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
