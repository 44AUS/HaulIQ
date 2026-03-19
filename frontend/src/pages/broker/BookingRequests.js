import React, { useState, useEffect } from 'react';
import { Check, X, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookingsApi, loadsApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';

const StatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    denied: 'bg-red-500/10 text-red-400 border-red-500/20',
    accepted: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    countered: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${map[status] || ''}`}>{status}</span>
  );
};

export default function BookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [loadCache, setLoadCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings');
  const [reviewModal, setReviewModal] = useState(null);
  const [brokerNote, setBrokerNote] = useState('');

  const fetchBookings = () => {
    setLoading(true);
    bookingsApi.pending()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setBookings(list);
        // fetch unique load details
        const uniqueLoadIds = [...new Set(list.map(b => b.load_id).filter(Boolean))];
        Promise.all(uniqueLoadIds.map(lid =>
          loadsApi.get(lid).then(l => ({ id: lid, load: adaptLoad(l) })).catch(() => ({ id: lid, load: null }))
        )).then(results => {
          const cache = {};
          results.forEach(r => { cache[r.id] = r.load; });
          setLoadCache(cache);
        });
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingBookings = bookings.filter(b => b.status === 'pending');

  const handleReviewBooking = (approved) => {
    bookingsApi.review(reviewModal.item.id, { approved, broker_note: brokerNote })
      .then(() => { fetchBookings(); setReviewModal(null); setBrokerNote(''); })
      .catch(err => alert(err.message));
  };

  const getLoad = (loadId) => loadCache[loadId] || null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Booking Requests</h1>
        <p className="text-dark-300 text-sm mt-1">Manage carrier booking requests and bids on your loads</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-dark-400/40 w-fit">
        {[
          { key: 'bookings', label: `Book Now Requests (${pendingBookings.length})` },
          { key: 'bids', label: 'Bids / Offers' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key ? 'bg-dark-600 text-white' : 'text-dark-300 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Bookings tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="glass rounded-xl border border-red-500/20 p-8 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : pendingBookings.length === 0 ? (
            <div className="glass rounded-xl border border-dark-400/40 p-10 text-center">
              <Clock size={32} className="text-dark-500 mx-auto mb-3" />
              <p className="text-dark-300">No pending booking requests</p>
            </div>
          ) : pendingBookings.map(booking => {
            const load = getLoad(booking.load_id);
            return (
              <div key={booking.id} className="glass rounded-xl border border-dark-400/40 p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-semibold">
                      {load ? `${load.origin} → ${load.dest}` : `Load #${String(booking.load_id).slice(0, 8)}`}
                    </p>
                    <span className="text-dark-500 text-xs">·</span>
                    <Link to={`/carrier-profile/${booking.carrier_id}`} className="text-brand-400 hover:text-brand-300 text-sm font-medium flex items-center gap-1 transition-colors">
                      View Carrier <ExternalLink size={11} />
                    </Link>
                  </div>
                  <p className="text-dark-300 text-sm">
                    {load ? `${load.type} · $${load.rate?.toLocaleString()} · ${load.miles} mi` : ''}
                  </p>
                  {booking.note && <p className="text-dark-400 text-xs mt-1 italic">"{booking.note}"</p>}
                  <p className="text-dark-500 text-xs mt-1">{new Date(booking.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={booking.status} />
                  <button onClick={() => setReviewModal({ type: 'booking', item: booking })}
                    className="btn-secondary text-sm px-4 py-2">Review</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bids tab */}
      {activeTab === 'bids' && (
        <div className="glass rounded-xl border border-dark-400/40 p-10 text-center">
          <DollarSign size={32} className="text-dark-500 mx-auto mb-3" />
          <p className="text-dark-300">Bid management coming soon</p>
          <p className="text-dark-500 text-xs mt-1">Carrier bids will appear here once the endpoint is available</p>
        </div>
      )}

      {/* Review modal */}
      {reviewModal && reviewModal.type === 'booking' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass border border-dark-400/40 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-white font-bold text-lg mb-1">Review Booking Request</h3>
            <div className="flex items-center justify-between mb-5">
              <p className="text-dark-300 text-sm">
                {(() => { const load = getLoad(reviewModal.item.load_id); return load ? `${load.origin} → ${load.dest}` : ''; })()}
              </p>
              <Link to={`/carrier-profile/${reviewModal.item.carrier_id}`} onClick={() => setReviewModal(null)}
                className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors">
                Carrier profile <ExternalLink size={10} />
              </Link>
            </div>
            {reviewModal.item.note && (
              <div className="bg-dark-700/50 rounded-lg p-3 mb-5">
                <p className="text-dark-300 text-xs">Carrier note:</p>
                <p className="text-white text-sm mt-0.5">"{reviewModal.item.note}"</p>
              </div>
            )}
            <div className="mb-5">
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Note to carrier (optional)</label>
              <textarea className="input resize-none" rows={2} placeholder="Add a message to the carrier..."
                value={brokerNote} onChange={e => setBrokerNote(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleReviewBooking(false)}
                className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                <X size={15} /> Deny
              </button>
              <button onClick={() => handleReviewBooking(true)}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                <Check size={15} /> Approve
              </button>
            </div>
            <button onClick={() => setReviewModal(null)} className="mt-3 w-full text-center text-dark-400 text-sm hover:text-white transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
