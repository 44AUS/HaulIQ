import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const ROLES = { CARRIER: 'carrier', BROKER: 'broker', ADMIN: 'admin' };

// Map backend UserOut → frontend user shape
function mapUser(apiUser) {
  return {
    id:      String(apiUser.id),
    name:    apiUser.name,
    email:   apiUser.email,
    role:    apiUser.role,
    plan:    apiUser.plan,
    phone:   apiUser.phone   || null,
    company: apiUser.company || apiUser.name,
    mc:      apiUser.mc_number  || null,
    dot:     apiUser.dot_number || null,
    joined:  apiUser.created_at ? apiUser.created_at.split('T')[0] : null,
    avatar:  apiUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true on mount while we rehydrate
  const [error, setError]     = useState(null);

  // ── Rehydrate session from localStorage on mount ─────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('hauliq_token');
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then(u => setUser(mapUser(u)))
      .catch(() => localStorage.removeItem('hauliq_token'))
      .finally(() => setLoading(false));
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password, role) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem('hauliq_token', data.access_token);
      const u = mapUser(data.user);
      if (role && u.role !== role) {
        setError('This account is not registered as a ' + role);
        localStorage.removeItem('hauliq_token');
        setLoading(false);
        return false;
      }
      setUser(u);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message || 'Invalid email or password');
      setLoading(false);
      return false;
    }
  }, []);

  // ── Signup ────────────────────────────────────────────────────────────────
  const signup = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        email:      formData.email,
        password:   formData.password,
        name:       formData.name,
        role:       formData.role,
        phone:      formData.phone    || null,
        company:    formData.company  || null,
        mc_number:  formData.mc       || null,
        dot_number: formData.dot      || null,
      };
      const data = await authApi.signup(payload);
      localStorage.setItem('hauliq_token', data.access_token);
      const u = mapUser(data.user);
      setUser(u);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
      setLoading(false);
      return null;
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('hauliq_token');
    setUser(null);
  }, []);

  // ── Update plan (called after successful payment) ─────────────────────────
  const updatePlan = useCallback((plan) => {
    setUser(u => ({ ...u, plan }));
  }, []);

  // ── Update user fields locally (e.g. logo upload) ─────────────────────────
  const updateUser = useCallback((fields) => {
    setUser(u => ({ ...u, ...fields }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, updatePlan, updateUser, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
