import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Menu, X, ChevronDown, LogOut, Settings, BarChart2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const dashboardPath = user
    ? user.role === 'admin' ? '/admin' : `/${user.role}/dashboard`
    : '/login';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || user ? 'glass border-b border-dark-400/50' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img src="/urload-logo.png" alt="UrLoad" style={{ height: 32, width: 'auto' }} />
          </Link>

          {/* Desktop Nav */}
          {!user && (
            <div className="hidden md:flex items-center gap-1">
              {[['Features', '#features'], ['Pricing', '#pricing'], ['Compare', '#compare']].map(([label, href]) => (
                <a key={label} href={href} className="btn-ghost text-sm">{label}</a>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 glass-light rounded-lg px-3 py-2 hover:bg-dark-500 transition-colors"
                >
                  <div className="w-7 h-7 bg-brand-500/20 border border-brand-500/40 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold">
                    {user.avatar}
                  </div>
                  <span className="text-white text-sm font-medium hidden sm:block">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className="text-dark-200" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-12 w-52 glass rounded-xl shadow-2xl border border-dark-400/60 py-1 z-50">
                    <div className="px-4 py-3 border-b border-dark-400/50">
                      <p className="text-white text-sm font-medium">{user.name}</p>
                      <p className="text-dark-200 text-xs mt-0.5 capitalize">{user.role} · {user.plan}</p>
                    </div>
                    <Link to={dashboardPath} onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-dark-100 hover:text-white hover:bg-dark-600 transition-colors text-sm">
                      <BarChart2 size={15} /> Dashboard
                    </Link>
                    <Link to="/settings" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-dark-100 hover:text-white hover:bg-dark-600 transition-colors text-sm">
                      <Settings size={15} /> Settings
                    </Link>
                    <div className="border-t border-dark-400/50 mt-1 pt-1">
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors text-sm">
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm hidden sm:block">Sign in</Link>
                <Link to="/signup" className="btn-primary text-sm py-2">Get Started</Link>
              </>
            )}
            <button className="md:hidden text-dark-100 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && !user && (
          <div className="md:hidden pb-4 border-t border-dark-400/50 mt-2 pt-4 space-y-1">
            {[['Features', '#features'], ['Pricing', '#pricing'], ['Compare', '#compare']].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-dark-100 hover:text-white hover:bg-dark-600 rounded-lg transition-colors text-sm">{label}</a>
            ))}
            <div className="flex gap-2 mt-4 px-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 btn-secondary text-center text-sm py-2">Sign in</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex-1 btn-primary text-center text-sm py-2">Get Started</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
