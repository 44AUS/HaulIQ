import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert,
  Grid, Divider, CircularProgress,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import IonIcon from '../../components/IonIcon';


const fmtDate = (iso) => {
  if (!iso) return '—';
  const utc = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  return new Date(utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    company:          user?.company          || '',
    mc:               user?.mc               || '',
    dot:              user?.dot              || '',
    business_address: user?.business_address || '',
    business_city:    user?.business_city    || '',
    business_state:   user?.business_state   || '',
    business_zip:     user?.business_zip     || '',
    business_country: user?.business_country || '',
  });
  const [status,  setStatus]  = useState(null);
  const [saving,  setSaving]  = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleAddressSelect = (place) => {
    if (!place?.address_components) return;
    const get = (type) => place.address_components.find(c => c.types.includes(type))?.long_name || '';
    const streetNum  = get('street_number');
    const route      = get('route');
    setForm(f => ({
      ...f,
      business_address: [streetNum, route].filter(Boolean).join(' ') || place.formatted_address || '',
      business_city:    get('locality') || get('sublocality') || '',
      business_state:   get('administrative_area_level_1') || '',
      business_zip:     get('postal_code') || '',
      business_country: get('country') || '',
    }));
  };

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setStatus(null);
    try {
      const updated = await authApi.update({
        company:          form.company    || undefined,
        mc_number:        form.mc         || undefined,
        dot_number:       form.dot        || undefined,
        business_address: form.business_address || undefined,
        business_city:    form.business_city    || undefined,
        business_state:   form.business_state   || undefined,
        business_zip:     form.business_zip     || undefined,
        business_country: form.business_country || undefined,
      });
      updateUser({
        company:          updated.company || null,
        mc:               updated.mc_number  || null,
        dot:              updated.dot_number || null,
        business_address: updated.business_address || null,
        business_city:    updated.business_city    || null,
        business_state:   updated.business_state   || null,
        business_zip:     updated.business_zip     || null,
        business_country: updated.business_country || null,
      });
      setStatus({ type: 'success', msg: 'Business information saved.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {status && <Alert severity={status.type === 'success' ? 'success' : 'error'} onClose={() => setStatus(null)}>{status.msg}</Alert>}

      {/* Business Info */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <IonIcon name="business-outline" color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>Business Information</Typography>
          </Box>
          <Box component="form" onSubmit={handleSave}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Company Name"
                  size="small"
                  fullWidth
                  value={form.company}
                  onChange={set('company')}
                  InputProps={{ startAdornment: <IonIcon name="business-outline" sx={{ fontSize: 16, mr: 0.5, color: 'text.disabled' }} /> }}
                />
              </Grid>
              {user?.role === 'carrier' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="MC Number"
                      size="small"
                      fullWidth
                      placeholder="MC-000000"
                      value={form.mc}
                      onChange={set('mc')}
                      InputProps={{ startAdornment: <IonIcon name="car-sport-outline" sx={{ fontSize: 16, mr: 0.5, color: 'text.disabled' }} /> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="DOT Number"
                      size="small"
                      fullWidth
                      placeholder="DOT-000000"
                      value={form.dot}
                      onChange={set('dot')}
                    />
                  </Grid>
                </>
              )}
            </Grid>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, mb: 2 }}>
              <IonIcon name="location-outline" color="primary" sx={{ fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700}>Business Address</Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <AddressAutocomplete
                  value={form.business_address}
                  onChange={(val) => setForm(f => ({ ...f, business_address: val }))}
                  onSelect={handleAddressSelect}
                  label="Street Address"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="City" size="small" fullWidth value={form.business_city} onChange={set('business_city')} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="State" size="small" fullWidth value={form.business_state} onChange={set('business_state')} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="ZIP" size="small" fullWidth value={form.business_zip} onChange={set('business_zip')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Country" size="small" fullWidth value={form.business_country} onChange={set('business_country')} />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
              <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <IonIcon name="save-outline" />}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

// ── Metadata Tab ──────────────────────────────────────────────────────────────
function MetadataTab() {
  const { user } = useAuth();

  const rows = [
    { label: 'Company Name',     value: user?.company },
    { label: 'MC Number',        value: user?.mc },
    { label: 'DOT Number',       value: user?.dot },
    { label: 'Business Address', value: user?.business_address },
    { label: 'City',             value: user?.business_city },
    { label: 'State',            value: user?.business_state },
    { label: 'ZIP',              value: user?.business_zip },
    { label: 'Country',          value: user?.business_country },
    { label: 'Role',             value: user?.role },
    { label: 'Plan',             value: user?.plan },
    { label: 'Member Since',     value: user?.joined ? fmtDate(user.joined) : '—' },
    { label: 'Vetting Status',   value: user?.vetting_status },
    { label: 'Vetting Score',    value: user?.vetting_score },
  ];

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: 3 }}>
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2.5}>Business Metadata</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {rows.map(({ label, value }, i) => (
              <Box key={label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>{label}</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', wordBreak: 'break-all', textTransform: 'capitalize' }}>{value || '—'}</Typography>
                </Box>
                {i < rows.length - 1 && <Divider sx={{ mt: 1.5 }} />}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function ManageBusiness() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <Box sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: 1 }}>
      {activeTab === 'overview'  && <OverviewTab />}
      {activeTab === 'metadata'  && <MetadataTab />}
    </Box>
  );
}
