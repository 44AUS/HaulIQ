import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { bookingsApi } from '../../services/api';
import RateConSignature from '../../components/shared/RateConSignature';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

const TMS_STEPS  = ['Dispatched', 'Picked Up', 'In Transit', 'Delivered', 'POD Received'];
const TMS_VALUES = ['dispatched', 'picked_up', 'in_transit', 'delivered', 'pod_received'];

function TmsStepper({ activeStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: 16 }}>
      {TMS_STEPS.map((label, idx) => {
        const done   = idx < activeStep;
        const active = idx === activeStep;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: idx < TMS_STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: done || active ? 'var(--ion-color-primary)' : 'var(--ion-color-light)',
                border: active ? '2px solid var(--ion-color-primary)' : 'none',
              }}>
                {done
                  ? <IonIcon name="checkmark-outline" style={{ fontSize: 14, color: '#fff' }} />
                  : active
                  ? <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff' }} />
                  : <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ion-color-medium)' }}>{idx + 1}</span>
                }
              </div>
              <span style={{ marginTop: 4, fontSize: '0.6rem', whiteSpace: 'nowrap', color: active ? 'var(--ion-color-primary)' : done ? 'var(--ion-text-color)' : 'var(--ion-color-medium)', fontWeight: active ? 700 : 400 }}>
                {label}
              </span>
            </div>
            {idx < TMS_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, backgroundColor: done ? 'var(--ion-color-primary)' : 'var(--ion-color-light)', margin: '0 4px', marginBottom: 16 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--ion-border-color)' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{value}</span>
    </div>
  );
}

function Avatar({ name, role }) {
  const initial = (name || '?')[0].toUpperCase();
  const bg = role === 'broker' ? 'var(--ion-color-primary)' : '#7b1fa2';
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
      {initial}
    </div>
  );
}

