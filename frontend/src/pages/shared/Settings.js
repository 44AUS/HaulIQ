import { useState } from 'react';
import { User, Lock, Building, Truck, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

export default function Settings() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    name:    user?.name    || '',
    email:   user?.email   || '',
    company: user?.company || '',
    mc:      user?.mc      || '',
    dot:     user?.dot     || '',
  });

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [status, setStatus]       = useState(null); // { type: 'success'|'error', msg }
  const [saving, setSaving]       = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const updated = await authApi.update({
        name:       profile.name       || undefined,
        company:    profile.company    || undefined,
        mc_number:  profile.mc        || undefined,
        dot_number: profile.dot       || undefined,
      });
      updateUser({
        name:    updated.name,
        company: updated.company || updated.name,
        mc:      updated.mc_number  || null,
        dot:     updated.dot_number || null,
        avatar:  updated.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      });
      setStatus({ type: 'success', msg: 'Profile updated successfully.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setStatus({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }
    if (passwords.next.length < 8) {
      setStatus({ type: 'error', msg: 'Password must be at least 8 characters.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await authApi.update({ password: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' });
      setStatus({ type: 'success', msg: 'Password changed successfully.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-bold text-white">Account Settings</h1>

      {status && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          status.type === 'success'
            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {status.type === 'success'
            ? <CheckCircle size={16} />
            : <AlertCircle size={16} />}
          {status.msg}
        </div>
      )}

      {/* Profile */}
      <form onSubmit={saveProfile} className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <User size={18} className="text-brand-400" />
          <h2 className="text-lg font-semibold text-white">Profile Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-dark-400 mb-1">Full Name</label>
            <input
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">Email</label>
            <input
              value={profile.email}
              disabled
              className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-dark-400 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-dark-400 mb-1">
            <Building size={12} className="inline mr-1" />
            Company Name
          </label>
          <input
            value={profile.company}
            onChange={e => setProfile(p => ({ ...p, company: e.target.value }))}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        {user?.role === 'carrier' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-dark-400 mb-1">
                <Truck size={12} className="inline mr-1" />
                MC Number
              </label>
              <input
                value={profile.mc}
                onChange={e => setProfile(p => ({ ...p, mc: e.target.value }))}
                placeholder="MC-000000"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-dark-400 mb-1">DOT Number</label>
              <input
                value={profile.dot}
                onChange={e => setProfile(p => ({ ...p, dot: e.target.value }))}
                placeholder="DOT-000000"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Password */}
      <form onSubmit={changePassword} className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Lock size={18} className="text-brand-400" />
          <h2 className="text-lg font-semibold text-white">Change Password</h2>
        </div>

        <div>
          <label className="block text-xs text-dark-400 mb-1">New Password</label>
          <input
            type="password"
            value={passwords.next}
            onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))}
            placeholder="Min. 8 characters"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs text-dark-400 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={passwords.confirm}
            onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !passwords.next}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Lock size={15} />
            {saving ? 'Saving…' : 'Change Password'}
          </button>
        </div>
      </form>

      {/* Account info */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white mb-3">Account Info</h2>
        <div className="flex justify-between text-sm">
          <span className="text-dark-400">Role</span>
          <span className="text-white capitalize">{user?.role}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-dark-400">Plan</span>
          <span className="text-white capitalize">{user?.plan}</span>
        </div>
        {user?.joined && (
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Member since</span>
            <span className="text-white">{user.joined}</span>
          </div>
        )}
      </div>
    </div>
  );
}
