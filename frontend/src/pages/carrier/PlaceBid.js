import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Grid, CircularProgress,
  TextField, Alert, Stack, InputAdornment
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { loadsApi, bidsApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';

export default function PlaceBid() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
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

  const parsed = parseFloat(amount);
  const valid = !isNaN(parsed) && parsed > 0;
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
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );

  if (!load) return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <WarningAmberIcon sx={{ fontSize: 40, color: 'error.main', mb: 1.5 }} />
      <Typography color="text.secondary" gutterBottom>Load not found.</Typography>
      <Button component={Link} to="/carrier/loads" variant="text">Back to Load Board</Button>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon />}
        variant="text"
        onClick={() => navigate(`/carrier/loads/${id}`)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to Load
      </Button>

      {/* Load summary */}
      <Card>
        <CardContent>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            You're bidding on
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 12 }} color="action" />
                <Typography variant="caption" color="text.secondary">Origin</Typography>
              </Box>
              <Typography variant="body1" fontWeight={600}>{load.origin}</Typography>
            </Box>
            <Typography color="text.secondary">→</Typography>
            <Box sx={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mb: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 12 }} color="action" />
                <Typography variant="caption" color="text.secondary">Destination</Typography>
              </Box>
              <Typography variant="body1" fontWeight={600}>{load.dest}</Typography>
            </Box>
          </Box>
          <Grid container spacing={2} sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary" display="block">Listed Rate</Typography>
              <Typography variant="body1" fontWeight={700}>${load.rate.toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary" display="block">Miles</Typography>
              <Typography variant="body1" fontWeight={700}>{load.miles} mi</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary" display="block">Type</Typography>
              <Typography variant="body1" fontWeight={700}>{load.type}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Existing bid notice */}
      {existingBid && (
        <Alert
          severity={
            existingBid.status === 'accepted' ? 'success' :
            existingBid.status === 'countered' ? 'info' :
            'warning'
          }
          icon={<WarningAmberIcon />}
        >
          <Typography variant="body2" fontWeight={600}>You already have a bid on this load</Typography>
          <Typography variant="body2">
            ${existingBid.amount?.toLocaleString()} — <Box component="span" sx={{ textTransform: 'capitalize' }}>{existingBid.status}</Box>
            {existingBid.status === 'countered' && existingBid.counter_amount && (
              <> · Broker countered at <strong>${existingBid.counter_amount.toLocaleString()}</strong></>
            )}
          </Typography>
        </Alert>
      )}

      {/* Success state */}
      {submitted ? (
        <Card sx={{ border: '1px solid', borderColor: 'primary.main' }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>Bid Submitted!</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Your bid of <strong>${parsed.toLocaleString()}</strong> has been sent to the broker.
              You'll be notified when they respond.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button component={Link} to={`/carrier/loads/${id}`} variant="outlined">
                Back to Load
              </Button>
              <Button component={Link} to="/carrier/loads" variant="contained">
                Browse More Loads
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        /* Bid form */
        <Card component="form" onSubmit={handleSubmit}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Place Your Bid</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Submit a rate to the broker for this load.
            </Typography>

            <Stack spacing={3}>
              {/* Amount */}
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Bid Amount"
                  required
                  inputProps={{ min: 1, step: 1 }}
                  placeholder={String(load.rate)}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& input': { fontSize: '1.1rem', fontWeight: 600 } }}
                />
                {pctDiff !== null && (
                  <Typography
                    variant="caption"
                    sx={{ mt: 0.75, display: 'block', fontWeight: 600, color: parseFloat(pctDiff) >= 0 ? 'success.main' : 'warning.main' }}
                  >
                    {parseFloat(pctDiff) >= 0 ? `+${pctDiff}%` : `${pctDiff}%`} vs listed rate of ${load.rate.toLocaleString()}
                  </Typography>
                )}
                {valid && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    ${(parsed / load.miles).toFixed(2)}/mi
                  </Typography>
                )}
              </Box>

              {/* Note */}
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={4}
                  label="Note to Broker (optional)"
                  placeholder="Tell the broker why you're the best carrier for this load — experience, equipment, availability..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  inputProps={{ maxLength: 500 }}
                  helperText={`${note.length}/500`}
                />
              </Box>

              {error && (
                <Alert severity="error" icon={<WarningAmberIcon />}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
                <Button
                  type="button"
                  onClick={() => navigate(`/carrier/loads/${id}`)}
                  variant="outlined"
                  fullWidth
                  size="large"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!valid || submitting}
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {submitting ? 'Submitting...' : 'Submit Bid'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
