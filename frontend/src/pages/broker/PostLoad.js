import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { loadsApi, equipmentTypesApi, equipmentClassesApi, rateIntelApi, loadTemplatesApi } from '../../services/api';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import { getDrivingMilesByCoords, getDrivingMiles } from '../../services/routing';
import IonIcon from '../../components/IonIcon';

const DIMS = ['48x102', '53x102', '40x96', '28x102'];

const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

function Toggle({ checked, onChange, color = 'primary' }) {
  const bg = checked
    ? (color === 'success' ? '#2e7d32' : 'var(--ion-color-primary)')
    : 'var(--ion-color-medium)';
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, flexShrink: 0, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ position: 'absolute', inset: 0, backgroundColor: bg, borderRadius: 22, transition: 'background 0.2s' }}>
        <span style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', top: 3, left: checked ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </span>
    </label>
  );
}

export default function PostLoad() {
  const navigate = useNavigate();
  const { state: routeState } = useLocation();
  const [equipmentClasses, setEquipmentClasses] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  useEffect(() => {
    Promise.all([equipmentClassesApi.list(), equipmentTypesApi.list()])
      .then(([classes, types]) => {
        setEquipmentClasses(Array.isArray(classes) ? classes : []);
        setEquipmentTypes(Array.isArray(types) ? types : []);
      })
      .catch(() => {});
  }, []);

  const tpl = routeState?.template || null;

  const [form, setForm] = useState({
    originCity: tpl?.origin || '', destCity: tpl?.destination || '',
    pickupAddress: tpl?.pickup_address || '', deliveryAddress: tpl?.delivery_address || '',
    pickupLat: tpl?.pickup_lat || null, pickupLng: tpl?.pickup_lng || null,
    deliveryLat: tpl?.delivery_lat || null, deliveryLng: tpl?.delivery_lng || null,
    pickup: '', delivery: '',
    equipmentClass: '', equipment: tpl?.load_type || '', weight: tpl?.weight_lbs ? String(tpl.weight_lbs) : '', dims: tpl?.dimensions || '48x102',
    loadSize: tpl?.load_size || 'full', trailerLength: tpl?.trailer_length_ft ? String(tpl.trailer_length_ft) : '',
    commodity: tpl?.commodity || '', rate: tpl?.rate ? String(tpl.rate) : '', miles: tpl?.miles ? String(tpl.miles) : '', deadhead: tpl?.deadhead_miles ? String(tpl.deadhead_miles) : '', notes: tpl?.notes || '',
    instantBook: tpl?.instant_book || false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [posted, setPosted] = useState(false);
  const [calcingMiles, setCalcingMiles] = useState(false);
  const [rateIntel, setRateIntel] = useState(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState(tpl ? tpl.name : '');
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

  useEffect(() => {
    const originState = form.originCity?.split(', ')[1];
    const destState   = form.destCity?.split(', ')[1];
    if (!originState || !destState) { setRateIntel(null); return; }
    rateIntelApi.lane(originState, destState)
      .then(data => setRateIntel(data))
      .catch(() => setRateIntel(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.originCity, form.destCity]);

  const handlePickup = ({ address, cityState, lat, lng }) => {
    setForm(f => ({
      ...f,
      pickupAddress: address || f.pickupAddress,
      originCity: cityState || address || f.originCity,
      pickupLat: lat ?? null,
      pickupLng: lng ?? null,
    }));
  };

  const handleDelivery = ({ address, cityState, lat, lng }) => {
    setForm(f => ({
      ...f,
      deliveryAddress: address || f.deliveryAddress,
      destCity: cityState || address || f.destCity,
      deliveryLat: lat ?? null,
      deliveryLng: lng ?? null,
    }));
  };

  const handlePost = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    loadsApi.post({
      origin:           form.originCity,
      destination:      form.destCity,
      origin_state:     form.originCity.split(', ')[1] || null,
      dest_state:       form.destCity.split(', ')[1] || null,
      miles:            parseInt(form.miles) || 0,
      deadhead_miles:   parseInt(form.deadhead) || 0,
      load_type:        form.equipment,
      weight_lbs:       form.weight ? parseInt(form.weight) : null,
      commodity:        form.commodity || null,
      pickup_date:      form.pickup,
      delivery_date:    form.delivery,
      rate:             parseFloat(form.rate),
      notes:            form.notes || null,
      pickup_address:   form.pickupAddress || null,
      delivery_address: form.deliveryAddress || null,
      pickup_lat:       form.pickupLat || null,
      pickup_lng:       form.pickupLng || null,
      delivery_lat:     form.deliveryLat || null,
      delivery_lng:     form.deliveryLng || null,
      instant_book:      form.instantBook,
      load_size:         form.loadSize,
      trailer_length_ft: form.trailerLength ? parseInt(form.trailerLength) : null,
    })
      .then(() => {
        if (saveAsTemplate && templateName.trim()) {
          loadTemplatesApi.create({
            name: templateName.trim(),
            origin: form.originCity,
            origin_state: form.originCity.split(', ')[1] || null,
            destination: form.destCity,
            dest_state: form.destCity.split(', ')[1] || null,
            miles: parseInt(form.miles) || 0,
            deadhead_miles: parseInt(form.deadhead) || 0,
            pickup_address: form.pickupAddress || null,
            delivery_address: form.deliveryAddress || null,
            pickup_lat: form.pickupLat || null,
            pickup_lng: form.pickupLng || null,
            delivery_lat: form.deliveryLat || null,
            delivery_lng: form.deliveryLng || null,
            load_type: form.equipment || null,
            load_size: form.loadSize || null,
            trailer_length_ft: form.trailerLength ? parseInt(form.trailerLength) : null,
            weight_lbs: form.weight ? parseInt(form.weight) : null,
            commodity: form.commodity || null,
            dimensions: form.dims || null,
            rate: parseFloat(form.rate),
            notes: form.notes || null,
            instant_book: form.instantBook,
          }).catch(() => {});
        }
        setPosted(true);
      })
      .catch(err => { setError(err.message); setSubmitting(false); });
  };

  const getRateHelperColor = () => {
    if (!form.rate) return 'var(--ion-color-medium)';
    const rpm = form.miles ? parseFloat(form.rate) / parseInt(form.miles) : null;
    if (parseFloat(form.rate) < 1500) return '#ed6c02';
    if (rateIntel && rpm && rpm < rateIntel.avg_rpm * 0.85) return '#d32f2f';
    if (rateIntel && rpm && rpm > rateIntel.avg_rpm * 1.15) return '#2e7d32';
    return 'var(--ion-color-medium)';
  };

  const getRateHelperText = () => {
    if (!form.rate) return rateIntel ? `Lane avg: $${rateIntel.avg_rpm?.toFixed(2)}/mi${rateIntel.sample_count > 0 ? ` (${rateIntel.sample_count} recent loads)` : ' (estimate)'}` : '';
    const rpm = form.miles ? parseFloat(form.rate) / parseInt(form.miles) : null;
    const marketStr = rateIntel ? ` · Lane avg $${rateIntel.avg_rpm?.toFixed(2)}/mi` : ' · avg ~$2.80–3.20/mi';
    if (parseFloat(form.rate) < 1500) return `May appear in "Worst Loads" feed${marketStr}`;
    if (rateIntel && rpm && rpm < rateIntel.avg_rpm * 0.85) return `Below lane average${marketStr}`;
    if (rateIntel && rpm && rpm > rateIntel.avg_rpm * 1.15) return `Above lane average — competitive rate${marketStr}`;
    return `On par with lane market${marketStr}`;
  };

  if (posted) return (
    <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: '80px 0' }}>
      <IonIcon name="checkmark-circle-outline" style={{ fontSize: 56, color: '#2e7d32', display: 'block', margin: '0 auto 16px' }} />
      <h2 style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--ion-text-color)' }}>Load Posted!</h2>
      <p style={{ margin: '0 0 32px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
        Your load is now live on the board. Carriers will see it immediately.
      </p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <button
          onClick={() => {
            setPosted(false);
            setSaveAsTemplate(false);
            setTemplateName('');
            setForm({
              originCity: '', destCity: '', pickupAddress: '', deliveryAddress: '',
              pickupLat: null, pickupLng: null, deliveryLat: null, deliveryLng: null,
              pickup: '', delivery: '', equipmentClass: '', equipment: '', weight: '', dims: '48x102',
              loadSize: 'full', trailerLength: '',
              commodity: '', rate: '', miles: '', deadhead: '', notes: '',
              instantBook: false,
            });
          }}
          style={{ padding: '8px 20px', border: '1px solid var(--ion-border-color)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}
        >
          Post Another
        </button>
        <button
          onClick={() => navigate('/broker/loads')}
          style={{ padding: '8px 20px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600 }}
        >
          View Loads
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ion-text-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <IonIcon name="add-circle-outline" style={{ color: 'var(--ion-color-primary)' }} />
          {tpl ? `Re-post: ${tpl.name}` : 'Post a Load'}
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
          {tpl ? 'Lane details pre-filled from template — just set the dates.' : 'Fill out the details and your load will be live instantly'}
        </p>
      </div>

      <div style={{ border: '1px solid var(--ion-border-color)', borderRadius: 8, padding: 24, backgroundColor: 'var(--ion-card-background)' }}>
        <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Pickup / Delivery */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <AddressAutocomplete
                label="Pickup Address *"
                placeholder="123 Main St, Chicago, IL"
                value={form.pickupAddress}
                onChange={handlePickup}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginTop: 4 }}>
                Full address — hidden from carriers until booked
              </span>
            </div>
            <div>
              <AddressAutocomplete
                label="Delivery Address *"
                placeholder="456 Oak Ave, Atlanta, GA"
                value={form.deliveryAddress}
                onChange={handleDelivery}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginTop: 4 }}>
                Full address — hidden from carriers until booked
              </span>
            </div>
          </div>

          {/* Miles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Loaded Miles *</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...inputStyle, paddingRight: calcingMiles ? 36 : 12 }}
                  type="number" required
                  value={form.miles}
                  onChange={e => set('miles', e.target.value)}
                  placeholder={calcingMiles ? 'Calculating…' : '716'}
                />
                {calcingMiles && <IonSpinner name="crescent" style={{ width: 14, height: 14, position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }} />}
              </div>
              {form.miles && !calcingMiles && (
                <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginTop: 4 }}>Auto-calculated · edit if needed</span>
              )}
            </div>
            <div>
              <label style={labelStyle}>Deadhead Miles</label>
              <input style={inputStyle} type="number" value={form.deadhead} onChange={e => set('deadhead', e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* Dates */}
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

          {/* Equipment Class → Type → Weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Equipment Class *</label>
              <select
                style={inputStyle}
                required
                value={form.equipmentClass}
                onChange={e => setForm(f => ({ ...f, equipmentClass: e.target.value, equipment: '' }))}
              >
                <option value="">Select class…</option>
                {equipmentClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Equipment Type *</label>
              <select
                style={{ ...inputStyle, opacity: !form.equipmentClass ? 0.5 : 1 }}
                required
                disabled={!form.equipmentClass}
                value={form.equipment}
                onChange={e => set('equipment', e.target.value)}
              >
                <option value="">Select type…</option>
                {equipmentTypes
                  .filter(t => t.class_id === form.equipmentClass)
                  .map(t => <option key={t.id} value={t.name}>{t.name}</option>)
                }
              </select>
            </div>
            <div>
              <label style={labelStyle}>Weight (lbs)</label>
              <input style={inputStyle} type="number" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="42000" />
            </div>
          </div>

          {/* Load Size + Trailer Length */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Load Size</label>
              <select style={inputStyle} value={form.loadSize} onChange={e => set('loadSize', e.target.value)}>
                <option value="full">Full Truckload (FTL)</option>
                <option value="partial">Partial Truckload (LTL)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Trailer Length (ft)</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputStyle, paddingRight: 32 }} type="number" value={form.trailerLength} onChange={e => set('trailerLength', e.target.value)} placeholder="53" />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--ion-color-medium)', pointerEvents: 'none' }}>ft</span>
              </div>
            </div>
          </div>

          {/* Commodity + Dims */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Commodity</label>
              <input style={inputStyle} value={form.commodity} onChange={e => set('commodity', e.target.value)} placeholder="General Freight" />
            </div>
            <div>
              <label style={labelStyle}>Dimensions</label>
              <select style={inputStyle} value={form.dims} onChange={e => set('dims', e.target.value)}>
                {DIMS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Rate */}
          <div>
            <label style={labelStyle}>Rate (All-In) *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ion-color-medium)', pointerEvents: 'none' }}>$</span>
              <input style={{ ...inputStyle, paddingLeft: 24 }} type="number" required value={form.rate} onChange={e => set('rate', e.target.value)} placeholder="2500" />
            </div>
            {(form.rate || rateIntel) && (
              <span style={{ fontSize: '0.72rem', color: getRateHelperColor(), display: 'block', marginTop: 4 }}>{getRateHelperText()}</span>
            )}
          </div>

          {/* Instant Book toggle */}
          <div style={{ border: `1px solid ${form.instantBook ? '#2e7d32' : 'var(--ion-border-color)'}`, borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Toggle checked={form.instantBook} onChange={e => set('instantBook', e.target.checked)} color="success" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IonIcon name="flash-outline" style={{ color: form.instantBook ? '#2e7d32' : 'var(--ion-color-medium)', fontSize: 16 }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>Enable Instant Book</span>
              </div>
            </div>
            <p style={{ margin: '8px 0 0 52px', fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
              Carriers on your Instant Book allowlist can book this load immediately without approval.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Special Instructions</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any special requirements, hazmat info, contact details..."
            />
          </div>

          {/* Save as Template toggle */}
          <div style={{ border: `1px solid ${saveAsTemplate ? 'var(--ion-color-primary)' : 'var(--ion-border-color)'}`, borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Toggle checked={saveAsTemplate} onChange={e => setSaveAsTemplate(e.target.checked)} color="primary" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IonIcon name="layers-outline" style={{ color: saveAsTemplate ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', fontSize: 16 }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>Save as Template</span>
              </div>
            </div>
            <p style={{ margin: '8px 0 0 52px', fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
              Save this lane so you can re-post it in one click next time.
            </p>
            {saveAsTemplate && (
              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Template Name *</label>
                <input
                  style={inputStyle}
                  required
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder={form.originCity && form.destCity ? `${form.originCity} → ${form.destCity}` : 'e.g. Chicago → Atlanta weekly'}
                />
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 0', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '1rem', fontFamily: 'inherit', fontWeight: 600, opacity: submitting ? 0.8 : 1 }}
          >
            {submitting
              ? <><IonSpinner name="crescent" style={{ width: 16, height: 16, color: '#fff' }} /> Posting...</>
              : <><span>Post Load Live</span><IonIcon name="arrow-forward-outline" style={{ fontSize: 18 }} /></>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
