import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { instantBookApi, networkApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';
import {
  Box, Typography, Button, Card, CardContent, Paper, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, CircularProgress, Alert, TextField,
  Tabs, Tab, Avatar, IconButton, InputAdornment,
} from '@mui/material';

export default function InstantBookSettings() {
  const [tab, setTab] = useState(0);

  const [allowlist, setAllowlist] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const [uploadText, setUploadText] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [confirmRemove, setConfirmRemove] = useState(null);

  const [networkStatus, setNetworkStatus] = useState({});

  const handleAddToNetwork = (carrierId) => {
    setNetworkStatus(prev => ({ ...prev, [carrierId]: { ...prev[carrierId], loading: true } }));
    networkApi.add(carrierId)
      .then(res => setNetworkStatus(prev => ({ ...prev, [carrierId]: { status: res.status, entry_id: res.id, loading: false } })))
      .catch(() => setNetworkStatus(prev => ({ ...prev, [carrierId]: { ...prev[carrierId], loading: false } })));
  };

  useEffect(() => {
    instantBookApi.allowlist()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setAllowlist(list);
        // Pre-load network status for all carriers that have an account
        list.forEach(entry => {
          if (!entry.carrier_id) return;
          networkApi.check(entry.carrier_id)
            .then(res => {
              if (res?.status) {
                setNetworkStatus(prev => ({
                  ...prev,
                  [entry.carrier_id]: { status: res.status, entry_id: res.id },
                }));
              }
            })
            .catch(() => {});
        });
      })
      .catch(err => setListError(err.message))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (query.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      instantBookApi.searchCarriers(query)
        .then(data => setSearchResults(Array.isArray(data) ? data : []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const isAlreadyAdded = (carrier) =>
    allowlist.some(e => e.carrier_id === carrier.id || e.carrier_email === carrier.email);

  const handleAdd = (carrier) => {
    if (isAlreadyAdded(carrier) || addingId) return;
    setAddingId(carrier.id);
    instantBookApi.add(carrier.id)
      .then(entry => setAllowlist(prev => [entry, ...prev]))
      .catch(() => {})
      .finally(() => setAddingId(null));
  };

  const handleRemove = (entryId) => {
    instantBookApi.remove(entryId)
      .then(() => { setAllowlist(prev => prev.filter(e => e.id !== entryId)); setConfirmRemove(null); })
      .catch(() => setConfirmRemove(null));
  };

  const parseUploadText = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    return lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length === 1) return { email: parts[0] };
      return { name: parts[0], email: parts[1] || '', mc: parts[2] || '' };
    }).filter(r => r.email);
  };

  const handleUploadSubmit = () => {
    if (!uploadText.trim()) return;
    const rows = parseUploadText(uploadText);
    if (!rows.length) return;
    setUploading(true);
    instantBookApi.bulkUpload(rows)
      .then(result => {
        setUploadResult(result);
        setUploadText('');
        return instantBookApi.allowlist();
      })
      .then(data => setAllowlist(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setUploading(false));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadText(ev.target.result);
    reader.readAsText(file);
  };

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IonIcon name="flash-outline" color="success" /> Instant Book Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Only carriers on your allowlist can instantly book your loads. Others must submit a Book Now request.
          </Typography>
        </Box>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: '12px !important', px: 3 }}>
            <Typography variant="h4" fontWeight={800}>{allowlist.length}</Typography>
            <Typography variant="caption" color="text.secondary">Approved carriers</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Info banner */}
      <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5, borderColor: 'success.main', bgcolor: 'rgba(46,125,50,0.04)' }}>
        <IonIcon name="information-circle-outline" sx={{ color: 'success.main', flexShrink: 0, mt: 0.2, fontSize: 18 }} />
        <Typography variant="body2" color="text.secondary">
          When a load has <strong>Instant Book</strong> enabled, only your approved carriers will see the Instant Book button. All other carriers will see a standard Book Now request that requires your approval.
        </Typography>
      </Paper>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<IonIcon name="people-outline" sx={{ fontSize: 16 }} />} iconPosition="start" label={`Allowlist (${allowlist.length})`} />
        <Tab icon={<IonIcon name="search-outline" sx={{ fontSize: 16 }} />} iconPosition="start" label="Add from Urload" />
        <Tab icon={<IonIcon name="cloud-upload-outline" sx={{ fontSize: 16 }} />} iconPosition="start" label="Upload a list" />
      </Tabs>

      {/* Allowlist tab */}
      {tab === 0 && (
        <Card>
          {listLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          ) : listError ? (
            <CardContent><Alert severity="error">{listError}</Alert></CardContent>
          ) : allowlist.length === 0 ? (
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <IonIcon name="people-outline" sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">No carriers on your allowlist yet</Typography>
              <Typography variant="caption" color="text.disabled">Add carriers via search or upload</Typography>
            </CardContent>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    {['Carrier', 'MC Number', 'Source', 'Added', 'Network', ''].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allowlist.map((entry, idx) => {
                    const ns = networkStatus[entry.carrier_id] || {};
                    const initial = (entry.carrier_name || entry.carrier_email || '?').charAt(0).toUpperCase();
                    return (
                      <TableRow key={entry.id} sx={{ bgcolor: idx % 2 === 1 ? 'action.hover' : 'inherit' }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                              {initial}
                            </Avatar>
                            <Box>
                              {entry.carrier_id ? (
                                <Typography
                                  component={Link}
                                  to={`/c/${entry.carrier_id?.slice(0,8)}`}
                                  state={{ carrierId: entry.carrier_id }}
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                >
                                  {entry.carrier_name || '—'}
                                </Typography>
                              ) : (
                                <Typography variant="body2" fontWeight={600}>{entry.carrier_name || '—'}</Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>{entry.carrier_email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{entry.carrier_mc || '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={entry.source}
                            size="small"
                            color={entry.source === 'upload' ? 'info' : 'primary'}
                            variant="outlined"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                          {new Date(entry.added_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {entry.carrier_id && (
                            ns.status === 'accepted' ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                                <IonIcon name="checkmark-outline" sx={{ fontSize: 14 }} />
                                <Typography variant="caption" fontWeight={600}>Network</Typography>
                              </Box>
                            ) : ns.status === 'pending' ? (
                              <Typography variant="caption" color="warning.main" fontWeight={600}>Request Sent</Typography>
                            ) : (
                              <Button
                                size="small"
                                variant="text"
                                startIcon={ns.loading ? <CircularProgress size={12} /> : <IonIcon name="git-network-outline" sx={{ fontSize: 14 }} />}
                                disabled={ns.loading}
                                onClick={() => handleAddToNetwork(entry.carrier_id)}
                                sx={{ fontSize: '0.7rem' }}
                              >
                                {ns.loading ? '…' : 'Add to Network'}
                              </Button>
                            )
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {confirmRemove === entry.id ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">Remove?</Typography>
                              <Button size="small" color="error" variant="text" onClick={() => handleRemove(entry.id)} sx={{ minWidth: 0, px: 0.5 }}>Yes</Button>
                              <Button size="small" variant="text" onClick={() => setConfirmRemove(null)} sx={{ minWidth: 0, px: 0.5 }}>No</Button>
                            </Box>
                          ) : (
                            <IconButton size="small" color="error" onClick={() => setConfirmRemove(entry.id)}>
                              <IonIcon name="trash-outline" sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </Card>
      )}

      {/* Search tab */}
      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth size="small"
            placeholder="Search by name, email, or MC number..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: <InputAdornment position="start"><IonIcon name="search-outline" sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
              endAdornment: searching ? <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment> : null,
            }}
          />

          {query.length >= 2 && !searching && searchResults.length === 0 && (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No carriers found matching "{query}"</Typography>
              <Typography variant="caption" color="text.disabled">Only registered Urload carriers appear here</Typography>
            </Paper>
          )}

          {searchResults.length > 0 && (
            <Card>
              {searchResults.map((carrier, idx) => {
                const already = isAlreadyAdded(carrier);
                const adding = addingId === carrier.id;
                return (
                  <Box key={carrier.id} sx={{
                    display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
                    borderBottom: idx < searchResults.length - 1 ? 1 : 0, borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      {carrier.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600}>{carrier.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">{carrier.email}</Typography>
                        {carrier.mc_number && (
                          <Typography variant="caption" color="text.secondary">· {carrier.mc_number}</Typography>
                        )}
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      variant={already ? 'outlined' : 'contained'}
                      color={already ? 'success' : 'primary'}
                      disabled={already || adding}
                      startIcon={already ? <IonIcon name="checkmark-outline" /> : adding ? <CircularProgress size={12} color="inherit" /> : <IonIcon name="person-add-outline" />}
                      onClick={() => handleAdd(carrier)}
                    >
                      {already ? 'Added' : adding ? 'Adding…' : 'Add'}
                    </Button>
                  </Box>
                );
              })}
            </Card>
          )}

          {query.length < 2 && (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <IonIcon name="search-outline" sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Search Urload's carrier database</Typography>
              <Typography variant="caption" color="text.disabled">
                Type at least 2 characters to search by name, email, or MC number
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Upload tab */}
      {tab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <IonIcon name="document-text-outline" sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="subtitle2">Accepted formats</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' }, gap: 1.5 }}>
                {[
                  { label: 'Email only', example: 'driver@company.com' },
                  { label: 'CSV (Name, Email)', example: 'John Smith, john@co.com' },
                  { label: 'CSV (Name, Email, MC)', example: 'John Smith, john@co.com, MC-123' },
                ].map(({ label, example }) => (
                  <Paper key={label} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{example}</Typography>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>

          <Paper
            variant="outlined"
            onDrop={handleFileDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              p: 4, textAlign: 'center', cursor: 'pointer',
              borderStyle: 'dashed', borderWidth: 2,
              borderColor: dragOver ? 'primary.main' : 'divider',
              bgcolor: dragOver ? 'action.selected' : 'transparent',
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'text.secondary' },
            }}
          >
            <IonIcon name="cloud-upload-outline" sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">Drop a .csv or .txt file here</Typography>
            <Typography variant="caption" color="text.disabled">or click to browse</Typography>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleFileDrop} />
          </Paper>

          <TextField
            fullWidth size="small" label="Or paste your list" multiline rows={8}
            placeholder={"driver@company.com\nJohn Smith, john@co.com, MC-123456\nJane Doe, jane@fleet.com"}
            value={uploadText}
            onChange={e => { setUploadText(e.target.value); setUploadResult(null); }}
            inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
          />

          {uploadResult && (
            <Alert severity="success" icon={<IonIcon name="checkmark-outline" />}>
              <strong>Upload complete — </strong>
              {uploadResult.added} carrier{uploadResult.added !== 1 ? 's' : ''} added
              {uploadResult.skipped > 0 && `, ${uploadResult.skipped} skipped (duplicates or invalid)`}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={handleUploadSubmit}
            disabled={!uploadText.trim() || uploading}
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <IonIcon name="cloud-upload-outline" />}
            sx={{ py: 1.5 }}
          >
            {uploading ? 'Importing…' : 'Import Carriers'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
