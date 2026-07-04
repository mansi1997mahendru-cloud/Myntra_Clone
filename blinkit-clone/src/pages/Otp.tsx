import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, KeyRound, AlertCircle, Info } from 'lucide-react';

export const Otp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp } = useAuth();

  // Retrieve routing states
  const { email } = (location.state || {}) as {
    email?: string;
  };

  // Redirect if accessed directly
  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(30);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // 30s Countdown timer
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Autofocus first input box
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  const handleChange = (value: string, index: number) => {
    const cleanVal = value.replace(/\D/g, ''); // Numbers only
    if (!cleanVal) return;

    const newOtp = [...otp];
    newOtp[index] = cleanVal.substring(cleanVal.length - 1); // Store only last digit
    setOtp(newOtp);

    // Auto move to next input box
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (!otp[index] && index > 0) {
        // Clear previous cell and focus it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current cell
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
    
    if (pasteData.length === 6) {
      const digits = pasteData.split('');
      setOtp(digits);
      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !email) return;
    setAuthError(null);
    setSuccessMsg(null);
    setOtp(Array(6).fill(''));
    
    try {
      await resendOtp(email);
      setSuccessMsg('A new 6-digit OTP code has been sent to your email.');
      setTimer(30);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Failed to resend OTP.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6 || !email) return;

    setAuthError(null);
    setSuccessMsg(null);
    setVerifying(true);

    try {
      await verifyOtp(email, otpCode);
      navigate('/complete-profile', { replace: true });
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Incorrect OTP code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  return (
    <div className="min-h-screen bg-neutral-50 flex justify-center items-center px-4">
      {/* Mobile Scaffold Container */}
      <div className="w-full max-w-md min-h-screen md:min-h-0 md:h-[650px] bg-white shadow-2xl relative flex flex-col justify-between border-x border-neutral-200 md:border md:rounded-3xl p-6 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center space-x-2 pt-2 pb-4 border-b border-neutral-100 flex-shrink-0">
          <button 
            onClick={() => navigate('/login')} 
            className="p-1 text-neutral-600 hover:text-neutral-900 focus:outline-none"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-black text-neutral-800">Email OTP Verification</span>
        </div>

        {/* Main Body */}
        <div className="flex-grow flex flex-col justify-start pt-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-yellow-100 text-yellow-600 mb-2">
              <KeyRound className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-black text-neutral-800 tracking-tight">Verify your account</h2>
            <p className="text-xs text-neutral-500 font-semibold leading-relaxed px-4">
              Enter the 6-digit OTP code sent to <span className="font-extrabold text-neutral-800">{email}</span>
            </p>
          </div>

          {authError && (
            <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2.5">
              <AlertCircle className="h-4.5 w-4.5 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3.5 rounded-xl text-xs font-semibold flex items-start space-x-2.5">
              <span className="text-emerald-600 text-base">✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* 6 Digit Inputs Panel */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-between space-x-2 px-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className={`w-12 h-14 bg-neutral-50 border-2 rounded-xl text-center text-xl font-extrabold focus:outline-none transition-all ${
                    digit 
                      ? 'border-yellow-400 bg-white ring-1 ring-yellow-400' 
                      : 'border-neutral-200 focus:border-yellow-400'
                  }`}
                />
              ))}
            </div>

            {/* Countdown / Resend Panel */}
            <div className="text-center text-xs">
              {timer > 0 ? (
                <p className="text-neutral-500 font-semibold">
                  Resend OTP in <span className="font-black text-neutral-800">{timer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-yellow-600 hover:text-yellow-700 font-black tracking-wide"
                >
                  Resend OTP
                </button>
              )}
            </div>

            {/* Verify CTA Button */}
            <button
              type="submit"
              disabled={!isOtpComplete || verifying}
              className={`w-full py-3.5 text-sm font-black rounded-xl shadow-md transition-all duration-200 active:scale-[0.98] ${
                isOtpComplete && !verifying
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
              }`}
            >
              {verifying ? 'Verifying OTP...' : 'Verify & Continue'}
            </button>
          </form>
        </div>

        {/* Hackathon Demo Notice */}
        <div className="bg-yellow-50 border border-yellow-200 p-3.5 rounded-xl flex items-start space-x-2.5 text-left mb-2 shadow-sm">
          <Info className="h-4.5 w-4.5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-[10px] leading-relaxed text-yellow-800">
            <span className="font-extrabold">Hackathon Demo Notice</span>
            <p className="font-medium">To easily test the application without setting up private SMTP mail credentials in Render, you can verify your account instantly by entering the Master OTP code: <code className="font-black bg-yellow-100 px-1 py-0.5 rounded text-[11px]">123456</code>.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
