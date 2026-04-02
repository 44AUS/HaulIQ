import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, Chip, Button,
  Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, CircularProgress, Alert, Skeleton, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import { contactApi } from '../../services/api';

function MessageDialog({ msg, onClose, onMarkRead, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onDelete(msg.id);
    onClose();
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>{msg.subject}</Typography>
          <Typography variant="caption" color="text.secondary">{msg.name} · {msg.email}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 2 }}>
          {new Date(msg.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{msg.message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        {!msg.read && (
          <Button variant="outlined" startIcon={<MarkEmailReadIcon />} onClick={() => { onMarkRead(msg.id); onClose(); }}>
            Mark as Read
          </Button>
        )}
        <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
        <Button variant="contained" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminContacts() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contactApi.list();
      setMessages(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await contactApi.markRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await contactApi.remove(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const unread = messages.filter(m => !m.read).length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <MailIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>Contact Messages</Typography>
            {unread > 0 && (
              <Chip label={`${unread} unread`} size="small" color="primary" sx={{ fontSize: 11 }} />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">{messages.length} total message{messages.length !== 1 ? 's' : ''}</Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
          onClick={load}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {[
          { label: 'Total',   value: messages.length,                         color: 'text.primary' },
          { label: 'Unread',  value: unread,                                   color: 'primary.main' },
          { label: 'Read',    value: messages.filter(m => m.read).length,      color: 'success.main' },
        ].map(({ label, value, color }) => (
          <Card variant="outlined" key={label}>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={800} color={color}>{value}</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>{label}</Typography>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Table */}
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[...Array(6)].map((_, i) => (
                    <TableCell key={i}><Skeleton variant="text" width={80} height={16} /></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    {[120, 160, 140, 80, 90, 70].map((w, j) => (
                      <TableCell key={j}><Skeleton variant="text" width={w} height={18} /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body2" color="text.secondary">No contact messages yet.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  {['Name', 'Email', 'Subject', 'Status', 'Received', ''].map((h, i) => (
                    <TableCell key={i} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'secondary.main', whiteSpace: 'nowrap' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {messages.map(m => (
                  <TableRow
                    key={m.id}
                    hover
                    onClick={() => { setSelected(m); if (!m.read) handleMarkRead(m.id); }}
                    sx={{ cursor: 'pointer', bgcolor: m.read ? 'transparent' : 'action.hover' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={m.read ? 400 : 700}>{m.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{m.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{m.subject}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={m.read ? 'Read' : 'Unread'}
                        size="small"
                        color={m.read ? 'default' : 'primary'}
                        variant={m.read ? 'outlined' : 'filled'}
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={e => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {!m.read && (
                          <IconButton size="small" title="Mark as read" onClick={() => handleMarkRead(m.id)}
                            sx={{ '&:hover': { color: 'primary.main' } }}>
                            <MarkEmailReadIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        )}
                        <IconButton size="small" title="Delete" onClick={() => handleDelete(m.id)}
                          disabled={deleting === m.id}
                          sx={{ '&:hover': { color: 'error.main' } }}>
                          {deleting === m.id
                            ? <CircularProgress size={14} color="inherit" />
                            : <DeleteOutlineIcon sx={{ fontSize: 15 }} />}
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

      {selected && (
        <MessageDialog
          msg={selected}
          onClose={() => setSelected(null)}
          onMarkRead={handleMarkRead}
          onDelete={handleDelete}
        />
      )}
    </Box>
  );
}
