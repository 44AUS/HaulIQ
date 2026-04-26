import { useState, useEffect } from 'react';
import { IonModal, IonSpinner } from '@ionic/react';
import { bookingsApi } from '../../services/api';
import IonIcon from '../IonIcon';

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))',
  border: '1px solid var(--ion-border-color)',
  borderRadius: 6,
  color: 'var(--ion-text-color)',
  fontSize: '0.875rem',
  padding: '9px 12px',
  outline: 'none',
  fontFamily: 'inherit',
};

const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

export default function DispatchModal({ open, onClose, booking, onDispatched }) {
  const [form, setForm] = useState({
    driver_name: '',
    driver_phone: '',
    carrier_visible_notes: '',
    dispatch_notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (booking) {
      setForm({
        driver_name:           booking.driver_name           || '',
        driver_phone:          booking.driver_phone          || '',
        carrier_visible_notes: booking.carrier_visible_notes || '',
        dispatch_notes:        booking.dispatch_notes        || '',
      });
    }
  }, [booking]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await bookingsApi.dispatch(booking.booking_id, form);
      onDispatched?.(result);
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <IonModal isOpen={open} onDidDismiss={onClose} style={{ '--width': '500px', '--height': 'auto', '--max-height': '90vh', '--border-radius': '12px' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IonIcon name="car-sport-outline" style={{ fontSize: 18, color: 'var(--ion-color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Dispatch Load</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex', alignItems: 'center' }}>
            <IonIcon name="close-outline" style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {booking && (
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
              {booking.origin} → {booking.destination}
              {booking.carrier_name ? ` · ${booking.carrier_name}` : ''}
            </p>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Driver Name</label>
              <input style={inputStyle} value={form.driver_name} onChange={set('driver_name')} placeholder="Jane Smith" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Driver Phone</label>
              <input style={inputStyle} value={form.driver_phone} onChange={set('driver_phone')} placeholder="(555) 000-0000" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes for Carrier</label>
            <textarea
              style={{ ...inputStyle, height: 80, resize: 'vertical' }}
              value={form.carrier_visible_notes}
              onChange={set('carrier_visible_notes')}
              placeholder="Gate code, dock instructions, appointment time..."
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--ion-color-medium)' }}>Visible to the carrier</span>
          </div>

          <div>
            <label style={labelStyle}>Internal Dispatch Notes</label>
            <textarea
              style={{ ...inputStyle, height: 64, resize: 'vertical' }}
              value={form.dispatch_notes}
              onChange={set('dispatch_notes')}
              placeholder="Internal notes — not visible to the carrier"
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--ion-color-medium)' }}>Only visible to your team</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 20px', borderTop: '1px solid var(--ion-border-color)' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '8px 18px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {saving && <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} />}
            {saving ? 'Saving…' : 'Dispatch'}
          </button>
        </div>
      </div>
    </IonModal>
  );
}
