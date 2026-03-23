import { useState, useEffect, useCallback } from 'react';
import { Check, X, DollarSign, Clock, ExternalLink, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookingsApi, loadsApi, bidsApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';

const StatusBadge = ({ status }) => {
  const map = {
    pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved:  'bg-brand-500/10 text-brand-400 border-brand-500/20',
    denied:    'bg-red-500/10 text-red-400 border-red-500/20',
    accepted:  'bg-brand-500/10 text-brand-400 border-brand-500/20',
    rejected:  'bg-red-500/10 text-red-400 border-red-500/20',
    countered: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    withdrawn: 'bg-dark-600/50 text-dark-400 border-dark-400/20',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${map[status] || ''}`}>{status}</span>;
};

export default function BookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [bids, setBids] = useState([]);
  const [loadCache, setLoadCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [bidsLoading, setBidsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings');

  // Booking review modal
  const [reviewModal, setReviewModal] = useState(null);
  const [brokerNote, setBrokerNote] = useState('');

  // Bid action modal
  const [bidModal, setBidModal] = useState(null); // { bid, mode: 'counter' | 'confirm_accept' | 'confirm_reject' }
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [bidActing, setBidActing] = useState(false);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    bookingsApi.pending()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setBookings(list);
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
  }, []);

  const fetchBids = useCallback(() => {
    setBidsLoading(true);
    bidsApi.myLoads()
      .then(data => setBids(Array.isArray(data) ? data : []))
      .finally(() => setBidsLoading(false));
  }, []);

  useEffect(() => { fetchBookings(); fetchBids(); }, [fetchBookings, fetchBids]);

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const activeBids = bids.filter(b => b.status !== 'withdrawn');

  const handleReviewBooking = (approved) => {
    bookingsApi.review(reviewModal.item.id, { approved, broker_note: brokerNote })
      .then(() => { fetchBookings(); setReviewModal(null); setBrokerNote(''); })
      .catch(err => alert(err.message));
  };

  const handleBidAction = () => {
    if (!bidModal) return;
    setBidActing(true);
    const { bid, mode } = bidModal;
    let call;
    if (mode === 'accept') call = bidsApi.accept(bid.id);
    else if (mode === 'reject') call = bidsApi.reject(bid.id);
    else call = bidsApi.counter(bid.id, { counter_amount: parseFloat(counterAmount), counter_note: counterNote || null });

    call
      .then(() => { fetchBids(); setBidModal(null); setCounterAmount(''); setCounterNote(''); })
      .catch(err => alert(err.message))
      .finally(() => setBidActing(false));
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
          { key: 'bookings', label: `Book Now (${pendingBookings.length})` },
          { key: 'bids',     label: `Bids / Offers (${activeBids.filter(b => b.status === 'pending').length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key ? 'bg-dark-600 text-white' : 'text-dark-300 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Bookings tab ── */}
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
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-white font-semibold">
                      {load ? `${load.origin} → ${load.dest}` : `Load #${String(booking.load_id).slice(0, 8)}`}
                    </p>
                    <span className="text-dark-500 text-xs">·</span>
                    <span className="text-dark-200 text-sm">{booking.carrier_name || 'Carrier'}{booking.carrier_mc ? ` · MC-${booking.carrier_mc}` : ''}</span>
                    <Link to={`/carrier-profile/${booking.carrier_id}`} className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors">
                      View profile <ExternalLink size={11} />
                    </Link>
                  </div>
                  <p className="text-dark-300 text-sm">{load ? `${load.type} · $${load.rate?.toLocaleString()} · ${load.miles} mi` : ''}</p>
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

      {/* ── Bids tab ── */}
      {activeTab === 'bids' && (
        <div className="space-y-3">
          {bidsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : activeBids.length === 0 ? (
            <div className="glass rounded-xl border border-dark-400/40 p-10 text-center">
              <DollarSign size={32} className="text-dark-500 mx-auto mb-3" />
              <p className="text-dark-300">No bids yet</p>
            </div>
          ) : activeBids.map(bid => {
            const diff = bid.load_rate ? ((bid.amount - bid.load_rate) / bid.load_rate * 100) : null;
            const isAbove = diff >= 0;
            return (
              <div key={bid.id} className="glass rounded-xl border border-dark-400/40 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-white font-semibold text-sm">
                        {bid.load_origin && bid.load_dest ? `${bid.load_origin} → ${bid.load_dest}` : `Load #${String(bid.load_id).slice(0, 8)}`}
                      </p>
                      <StatusBadge status={bid.status} />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-brand-400 font-bold text-lg">${bid.amount.toLocaleString()}</p>
                      {bid.load_rate && (
                        <span className={`text-xs flex items-center gap-1 ${isAbove ? 'text-brand-400' : 'text-yellow-400'}`}>
                          {isAbove ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {isAbove ? '+' : ''}{diff.toFixed(1)}% vs ${bid.load_rate.toLocaleString()} listed
                        </span>
                      )}
                    </div>
                    <p className="text-dark-300 text-xs mt-0.5">
                      {bid.carrier_name || 'Carrier'}{bid.carrier_mc ? ` · MC-${bid.carrier_mc}` : ''}
                    </p>
                    {bid.note && <p className="text-dark-400 text-xs mt-1 italic">"{bid.note}"</p>}
                    {bid.counter_amount && (
                      <p className="text-blue-400 text-xs mt-1">
                        Your counter: <span className="font-semibold">${bid.counter_amount.toLocaleString()}</span>
                        {bid.counter_note && ` — ${bid.counter_note}`}
                      </p>
                    )}
                  </div>
                  {bid.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setBidModal({ bid, mode: 'counter' }); setCounterAmount(String(bid.load_rate || '')); }}
                        className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors">
                        <RefreshCw size={11} /> Counter
                      </button>
                      <button
                        onClick={() => setBidModal({ bid, mode: 'accept' })}
                        className="flex items-center gap-1 text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 px-3 py-1.5 rounded-lg transition-colors">
                        <Check size={11} /> Accept
                      </button>
                      <button
                        onClick={() => setBidModal({ bid, mode: 'reject' })}
                        className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
                        <X size={11} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Booking review modal ── */}
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
              <textarea className="input resize-none" rows={2} placeholder="Add a message..."
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

      {/* ── Bid action modal ── */}
      {bidModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass border border-dark-400/40 rounded-2xl p-8 max-w-md w-full">
            {bidModal.mode === 'counter' ? (
              <>
                <h3 className="text-white font-bold text-lg mb-1">Counter Offer</h3>
                <p className="text-dark-300 text-sm mb-5">
                  Carrier bid <span className="text-white font-semibold">${bidModal.bid.amount.toLocaleString()}</span>
                  {bidModal.bid.load_rate && <> · Listed at <span className="text-white font-semibold">${bidModal.bid.load_rate.toLocaleString()}</span></>}
                </p>
                <div className="mb-4">
                  <label className="block text-dark-100 text-sm font-medium mb-1.5">Your counter amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">$</span>
                    <input className="input pl-7" type="number" value={counterAmount}
                      onChange={e => setCounterAmount(e.target.value)} autoFocus />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-dark-100 text-sm font-medium mb-1.5">Note to carrier (optional)</label>
                  <textarea className="input resize-none text-sm" rows={2}
                    value={counterNote} onChange={e => setCounterNote(e.target.value)}
                    placeholder="Explain your counter offer..." />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setBidModal(null)} className="flex-1 btn-secondary py-2.5 text-sm">Cancel</button>
                  <button onClick={handleBidAction} disabled={!counterAmount || bidActing}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    {bidActing ? 'Sending…' : 'Send Counter'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-white font-bold text-lg mb-2">
                  {bidModal.mode === 'accept' ? 'Accept Bid?' : 'Reject Bid?'}
                </h3>
                <p className="text-dark-300 text-sm mb-6">
                  {bidModal.mode === 'accept'
                    ? <>Accept <span className="text-brand-400 font-semibold">${bidModal.bid.amount.toLocaleString()}</span> from {bidModal.bid.carrier_name || 'this carrier'}?</>
                    : <>Reject <span className="text-white font-semibold">${bidModal.bid.amount.toLocaleString()}</span> from {bidModal.bid.carrier_name || 'this carrier'}?</>
                  }
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setBidModal(null)} className="flex-1 btn-secondary py-2.5 text-sm">Cancel</button>
                  <button onClick={handleBidAction} disabled={bidActing}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                      bidModal.mode === 'accept'
                        ? 'bg-brand-500 hover:bg-brand-600 text-white'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                    }`}>
                    {bidActing ? 'Processing…' : bidModal.mode === 'accept' ? <><Check size={14} /> Accept</> : <><X size={14} /> Reject</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
