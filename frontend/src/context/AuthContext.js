import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const ROLES = { CARRIER: 'carrier', BROKER: 'broker', ADMIN: 'admin' };

const MOCK_USERS = {
  'carrier@demo.com': { id: 'c1', name: 'Mike Rodriguez', email: 'carrier@demo.com', role: ROLES.CARRIER, plan: 'pro', avatar: 'MR', company: 'Rodriguez Trucking', mc: 'MC-123456', dot: 'DOT-789012', joined: '2024-01-15' },
  'broker@demo.com': { id: 'b1', name: 'Sarah Chen', email: 'broker@demo.com', role: ROLES.BROKER, plan: 'elite', avatar: 'SC', company: 'FastFreight Brokerage', joined: '2024-02-20' },
  'admin@hauliq.com': { id: 'a1', name: 'Admin', email: 'admin@hauliq.com', role: ROLES.ADMIN, plan: 'admin', avatar: 'AD', joined: '2023-12-01' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password, role) => {
    setLoading(true);
    setError(null);
    await new Promise(r => setTimeout(r, 800));
    const found = MOCK_USERS[email.toLowerCase()];
    if (found && password.length >= 4) {
      if (role && found.role !== role) {
        setError('This account is not registered as a ' + role);
        setLoading(false);
        return false;
      }
      setUser(found);
      setLoading(false);
      return true;
    }
    setError('Invalid email or password');
    setLoading(false);
    return false;
  }, []);

  const signup = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    await new Promise(r => setTimeout(r, 1000));
    const newUser = {
      id: 'u_' + Date.now(),
      name: data.name,
      email: data.email,
      role: data.role,
      plan: 'basic',
      avatar: data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      company: data.company || data.name,
      joined: new Date().toISOString().split('T')[0],
    };
    setUser(newUser);
    setLoading(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updatePlan = useCallback((plan) => {
    setUser(u => ({ ...u, plan }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, updatePlan, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
