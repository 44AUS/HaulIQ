import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import IonIcon from '../../components/IonIcon';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8, overflow: 'hidden' };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', fontFamily: 'inherit' };

const PLANS = {
  broker: [
    { key: 'starter', name: 'Starter', monthly: 0, annual: 0, badge: null, intro: 'Key Features', features: ['Up to 5 active load postings','Carrier search & booking','Basic document management','Email notifications','Standard analytics'] },
    { key: 'pro', name: 'Pro', monthly: 79, annual: 63, badge: 'Most Popular', intro: 'Everything in Starter, plus…', features: ['Unlimited load postings','Instant Book feature','Advanced analytics & reporting','Network management','Booking request management','Priority email support'] },
    { key: 'enterprise', name: 'Enterprise', monthly: 199, annual: 159, badge: null, intro: 'Everything in Pro, plus…', features: ['Dedicated account manager','Custom carrier allowlists','API access','Load performance insights','Custom integrations (TMS/ELD)','SLA-backed uptime guarantee'] },
  ],
  carrier: [
    { key: 'starter', name: 'Starter', monthly: 0, annual: 0, badge: null, intro: 'Key Features', features: ['Access to the load board','Bid on up to 10 loads/month','Document uploads (BOL, POD)','Basic profit calculator','Email notifications'] },
    { key: 'pro', name: 'Pro', monthly: 49, annual: 39, badge: 'Most Popular', intro: 'Everything in Starter, plus…', features: ['Unlimited load bids','Instant Book access','Advanced profit & fuel analytics','Earnings Brain AI suggestions','Priority load visibility','Priority support'] },
    { key: 'enterprise', name: 'Enterprise', monthly: 149, annual: 119, badge: null, intro: 'Everything in Pro, plus…', features: ['Fleet management tools','Multi-driver accounts','Dedicated account manager','Custom ELD integrations','Load performance reporting','API access'] },
  ],
};

const FEATURE_TABLE = {
  broker: [
    { section: 'Load Management' },
    { label: 'Active load postings', values: ['5', 'Unlimited', 'Unlimited'] },
    { label: 'Instant Book', values: [false, true, true] },
    { label: 'Booking request management', values: [false, true, true] },
    { label: 'Load performance analytics', values: [false, true, true] },
    { section: 'Carrier Tools' },
    { label: 'Carrier search', values: [true, true, true] },
    { label: 'Network management', values: [false, true, true] },
    { label: 'Carrier allowlist', values: [false, false, true] },
    { label: 'Carrier reviews', values: [true, true, true] },
    { section: 'Documents & Compliance' },
    { label: 'Document management', values: [true, true, true] },
    { label: 'BOL / POD uploads', values: [true, true, true] },
    { label: 'Rate confirmation docs', values: [false, true, true] },
    { section: 'Support & Integrations' },
    { label: 'Email support', values: [true, true, true] },
    { label: 'Priority support', values: [false, true, true] },
    { label: 'Dedicated account manager', values: [false, false, true] },
    { label: 'API access', values: [false, false, true] },
    { label: 'TMS / ELD integrations', values: [false, false, true] },
  ],
  carrier: [
    { section: 'Load Board' },
    { label: 'Load board access', values: [true, true, true] },
    { label: 'Monthly load bids', values: ['10', 'Unlimited', 'Unlimited'] },
    { label: 'Instant Book', values: [false, true, true] },
    { label: 'Saved loads', values: [true, true, true] },
    { section: 'Analytics & Tools' },
    { label: 'Profit calculator', values: [true, true, true] },
    { label: 'Advanced earnings analytics', values: [false, true, true] },
    { label: 'Earnings Brain (AI)', values: [false, true, true] },
    { label: 'Fuel cost estimator', values: [false, true, true] },
    { section: 'Documents' },
    { label: 'Document uploads (BOL/POD)', values: [true, true, true] },
    { label: 'Document history', values: [true, true, true] },
    { section: 'Fleet & Account' },
    { label: 'Single driver account', values: [true, true, true] },
    { label: 'Multi-driver accounts', values: [false, false, true] },
    { label: 'Fleet management tools', values: [false, false, true] },
    { label: 'Dedicated account manager', values: [false, false, true] },
    { label: 'API access', values: [false, false, true] },
  ],
};

