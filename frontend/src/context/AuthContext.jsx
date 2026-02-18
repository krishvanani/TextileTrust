import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
            // CRITICAL: Fetch fresh user data from backend (Single Source of Truth)
            const { data } = await api.get('/auth/me');
            setUser(data);
            // Update local storage to keep it somewhat in sync, but depend on API
            localStorage.setItem('user', JSON.stringify(data));
        } catch (error) {
            console.error("Failed to rehydrate user:", error);
            // If token is invalid, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }
      }
      setLoading(false);
    };

    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      // STRICT: Always fetch fresh user data after login
      await refreshUser();
      
      return { success: true };
    } catch (error) {
      console.error("Login error:", error.response?.data?.message || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      localStorage.setItem('token', data.token);
      // STRICT: Always fetch fresh user data after registration
      await refreshUser();
      
      return { success: true };
    } catch (error) {
      console.error("Registration error:", error.response?.data?.message || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const { data } = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
