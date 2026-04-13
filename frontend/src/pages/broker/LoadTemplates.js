import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Chip, IconButton, Alert,
  CircularProgress, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField,
} from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplayIcon from '@mui/icons-material/Replay';
import EditIcon from '@mui/icons-material/Edit';
import { loadTemplatesApi } from '../../services/api';

export default function LoadTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rename dialog
  const [renameDialog, setRenameDialog] = useState(null); // { id, name }
  const [renameSaving, setRenameSaving] = useState(false);

  useEffect(() => {
    loadTemplatesApi.list()
      .then(data => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load templates'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => {
    loadTemplatesApi.delete(id)
      .then(() => setTemplates(prev => prev.filter(t => t.id !== id)))
      .catch(() => {});
  };

  const handleRename = () => {
    if (!renameDialog) return;
    setRenameSaving(true);
    loadTemplatesApi.update(renameDialog.id, { name: renameDialog.name })
      .then(updated => {
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
        setRenameDialog(null);
      })
      .catch(() => {})
      .finally(() => setRenameSaving(false));
  };

  const handleUseTemplate = (t) => {
    navigate('/broker/post', { state: { template: t } });
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LayersIcon color="primary" /> Load Templates
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Re-post recurring lanes in seconds — no re-entry needed.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/broker/post')}>
          Post New Load
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : templates.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
          <LayersIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>No templates yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            When posting a load, click "Save as Template" to add it here.
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/broker/post')}>Post a Load</Button>
        </Paper>
      ) : (
        <Paper variant="outlined">
          {templates.map((t, i) => (
            <Box key={t.id}>
              {i > 0 && <Divider />}
              <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="subtitle2" fontWeight={700}>{t.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {t.origin} → {t.destination}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                    <Chip label={`$${(t.rate || 0).toLocaleString()}`} size="small" color="success" variant="outlined" />
                    <Chip label={`${t.miles} mi`} size="small" variant="outlined" />
                    {t.load_type && <Chip label={t.load_type} size="small" variant="outlined" />}
                    {t.times_used > 0 && (
                      <Chip label={`Used ${t.times_used}×`} size="small" variant="outlined" color="info" />
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<ReplayIcon />}
                    onClick={() => handleUseTemplate(t)}
                  >
                    Re-post
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => setRenameDialog({ id: t.id, name: t.name })}
                    title="Rename"
                    sx={{ color: 'text.secondary' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(t.id)}
                    sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        Up to 50 templates. Save from any load post.
      </Typography>

      {/* Rename dialog */}
      <Dialog open={!!renameDialog} onClose={() => setRenameDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename Template</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Template Name"
            value={renameDialog?.name || ''}
            onChange={e => setRenameDialog(d => ({ ...d, name: e.target.value }))}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRename}
            disabled={renameSaving || !renameDialog?.name?.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
