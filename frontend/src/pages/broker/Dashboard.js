import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadsApi, bookingsApi, analyticsApi, brokersApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import IonIcon from '../../components/IonIcon';

const cardStyle = {
  backgroundColor: 'var(--ion-card-background)',
  border: '1px solid var(--ion-border-color)',
  borderRadius: 8,
};

function StatusBadge({ status }) {
  const cfg = status === 'active'  ? { label: 'Active',  bg: 'rgba(45,211,111,0.12)',  color: '#2dd36f' }
             : status === 'filled'  ? { label: 'Filled',  bg: 'rgba(56,128,255,0.12)',  color: '#3880ff' }
             : { label: 'Expired', bg: 'rgba(235,68,90,0.12)', color: '#eb445a' };
  return (
    <span style={{ backgroundColor: cfg.bg, color: cfg.color, borderRadius: 10, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
      {cfg.label}
    </span>
  );
}

export default function BrokerDashboard() {
  const { user } = useAuth();
  const [loads, setLoads] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [brokerAnalytics, setBrokerAnalytics] = useState(null);
  const [brokerProfile, setBrokerProfile] = useState(null);

  useEffect(() => {
    loadsApi.posted()
      .then(res => {
        const adapted = adaptLoadList(res);
        setLoads(adapted.map(l => ({ ...l, status: l.status === 'removed' ? 'expired' : l.status })));
      })
      .catch(() => setLoads([]));

    bookingsApi.pending().then(data => setPendingCount(Array.isArray(data) ? data.length : 0)).catch(() => setPendingCount(0));
    analyticsApi.broker().then(data => setBrokerAnalytics(data)).catch(() => setBrokerAnalytics(null));

    if (user?.id) {
      brokersApi.get(user.id).then(data => setBrokerProfile(data)).catch(() => setBrokerProfile(null));
    }
  }, [user?.id]);

  const recentLoads = loads.slice(0, 4);

  const stats = [
    { icon: 'car-sport-outline',  label: 'Active Loads',     value: loads.filter(l => l.status === 'active').length },
    { icon: 'eye-outline',        label: 'Total Views',       value: brokerAnalytics ? brokerAnalytics.total_views : loads.reduce((s, l) => s + (l.viewCount || 0), 0) },
    { icon: 'people-outline',     label: 'Pending Bookings',  value: pendingCount },
    { icon: 'trending-up-outline',label: 'Fill Rate',         value: loads.length ? `${Math.round((loads.filter(l => l.status === 'filled').length / loads.length) * 100)}%` : '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: 'var(--ion-text-color)' }}>
            Welcome, {user?.name?.split(' ')[0]}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Your freight brokerage performance overview</p>
        </div>
        <Link to="/broker/post" style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--ion-color-primary)', color: '#fff', textDecoration: 'none', borderRadius: 6, padding: '9px 16px', fontWeight: 700, fontSize: '0.875rem' }}>
          <IonIcon name="add-circle-outline" style={{ fontSize: 18 }} /> Post a Load
        </Link>
      </div>

      {/* Stats — 4 equal columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
        {stats.map(({ icon, label, value }) => (
          <div key={label} style={cardStyle}>
            <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'var(--ion-color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IonIcon name={icon} style={{ fontSize: 22, color: 'var(--ion-color-primary)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{label}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ion-text-color)' }}>{value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Rating */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        <div style={cardStyle}>
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)', marginBottom: 16 }}>Load Views (Last 6 Weeks)</div>
            {brokerAnalytics?.weekly?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={brokerAnalytics.weekly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="views" fill="#1565C0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Post loads to see view data</span>
              </div>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', marginBottom: 16 }}>Your Broker Rating</div>
            <div style={{ textAlign: 'center', paddingTop: 8, paddingBottom: 8 }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ion-text-color)' }}>
                {brokerProfile?.avg_rating > 0 ? brokerProfile.avg_rating.toFixed(1) : '—'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '8px 0' }}>
                {[1,2,3,4,5].map(i => (
                  <IonIcon key={i} name="star-outline" style={{ fontSize: 18, color: brokerProfile?.avg_rating >= i ? 'var(--ion-color-warning)' : 'var(--ion-color-medium)' }} />
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>
                {brokerProfile?.reviews_count > 0
                  ? `Based on ${brokerProfile.reviews_count} carrier review${brokerProfile.reviews_count !== 1 ? 's' : ''}`
                  : 'No carrier reviews yet'}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--ion-border-color)', marginTop: 12, paddingTop: 12 }}>
              {[
                ['Avg Payment Days', brokerProfile?.avg_payment_days ? `${Math.round(brokerProfile.avg_payment_days)} days` : '—'],
                ['Pay Speed',        brokerProfile?.pay_speed ? brokerProfile.pay_speed.replace('_', ' ') : '—'],
                ['Total Reviews',    brokerProfile?.reviews_count > 0 ? brokerProfile.reviews_count : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{k}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-color-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Loads */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)' }}>My Recent Loads</span>
          <Link to="/broker/loads" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--ion-color-primary)', textDecoration: 'none' }}>
            Manage all <IonIcon name="arrow-forward-outline" style={{ fontSize: 14 }} />
          </Link>
        </div>

        {loads.length === 0 ? (
          <div style={{ ...cardStyle, padding: '32px 24px', textAlign: 'center' }}>
            <IonIcon name="cube-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No loads posted yet.</p>
            <Link to="/broker/post" style={{ fontSize: '0.875rem', color: 'var(--ion-color-primary)', textDecoration: 'none' }}>Post your first load</Link>
          </div>
        ) : (
          <div style={cardStyle}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--ion-color-light)' }}>
                    {['Load #', 'Route', 'Type', 'Rate', 'Pickup', 'Views', 'Bids', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLoads.map((load, idx) => (
                    <tr key={load.id} style={{ backgroundColor: idx % 2 === 1 ? 'var(--ion-color-light)' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ion-color-medium)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                        {String(load._raw?.id || load.id).slice(0, 8).toUpperCase()}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <Link to={`/broker/loads/${load._raw?.id || load.id}`} state={{ from: 'Dashboard' }} style={{ fontWeight: 600, color: 'var(--ion-color-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>
                          {load.origin} → {load.dest}
                        </Link>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{load.type}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--ion-text-color)' }}>${(load.rate || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--ion-color-medium)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{load.pickup}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IonIcon name="eye-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{load.viewCount || 0}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IonIcon name="people-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>—</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}><StatusBadge status={load.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
