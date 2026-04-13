import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, IconButton, Tooltip,
  Stack, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChatIcon from '@mui/icons-material/ChatBubbleOutline';
import { driversApi, messagesApi } from '../../services/api';

const BASE_URL = window.location.origin;

const GROUPS = [
  { key: 'admin',   label: 'Admin' },
  { key: 'level_3', label: 'Level 3' },
  { key: 'level_2', label: 'Level 2' },
  { key: 'level_1', label: 'Level 1' },
];

function isOnline(lastActiveAt) {
  if (!lastActiveAt) return false;
  return (Date.now() - new Date(lastActiveAt).getTime()) < 5 * 60 * 1000;
}

export default function Drivers() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('enabled'); // 'enabled' | 'disabled'
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', phone: '', license_number: '', driver_level: 'level_1' });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [newInvite, setNewInvite] = useState(null);
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
    setInviting(true); setInviteError(null);
    try {
      const res = await driversApi.invite(inviteForm);
      setNewInvite(res);
      load();
      setInviteForm({ name: '', email: '', phone: '', license_number: '', driver_level: 'level_1' });
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

  const handleMessage = async (driver) => {
    try {
      const convo = await messagesApi.direct(driver.id);
      navigate(`/carrier/messages?conv=${convo.id}`);
    } catch (err) { alert(err.message); }
  };

  const copyInviteLink = (token) => {
    navigator.clipboard.writeText(`${BASE_URL}/invite/driver?token=${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const visibleDrivers = drivers.filter(d =>
    filter === 'enabled' ? d.is_active || d.invite_accepted : !d.is_active && !d.invite_accepted
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Filter row ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, flexShrink: 0 }}>
        <Typography variant="h6" fontWeight={700}>Employees</Typography>
        <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: '6px', overflow: 'hidden' }}>
          {['enabled', 'disabled'].map(f => (
            <Box
              key={f}
              onClick={() => setFilter(f)}
              sx={{
                px: 2.5, py: 0.75, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                bgcolor: filter === f ? 'action.selected' : 'transparent',
                color: filter === f ? 'text.primary' : 'text.secondary',
                textTransform: 'capitalize',
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'background 0.15s',
                borderRight: f === 'enabled' ? 1 : 0, borderColor: 'divider',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── List ── */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          GROUPS.map(group => {
            const groupDrivers = visibleDrivers.filter(d => (d.driver_level || 'level_1') === group.key);
            return (
              <Box key={group.key}>
                {/* Section header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 0.75, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.disabled', letterSpacing: '0.04em' }}>
                    {group.label}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.disabled' }}>
                    {groupDrivers.length}
                  </Typography>
                </Box>

                {groupDrivers.length === 0 ? (
                  <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.disabled">None</Typography>
                  </Box>
                ) : (
                  groupDrivers.map(driver => {
                    const online = isOnline(driver.last_active_at);
                    const initials = driver.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <Box
                        key={driver.id}
                        sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1.5, borderBottom: 1, borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer', gap: 1.5 }}
                      >
                        {/* Avatar with online dot */}
                        <Box sx={{ position: 'relative', flexShrink: 0 }}>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 700, fontSize: '0.85rem' }}>
                            {initials}
                          </Avatar>
                          <Box sx={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', bgcolor: online ? 'success.main' : 'error.main', border: '2px solid', borderColor: 'background.paper' }} />
                        </Box>

                        {/* Name + email */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{driver.name}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">{driver.email}</Typography>
                        </Box>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={e => e.stopPropagation()}>
                          {driver.invite_accepted && (
                            <Tooltip title="Message">
                              <IconButton size="small" onClick={() => handleMessage(driver)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                <ChatIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => setDeleteTarget(driver)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                              <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        <ChevronRightIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
                      </Box>
                    );
                  })
                )}
              </Box>
            );
          })
        )}
      </Box>

      {/* ── Floating ADD ── */}
      <Box sx={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setInviteOpen(true); setNewInvite(null); setInviteError(null); }}
          sx={{ bgcolor: '#FF8C00', color: '#fff', '&:hover': { bgcolor: '#E07800' }, fontWeight: 700, px: 3.5, py: 1.25, borderRadius: 3, fontSize: '0.9rem', boxShadow: '0 4px 16px rgba(255,140,0,0.45)' }}
        >
          ADD
        </Button>
      </Box>

      {/* ── Invite dialog ── */}
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
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1, fontSize: '0.7rem' }}>
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
              <TextField label="Full Name" required size="small" fullWidth value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} />
              <TextField label="Email" required type="email" size="small" fullWidth value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
              <TextField label="Phone" size="small" fullWidth value={inviteForm.phone} onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))} />
              <TextField label="CDL / License Number" size="small" fullWidth value={inviteForm.license_number} onChange={e => setInviteForm(f => ({ ...f, license_number: e.target.value }))} />
              <FormControl size="small" fullWidth>
                <InputLabel>Access Level</InputLabel>
                <Select label="Access Level" value={inviteForm.driver_level} onChange={e => setInviteForm(f => ({ ...f, driver_level: e.target.value }))}>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="level_3">Level 3</MenuItem>
                  <MenuItem value="level_2">Level 2</MenuItem>
                  <MenuItem value="level_1">Level 1</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setInviteOpen(false); setNewInvite(null); }}>{newInvite ? 'Close' : 'Cancel'}</Button>
          {!newInvite && (
            <Button variant="contained" onClick={handleInvite} disabled={inviting || !inviteForm.name.trim() || !inviteForm.email.trim()}
              startIcon={inviting ? <CircularProgress size={14} color="inherit" /> : null} sx={{ fontWeight: 700 }}>
              {inviting ? 'Inviting…' : 'Send Invite'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Confirm delete ── */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle fontWeight={700}>Remove Driver?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Remove <strong>{deleteTarget?.name}</strong> from your team?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : null}>
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
