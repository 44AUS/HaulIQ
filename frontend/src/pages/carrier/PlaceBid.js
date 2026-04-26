import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { loadsApi, bidsApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

export default function PlaceBid() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [load, setLoad]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [amount, setAmount]       = useState('');
  const [note, setNote]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState(null);
  const [existingBid, setExistingBid] = useState(null);

  useEffect(() => {
    loadsApi.get(id)
      .then(data => {
        setLoad(adaptLoad(data));
        setAmount(String(data.rate || ''));
        return bidsApi.my();
      })
      .then(bids => {
        const existing = bids.find(b => String(b.load_id) === String(id));
        if (existing) setExistingBid(existing);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const parsed  = parseFloat(amount);
  const valid   = !isNaN(parsed) && parsed > 0;
  const pctDiff = load && valid ? (((parsed - load.rate) / load.rate) * 100).toFixed(1) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await bidsApi.place({ load_id: load._raw.id, amount: parsed, note: note.trim() || null });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <IonSpinner name="crescent" />
    </div>
  );

  if (!load) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <IonIcon name="warning-outline" style={{ fontSize: 40, color: '#d32f2f', display: 'block', margin: '0 auto 12px' }} />
      <p style={{ margin: '0 0 16px', color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>Load not found.</p>
      <Link to="/carrier/loads" style={{ color: 'var(--ion-color-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>Back to Load Board</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <button
        onClick={() => navigate(`/carrier/loads/${id}`)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-primary)', fontSize: '0.875rem', fontFamily: 'inherit', alignSelf: 'flex-start', padding: 0 }}
      >
        <IonIcon name="arrow-back-outline" style={{ fontSize: 16 }} /> Back to Load
      </button>

      {/* Load summary */}
      <div style={{ ...cardStyle, padding: 16 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 12 }}>You're bidding on</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <IonIcon name="location-outline" style={{ fontSize: 12, color: 'var(--ion-color-medium)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Origin</span>
            </span>
            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)', display: 'block' }}>{load.origin}</span>
          </div>
          <span style={{ color: 'var(--ion-color-medium)' }}>→</span>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginBottom: 4 }}>
              <IonIcon name="location-outline" style={{ fontSize: 12, color: 'var(--ion-color-medium)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Destination</span>
            </span>
            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)', display: 'block' }}>{load.dest}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, paddingTop: 16, borderTop: '1px solid var(--ion-border-color)' }}>
          {[
            { label: 'Listed Rate', value: `$${load.rate.toLocaleString()}` },
            { label: 'Miles',       value: `${load.miles} mi` },
            { label: 'Type',        value: load.type },
          ].map(({ label, value }) => (
            <div key={label}>
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 2 }}>{label}</span>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)', display: 'block' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Existing bid notice */}
      {existingBid && (() => {
        const isAccepted  = existingBid.status === 'accepted';
        const isCountered = existingBid.status === 'countered';
        const bg    = isAccepted ? 'rgba(46,125,50,0.08)'  : isCountered ? 'rgba(2,136,209,0.08)'  : 'rgba(237,108,2,0.08)';
        const border = isAccepted ? 'rgba(46,125,50,0.3)'  : isCountered ? 'rgba(2,136,209,0.3)'   : 'rgba(237,108,2,0.3)';
        const color  = isAccepted ? '#2e7d32'              : isCountered ? '#0288d1'                : '#ed6c02';
        return (
          <div style={{ padding: '12px 14px', backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 6 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.875rem', color }}>You already have a bid on this load</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color }}>
              ${existingBid.amount?.toLocaleString()} — {existingBid.status}
              {existingBid.status === 'countered' && existingBid.counter_amount && (
                <> · Broker countered at <strong>${existingBid.counter_amount.toLocaleString()}</strong></>
              )}
            </p>
          </div>
        );
      })()}

      {/* Success state */}
      {submitted ? (
        <div style={{ ...cardStyle, padding: '64px 20px', textAlign: 'center', border: `1px solid var(--ion-color-primary)` }}>
          <IonIcon name="checkmark-circle" style={{ fontSize: 56, color: 'var(--ion-color-primary)', display: 'block', margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Bid Submitted!</h3>
          <p style={{ margin: '0 0 32px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
            Your bid of <strong>${parsed.toLocaleString()}</strong> has been sent to the broker.
            You'll be notified when they respond.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link to={`/carrier/loads/${id}`} style={{ padding: '8px 16px', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
              Back to Load
            </Link>
            <Link to="/carrier/loads" style={{ padding: '8px 16px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
              Browse More Loads
            </Link>
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ion-text-color)' }}>Place Your Bid</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Submit a rate to the broker for this load.</p>
            </div>

            {/* Amount */}
            <div>
              <label style={labelStyle}>Bid Amount *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ion-color-medium)', pointerEvents: 'none', display: 'flex' }}>
                  <IonIcon name="cash-outline" style={{ fontSize: 16 }} />
                </span>
                <input
                  style={{ ...inputStyle, paddingLeft: 32, fontSize: '1.1rem', fontWeight: 600 }}
                  type="number"
                  required
                  min={1}
                  step={1}
                  placeholder={String(load.rate)}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  autoFocus
                />
              </div>
              {pctDiff !== null && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: parseFloat(pctDiff) >= 0 ? '#2e7d32' : '#ed6c02', display: 'block', marginTop: 4 }}>
                  {parseFloat(pctDiff) >= 0 ? `+${pctDiff}%` : `${pctDiff}%`} vs listed rate of ${load.rate.toLocaleString()}
                </span>
              )}
              {valid && (
                <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginTop: 2 }}>
                  ${(parsed / load.miles).toFixed(2)}/mi
                </span>
              )}
            </div>

            {/* Note */}
            <div>
              <label style={labelStyle}>Note to Broker (optional)</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 88 }}
                rows={4}
                maxLength={500}
                placeholder="Tell the broker why you're the best carrier for this load — experience, equipment, availability..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginTop: 2 }}>{note.length}/500</span>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon name="warning-outline" style={{ fontSize: 16 }} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => navigate(`/carrier/loads/${id}`)}
                style={{ flex: 1, padding: '12px', border: '1px solid var(--ion-border-color)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!valid || submitting}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: (!valid || submitting) ? 'not-allowed' : 'pointer', fontSize: '1rem', fontFamily: 'inherit', fontWeight: 600, opacity: (!valid || submitting) ? 0.7 : 1 }}
              >
                {submitting && <IonSpinner name="crescent" style={{ width: 16, height: 16, color: '#fff' }} />}
                {submitting ? 'Submitting...' : 'Submit Bid'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
