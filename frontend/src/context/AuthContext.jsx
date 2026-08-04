import React, { createContext, useContext, useState } from 'react';
import { authAPI } from '../services/apiService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ad_web_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      const userProfile = {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        hospital: data.hospital_affiliation,
        token: data.token,
        scansAnalyzed: 0,
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
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
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
