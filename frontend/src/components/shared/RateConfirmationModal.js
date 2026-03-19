import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export default function RateConfirmationModal({ rc, role, onSign, onClose }) {
  const [sigInput, setSigInput] = useState('');
  const [signed, setSigned] = useState(false);

  const isFullySigned = rc.status === 'fully_signed' || signed;
  const isPendingCarrier = rc.status === 'pending_carrier' && !signed;

  function handleSign() {
    if (!sigInput.trim()) return;
    onSign(sigInput.trim());
    setSigned(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass border border-dark-400/40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-dark-400/30 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-dark-400 hover:text-dark-200 transition-colors"
          >
            <X size={18} />
          </button>
          <p className="text-center text-xs text-dark-400 uppercase tracking-widest mb-1">Rate Confirmation</p>
          <h2 className="text-center text-2xl font-bold text-white">RATE CONFIRMATION</h2>
          <p className="text-center text-brand-400 text-sm font-mono mt-1">RC-{rc.id.toUpperCase()}</p>
          <div className="flex items-center justify-center gap-3 mt-2">
            {signed || isFullySigned ? (
              <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={11} /> Fully Signed
              </span>
            ) : (
              <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-semibold px-2.5 py-1 rounded-full">
                Pending Carrier Signature
              </span>
            )}
            <span className="text-dark-400 text-xs">{formatDate(rc.createdAt)}</span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Broker Information */}
          <div>
            <p className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-3">Broker Information</p>
            <div className="glass-light rounded-xl p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Company Name</p>
                <p className="text-white text-sm font-semibold">{rc.brokerName}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">MC Number</p>
                <p className="text-white text-sm font-semibold">{rc.brokerMc}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Contact Name</p>
                <p className="text-white text-sm">{rc.brokerContact}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Phone</p>
                <p className="text-white text-sm">{rc.brokerPhone}</p>
              </div>
            </div>
          </div>

          {/* Carrier Information */}
          <div>
            <p className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-3">Carrier Information</p>
            <div className="glass-light rounded-xl p-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Carrier Name</p>
                <p className="text-white text-sm font-semibold">{rc.carrierName}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">MC Number</p>
                <p className="text-white text-sm font-semibold">{rc.carrierMc}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">DOT Number</p>
                <p className="text-white text-sm font-semibold">{rc.carrierDot}</p>
              </div>
            </div>
          </div>

          {/* Load Details */}
          <div>
            <p className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-3">Load Details</p>
            <div className="glass-light rounded-xl p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Origin</p>
                <p className="text-white text-sm font-semibold">{rc.origin}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Destination</p>
                <p className="text-white text-sm font-semibold">{rc.dest}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Pickup Date</p>
                <p className="text-white text-sm">{formatDate(rc.pickup)}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Delivery Date</p>
                <p className="text-white text-sm">{formatDate(rc.delivery)}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Equipment Type</p>
                <p className="text-white text-sm">{rc.type}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Commodity</p>
                <p className="text-white text-sm">{rc.commodity}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Weight</p>
                <p className="text-white text-sm">{rc.weight}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-0.5">Miles</p>
                <p className="text-white text-sm">{rc.miles} mi</p>
              </div>
            </div>
          </div>

          {/* Rate & Payment Terms */}
          <div>
            <p className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-3">Rate & Payment Terms</p>
            <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-dark-300 text-sm">Total Rate</span>
                <span className="text-brand-400 text-2xl font-bold">${rc.rate.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-brand-500/10">
                <div>
                  <p className="text-dark-400 text-xs mb-0.5">Rate Per Mile</p>
                  <p className="text-white text-sm font-semibold">${rc.ratePerMile}/mi</p>
                </div>
                <div>
                  <p className="text-dark-400 text-xs mb-0.5">Payment Terms</p>
                  <p className="text-white text-sm font-semibold">{rc.paymentTerms}</p>
                </div>
                <div>
                  <p className="text-dark-400 text-xs mb-0.5">Payment Method</p>
                  <p className="text-white text-sm font-semibold">{rc.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <p className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-3">Special Instructions</p>
            <div className="bg-dark-700/40 border border-dark-400/20 rounded-xl px-4 py-3">
              <p className="text-dark-300 text-sm leading-relaxed">
                {rc.specialInstructions || 'None'}
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div>
            <p className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-3">Signatures</p>
            <div className="grid grid-cols-2 gap-4">

              {/* Broker Signature */}
              <div className="glass-light rounded-xl p-4">
                <p className="text-dark-400 text-xs font-bold uppercase tracking-wider mb-3">Broker Signature</p>
                {rc.brokerSignedAt ? (
                  <div>
                    <p className="text-brand-400 italic text-base font-semibold mb-1">{rc.brokerSignature}</p>
                    <p className="text-dark-400 text-xs mb-2">{formatDateTime(rc.brokerSignedAt)}</p>
                    <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                      <CheckCircle size={10} /> Signed
                    </span>
                  </div>
                ) : (
                  <div className="border-b border-dark-400/40 pb-2 mt-6">
                    <p className="text-dark-500 text-xs">Signature</p>
                  </div>
                )}
              </div>

              {/* Carrier Signature */}
              <div className="glass-light rounded-xl p-4">
                <p className="text-dark-400 text-xs font-bold uppercase tracking-wider mb-3">Carrier Signature</p>
                {(rc.carrierSignedAt || signed) ? (
                  <div>
                    <p className="text-brand-400 italic text-base font-semibold mb-1">
                      {signed ? sigInput : rc.carrierSignature}
                    </p>
                    <p className="text-dark-400 text-xs mb-2">
                      {signed ? formatDateTime(new Date().toISOString()) : formatDateTime(rc.carrierSignedAt)}
                    </p>
                    <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                      <CheckCircle size={10} /> Signed
                    </span>
                  </div>
                ) : isPendingCarrier && role === 'carrier' ? (
                  <div className="space-y-2">
                    <p className="text-dark-400 text-xs">By signing, you agree to the terms and rates above.</p>
                    <input
                      className="input text-sm w-full"
                      placeholder="Type your full legal name to sign"
                      value={sigInput}
                      onChange={e => setSigInput(e.target.value)}
                    />
                    <button
                      onClick={handleSign}
                      disabled={!sigInput.trim()}
                      className="btn-primary text-sm w-full disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Sign Rate Confirmation
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center h-full">
                    <p className="text-dark-500 text-xs italic">Awaiting carrier signature...</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Success message */}
          {signed && (
            <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-brand-400 flex-shrink-0" />
              <p className="text-brand-400 text-sm font-medium">Rate Confirmation signed successfully. This window will close shortly.</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-400/30 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">
            Close
          </button>
          {role === 'carrier' && isPendingCarrier && (
            <button
              onClick={handleSign}
              disabled={!sigInput.trim()}
              className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sign
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
