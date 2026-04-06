import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Typography, CircularProgress, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { bookingsApi } from '../../services/api';

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <LocalShippingIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>Dispatch Load</Typography>
        </Stack>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {booking && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {booking.origin} → {booking.destination}
            {booking.carrier_name ? ` · ${booking.carrier_name}` : ''}
          </Typography>
        )}

        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Driver Name"
              value={form.driver_name}
              onChange={set('driver_name')}
              size="small"
              fullWidth
              placeholder="Jane Smith"
            />
            <TextField
              label="Driver Phone"
              value={form.driver_phone}
              onChange={set('driver_phone')}
              size="small"
              fullWidth
              placeholder="(555) 000-0000"
            />
          </Stack>

          <TextField
            label="Notes for Carrier"
            value={form.carrier_visible_notes}
            onChange={set('carrier_visible_notes')}
            size="small"
            fullWidth
            multiline
            rows={3}
            placeholder="Gate code, dock instructions, appointment time..."
            helperText="Visible to the carrier"
          />

          <TextField
            label="Internal Dispatch Notes"
            value={form.dispatch_notes}
            onChange={set('dispatch_notes')}
            size="small"
            fullWidth
            multiline
            rows={2}
            placeholder="Internal notes — not visible to the carrier"
            helperText="Only visible to your team"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {saving ? 'Saving…' : 'Dispatch'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
