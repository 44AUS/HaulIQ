import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Chip, Stack,
  CircularProgress, Avatar, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/PendingActions';
import { driversApi } from '../../services/api';

const BASE_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '').replace(':8000', ':3000')
  : window.location.origin;

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);

  const [inviteForm, setInviteForm] = useState({ name: '', email: '', phone: '', license_number: '' });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [newInvite, setNewInvite] = useState(null); // { name, email, invite_token }
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    driversApi.list()
      .then(data => setDrivers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      const res = await driversApi.invite(inviteForm);
      setNewInvite(res);
      load();
      setInviteForm({ name: '', email: '', phone: '', license_number: '' });
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await driversApi.remove(deleteTarget.id);
      setDrivers(d => d.filter(x => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const copyInviteLink = (token) => {
    const url = `${BASE_URL}/invite/driver?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>My Drivers</Typography>
          <Typography variant="body2" color="text.secondary">Invite and manage drivers on your team</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setInviteOpen(true); setNewInvite(null); setInviteError(null); }}
          sx={{ fontWeight: 700 }}
        >
          Invite Driver
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : drivers.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PersonIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>No drivers yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Invite your first driver to assign loads and track progress.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setInviteOpen(true)}>
              Invite Driver
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {drivers.map(driver => (
            <Card key={driver.id}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 700 }}>
                    {driver.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" fontWeight={700}>{driver.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{driver.email}</Typography>
                    {driver.phone && (
                      <Typography variant="caption" color="text.secondary">{driver.phone}</Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      icon={driver.invite_accepted ? <CheckCircleIcon /> : <PendingIcon />}
                      label={driver.invite_accepted ? 'Active' : 'Invite Pending'}
                      size="small"
                      color={driver.invite_accepted ? 'success' : 'warning'}
                      variant="outlined"
                    />
                    <Tooltip title="Remove driver">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(driver)}
                        sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' } }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onClose={() => { setInviteOpen(false); setNewInvite(null); }} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Invite a Driver</DialogTitle>
        <DialogContent>
          {newInvite ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600}>Invite created for {newInvite.name}!</Typography>
                <Typography variant="caption">Share this link with them to set up their account.</Typography>
              </Alert>
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Invite Link</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1, fontSize: '0.7rem' }}
                  >
                    {`${BASE_URL}/invite/driver?token=${newInvite.invite_token}`}
                  </Typography>
                  <Tooltip title={copiedToken === newInvite.invite_token ? 'Copied!' : 'Copy link'}>
                    <IconButton size="small" onClick={() => copyInviteLink(newInvite.invite_token)}>
                      <ContentCopyIcon sx={{ fontSize: 15, color: copiedToken === newInvite.invite_token ? 'success.main' : 'text.secondary' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          ) : (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {inviteError && <Alert severity="error">{inviteError}</Alert>}
              <TextField
                label="Full Name" required size="small" fullWidth
                value={inviteForm.name}
                onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
              />
              <TextField
                label="Email" required type="email" size="small" fullWidth
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
              />
              <TextField
                label="Phone" size="small" fullWidth
                value={inviteForm.phone}
                onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))}
              />
              <TextField
                label="CDL / License Number" size="small" fullWidth
                value={inviteForm.license_number}
                onChange={e => setInviteForm(f => ({ ...f, license_number: e.target.value }))}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setInviteOpen(false); setNewInvite(null); }}>
            {newInvite ? 'Close' : 'Cancel'}
          </Button>
          {!newInvite && (
            <Button
              variant="contained"
              onClick={handleInvite}
              disabled={inviting || !inviteForm.name.trim() || !inviteForm.email.trim()}
              startIcon={inviting ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{ fontWeight: 700 }}
            >
              {inviting ? 'Inviting…' : 'Send Invite'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle fontWeight={700}>Remove Driver?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Remove <strong>{deleteTarget?.name}</strong> from your team? Their account will be deactivated.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
