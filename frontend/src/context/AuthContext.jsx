import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, historyAPI } from '../services/apiService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ad_web_user');
    return saved ? JSON.parse(saved) : null;
  });

  const refreshUserScans = useCallback(async (customUser = null) => {
    const activeUser = customUser || user;
    if (!activeUser || (!activeUser.id && !activeUser.email)) return;
    try {
      const records = await historyAPI.getHistory(activeUser.id, activeUser.email);
      const count = Array.isArray(records) ? records.length : 0;
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, scansAnalyzed: count };
        localStorage.setItem('ad_web_user', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      // Ignore count fetch errors
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (user?.id || user?.email) {
      refreshUserScans();
    }
  }, [user?.id, user?.email]);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      let scanCount = 0;
      try {
        const historyRecords = await historyAPI.getHistory(data.id, data.email);
        scanCount = Array.isArray(historyRecords) ? historyRecords.length : 0;
      } catch (e) {
        scanCount = 0;
      }

      const userProfile = {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        hospital: data.hospital_affiliation,
        token: data.token,
        scansAnalyzed: scanCount,
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80"
      };
      setUser(userProfile);
      localStorage.setItem('ad_web_user', JSON.stringify(userProfile));
      return { success: true, user: userProfile };
    } catch (error) {
      const msg = error.response?.data?.detail || "Authentication failed. Please check your credentials.";
      return { success: false, error: msg };
    }
  };

  const register = async (formData) => {
    try {
      const data = await authAPI.register(formData);
      const newProfile = {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        hospital: data.hospital_affiliation,
        token: data.token,
        scansAnalyzed: 0,
        avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
      };
      setUser(newProfile);
      localStorage.setItem('ad_web_user', JSON.stringify(newProfile));
      return { success: true, user: newProfile };
    } catch (error) {
      const msg = error.response?.data?.detail || "Registration failed. Please try again.";
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ad_web_user');
    try {
      sessionStorage.removeItem('ad_active_scan');
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, refreshUserScans }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
