import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, CardActionArea, Chip, CircularProgress,
  Grid, Avatar, IconButton, Dialog, DialogContent, DialogTitle,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Tooltip,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useAuth } from '../../context/AuthContext';
import { documentsApi } from '../../services/api';

const DOC_TYPE_LABELS = {
  BOL: 'Bill of Lading',
  POD: 'Proof of Delivery',
  receipt: 'Receipt',
  rate_confirmation: 'Rate Confirmation',
  other: 'Other',
};

const DOC_TYPE_COLORS = {
  BOL: 'primary',
  POD: 'success',
  receipt: 'warning',
  rate_confirmation: 'info',
  other: 'default',
};

function DocTypeChip({ type }) {
  return (
    <Chip
      label={DOC_TYPE_LABELS[type] || type}
      size="small"
      color={DOC_TYPE_COLORS[type] || 'default'}
      variant="outlined"
    />
  );
}

function DocViewer({ doc, open, onClose }) {
  const [page, setPage] = useState(0);
  const pages = doc?.pages || [];

  useEffect(() => { setPage(0); }, [doc]);

  if (!doc) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>{doc.file_name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {doc.load_origin} → {doc.load_destination}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {pages.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No preview available.</Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{ position: 'relative', bgcolor: 'action.selected' }}>
              <img
                src={pages[page]}
                alt={`Page ${page + 1}`}
                style={{ width: '100%', display: 'block', maxHeight: 600, objectFit: 'contain' }}
              />
              {pages.length > 1 && (
                <Box sx={{
                  position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', alignItems: 'center', gap: 1,
                  bgcolor: 'rgba(0,0,0,0.55)', borderRadius: 3, px: 1.5, py: 0.5,
                }}>
                  <IconButton
                    size="small"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    sx={{ color: '#fff', p: 0.5 }}
                  >
                    <NavigateBeforeIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" sx={{ color: '#fff', minWidth: 50, textAlign: 'center' }}>
                    {page + 1} / {pages.length}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setPage(p => Math.min(pages.length - 1, p + 1))}
                    disabled={page === pages.length - 1}
                    sx={{ color: '#fff', p: 0.5 }}
                  >
                    <NavigateNextIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Documents() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    documentsApi.mine()
      .then(data => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  const loadPath = (loadId) =>
    user?.role === 'broker' ? `/broker/loads/${loadId}` : `/carrier/active`;

  const filtered = docs.filter(d => {
    const matchSearch = !search ||
      d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      d.load_origin?.toLowerCase().includes(search.toLowerCase()) ||
      d.load_destination?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.doc_type === typeFilter;
    return matchSearch && matchType;
  });

  // Group by load
  const byLoad = filtered.reduce((acc, doc) => {
    const key = doc.load_id;
    if (!acc[key]) acc[key] = { load_id: key, origin: doc.load_origin, destination: doc.load_destination, docs: [] };
    acc[key].docs.push(doc);
    return acc;
  }, {});
  const groups = Object.values(byLoad);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <FolderIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={700}>My Documents</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          All documents you've uploaded, organized by load
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by filename or route…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment>,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Document Type</InputLabel>
          <Select value={typeFilter} label="Document Type" onChange={e => setTypeFilter(e.target.value)}>
            <MenuItem value="all">All Types</MenuItem>
            {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} document{filtered.length !== 1 ? 's' : ''} across {groups.length} load{groups.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      {groups.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <FolderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body1" fontWeight={600} color="text.secondary">
              {search || typeFilter !== 'all' ? 'No documents match your filters' : 'No documents uploaded yet'}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Documents you upload to loads will appear here
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {groups.map(group => (
            <Card key={group.load_id} variant="outlined">
              <CardContent sx={{ pb: '12px !important' }}>
                {/* Load header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34 }}>
                      <LocalShippingIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {group.origin} → {group.destination}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Load ID: {group.load_id.slice(0, 8)}…
                      </Typography>
                    </Box>
                  </Box>
                  <Tooltip title="View load">
                    <IconButton
                      component={Link}
                      to={loadPath(group.load_id)}
                      state={{ from: 'Documents' }}
                      size="small"
                    >
                      <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Documents table */}
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>File</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Pages</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Uploaded</TableCell>
                        <TableCell sx={{ width: 40 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.docs.map(doc => (
                        <TableRow
                          key={doc.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => setViewing(doc)}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ArticleIcon sx={{ fontSize: 15, color: 'text.disabled', flexShrink: 0 }} />
                              <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>{doc.file_name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><DocTypeChip type={doc.doc_type} /></TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{doc.page_count}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <Tooltip title="Preview">
                              <IconButton size="small" onClick={() => setViewing(doc)}>
                                <OpenInNewIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <DocViewer doc={viewing} open={!!viewing} onClose={() => setViewing(null)} />
    </Box>
  );
}
