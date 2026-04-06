import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Paper, Chip, Typography, Box, Button, IconButton, Tooltip, Stack,
  CircularProgress
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import { rateConfirmationApi } from '../../services/api';

const TMS_LABEL = {
  dispatched:   { label: 'Dispatched',   color: 'info' },
  picked_up:    { label: 'Picked Up',    color: 'primary' },
  in_transit:   { label: 'In Transit',   color: 'primary' },
  delivered:    { label: 'Delivered',    color: 'success' },
  pod_received: { label: 'POD Received', color: 'success' },
};

function nextActionLabel(row) {
  if (!row.tms_status && row.booking_status === 'approved') return { label: 'Assign Driver', color: 'warning' };
  if (row.tms_status === 'dispatched')   return { label: 'Awaiting Pickup',  color: 'default' };
  if (row.tms_status === 'picked_up')    return { label: 'In Transit',        color: 'info' };
  if (row.tms_status === 'in_transit')   return { label: 'Awaiting Delivery', color: 'info' };
  if (row.tms_status === 'delivered')    return { label: 'Mark POD',          color: 'warning' };
  if (row.tms_status === 'pod_received') return { label: 'Completed',         color: 'success' };
  return { label: row.booking_status, color: 'default' };
}

export default function DispatcherTable({ rows, loading, onDispatch, onMarkPOD }) {
  const navigate = useNavigate();
  const [pdfLoading, setPdfLoading] = useState(null);

  const handleRateCon = async (bookingId) => {
    setPdfLoading(bookingId);
    try {
      await rateConfirmationApi.download(bookingId);
    } catch (e) {
      alert(e.message);
    } finally {
      setPdfLoading(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!rows.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <LocalShippingIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">No active shipments to dispatch.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            {['Route', 'Carrier', 'Driver', 'Pickup Date', 'Rate', 'TMS Status', 'Next Action', 'Last Note', ''].map(h => (
              <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => {
            const next = nextActionLabel(row);
            const tms  = row.tms_status ? TMS_LABEL[row.tms_status] : null;
            return (
              <TableRow key={row.booking_id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>
                    {row.origin} → {row.destination}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 130 }}>
                    {row.carrier_name || '—'}
                  </Typography>
                  {row.carrier_mc && (
                    <Typography variant="caption" color="text.secondary">MC# {row.carrier_mc}</Typography>
                  )}
                </TableCell>

                <TableCell>
                  {row.driver_name ? (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 110 }}>{row.driver_name}</Typography>
                        {row.driver_phone && (
                          <Typography variant="caption" color="text.secondary">{row.driver_phone}</Typography>
                        )}
                      </Box>
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.disabled">Not assigned</Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {row.pickup_date ? new Date(row.pickup_date).toLocaleDateString() : '—'}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    ${(row.rate || 0).toLocaleString()}
                  </Typography>
                </TableCell>

                <TableCell>
                  {tms ? (
                    <Chip label={tms.label} color={tms.color} size="small" variant="outlined" />
                  ) : (
                    <Chip label="Not Dispatched" size="small" sx={{ bgcolor: 'action.disabledBackground' }} />
                  )}
                </TableCell>

                <TableCell>
                  {next.label === 'Assign Driver' ? (
                    <Button size="small" variant="outlined" color="warning" onClick={() => onDispatch(row)}>
                      Assign Driver
                    </Button>
                  ) : next.label === 'Mark POD' ? (
                    <Button size="small" variant="outlined" color="success" onClick={() => onMarkPOD(row)}>
                      Mark POD
                    </Button>
                  ) : (
                    <Chip label={next.label} color={next.color} size="small" />
                  )}
                </TableCell>

                <TableCell>
                  {row.last_check_call ? (
                    <Tooltip title={row.last_check_call}>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 120, display: 'block' }}>
                        {row.last_check_call}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>

                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Rate Confirmation PDF">
                      <IconButton
                        size="small"
                        onClick={() => handleRateCon(row.booking_id)}
                        disabled={pdfLoading === row.booking_id}
                      >
                        {pdfLoading === row.booking_id
                          ? <CircularProgress size={14} />
                          : <PictureAsPdfIcon fontSize="small" />
                        }
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Open Dispatch Detail">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/broker/dispatch/${row.booking_id}`)}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
