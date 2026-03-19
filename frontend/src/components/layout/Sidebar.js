import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Truck, LayoutDashboard, Search, Calculator, Brain, BookmarkCheck,
  History, TrendingUp, BarChart2, PlusCircle, Package, Users,
  CreditCard, DollarSign, Shield, Settings, LogOut, Bell, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CARRIER_LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard',         path: '/carrier/dashboard' },
  { icon: Search,          label: 'Load Board',         path: '/carrier/loads' },
  { icon: Calculator,      label: 'Profit Calculator',  path: '/carrier/calculator' },
  { icon: Brain,           label: 'Earnings Brain',     path: '/carrier/brain' },
  { icon: BookmarkCheck,   label: 'Saved Loads',        path: '/carrier/saved' },
  { icon: History,         label: 'Load History',       path: '/carrier/history' },
  { icon: TrendingUp,      label: 'Analytics',          path: '/carrier/analytics' },
];

const BROKER_LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard',          path: '/broker/dashboard' },
  { icon: PlusCircle,      label: 'Post Load',          path: '/broker/post' },
  { icon: Package,         label: 'Manage Loads',       path: '/broker/loads' },
  { icon: BarChart2,       label: 'Analytics',          path: '/broker/analytics' },
];

const ADMIN_LINKS = [
  { icon: LayoutDashboard, label: 'Overview',           path: '/admin' },
  { icon: Users,           label: 'Users',              path: '/admin/users' },
  { icon: Package,         label: 'Load Moderation',   path: '/admin/loads' },
  { icon: CreditCard,      label: 'Subscriptions',      path: '/admin/subscriptions' },
  { icon: DollarSign,      label: 'Revenue',            path: '/admin/revenue' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const links = user.role === 'carrier' ? CARRIER_LINKS
              : user.role === 'broker'  ? BROKER_LINKS
              : ADMIN_LINKS;

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 py-5 border-b border-dark-400/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0 glow-green-sm">
          <Truck size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight">
            Haul<span className="gradient-text">IQ</span>
          </span>
        )}
      </div>

      {/* User badge */}
      {!collapsed && (
        <div className="mx-3 mt-4 p-3 glass-light rounded-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500/20 border border-brand-500/30 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
              {user.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name.split(' ')[0]}</p>
              <p className="text-dark-200 text-xs capitalize truncate">{user.role} · <span className="text-brand-400">{user.plan}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 mt-4 space-y-0.5 overflow-y-auto">
        {links.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));
          return (
            <Link key={path} to={path}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-link ${active ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? label : undefined}>
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-dark-400/50 pt-3 mt-2">
        <Link to="/settings"
          className={`sidebar-link ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Settings' : undefined}>
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button onClick={handleLogout}
          className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/5 ${collapsed ? 'justify-center px-2' : ''}`}>
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 glass p-2 rounded-lg text-dark-100 hover:text-white">
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full bg-dark-800 border-r border-dark-400/50">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col h-screen sticky top-0 bg-dark-800 border-r border-dark-400/50 transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-dark-600 border border-dark-400 rounded-full flex items-center justify-center text-dark-100 hover:text-white hover:bg-dark-500 transition-colors z-10">
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>
    </>
  );
}
