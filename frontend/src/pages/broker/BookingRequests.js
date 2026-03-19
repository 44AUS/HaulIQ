import React, { useState } from 'react';
import { Check, X, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessaging } from '../../context/MessagingContext';
import { LOADS, MOCK_CARRIERS } from '../../data/sampleData';

export default function BookingRequests() {
  useAuth();
  const { bookings, bids, reviewBooking, respondBid } = useMessaging();
  const [activeTab, setActiveTab] = useState('bookings');
  const [reviewModal, setReviewModal] = useState(null); // { type: 'booking'|'bid', item }
  const [brokerNote, setBrokerNote] = useState('');
  const [counterAmount, setCounterAmount] = useState('');

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const pendingBids = bids.filter(b => b.status === 'pending');

  const getLoad = (loadId) => LOADS.find(l => l.id === loadId);
  const getCarrier = (carrierId) => MOCK_CARRIERS.find(c => c.id === carrierId);

  const handleReviewBooking = (approved) => {
    reviewBooking(reviewModal.item.id, approved, brokerNote);
    setReviewModal(null);
    setBrokerNote('');
  };

  const handleBidAction = (action) => {
    respondBid(reviewModal.item.id, action, parseFloat(counterAmount) || null, brokerNote);
    setReviewModal(null);
    setBrokerNote('');
    setCounterAmount('');
  };

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
          { key: 'bids', label: `Bids / Offers (${pendingBids.length})` },
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
          {pendingBookings.length === 0 ? (
            <div className="glass rounded-xl border border-dark-400/40 p-10 text-center">
              <Clock size={32} className="text-dark-500 mx-auto mb-3" />
              <p className="text-dark-300">No pending booking requests</p>
            </div>
          ) : pendingBookings.map(booking => {
            const load = getLoad(booking.loadId);
            const carrier = getCarrier(booking.carrierId);
            return (
              <div key={booking.id} className="glass rounded-xl border border-dark-400/40 p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-semibold">{load ? `${load.origin} → ${load.dest}` : booking.loadId}</p>
                    <span className="text-dark-500 text-xs">·</span>
                    {carrier ? (
                      <Link to={`/carrier-profile/${carrier.id}`} className="text-brand-400 hover:text-brand-300 text-sm font-medium flex items-center gap-1 transition-colors">
                        {carrier.name} <ExternalLink size={11} />
                      </Link>
                    ) : <span className="text-dark-400 text-sm">Unknown Carrier</span>}
                  </div>
                  <p className="text-dark-300 text-sm">{load?.type} · {load ? `$${load.rate.toLocaleString()}` : ''} · {load?.miles} mi</p>
                  {booking.note && <p className="text-dark-400 text-xs mt-1 italic">"{booking.note}"</p>}
                  <p className="text-dark-500 text-xs mt-1">{new Date(booking.createdAt).toLocaleString()}</p>
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
        <div className="space-y-3">
          {pendingBids.length === 0 ? (
            <div className="glass rounded-xl border border-dark-400/40 p-10 text-center">
              <DollarSign size={32} className="text-dark-500 mx-auto mb-3" />
              <p className="text-dark-300">No pending bids</p>
            </div>
          ) : pendingBids.map(bid => {
            const load = getLoad(bid.loadId);
            const carrier = getCarrier(bid.carrierId);
            return (
              <div key={bid.id} className="glass rounded-xl border border-dark-400/40 p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-semibold">{load ? `${load.origin} → ${load.dest}` : bid.loadId}</p>
                    <span className="text-dark-500 text-xs">·</span>
                    {carrier ? (
                      <Link to={`/carrier-profile/${carrier.id}`} className="text-brand-400 hover:text-brand-300 text-sm font-medium flex items-center gap-1 transition-colors">
                        {carrier.name} <ExternalLink size={11} />
                      </Link>
                    ) : <span className="text-dark-400 text-sm">Unknown Carrier</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-dark-300 text-sm">Listed: <span className="text-white">${load?.rate.toLocaleString()}</span></span>
                    <span className="text-dark-400">→</span>
                    <span className="text-dark-300 text-sm">Bid: <span className="text-brand-400 font-bold">${bid.amount.toLocaleString()}</span></span>
                    {load && <span className={`text-xs ${bid.amount >= load.rate ? 'text-brand-400' : 'text-yellow-400'}`}>
                      ({bid.amount >= load.rate ? '+' : ''}{((bid.amount - load.rate) / load.rate * 100).toFixed(1)}%)
                    </span>}
                  </div>
                  {bid.note && <p className="text-dark-400 text-xs mt-1 italic">"{bid.note}"</p>}
                  <p className="text-dark-500 text-xs mt-1">{new Date(bid.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={bid.status} />
                  <button onClick={() => { setReviewModal({ type: 'bid', item: bid }); setCounterAmount(String(bid.amount)); }}
                    className="btn-secondary text-sm px-4 py-2">Review</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass border border-dark-400/40 rounded-2xl p-8 max-w-md w-full">
            {reviewModal.type === 'booking' ? (
              <>
                <h3 className="text-white font-bold text-lg mb-1">Review Booking Request</h3>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-dark-300 text-sm">
                    {(() => { const load = getLoad(reviewModal.item.loadId); return load ? `${load.origin} → ${load.dest}` : ''; })()}
                  </p>
                  {(() => { const c = getCarrier(reviewModal.item.carrierId); return c ? (
                    <Link to={`/carrier-profile/${c.id}`} onClick={() => setReviewModal(null)}
                      className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors">
                      {c.name}'s profile <ExternalLink size={10} />
                    </Link>
                  ) : null; })()}
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
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-bold text-lg">Review Bid</h3>
                  {(() => { const c = getCarrier(reviewModal.item.carrierId); return c ? (
                    <Link to={`/carrier-profile/${c.id}`} onClick={() => setReviewModal(null)}
                      className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors">
                      {c.name}'s profile <ExternalLink size={10} />
                    </Link>
                  ) : null; })()}
                </div>
                <div className="flex gap-4 mb-5 mt-3">
                  <div className="bg-dark-700/50 rounded-lg p-3 flex-1 text-center">
                    <p className="text-dark-400 text-xs mb-1">Listed Rate</p>
                    <p className="text-white font-bold">${getLoad(reviewModal.item.loadId)?.rate.toLocaleString()}</p>
                  </div>
                  <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-3 flex-1 text-center">
                    <p className="text-dark-400 text-xs mb-1">Carrier Bid</p>
                    <p className="text-brand-400 font-bold">${reviewModal.item.amount.toLocaleString()}</p>
                  </div>
                </div>
                {reviewModal.item.note && (
                  <div className="bg-dark-700/50 rounded-lg p-3 mb-4">
                    <p className="text-dark-300 text-xs">Carrier note:</p>
                    <p className="text-white text-sm mt-0.5">"{reviewModal.item.note}"</p>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-dark-100 text-sm font-medium mb-1.5">Counter offer amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">$</span>
                    <input className="input pl-7" type="number" value={counterAmount}
                      onChange={e => setCounterAmount(e.target.value)} placeholder="Enter counter amount" />
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-dark-100 text-sm font-medium mb-1.5">Note to carrier (optional)</label>
                  <textarea className="input resize-none" rows={2} placeholder="Add context to your response..."
                    value={brokerNote} onChange={e => setBrokerNote(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button onClick={() => handleBidAction('rejected')}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1">
                    <X size={13} /> Reject
                  </button>
                  <button onClick={() => handleBidAction('countered')}
                    className="bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 py-2.5 rounded-xl text-xs font-medium transition-all">
                    Counter
                  </button>
                  <button onClick={() => handleBidAction('accepted')}
                    className="bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1">
                    <Check size={13} /> Accept
                  </button>
                </div>
                <button onClick={() => setReviewModal(null)} className="w-full text-center text-dark-400 text-sm hover:text-white transition-colors">Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
