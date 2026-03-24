import React, { useState } from 'react';
import {
  Box, Typography, Card, TextField, InputAdornment, Alert,
  Chip, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Button,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FlagIcon from '@mui/icons-material/Flag';
import { LOADS } from '../../data/sampleData';

const profitScoreColor = {
  green:  'success',
  yellow: 'warning',
  red:    'error',
};

export default function AdminLoads() {
  const [search, setSearch] = useState('');
  const filtered = LOADS.filter(l =>
    !search ||
    l.origin.toLowerCase().includes(search.toLowerCase()) ||
    l.dest.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Load Moderation</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">Review and moderate loads on the platform</Typography>
      </Box>

      {/* Search */}
      <Box sx={{ maxWidth: 400 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search loads..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
        />
      </Box>

      {/* Flagged alert */}
      <Alert
        severity="warning"
        icon={<FlagIcon />}
        action={
          <Button color="warning" size="small" variant="text">Review flagged →</Button>
        }
      >
        3 loads have been flagged by drivers for suspicious rates or broker issues.
      </Alert>

      {/* Table */}
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Load ID', 'Route', 'Type', 'Rate', 'Broker', 'Profit Score', 'Actions'].map(h => (
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
              {filtered.map(load => (
                <TableRow key={load.id} hover>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {load.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} noWrap>{load.origin} → {load.dest}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{load.type}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>${load.rate.toLocaleString()}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" noWrap>{load.broker.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={load.profitScore}
                      size="small"
                      color={profitScoreColor[load.profitScore] || 'default'}
                      sx={{ fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.25 }}>
                      <IconButton size="small" title="Approve" sx={{ color: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>
                        <CheckIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" title="Remove" sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" title="Flag" sx={{ color: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}>
                        <FlagIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
