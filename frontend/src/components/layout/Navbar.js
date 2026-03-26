import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, Settings, BarChart2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { label: 'Features',    href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'For Carriers', href: '#carriers' },
  { label: 'For Brokers', href: '#brokers' },
  { label: 'Pricing',     href: '#pricing' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const dashboardPath = user
    ? user.role === 'admin' ? '/admin' : `/${user.role}/dashboard`
    : '/login';

  const scrolledBg = 'bg-[#000000] border-b border-white/[0.08]';
  const transparentBg = 'bg-transparent';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || user ? scrolledBg : transparentBg}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-[62px]">

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img src="/urload-logo.png" alt="UrLoad" style={{ height: 40, width: 'auto' }} />
          </Link>

          {/* Center nav links */}
          {!user && (
            <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all duration-150"
                >
                  {label}
                </a>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/[0.07] transition-all"
                >
                  <div className="w-7 h-7 bg-brand-500/20 border border-brand-500/40 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold">
                    {user.avatar}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className="opacity-60" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-12 w-52 bg-[#111] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white text-sm font-medium">{user.name}</p>
                      <p className="text-white/40 text-xs mt-0.5 capitalize">{user.role} · {user.plan}</p>
                    </div>
                    <Link to={dashboardPath} onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-sm">
                      <BarChart2 size={15} /> Dashboard
                    </Link>
                    <Link to="/settings" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-sm">
                      <Settings size={15} /> Settings
                    </Link>
                    <div className="border-t border-white/10 mt-1 pt-1">
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
                <Link
                  to="/login"
                  className="hidden sm:block px-4 py-2 text-sm font-semibold text-white hover:text-white/70 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 text-sm font-bold text-black bg-white hover:bg-white/90 rounded-lg transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
            <button className="md:hidden text-white/70 hover:text-white ml-1" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && !user && (
          <div className="md:hidden pb-4 border-t border-white/10 mt-1 pt-3 space-y-0.5">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors text-sm">
                {label}
              </a>
            ))}
            <div className="flex gap-2 mt-3 px-2">
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2.5 text-sm font-medium text-white/80 border border-white/20 rounded-lg hover:bg-white/[0.06] transition-all">
                Login
              </Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-all">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
