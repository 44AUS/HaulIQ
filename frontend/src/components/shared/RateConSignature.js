import { useState, useEffect, useRef, useCallback } from 'react';
import { IonSpinner } from '@ionic/react';
import { rateConfirmationApi } from '../../services/api';
import IonIcon from '../IonIcon';

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
    <div>
      <div style={{ border: '1.5px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'var(--ion-card-background)', overflow: 'hidden', cursor: 'crosshair', touchAction: 'none', position: 'relative' }}>
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
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IonIcon name="pencil-outline" style={{ fontSize: 16 }} /> Draw your signature here
            </span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
        <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', fontSize: '0.75rem', fontFamily: 'inherit', padding: '4px 8px' }}>
          Clear
        </button>
      </div>
    </div>
  );
}

export default function RateConSignature({ bookingId, role }) {
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [sigData, setSigData] = useState(null);
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
    <div style={{ border: '1px solid var(--ion-border-color)', borderRadius: 8, padding: 20, backgroundColor: 'var(--ion-card-background)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ion-text-color)' }}>
          <IonIcon name="pencil-outline" style={{ fontSize: 16, color: 'var(--ion-color-primary)' }} /> Rate Confirmation Signatures
        </span>
        <button
          onClick={handleDownload}
          disabled={pdfLoading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', border: '1px solid var(--ion-border-color)', borderRadius: 6, backgroundColor: 'transparent', color: 'var(--ion-text-color)', fontSize: '0.82rem', fontFamily: 'inherit', cursor: pdfLoading ? 'not-allowed' : 'pointer', opacity: pdfLoading ? 0.6 : 1 }}
        >
          {pdfLoading ? <IonSpinner name="crescent" style={{ width: 13, height: 13 }} /> : <IonIcon name="document-outline" style={{ fontSize: 14 }} />}
          Download PDF
        </button>
      </div>

      {/* Signature status */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <SignBadge label="Broker"  signed={brokerSigned}  name={status?.broker_signed_name}  at={status?.broker_signed_at} />
        <SignBadge label="Carrier" signed={carrierSigned} name={status?.carrier_signed_name} at={status?.carrier_signed_at} />
        {fullySigned && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #2e7d32', color: '#2e7d32', borderRadius: 12, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
            <IonIcon name="checkmark-circle" style={{ fontSize: 14 }} /> Fully Executed
          </span>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: '0.82rem', color: '#d32f2f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', padding: 0 }}>×</button>
        </div>
      )}

      {!alreadySigned && !showPad && (
        <button
          onClick={() => setShowPad(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}
        >
          <IonIcon name="pencil-outline" style={{ fontSize: 14 }} /> Sign Rate Confirmation
        </button>
      )}

      {!alreadySigned && showPad && (
        <div>
          <div style={{ borderTop: '1px solid var(--ion-border-color)', marginBottom: 12 }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 8 }}>
            By signing below you agree to the terms of this rate confirmation.
          </span>
          <SignatureCanvas onReady={setSigData} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => { setShowPad(false); setSigData(null); }}
              style={{ padding: '7px 14px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSign}
              disabled={!sigData || signing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600, cursor: (!sigData || signing) ? 'not-allowed' : 'pointer', opacity: (!sigData || signing) ? 0.6 : 1 }}
            >
              {signing && <IonSpinner name="crescent" style={{ width: 13, height: 13, color: '#fff' }} />}
              Submit Signature
            </button>
          </div>
        </div>
      )}

      {alreadySigned && (
        <span style={{ fontSize: '0.78rem', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 4 }}>
          <IonIcon name="checkmark-circle" style={{ fontSize: 14 }} /> You have signed this rate confirmation.
        </span>
      )}
    </div>
  );
}

function SignBadge({ label, signed, name, at }) {
  const fmtDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {signed
        ? <IonIcon name="checkmark-circle" style={{ fontSize: 16, color: '#2e7d32' }} />
        : <IonIcon name="hourglass-outline" style={{ fontSize: 16, color: 'var(--ion-color-medium)' }} />}
      <div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: signed ? '#2e7d32' : 'var(--ion-color-medium)', display: 'block' }}>{label}</span>
        {signed && name && (
          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', lineHeight: 1.2 }}>
            {name}{at ? ` · ${fmtDate(at)}` : ''}
          </span>
        )}
        {!signed && (
          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', lineHeight: 1.2 }}>Pending</span>
        )}
      </div>
    </div>
  );
}