function FeatureValue({ val }) {
  if (val === true)  return <IonIcon name="checkmark-outline" style={{ fontSize: 15, color: 'var(--ion-color-success)' }} />;
  if (val === false) return <IonIcon name="remove-outline" style={{ fontSize: 15, color: 'var(--ion-color-medium)' }} />;
  return <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{val}</span>;
}

function PlanCard({ plan, billing, currentKey, onActivate, activating }) {
  const price = billing === 'annual' ? plan.annual : plan.monthly;
  const isCurrent = currentKey === plan.key;
  const isFree = plan.monthly === 0;
  const statusColor = isCurrent ? '#22c55e' : '#b91c1c';
  const statusBg    = isCurrent ? 'rgba(34,197,94,0.12)' : 'rgba(185,28,28,0.12)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${isCurrent ? '#22c55e' : 'var(--ion-border-color)'}`, borderRadius: 8, overflow: 'hidden', height: '100%' }}>
      <div style={{ textAlign: 'center', padding: '6px 0', backgroundColor: statusBg }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{isCurrent ? 'Current Plan' : 'Inactive'}</span>
      </div>
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ion-text-color)' }}>{plan.name}</span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--ion-text-color)' }}>{isFree ? 'Free' : `$${price}.00`}</span>
          {!isFree && <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>/mo</span>}
        </div>
      </div>
      <div style={{ padding: '0 20px 16px' }}>
        {isCurrent ? (
          <div style={{ textAlign: 'center', padding: '8px 0', border: '1px solid #22c55e', borderRadius: 6, color: '#22c55e', fontWeight: 700, fontSize: '0.875rem' }}>Current Plan</div>
        ) : (
          <button onClick={() => onActivate(plan)} disabled={activating === plan.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 0', cursor: activating === plan.key ? 'default' : 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: '0.875rem', letterSpacing: '0.04em', opacity: activating === plan.key ? 0.7 : 1 }}>
            {activating === plan.key && <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} />}
            {activating === plan.key ? 'Processing…' : isFree ? 'Switch to Free' : 'Activate'}
          </button>
        )}
      </div>
      <div style={{ borderTop: '1px solid var(--ion-border-color)', padding: '12px 20px 20px', flex: 1 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--ion-color-medium)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{plan.intro}</div>
        {plan.features.map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <IonIcon name="checkmark-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)', marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
}
const CHART_DATES = last7Days();
const EMPTY_CHART = CHART_DATES.map(date => ({ date, trials: 0, pro: 0, enterprise: 0, starter: 0, credit: 0 }));

function ReferralsTab({ user, currentSub }) {
  const [copied, setCopied] = useState(false);
  const hasActivePlan = currentSub && currentSub.status !== 'cancelled';
  const referralCode = `URLOAD-${(user?.name || 'USER').split(' ')[0].toUpperCase().slice(0, 6)}`;
  const referralLink = `https://urload.app/join?ref=${referralCode}`;
  const maskedLink = '•'.repeat(36);
  const copy = () => { navigator.clipboard.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const dateRange = `${CHART_DATES[0]} - ${CHART_DATES[6]}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={cardStyle}>
        <div style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 12px', fontWeight: 800, fontSize: '1.1rem', color: 'var(--ion-text-color)' }}>Urload Referral Program</h3>
          <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'var(--ion-color-medium)', lineHeight: 1.7 }}>
            Get Urload to credit you! If a broker or carrier uses your referral link to sign up, they'll enjoy{' '}
            <strong>10% off their first billing cycle</strong> when they subscribe. And you'll get a{' '}
            <strong>10% credit</strong> towards your next billing cycle!
          </p>
          <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--ion-color-medium)', lineHeight: 1.7 }}>
            For example, if someone using your referral link subscribes to the annual Enterprise plan, they will
            get a 10% discount and Urload will apply a credit towards your subscription automatically.
          </p>
          <div style={{ borderTop: '1px solid var(--ion-border-color)', paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ion-color-medium)' }}>Referral Link</span>
              <IonIcon name="information-circle-outline" style={{ fontSize: 13, color: 'var(--ion-color-medium)' }} />
            </div>
            {hasActivePlan ? (
              <>
                <div style={{ position: 'relative' }}>
                  <input readOnly value={referralLink} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.82rem', paddingRight: 40 }} />
                  <button onClick={copy} title={copied ? 'Copied!' : 'Copy link'} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#2dd36f' : 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
                    <IonIcon name="copy-outline" style={{ fontSize: 15 }} />
                  </button>
                </div>
                {copied && <div style={{ fontSize: '0.75rem', color: '#2dd36f', marginTop: 4 }}>Link copied to clipboard!</div>}
              </>
            ) : (
              <>
                <input readOnly value={maskedLink} style={{ ...inputStyle, letterSpacing: '0.08em', color: 'var(--ion-color-medium)', marginBottom: 8 }} />
                <div style={{ display: 'inline-block', backgroundColor: 'var(--ion-color-danger)', borderRadius: 4, padding: '4px 12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 500 }}>You must have an active Urload subscription to unlock your referral link</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ion-color-medium)' }}>Analytics</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Days · {dateRange}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', marginBottom: 8 }}>Trials Started</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={EMPTY_CHART} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ReTooltip />
                  <Line type="monotone" dataKey="trials" stroke="#9ca3af" strokeWidth={2} dot={false} name="Trials Started" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', marginBottom: 8 }}>Conversions by Plan</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={EMPTY_CHART} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ReTooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="enterprise" stroke="#f59e0b" strokeWidth={2} dot={false} name="Enterprise" />
                  <Line type="monotone" dataKey="pro"        stroke="#3b82f6" strokeWidth={2} dot={false} name="Pro" />
                  <Line type="monotone" dataKey="starter"   stroke="#ec4899" strokeWidth={2} dot={false} name="Starter" />
                  <Line type="monotone" dataKey="credit"    stroke="#22c55e" strokeWidth={2} dot={false} name="Credit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Billing() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'plans';
  const [billing, setBilling] = useState('monthly');
  const [currentSub, setCurrentSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);

  const rolePlans = PLANS[user?.role] || PLANS.carrier;

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/subscriptions/plans?role=${user.role}`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/subscriptions/me`, { headers }).then(r => r.json()).catch(() => null),
    ]).then(([p, s]) => { setPlans(Array.isArray(p) ? p : []); setCurrentSub(s && !s.detail ? s : null); setLoading(false); });
  }, [token, user.role]);

  const currentKey = currentSub?.plan?.tier === 'elite' ? 'enterprise' : currentSub?.plan?.tier === 'pro' ? 'pro' : currentSub ? 'starter' : null;
  const daysLeft   = currentSub?.current_period_end ? Math.max(0, Math.ceil((new Date(currentSub.current_period_end) - Date.now()) / 86400000)) : null;

  const handleActivate = (plan) => {
    if (plan.monthly === 0) {
      const backendPlan = plans.find(p => p.tier === 'basic' || p.price === 0);
      if (backendPlan) {
        setActivating(plan.key);
        fetch(`${API}/api/subscriptions/change`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ plan_id: backendPlan.id }) }).finally(() => setActivating(null));
      }
      return;
    }
    const tierMap = { pro: 'pro', enterprise: 'elite' };
    const backendPlan = plans.find(p => p.tier === tierMap[plan.key]);
    navigate(backendPlan ? `/checkout?plan_id=${backendPlan.id}` : '/checkout');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {activeTab === 'plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[...Array(6)].map((_, i) => <div key={i} style={{ height: 160, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid var(--ion-border-color)' }} />)}
            </div>
          ) : (
            <>
              {/* Current plan card */}
              <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)', textAlign: 'center', marginBottom: 12 }}>Current Plan</div>
                <div style={{ ...cardStyle, border: '1px solid var(--ion-border-color)' }}>
                  <div style={{ textAlign: 'center', padding: '6px 0', backgroundColor: currentSub?.status === 'trialing' ? 'rgba(161,138,0,0.25)' : currentSub ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: currentSub?.status === 'trialing' ? '#c9a800' : currentSub ? '#22c55e' : 'var(--ion-color-medium)', textTransform: 'capitalize', letterSpacing: '0.06em' }}>
                      {currentSub?.status === 'trialing' ? 'Trialing' : currentSub ? currentSub.status : 'No Active Plan'}
                    </span>
                  </div>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--ion-text-color)' }}>{currentSub?.plan?.name || 'Starter'}</span>
                    {daysLeft !== null && currentSub && <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{daysLeft} days left</span>}
                  </div>
                  <div style={{ margin: '0 16px 16px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 6 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{(user?.company || user?.name || '?')[0].toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', lineHeight: 1.2 }}>{user?.role === 'broker' ? 'Business' : 'Carrier'}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.company || user?.name}</div>
                    </div>
                    <IonIcon name="chevron-forward-outline" style={{ fontSize: 17, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
                  </div>
                </div>
              </div>

              {/* Billing toggle */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 10, padding: 3, gap: 2 }}>
                  {[{ v: 'monthly', l: 'Monthly' }, { v: 'annual', l: 'Annual' }].map(({ v, l }) => (
                    <button key={v} onClick={() => setBilling(v)} style={{ background: billing === v ? 'var(--ion-card-background)' : 'transparent', color: billing === v ? 'var(--ion-text-color)' : 'var(--ion-color-medium)', border: 'none', borderRadius: 8, padding: '6px 20px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.875rem', boxShadow: billing === v ? '0 1px 4px rgba(0,0,0,0.15)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {l}
                      {v === 'annual' && <span style={{ backgroundColor: 'rgba(45,211,111,0.15)', color: '#2dd36f', borderRadius: 8, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 700 }}>Save 20%</span>}
                    </button>
                  ))}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ion-text-color)', marginTop: 16 }}>
                  {billing === 'annual' ? 'Annual' : 'Monthly'} Plans
                </div>
              </div>

              {/* Plan cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {rolePlans.map(plan => <PlanCard key={plan.key} plan={plan} billing={billing} currentKey={currentKey} onActivate={handleActivate} activating={activating} />)}
              </div>

              {/* Feature comparison table */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)', marginBottom: 16 }}>Full Feature Comparison</div>
                <div style={{ ...cardStyle }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)' }}>Features</th>
                        {rolePlans.map(p => <th key={p.key} style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)' }}>{p.name}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(FEATURE_TABLE[user?.role] || FEATURE_TABLE.carrier).map((row, i) => {
                        if (row.section) return (
                          <tr key={i}>
                            <td colSpan={4} style={{ padding: '6px 16px', backgroundColor: 'rgba(0,0,0,0.06)' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--ion-color-medium)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.section}</span>
                            </td>
                          </tr>
                        );
                        return (
                          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                            <td style={{ padding: '8px 16px', fontSize: '0.875rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)' }}>{row.label}</td>
                            {row.values.map((v, vi) => <td key={vi} style={{ padding: '8px 16px', textAlign: 'center', borderBottom: '1px solid var(--ion-border-color)' }}><FeatureValue val={v} /></td>)}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {currentSub && currentSub.status !== 'cancelled' && currentKey !== 'starter' && (
                <div style={{ maxWidth: 500, padding: '12px 16px', borderRadius: 6, backgroundColor: 'rgba(255,196,9,0.1)', border: '1px solid rgba(255,196,9,0.3)', color: 'var(--ion-color-warning)', fontSize: '0.875rem' }}>
                  To cancel your plan, contact <a href="mailto:support@urload.app" style={{ color: 'var(--ion-color-warning)', fontWeight: 600 }}>support@urload.app</a>. You'll keep access until the end of your billing period.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'referrals' && <ReferralsTab user={user} currentSub={currentSub} />}
    </div>
  );
}
