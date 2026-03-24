import React, { useState } from 'react';
import {
  Box, Typography, Card, TextField, InputAdornment, Button, Avatar,
  Chip, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CloseIcon from '@mui/icons-material/Close';
import { MOCK_USERS_LIST } from '../../data/sampleData';

const rolePlanColor = {
  carrier: 'primary',
  broker: 'info',
  admin: 'secondary',
};

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  const filtered = MOCK_USERS_LIST.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PeopleIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>User Management</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">{MOCK_USERS_LIST.length} total users</Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <TextField
          size="small"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
          sx={{ flex: 1 }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
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
      </Box>

      {/* Table */}
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['User', 'Role', 'Plan', 'Status', 'Joined', 'MRR', 'Actions'].map(h => (
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
              {filtered.map(u => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark', fontSize: 12, fontWeight: 700 }}>
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
                    <Chip
                      label={u.plan}
                      size="small"
                      color={u.plan === 'elite' ? 'secondary' : u.plan === 'pro' ? 'success' : 'default'}
                      variant={u.plan === 'basic' ? 'outlined' : 'filled'}
                      sx={{ textTransform: 'capitalize', fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.status}
                      size="small"
                      color={u.status === 'active' ? 'success' : 'error'}
                      sx={{ fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" noWrap>{u.joined}</Typography>
                  </TableCell>
                  <TableCell>
                    {u.revenue > 0
                      ? <Typography variant="body2" fontWeight={600}>${u.revenue}/mo</Typography>
                      : <Typography variant="caption" color="text.disabled">Free</Typography>
                    }
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.25 }}>
                      {u.status === 'active' ? (
                        <IconButton size="small" title="Suspend" sx={{ '&:hover': { color: 'error.main' } }}>
                          <PersonOffIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      ) : (
                        <IconButton size="small" title="Activate" sx={{ '&:hover': { color: 'success.main' } }}>
                          <HowToRegIcon sx={{ fontSize: 16 }} />
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
      </Card>

      {/* User detail dialog */}
      <Dialog open={!!selectedUser} onClose={() => setSelectedUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          User Details
          <IconButton size="small" onClick={() => setSelectedUser(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        {selectedUser && (
          <>
            <DialogContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 2, mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.dark', fontWeight: 700, fontSize: 16 }}>
                  {selectedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{selectedUser.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedUser.email}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  ['Role', selectedUser.role],
                  ['Plan', selectedUser.plan],
                  ['Status', selectedUser.status],
                  ['Member Since', selectedUser.joined],
                  ['Monthly Revenue', selectedUser.revenue > 0 ? `$${selectedUser.revenue}/mo` : 'Free'],
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
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button variant="outlined" fullWidth>Edit Plan</Button>
              <Button variant="contained" color="error" fullWidth>Suspend</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