export default function DispatchDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [checkCalls, setCheckCalls] = useState([]);
  const [callNote, setCallNote] = useState('');
  const [addingCall, setAddingCall] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [markingPOD, setMarkingPOD] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    driver_name: '', driver_phone: '', carrier_visible_notes: '', dispatch_notes: '',
  });
  const callsEndRef = useRef(null);

  const load = booking?.load;
  const tmsStep = booking?.tms_status ? TMS_VALUES.indexOf(booking.tms_status) : -1;

  const fetchAll = async () => {
    try {
      const [bk, calls] = await Promise.all([
        bookingsApi.get(bookingId),
        bookingsApi.checkCalls(bookingId),
      ]);
      setBooking(bk);
      setCheckCalls(calls);
      setDispatchForm({
        driver_name:           bk.driver_name           || '',
        driver_phone:          bk.driver_phone          || '',
        carrier_visible_notes: bk.carrier_visible_notes || '',
        dispatch_notes:        bk.dispatch_notes        || '',
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [bookingId]); // eslint-disable-line

  useEffect(() => {
    callsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [checkCalls]);

  const handleSaveDispatch = async () => {
    setSaving(true);
    try {
      await bookingsApi.dispatch(bookingId, dispatchForm);
      const bk = await bookingsApi.get(bookingId);
      setBooking(bk);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPOD = async () => {
    setMarkingPOD(true);
    try {
      await bookingsApi.tmsStatus(bookingId, 'pod_received');
      setBooking(b => ({ ...b, tms_status: 'pod_received' }));
    } catch (e) {
      alert(e.message);
    } finally {
      setMarkingPOD(false);
    }
  };

  const handleAddCall = async () => {
    if (!callNote.trim()) return;
    setAddingCall(true);
    try {
      await bookingsApi.addCheckCall(bookingId, callNote.trim());
      const calls = await bookingsApi.checkCalls(bookingId);
      setCheckCalls(calls);
      setCallNote('');
    } catch (e) {
      alert(e.message);
    } finally {
      setAddingCall(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><IonSpinner name="crescent" /></div>
  );

  if (error || !booking) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <IonIcon name="warning-outline" style={{ fontSize: 40, color: '#d32f2f', display: 'block', margin: '0 auto 12px' }} />
      <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{error || 'Booking not found.'}</p>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-primary)', fontSize: '0.875rem', fontFamily: 'inherit' }}>Go back</button>
    </div>
  );

  const canDownloadRateCon = ['approved', 'in_transit', 'completed'].includes(booking.status);
  const set = (field) => (e) => setDispatchForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <button
        onClick={() => navigate('/broker/active')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-primary)', fontSize: '0.875rem', fontFamily: 'inherit', alignSelf: 'flex-start', padding: 0 }}
      >
        <IonIcon name="arrow-back-outline" style={{ fontSize: 16 }} /> Back to Loads in Progress
      </button>

      {/* Header */}
      <div style={{ ...cardStyle, padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ion-text-color)' }}>
            {load?.origin} → {load?.destination}
          </h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ion-color-medium)' }}>
            Booking #{bookingId.slice(0, 8)}
            {booking.carrier_name ? ` · ${booking.carrier_name}` : ''}
            {load?.rate ? ` · $${load.rate.toLocaleString()}` : ''}
          </p>
        </div>

        <TmsStepper activeStep={tmsStep} />

        {booking.tms_status === 'delivered' && (
          <button
            onClick={handleMarkPOD}
            disabled={markingPOD}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, cursor: markingPOD ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: markingPOD ? 0.7 : 1 }}
          >
            {markingPOD ? <IonSpinner name="crescent" style={{ width: 16, height: 16, color: '#fff' }} /> : <IonIcon name="checkmark-circle" style={{ fontSize: 16 }} />}
            Mark POD Received — Close Out Load
          </button>
        )}
        {booking.tms_status === 'pod_received' && (
          <div style={{ padding: '10px 14px', backgroundColor: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.3)', borderRadius: 6, color: '#2e7d32', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IonIcon name="checkmark-circle" style={{ fontSize: 16 }} />
            <div>
              <strong>POD Received</strong>
              <span style={{ display: 'block', fontSize: '0.75rem' }}>Load fully closed out.</span>
            </div>
          </div>
        )}
      </div>

      {canDownloadRateCon && <RateConSignature bookingId={bookingId} role="broker" />}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,7fr) minmax(0,5fr)', gap: 24 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Dispatch form */}
          <div style={{ ...cardStyle, padding: 20 }}>
            <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Dispatch Details</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Driver Name</label>
                  <input style={inputStyle} value={dispatchForm.driver_name} onChange={set('driver_name')} placeholder="Jane Smith" />
                </div>
                <div>
                  <label style={labelStyle}>Driver Phone</label>
                  <input style={inputStyle} value={dispatchForm.driver_phone} onChange={set('driver_phone')} placeholder="(555) 000-0000" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes for Carrier <span style={{ fontWeight: 400 }}>(visible to carrier)</span></label>
                <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={dispatchForm.carrier_visible_notes} onChange={set('carrier_visible_notes')} placeholder="Gate code, dock instructions, appointment time..." />
              </div>

              <div>
                <label style={labelStyle}>Internal Dispatch Notes <span style={{ fontWeight: 400 }}>(only visible to your team)</span></label>
                <textarea style={{ ...inputStyle, height: 52, resize: 'vertical' }} value={dispatchForm.dispatch_notes} onChange={set('dispatch_notes')} placeholder="Internal notes — not visible to the carrier" />
              </div>
            </div>

            <button
              onClick={handleSaveDispatch}
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '8px 16px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} /> : <IonIcon name="save-outline" style={{ fontSize: 14 }} />}
              {saving ? 'Saving…' : booking.tms_status ? 'Update Dispatch' : 'Dispatch Load'}
            </button>
          </div>

          {/* Check Call Log */}
          <div style={{ ...cardStyle, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <IonIcon name="chatbox-outline" style={{ color: 'var(--ion-color-medium)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Check Call Log</span>
              {checkCalls.length > 0 && (
                <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700, backgroundColor: 'var(--ion-color-light)', color: 'var(--ion-color-medium)' }}>{checkCalls.length}</span>
              )}
            </div>

            {checkCalls.length === 0 ? (
              <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No check calls yet.</p>
            ) : (
              <div style={{ marginBottom: 16, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {checkCalls.map((call, idx) => (
                  <div key={call.id}>
                    <div style={{ padding: '10px 0', display: 'flex', gap: 12 }}>
                      <Avatar name={call.author_name} role={call.author_role} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{call.author_name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--ion-color-medium)' }}>{new Date(call.created_at).toLocaleString()}</span>
                        </div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--ion-text-color)', wordBreak: 'break-word' }}>{call.note}</span>
                      </div>
                    </div>
                    {idx < checkCalls.length - 1 && <div style={{ borderTop: '1px solid var(--ion-border-color)' }} />}
                  </div>
                ))}
                <div ref={callsEndRef} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <textarea
                style={{ ...inputStyle, flex: 1, resize: 'none', height: 60 }}
                placeholder="Add a check call note..."
                value={callNote}
                onChange={e => setCallNote(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCall(); } }}
              />
              <button
                onClick={handleAddCall}
                disabled={!callNote.trim() || addingCall}
                style={{ padding: '0 20px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: (!callNote.trim() || addingCall) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: (!callNote.trim() || addingCall) ? 0.7 : 1, alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}
              >
                {addingCall ? <IonSpinner name="crescent" style={{ width: 16, height: 16, color: '#fff' }} /> : 'Add'}
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Load summary */}
          <div style={{ ...cardStyle, padding: 20 }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '0.82rem', color: 'var(--ion-text-color)' }}>Load Summary</p>
            <div>
              {[
                ['Pickup',        load?.origin || '—'],
                ['Delivery',      load?.destination || '—'],
                ['Pickup Date',   load?.pickup_date ? new Date(load.pickup_date).toLocaleDateString() : '—'],
                ['Delivery Date', load?.delivery_date ? new Date(load.delivery_date).toLocaleDateString() : '—'],
                ['Miles',         load?.miles ? `${load.miles.toLocaleString()} mi` : '—'],
                ['Equipment',     load?.load_type || '—'],
                ['Rate',          load?.rate ? `$${load.rate.toLocaleString()}` : '—'],
                ['Commodity',     load?.commodity || '—'],
              ].map(([k, v]) => <InfoRow key={k} label={k} value={v} />)}
            </div>
          </div>

          {/* Carrier */}
          {booking.carrier_name && (
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <IonIcon name="person-outline" style={{ color: 'var(--ion-color-medium)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--ion-text-color)' }}>Carrier</span>
              </div>
              <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{booking.carrier_name}</p>
              {booking.tms_status && (
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: '1px solid #0288d1', color: '#0288d1', textTransform: 'capitalize' }}>
                  {booking.tms_status.replace('_', ' ')}
                </span>
              )}
            </div>
          )}

          {/* Milestones */}
          {(booking.dispatched_at || booking.picked_up_at || booking.delivered_at || booking.pod_received_at) && (
            <div style={{ ...cardStyle, padding: 20 }}>
              <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '0.82rem', color: 'var(--ion-text-color)' }}>Milestone Timestamps</p>
              <div>
                {[
                  ['Dispatched',   booking.dispatched_at],
                  ['Picked Up',    booking.picked_up_at],
                  ['Delivered',    booking.delivered_at],
                  ['POD Received', booking.pod_received_at],
                ].filter(([, ts]) => ts).map(([label, ts]) => (
                  <InfoRow key={label} label={label} value={new Date(ts).toLocaleString()} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
