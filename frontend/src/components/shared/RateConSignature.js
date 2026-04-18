import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Chip, CircularProgress, Alert, Divider,
} from '@mui/material';
import { rateConfirmationApi } from '../../services/api';
import IonIcon from '../IonIcon';


// ─── Signature canvas ─────────────────────────────────────────────────────────
function SignatureCanvas({ onReady }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#0D2137';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
    setIsEmpty(false);
    onReady(canvas.toDataURL('image/png'));
  }, [onReady]);

  const stopDraw = useCallback(() => { drawing.current = false; }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onReady(null);
  };

  return (
    <Box>
      <Box
        sx={{
          border: '1.5px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          bgcolor: 'background.paper',
          overflow: 'hidden',
          cursor: 'crosshair',
          touchAction: 'none',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={120}
          style={{ display: 'block', width: '100%', height: 120 }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {isEmpty && (
          <Box sx={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <Typography variant="body2" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <IonIcon name="pencil-outline" fontSize="small" /> Draw your signature here
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.75 }}>
        <Button size="small" onClick={clear} sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          Clear
        </Button>
      </Box>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RateConSignature({ bookingId, role }) {
  const [status, setStatus]   = useState(null);   // sign-status response
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [sigData, setSigData] = useState(null);   // canvas data URL
  const [error, setError]     = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPad, setShowPad] = useState(false);

  const alreadySigned = status && (
    (role === 'broker'  && status.broker_signed) ||
    (role === 'carrier' && status.carrier_signed)
  );

  useEffect(() => {
    rateConfirmationApi.signStatus(bookingId)
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleSign = () => {
    if (!sigData) return;
    setSigning(true);
    setError(null);
    rateConfirmationApi.sign(bookingId, sigData)
      .then(updated => { setStatus(updated); setShowPad(false); setSigData(null); })
      .catch(err => setError(err.message))
      .finally(() => setSigning(false));
  };

  const handleDownload = async () => {
    setPdfLoading(true);
    try { await rateConfirmationApi.download(bookingId); }
    catch (e) { setError(e.message); }
    finally { setPdfLoading(false); }
  };

  if (loading) return null;

  const brokerSigned  = status?.broker_signed;
  const carrierSigned = status?.carrier_signed;
  const fullySigned   = status?.fully_signed;

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <IonIcon name="pencil-outline" fontSize="small" color="primary" /> Rate Confirmation Signatures
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={pdfLoading ? <CircularProgress size={13} /> : <IonIcon name="document-outline" />}
          onClick={handleDownload}
          disabled={pdfLoading}
        >
          Download PDF
        </Button>
      </Box>

      {/* Status row */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        <SignBadge label="Broker" signed={brokerSigned} name={status?.broker_signed_name} at={status?.broker_signed_at} />
        <SignBadge label="Carrier" signed={carrierSigned} name={status?.carrier_signed_name} at={status?.carrier_signed_at} />
        {fullySigned && (
          <Chip
            icon={<IonIcon name="checkmark-circle" />}
            label="Fully Executed"
            color="success"
            size="small"
            variant="outlined"
          />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Sign action */}
      {!alreadySigned && !showPad && (
        <Button
          variant="contained"
          size="small"
          startIcon={<IonIcon name="pencil-outline" />}
          onClick={() => setShowPad(true)}
        >
          Sign Rate Confirmation
        </Button>
      )}

      {!alreadySigned && showPad && (
        <Box>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            By signing below you agree to the terms of this rate confirmation.
          </Typography>
          <SignatureCanvas onReady={setSigData} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Button size="small" onClick={() => { setShowPad(false); setSigData(null); }}>Cancel</Button>
            <Button
              size="small"
              variant="contained"
              disabled={!sigData || signing}
              onClick={handleSign}
              endIcon={signing ? <CircularProgress size={13} color="inherit" /> : null}
            >
              Submit Signature
            </Button>
          </Box>
        </Box>
      )}

      {alreadySigned && (
        <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IonIcon name="checkmark-circle" sx={{ fontSize: 14 }} /> You have signed this rate confirmation.
        </Typography>
      )}
    </Paper>
  );
}

function SignBadge({ label, signed, name, at }) {
  const fmtDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      {signed
        ? <IonIcon name="checkmark-circle" sx={{ fontSize: 16, color: 'success.main' }} />
        : <IonIcon name="hourglass-outline" sx={{ fontSize: 16, color: 'text.disabled' }} />}
      <Box>
        <Typography variant="caption" fontWeight={600} color={signed ? 'success.main' : 'text.disabled'}>
          {label}
        </Typography>
        {signed && name && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
            {name}{at ? ` · ${fmtDate(at)}` : ''}
          </Typography>
        )}
        {!signed && (
          <Typography variant="caption" color="text.disabled" display="block" sx={{ lineHeight: 1.2 }}>
            Pending
          </Typography>
        )}
      </Box>
    </Box>
  );
}
