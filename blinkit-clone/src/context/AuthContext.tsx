import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserSessionProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  is_active: boolean;
}

interface AuthContextType {
  user: UserSessionProfile | null;
  loading: boolean;
  login: (loginId: string, pass: string) => Promise<void>;
  register: (fullName: string, mobile: string, email: string, pass: string, confirmPass: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, pass: string, confirmPass: string) => Promise<void>;
  logout: () => Promise<void>;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSessionProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile with access token
  const fetchProfile = async (token: string): Promise<UserSessionProfile | null> => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const u = await res.json();
        return {
          uid: String(u.id),
          email: u.email,
          displayName: u.full_name,
          phoneNumber: u.mobile,
          is_active: u.is_active
        };
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
    return null;
  };

  // Helper to refresh access token
  const refreshSession = async (rToken: string): Promise<string | null> => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rToken })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('access_token', data.access_token);
        return data.access_token;
      }
    } catch (e) {
      console.error("Error refreshing token:", e);
    }
    return null;
  };

  // Load session on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const accToken = localStorage.getItem('access_token');
      const refToken = localStorage.getItem('refresh_token');

      if (accToken) {
        const profile = await fetchProfile(accToken);
        if (profile) {
          setUser(profile);
          setLoading(false);
          return;
        }
      }

      // If access token failed/expired, try refresh token
      if (refToken) {
        const newAccToken = await refreshSession(refToken);
        if (newAccToken) {
          const profile = await fetchProfile(newAccToken);
          if (profile) {
            setUser(profile);
            setLoading(false);
            return;
          }
        }
      }

      setUser(null);
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (loginId: string, pass: string) => {
    const res = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: loginId, password: pass })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Login failed. Please check credentials.');
    }

    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    setUser({
      uid: String(data.user.id),
      email: data.user.email,
      displayName: data.user.full_name,
      phoneNumber: data.user.mobile,
      is_active: data.user.is_active
    });
  };

  const register = async (fullName: string, mobile: string, email: string, pass: string, confirmPass: string) => {
    const res = await fetch('http://localhost:8000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName,
        mobile,
        email,
        password: pass,
        confirm_password: confirmPass
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Registration failed.');
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await fetch('http://localhost:8000/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Verification failed.');
    }
  };

  const forgotPassword = async (email: string) => {
    const res = await fetch('http://localhost:8000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Failed to trigger reset email.');
    }
  };

  const resetPassword = async (token: string, pass: string, confirmPass: string) => {
    const res = await fetch('http://localhost:8000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: pass, confirm_password: confirmPass })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Password reset failed.');
    }
  };

  const resendOtp = async (email: string) => {
    const res = await fetch('http://localhost:8000/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Failed to resend OTP.');
    }
  };

  const logout = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      verifyOtp,
      resendOtp,
      forgotPassword,
      resetPassword,
      logout,
      isMock: true
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
