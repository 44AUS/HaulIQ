import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, User, MessageSquare, ChevronDown, Check } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { contactApi } from '../services/api';

const SUBJECTS = [
  'General Inquiry',
  'Technical Support',
  'Billing & Payments',
  'Account Issue',
  'Partnership',
  'Report a Bug',
  'Other',
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await contactApi.submit(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      <Navbar />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '80px 24px 100px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ display: 'inline-block', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.06em', marginBottom: 16 }}>
            CONTACT
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#e6edf3', marginBottom: 14, lineHeight: 1.2 }}>
            Get in Touch
          </h1>
          <p style={{ color: '#8b949e', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
            Have a question, issue, or partnership idea? We'd love to hear from you. Our team typically responds within one business day.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr)', gap: 40, alignItems: 'start' }}>
          {/* Left — contact info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              {
                icon: <Mail size={18} />,
                title: 'Email Us',
                lines: ['support@hauliq.com', 'For fastest response'],
              },
              {
                icon: <MessageSquare size={18} />,
                title: 'Support Hours',
                lines: ['Monday – Friday', '9 AM – 6 PM ET'],
              },
            ].map(({ icon, title, lines }) => (
              <div key={title} style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <p style={{ color: '#e6edf3', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</p>
                  {lines.map((l, i) => (
                    <p key={i} style={{ color: '#6e7681', fontSize: 13, margin: 0 }}>{l}</p>
                  ))}
                </div>
              </div>
            ))}

            {/* Quick links */}
            <div style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: 12, padding: '18px 20px' }}>
              <p style={{ color: '#0ea5e9', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14 }}>QUICK LINKS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Terms of Service', to: '/terms' },
                  { label: 'Privacy Policy',   to: '/privacy' },
                  { label: 'Careers',          to: '/careers' },
                ].map(({ label, to }) => (
                  <Link key={label} to={to} style={{ color: '#8b949e', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}
                  >
                    <span style={{ opacity: 0.4 }}>→</span> {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div style={{ background: 'rgba(22,27,34,0.7)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: 16, padding: '32px' }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Check size={26} color="#22c55e" />
                </div>
                <h3 style={{ color: '#e6edf3', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Message Sent!</h3>
                <p style={{ color: '#8b949e', fontSize: 14, marginBottom: 28 }}>
                  Thanks for reaching out. We'll get back to you at <strong style={{ color: '#e6edf3' }}>{form.email}</strong> within one business day.
                </p>
                <button
                  onClick={() => { setSuccess(false); setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' }); }}
                  style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, color: '#0ea5e9', fontSize: 14, fontWeight: 600, padding: '10px 24px', cursor: 'pointer' }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h2 style={{ color: '#e6edf3', fontWeight: 700, fontSize: 18, margin: 0 }}>Send Us a Message</h2>

                {/* Name */}
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#484f58' }} />
                    <input
                      required
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="Your full name"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#484f58' }} />
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="you@example.com"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Subject <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={form.subject}
                      onChange={e => set('subject', e.target.value)}
                      style={{ ...inputStyle, paddingRight: 36, appearance: 'none', cursor: 'pointer' }}
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#484f58', pointerEvents: 'none' }} />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label style={{ display: 'block', color: '#8b949e', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Message <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    placeholder="Tell us how we can help…"
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                  />
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: submitting ? 'rgba(14,165,233,0.4)' : '#0ea5e9', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 0', cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                >
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(13,17,23,0.8)',
  border: '1px solid rgba(48,54,61,0.7)',
  borderRadius: 8,
  color: '#e6edf3',
  fontSize: 14,
  padding: '10px 12px 10px 34px',
  outline: 'none',
  boxSizing: 'border-box',
};
