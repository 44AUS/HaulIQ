import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, TextField, InputAdornment, Button, Avatar,
  Chip, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, CircularProgress, Select, MenuItem, FormControl, InputLabel, Skeleton,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { adminApi } from '../../services/api';

const PLANS = ['basic', 'pro', 'elite', 'admin'];

const rolePlanColor = { carrier: 'primary', broker: 'info', admin: 'secondary' };
const planColor = (p) => p === 'elite' ? 'secondary' : p === 'pro' ? 'success' : p === 'admin' ? 'error' : 'default';

function PlanDialog({ user, onClose, onSaved }) {
  const [plan, setPlan] = useState(user.plan || 'basic');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.setPlan(user.id, plan);
      onSaved({ ...user, plan });
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Change Plan — {user.name}
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel>Plan</InputLabel>
          <Select value={plan} label="Plan" onChange={e => setPlan(e.target.value)}>
            {PLANS.map(p => <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="outlined" fullWidth>Cancel</Button>
        <Button onClick={handleSave} variant="contained" fullWidth disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function UserDetailDialog({ user, onClose, onUpdate, onDeleted }) {
  const [planOpen, setPlanOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function toggleSuspend() {
    setActioning(true);
    try {
      if (user.is_active) {
        await adminApi.suspend(user.id);
        onUpdate({ ...user, is_active: false });
      } else {
        await adminApi.activate(user.id);
        onUpdate({ ...user, is_active: true });
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setActioning(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await adminApi.deleteUser(user.id);
      onDeleted(user.id);
      onClose();
    } catch (e) {
      alert(e.message);
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          User Details
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 2, mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.dark', fontWeight: 700, fontSize: 16 }}>
              {(user.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">{user.email}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[
              ['Role', user.role],
              ['Plan', user.plan || '—'],
              ['Status', user.is_active ? 'Active' : 'Suspended'],
              ['Company', user.company || '—'],
              ['MC Number', user.mc_number || '—'],
              ['State', user.business_state || '—'],
              ['Member Since', user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'],
            ].map(([k, v], i, arr) => (
              <Box key={k}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">{k}</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{v}</Typography>
                </Box>
                {i < arr.length - 1 && <Divider sx={{ mt: 1.5 }} />}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" fullWidth onClick={() => setPlanOpen(true)}>Change Plan</Button>
          <Button
            variant="contained"
            color={user.is_active ? 'error' : 'success'}
            fullWidth
            onClick={toggleSuspend}
            disabled={actioning}
          >
            {actioning ? '…' : user.is_active ? 'Suspend' : 'Reactivate'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            startIcon={<DeleteOutlineIcon />}
            onClick={() => setConfirmDelete(true)}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      {confirmDelete && (
        <Dialog open onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Delete User?</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              Permanently delete <strong>{user.name}</strong> ({user.email})? This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" fullWidth onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="contained" color="error" fullWidth onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {planOpen && (
        <PlanDialog
          user={user}
          onClose={() => setPlanOpen(false)}
          onSaved={updated => { onUpdate(updated); setPlanOpen(false); }}
        />
      )}
    </>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actioning, setActioning] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.q = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (planFilter !== 'all') params.plan = planFilter;
      const data = await adminApi.users(params);
      const list = Array.isArray(data) ? data : (data.users || []);
      setUsers(list);
      setTotal(Array.isArray(data) ? list.length : (data.total || list.length));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, planFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function updateUser(updated) {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    if (selectedUser?.id === updated.id) setSelectedUser(updated);
  }

  function removeUser(id) {
    setUsers(prev => prev.filter(u => u.id !== id));
    setTotal(t => t - 1);
  }

  async function quickSuspend(u) {
    setActioning(a => ({ ...a, [u.id]: true }));
    try {
      await adminApi.suspend(u.id);
      updateUser({ ...u, is_active: false });
    } catch (e) {
      alert(e.message);
    } finally {
      setActioning(a => ({ ...a, [u.id]: false }));
    }
  }

  async function quickActivate(u) {
    setActioning(a => ({ ...a, [u.id]: true }));
    try {
      await adminApi.activate(u.id);
      updateUser({ ...u, is_active: true });
    } catch (e) {
      alert(e.message);
    } finally {
      setActioning(a => ({ ...a, [u.id]: false }));
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PeopleIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>User Management</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">{total} total users</Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name, email, company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['all', 'carrier', 'broker', 'admin'].map(r => (
            <Button
              key={r}
              size="small"
              variant={roleFilter === r ? 'contained' : 'outlined'}
              onClick={() => setRoleFilter(r)}
              sx={{ textTransform: 'capitalize', minWidth: 64 }}
            >
              {r}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['all', ...PLANS].map(p => (
            <Button
              key={p}
              size="small"
              variant={planFilter === p ? 'contained' : 'outlined'}
              color={p === 'all' ? 'primary' : p === 'elite' ? 'secondary' : p === 'pro' ? 'success' : 'primary'}
              onClick={() => setPlanFilter(p)}
              sx={{ textTransform: 'capitalize', minWidth: 56 }}
            >
              {p}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Table */}
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[...Array(7)].map((_, i) => (
                    <TableCell key={i}><Skeleton variant="text" width={80} height={16} /></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    {[160, 80, 80, 80, 100, 80, 80].map((w, j) => (
                      <TableCell key={j}><Skeleton variant="text" width={w} height={18} /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ) : users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No users found.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  {['User', 'Role', 'Plan', 'Status', 'Company', 'Joined', 'Actions'].map(h => (
                    <TableCell
                      key={h}
                      sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'secondary.main', whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={u.avatar_url || undefined}
                          sx={{ width: 32, height: 32, bgcolor: 'primary.dark', fontSize: 12, fontWeight: 700 }}
                        >
                          {(u.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.role}
                        size="small"
                        color={rolePlanColor[u.role] || 'default'}
                        variant="outlined"
                        sx={{ textTransform: 'capitalize', fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      {u.plan ? (
                        <Chip
                          label={u.plan}
                          size="small"
                          color={planColor(u.plan)}
                          variant={u.plan === 'basic' ? 'outlined' : 'filled'}
                          sx={{ textTransform: 'capitalize', fontSize: 11 }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.is_active ? 'Active' : 'Suspended'}
                        size="small"
                        color={u.is_active ? 'success' : 'error'}
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>{u.company || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.25 }}>
                        {actioning[u.id] ? (
                          <CircularProgress size={16} sx={{ mx: 0.5 }} />
                        ) : !u.is_active ? (
                          <IconButton size="small" title="Reactivate" onClick={() => quickActivate(u)} sx={{ '&:hover': { color: 'success.main' } }}>
                            <HowToRegIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        ) : (
                          <IconButton size="small" title="Suspend" onClick={() => quickSuspend(u)} sx={{ '&:hover': { color: 'error.main' } }}>
                            <PersonOffIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                        <IconButton size="small" onClick={() => setSelectedUser(u)}>
                          <MoreHorizIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {selectedUser && (
        <UserDetailDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={updated => { updateUser(updated); }}
          onDeleted={removeUser}
        />
      )}
    </Box>
  );
}
