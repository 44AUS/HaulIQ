import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Chip, CircularProgress, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  useTheme,
} from '@mui/material';
import { freightPaymentsApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';


// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { key: 'all',      label: 'ALL' },
  { key: 'pending',  label: 'PENDING' },
  { key: 'paid',     label: 'PAID' },
  { key: 'past_due', label: 'PAST DUE' },
  { key: 'voided',   label: 'VOIDED' },
];

// Map backend status → tab key
const STATUS_TAB = {
  pending:  'pending',
  escrowed: 'pending',
  released: 'paid',
  failed:   'past_due',
  refunded: 'voided',
};

// Badge colors matching app palette
const TAB_CHIP = {
  pending:  { label: 'Pending',   bg: '#ffce00', text: '#000' },
  escrowed: { label: 'In Escrow', bg: '#2a7fff', text: '#fff' },
  released: { label: 'Paid',      bg: '#2dd36f', text: '#fff' },
  failed:   { label: 'Past Due',  bg: '#eb445a', text: '#fff' },
  refunded: { label: 'Voided',    bg: '#757575', text: '#fff' },
};

// Left accent bar color per status
const STATUS_BAR = {
  pending:  '#ffce00',
  escrowed: '#2a7fff',
  released: '#2dd36f',
  failed:   '#eb445a',
  refunded: '#616161',
};

const fmt = (n) =>
  n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

const fmtDate = (s) => {
  if (!s) return '—';
  const utc = typeof s === 'string' && !s.endsWith('Z') && !s.includes('+') ? s + 'Z' : s;
  const d = new Date(utc);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
};

export default function CarrierPayments() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [spinning,  setSpinning]  = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = (showSpinner = false) => {
    if (showSpinner) setSpinning(true); else setLoading(true);
    freightPaymentsApi.list()
      .then(d => setPayments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => { setLoading(false); setSpinning(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const tabItems = useMemo(() => {
    if (activeTab === 'all') return payments;
    return payments.filter(p => STATUS_TAB[p.status] === activeTab);
  }, [payments, activeTab]);

  const tabCounts = useMemo(() => {
    const c = { all: payments.length };
    TABS.slice(1).forEach(t => {
      c[t.key] = payments.filter(p => STATUS_TAB[p.status] === t.key).length;
    });
    return c;
  }, [payments]);

  // Summary stats
  const pending   = payments.filter(p => p.status === 'pending' || p.status === 'escrowed').reduce((s, p) => s + (p.carrier_amount || 0), 0);
  const paid      = payments.filter(p => p.status === 'released').reduce((s, p) => s + (p.carrier_amount || 0), 0);
  const pastDue   = payments.filter(p => p.status === 'failed').reduce((s, p) => s + (p.carrier_amount || 0), 0);

  const activeFg   = isDark ? '#fff' : '#000';
  const inactiveFg = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '4px 6px' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', bgcolor: 'background.paper', borderRadius: '6px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

      {/* ── Top bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, flexShrink: 0, borderRadius: '6px 6px 0 0' }}>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>Payments</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Freight payments for your completed loads
          </Typography>
        </Box>
        {/* Summary pills */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Awaiting', value: fmt(pending),  color: '#ffce00', text: '#000' },
            { label: 'Paid Out', value: fmt(paid),     color: '#2dd36f', text: '#fff' },
            { label: 'Past Due', value: fmt(pastDue),  color: '#eb445a', text: '#fff' },
          ].map(({ label, value, color, text }) => (
            <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: '8px', px: 2, py: 0.75, minWidth: 80 }}>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color }}>{value}</Typography>
              <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', fontWeight: 600, letterSpacing: '0.04em' }}>{label.toUpperCase()}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Tab bar ── */}
      <Box sx={{ display: 'flex', alignItems: 'stretch', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', flexShrink: 0, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count    = tabCounts[tab.key] ?? 0;
          return (
            <Box key={tab.key} onClick={() => setActiveTab(tab.key)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 2.75, cursor: 'pointer', flexShrink: 0,
                borderBottom: isActive ? '2px solid' : '2px solid transparent',
                borderColor: isActive ? (isDark ? '#fff' : '#000') : 'transparent',
                color: isActive ? activeFg : inactiveFg,
                opacity: isActive ? 1 : 0.6,
                '&:hover': { opacity: 1, bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
                transition: 'opacity 0.15s, background-color 0.15s',
              }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>{tab.label}</Typography>
              <Box sx={{ bgcolor: 'background.default', borderRadius: '4px', px: 0.6, py: 0.15, minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{count}</Typography>
              </Box>
            </Box>
          );
        })}
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1.5 }}>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => fetchData(true)} sx={{ color: 'text.secondary' }}>
              <IonIcon name="refresh-outline" sx={{ fontSize: 18, animation: spinning ? 'spin 0.8s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Table ── */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress size={28} />
          </Box>
        ) : tabItems.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 1 }}>
            <Typography variant="body2" color="text.secondary">No payments in this category</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: '400 !important', color: `${isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)'} !important` } }}>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 200 }}>Route</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 110 }}>Load Rate</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 120 }}>Your Earnings</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 90  }}>Escrowed</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, minWidth: 90  }}>Paid Out</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', bgcolor: 'action.hover', py: 1.25, width: 120, minWidth: 120 }}>Status</TableCell>
                  <TableCell sx={{ bgcolor: 'action.hover', py: 1.25, width: 32, minWidth: 32 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {tabItems.map((p) => {
                  const chip     = TAB_CHIP[p.status] || { label: p.status, bg: '#9e9e9e', text: '#fff' };
                  const barColor = STATUS_BAR[p.status] || '#9e9e9e';
                  return (
                    <TableRow
                      key={p.id}
                      sx={{
                        height: 64,
                        '& td': { py: 0, borderBottom: 0 },
                        '& td:not(:nth-of-type(1))': { borderBottom: '1px solid', borderBottomColor: 'divider' },
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
                      }}
                    >
                      {/* Route — with accent bar */}
                      <TableCell sx={{ pl: 0, position: 'relative', minWidth: 200 }}>
                        <Box sx={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 4, bgcolor: barColor, borderRadius: '0 2px 2px 0' }} />
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                            {p.load_origin || '—'} → {p.load_destination || '—'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{fmt(p.amount)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="success.main">{fmt(p.carrier_amount)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{fmtDate(p.escrowed_at)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{fmtDate(p.released_at)}</Typography>
                      </TableCell>
                      <TableCell sx={{ width: 120, minWidth: 120 }}>
                        <Chip label={chip.label} size="small" sx={{ fontSize: '0.68rem', height: 22, fontWeight: 600, borderRadius: '8px', bgcolor: chip.bg, color: chip.text }} />
                      </TableCell>
                      <TableCell sx={{ width: 32, minWidth: 32, pr: 1 }}>
                        <IonIcon name="chevron-forward-outline" sx={{ fontSize: 18, color: 'text.disabled', display: 'block' }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

    </Box>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Box>
  );
}
