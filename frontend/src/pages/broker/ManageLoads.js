import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { IonSpinner, IonModal } from '@ionic/react';
import { loadsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import { getDrivingMilesByCoords, getDrivingMiles } from '../../services/routing';
import IonIcon from '../../components/IonIcon';

const STATUS_OPTS = ['all', 'active', 'filled', 'expired'];
const EQUIPMENT = ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Lowboy', 'Tanker', 'Box Truck'];
const DIMS = ['48x102', '53x102', '40x96', '28x102'];

const STATUS_BADGE = {
  active:  { bg: 'rgba(46,125,50,0.12)',  color: '#2e7d32', label: 'Active' },
  filled:  { bg: 'rgba(2,136,209,0.12)',  color: '#0288d1', label: 'Filled' },
  expired: { bg: 'rgba(211,47,47,0.12)',  color: '#d32f2f', label: 'Expired' },
};

function statusChip(status) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.expired;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };
const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-color-light)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4, display: 'inline-block' }} />;
}

function EditModal({ load, onClose, onSaved }) {
  const raw = load._raw;
  const [form, setForm] = useState({
    originCity:      raw.origin || '',
    destCity:        raw.destination || '',
    pickupAddress:   raw.pickup_address || '',
    deliveryAddress: raw.delivery_address || '',
    pickupLat:       raw.pickup_lat || null,
    pickupLng:       raw.pickup_lng || null,
    deliveryLat:     raw.delivery_lat || null,
    deliveryLng:     raw.delivery_lng || null,
    miles:           raw.miles || '',
    deadhead:        raw.deadhead_miles || '',
    pickup:          raw.pickup_date || '',
    delivery:        raw.delivery_date || '',
    equipment:       raw.load_type || 'Dry Van',
    weight:          raw.weight_lbs || '',
    commodity:       raw.commodity || '',
    dims:            raw.dimensions || '48x102',
    rate:            raw.rate || '',
    notes:           raw.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [calcingMiles, setCalcingMiles] = useState(false);
  const milesTimer = useRef(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    clearTimeout(milesTimer.current);
    const { pickupLat, pickupLng, deliveryLat, deliveryLng, originCity, destCity } = form;
    const hasCoords = pickupLat && pickupLng && deliveryLat && deliveryLng;
    const hasCities = originCity?.includes(',') && destCity?.includes(',');
    if (!hasCoords && !hasCities) return;
    milesTimer.current = setTimeout(() => {
      setCalcingMiles(true);
      const promise = hasCoords
        ? getDrivingMilesByCoords(pickupLat, pickupLng, deliveryLat, deliveryLng)
        : getDrivingMiles(originCity, destCity);
      promise
        .then(miles => { if (miles) set('miles', String(miles)); })
        .finally(() => setCalcingMiles(false));
    }, 600);
    return () => clearTimeout(milesTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pickupLat, form.pickupLng, form.deliveryLat, form.deliveryLng, form.originCity, form.destCity]);

  const handlePickup = ({ address, cityState, lat, lng }) => {
    setForm(f => ({
      ...f,
      pickupAddress: address || f.pickupAddress,
      originCity:    cityState || address || f.originCity,
      pickupLat:     lat ?? null,
      pickupLng:     lng ?? null,
    }));
  };

  const handleDelivery = ({ address, cityState, lat, lng }) => {
    setForm(f => ({
      ...f,
      deliveryAddress: address || f.deliveryAddress,
      destCity:        cityState || address || f.destCity,
      deliveryLat:     lat ?? null,
      deliveryLng:     lng ?? null,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    loadsApi.update(raw.id, {
      origin:           form.originCity,
      destination:      form.destCity,
      miles:            parseInt(form.miles) || undefined,
      deadhead_miles:   parseInt(form.deadhead) || 0,
      load_type:        form.equipment,
      weight_lbs:       form.weight ? parseInt(form.weight) : null,
      commodity:        form.commodity || null,
      dimensions:       form.dims,
      pickup_date:      form.pickup || undefined,
      delivery_date:    form.delivery || undefined,
      rate:             parseFloat(form.rate) || undefined,
      notes:            form.notes || null,
      pickup_address:   form.pickupAddress || null,
      delivery_address: form.deliveryAddress || null,
      pickup_lat:       form.pickupLat || null,
      pickup_lng:       form.pickupLng || null,
      delivery_lat:     form.deliveryLat || null,
      delivery_lng:     form.deliveryLng || null,
    })
      .then(() => { onSaved(); onClose(); })
      .catch(err => { setError(err.message); setSaving(false); });
  };

  return (
    <IonModal isOpen onDidDismiss={onClose} style={{ '--width': '680px', '--height': 'auto', '--border-radius': '12px', '--max-height': '90vh' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Edit Load</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
            <IonIcon name="close-outline" style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Pickup Address *</label>
                <AddressAutocomplete
                  label="Pickup Address *"
                  value={form.pickupAddress || form.originCity}
                  onChange={handlePickup}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Delivery Address *</label>
                <AddressAutocomplete
                  label="Delivery Address *"
                  value={form.deliveryAddress || form.destCity}
                  onChange={handleDelivery}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Loaded Miles *</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, paddingRight: calcingMiles ? 36 : 12 }} type="number" required value={form.miles} onChange={e => set('miles', e.target.value)} />
                  {calcingMiles && <IonSpinner name="crescent" style={{ width: 14, height: 14, position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }} />}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Deadhead Miles</label>
                <input style={inputStyle} type="number" value={form.deadhead} onChange={e => set('deadhead', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Pickup Date *</label>
                <input style={inputStyle} type="date" required value={form.pickup} onChange={e => set('pickup', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Delivery Date *</label>
                <input style={inputStyle} type="date" required value={form.delivery} onChange={e => set('delivery', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Equipment Type</label>
                <select style={{ ...inputStyle }} value={form.equipment} onChange={e => set('equipment', e.target.value)}>
                  {EQUIPMENT.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Weight (lbs)</label>
                <input style={inputStyle} type="number" value={form.weight} onChange={e => set('weight', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Commodity</label>
                <input style={inputStyle} value={form.commodity} onChange={e => set('commodity', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Dimensions</label>
                <select style={{ ...inputStyle }} value={form.dims} onChange={e => set('dims', e.target.value)}>
                  {DIMS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Rate (All-In) $ *</label>
              <input style={inputStyle} type="number" required value={form.rate} onChange={e => set('rate', e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Notes</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} /> : <IonIcon name="save-outline" style={{ fontSize: 14 }} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </IonModal>
  );
}

export default function ManageLoads() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [editingLoad, setEditingLoad] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLoads = useCallback(() => {
    setLoading(true);
    loadsApi.posted()
      .then(res => {
        const adapted = adaptLoadList(res);
        setLoads(adapted.filter(l => l.status !== 'removed'));
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    loadsApi.delete(deleteTarget._raw.id)
      .then(() => {
        setLoads(prev => prev.filter(l => l._raw.id !== deleteTarget._raw.id));
        setDeleteTarget(null);
      })
      .catch(err => alert(err.message))
      .finally(() => setDeleting(false));
  };

  const filtered = filter === 'all' ? loads : loads.filter(l => l.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ion-text-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IonIcon name="cube-outline" style={{ color: 'var(--ion-color-primary)' }} /> Manage Loads
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
            {loads.filter(l => l.status === 'active').length} active loads
          </p>
        </div>
        <Link
          to="/broker/post"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}
        >
          <IonIcon name="add-circle-outline" style={{ fontSize: 16 }} /> Post New Load
        </Link>
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', border: '1px solid var(--ion-border-color)', borderRadius: 6, overflow: 'hidden', alignSelf: 'flex-start' }}>
        {STATUS_OPTS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '6px 16px', cursor: 'pointer', background: filter === s ? 'var(--ion-color-primary)' : 'transparent',
              color: filter === s ? '#fff' : 'var(--ion-text-color)', border: 'none',
              borderRight: s !== STATUS_OPTS[STATUS_OPTS.length - 1] ? '1px solid var(--ion-border-color)' : 'none',
              fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: filter === s ? 600 : 400, textTransform: 'capitalize',
            }}
          >
            {s}{s !== 'all' && ` (${loads.filter(l => l.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={cardStyle}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Load #', 'Route', 'Type', 'Rate', 'Pickup', 'Views', 'Bids', 'Status', 'Actions'].map(h => (
                    <th key={h} style={thStyle}><SkeletonBox width={60} height={12} /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[80, 160, 70, 70, 90, 40, 40, 70, 90].map((w, j) => (
                      <td key={j} style={tdStyle}><SkeletonBox width={w} height={14} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>
          {error}
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  {['Load #', 'Route', 'Type', 'Rate', 'Pickup', 'Views', 'Bids', 'Status', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '48px 0', color: 'var(--ion-color-medium)' }}>
                      No loads found
                    </td>
                  </tr>
                ) : filtered.map((load, idx) => (
                  <tr key={load.id} style={{ backgroundColor: idx % 2 === 1 ? 'var(--ion-color-light)' : 'transparent' }}>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ion-color-medium)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                      {String(load._raw.id).slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <Link
                        to={`/broker/loads/${load._raw.id}`}
                        state={{ from: 'Manage Loads' }}
                        style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-color-primary)', textDecoration: 'none' }}
                      >
                        {load.origin} → {load.dest}
                      </Link>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{load.type}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>${(load.rate || 0).toLocaleString()}</td>
                    <td style={{ ...tdStyle, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{load.pickup}</td>
                    <td style={tdStyle}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IonIcon name="eye-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} />
                        {load.viewCount || 0}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IonIcon name="people-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} />
                        —
                      </span>
                    </td>
                    <td style={tdStyle}>{statusChip(load.status)}</td>
                    <td style={tdStyle}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {load.status === 'active' && (
                          <button onClick={() => setEditingLoad(load)} title="Edit load" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex', borderRadius: 4 }}>
                            <IonIcon name="create-outline" style={{ fontSize: 16 }} />
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(load)} title="Delete load" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', padding: 4, display: 'flex', borderRadius: 4 }}>
                          <IonIcon name="trash-outline" style={{ fontSize: 16 }} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingLoad && (
        <EditModal
          load={editingLoad}
          onClose={() => setEditingLoad(null)}
          onSaved={fetchLoads}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <IonModal isOpen onDidDismiss={() => setDeleteTarget(null)} style={{ '--width': '360px', '--height': 'auto', '--border-radius': '12px' }}>
          <div style={{ backgroundColor: 'var(--ion-card-background)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Delete Load?</span>
              <button onClick={() => setDeleteTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
                <IonIcon name="close-outline" style={{ fontSize: 20 }} />
              </button>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
              This will remove the load from the board. Carriers will no longer see it.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ flex: 1, padding: '8px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', backgroundColor: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
                {deleting && <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </IonModal>
      )}
    </div>
  );
}
