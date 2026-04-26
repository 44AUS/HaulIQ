import { Link } from 'react-router-dom';
import { Briefcase, Zap, TrendingUp, Users } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

const VALUES = [
  { icon: <Zap size={20} />,        title: 'Move Fast',        desc: 'We ship quickly, learn from users, and iterate. No bureaucracy, no red tape.' },
  { icon: <TrendingUp size={20} />, title: 'Impact Driven',    desc: 'Every feature we build helps truckers earn more and brokers operate smarter.' },
  { icon: <Users size={20} />,      title: 'Small & Mighty',   desc: 'A tight-knit team where your work is visible and your voice genuinely matters.' },
  { icon: <Briefcase size={20} />,  title: 'Remote-First',     desc: 'Work from anywhere. We care about outcomes, not office hours.' },
];

export default function Careers() {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      <Navbar />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '80px 24px 100px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-block', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.06em', marginBottom: 16 }}>
            CAREERS
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: '#e6edf3', marginBottom: 16, lineHeight: 1.2 }}>
            Help Us Build the Future<br />of Freight
          </h1>
          <p style={{ color: '#8b949e', fontSize: 16, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            Urload is on a mission to help carriers earn more and brokers work smarter. We're building technology that actually matters in the real world of trucking.
          </p>
        </div>

        {/* Values */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 64 }}>
          {VALUES.map(({ icon, title, desc }) => (
            <div key={title} style={{ background: 'rgba(22,27,34,0.7)', border: '1px solid rgba(48,54,61,0.5)', borderRadius: 14, padding: '22px 24px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', marginBottom: 14 }}>
                {icon}
              </div>
              <h3 style={{ color: '#e6edf3', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{title}</h3>
              <p style={{ color: '#6e7681', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* No open roles */}
        <div style={{ background: 'rgba(22,27,34,0.5)', border: '1px solid rgba(48,54,61,0.4)', borderRadius: 16, padding: '52px 40px', textAlign: 'center', marginBottom: 48 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(48,54,61,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Briefcase size={22} color="#484f58" />
          </div>
          <h2 style={{ color: '#e6edf3', fontWeight: 700, fontSize: 22, marginBottom: 10 }}>
            No Open Positions Right Now
          </h2>
          <p style={{ color: '#6e7681', fontSize: 15, maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.7 }}>
            We don't have any open roles at the moment, but we're always growing. Send us your resume and we'll keep you in mind for future openings.
          </p>
          <Link
            to="/contact"
            style={{ display: 'inline-block', background: '#0ea5e9', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 10, textDecoration: 'none', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#0284c7'}
            onMouseLeave={e => e.currentTarget.style.background = '#0ea5e9'}
          >
            Send Us Your Resume
          </Link>
        </div>

        {/* Footer nav */}
        <div style={{ borderTop: '1px solid rgba(48,54,61,0.5)', paddingTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#0ea5e9', fontSize: 14, textDecoration: 'none' }}>← Back to Home</Link>
          <Link to="/contact" style={{ color: '#6e7681', fontSize: 14, textDecoration: 'none' }}>Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
