import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, MessageSquare, Bookmark, BookmarkCheck, AlertTriangle, Zap, CalendarCheck, DollarSign, Send, X, CheckCircle, Clock } from 'lucide-react';
import { LOADS } from '../../data/sampleData';
import ProfitBadge from '../../components/shared/ProfitBadge';
import BrokerRating from '../../components/shared/BrokerRating';
import { useAuth } from '../../context/AuthContext';
import { useMessaging } from '../../context/MessagingContext';

export default function LoadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendMessage, placeBid, requestBooking } = useMessaging();
  const load = LOADS.find(l => l.id === id);
  const [saved, setSaved] = useState(load?.saved || false);

  // Action state
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidNote, setBidNote] = useState('');
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null); // null | 'pending' | 'instant_booked'

  if (!load) return (
    <div className="text-center py-20">
      <p className="text-dark-300">Load not found.</p>
      <Link to="/carrier/loads" className="text-brand-400 mt-2 inline-block">Back to Load Board</Link>
    </div>
  );

  const fuelCostEst = load.fuel;
  const deadheadCost = Math.round(load.deadhead * 0.62);
  const grossRevenue = load.rate;
  const expenses = fuelCostEst + deadheadCost + 120;
  const netProfit = grossRevenue - expenses;

  const handleInstantBook = () => {
    requestBooking(load.id, '', true, user);
    setBookingStatus('instant_booked');
  };

  const handleBookNow = () => {
    requestBooking(load.id, '', false, user);
    setBookingStatus('pending');
  };

  const handlePlaceBid = () => {
    if (!bidAmount || isNaN(parseFloat(bidAmount))) return;
    placeBid(load.id, parseFloat(bidAmount), bidNote, user);
    setBidModalOpen(false);
    setBidAmount('');
    setBidNote('');
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessage(
      load.id,
      load.broker.id,
      load.broker.name,
      `${load.origin} → ${load.dest}`,
      messageText.trim(),
      user
    );
    setMessageText('');
    setMessageOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-dark-300 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Load Board
      </button>

      {/* Load header */}
      <div className="glass rounded-xl p-6 border border-dark-400/40">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {load.hot && <span className="badge-red flex items-center gap-1">🔥 Hot Load</span>}
              {load.instantBook && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Zap size={10} /> Instant Book</span>}
              <span className="badge-blue flex items-center gap-1"><Truck size={10} />{load.type}</span>
              <span className="text-dark-300 text-xs">{load.posted}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{load.origin} → {load.dest}</h1>
            <p className="text-dark-300 text-sm mt-1">{load.commodity} · {load.weight} · {load.miles} loaded miles</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSaved(!saved)}
              className={`p-2.5 rounded-lg border transition-all ${saved ? 'border-brand-500/40 bg-brand-500/10 text-brand-400' : 'border-dark-400/40 text-dark-300 hover:text-white hover:border-dark-300'}`}>
              {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Route details */}
          <div className="glass rounded-xl p-6 border border-dark-400/40">
            <h2 className="text-white font-semibold mb-4">Route Details</h2>
            <div className="space-y-4">
              {[
                { label: 'Pickup', value: load.origin, sub: load.pickup, icon: MapPin, color: 'text-brand-400' },
                { label: 'Delivery', value: load.dest, sub: load.delivery, icon: MapPin, color: 'text-red-400' },
              ].map(({ label, value, sub, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0`}>
                    <Icon size={15} className={color} />
                  </div>
                  <div>
                    <p className="text-dark-300 text-xs">{label}</p>
                    <p className="text-white font-medium text-sm">{value}</p>
                    <p className="text-dark-400 text-xs">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-dark-400/30">
              {[
                ['Loaded Miles', `${load.miles} mi`],
                ['Deadhead', `${load.deadhead} mi`],
                ['Dimensions', load.dims],
              ].map(([k, v]) => (
                <div key={k} className="bg-dark-700/50 rounded-lg p-3">
                  <p className="text-dark-300 text-xs">{k}</p>
                  <p className="text-white font-semibold text-sm mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Profit breakdown */}
          <div className="glass rounded-xl p-6 border border-dark-400/40">
            <h2 className="text-white font-semibold mb-4">Profit Breakdown</h2>
            <div className="space-y-3 mb-5">
              {[
                { label: 'Gross Rate', value: `+$${grossRevenue.toLocaleString()}`, cls: 'text-brand-400' },
                { label: `Fuel (~${load.miles} mi)`, value: `-$${fuelCostEst}`, cls: 'text-red-400' },
                { label: `Deadhead (${load.deadhead} mi)`, value: `-$${deadheadCost}`, cls: 'text-red-400' },
                { label: 'Misc / tolls', value: '-$120', cls: 'text-red-400' },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-dark-400/20">
                  <span className="text-dark-200 text-sm">{label}</span>
                  <span className={`font-semibold text-sm ${cls}`}>{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="text-white font-bold">Estimated Net Profit</span>
                <span className={`text-xl font-black ${netProfit > 0 ? 'text-brand-400' : 'text-red-400'}`}>
                  {netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()}
                </span>
              </div>
            </div>
            <ProfitBadge score={load.profitScore} net={netProfit} ratePerMile={load.ratePerMile} size="lg" />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Broker */}
          <div className="glass rounded-xl p-5 border border-dark-400/40">
            <h2 className="text-white font-semibold text-sm mb-3">Broker</h2>
            <BrokerRating broker={load.broker} />
          </div>

          {/* Quick stats */}
          <div className="glass rounded-xl p-5 border border-dark-400/40 space-y-3">
            <h2 className="text-white font-semibold text-sm">Quick Stats</h2>
            {[
              { label: 'Rate', value: `$${load.rate.toLocaleString()}` },
              { label: 'Per Mile', value: `$${load.ratePerMile}` },
              { label: 'Weight', value: load.weight },
              { label: 'Commodity', value: load.commodity },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-dark-300">{label}</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="space-y-2.5">
            {/* Booking success states */}
            {bookingStatus === 'instant_booked' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-emerald-400 font-semibold text-sm">Booked!</p>
                  <p className="text-emerald-300/70 text-xs">This load is now assigned to you.</p>
                </div>
              </div>
            )}

            {bookingStatus === 'pending' && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
                <Clock size={20} className="text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-yellow-400 font-semibold text-sm">Request Sent</p>
                  <p className="text-yellow-300/70 text-xs">Awaiting broker approval.</p>
                </div>
              </div>
            )}

            {!bookingStatus && (
              <>
                {/* Instant Book */}
                {load.instantBook && (
                  <button onClick={handleInstantBook}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/20">
                    <Zap size={16} /> Instant Book
                  </button>
                )}

                {/* Book Now (broker approval) */}
                {load.bookNow && !load.instantBook && (
                  <button onClick={handleBookNow}
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 glow-green">
                    <CalendarCheck size={16} /> Book Now
                  </button>
                )}

                {/* Place Bid */}
                <button onClick={() => setBidModalOpen(true)}
                  className="btn-secondary w-full py-3 flex items-center justify-center gap-2">
                  <DollarSign size={16} /> Place Bid / Counter Offer
                </button>
              </>
            )}

            {/* Message Broker — always visible */}
            {!messageOpen ? (
              <button onClick={() => setMessageOpen(true)}
                className="w-full py-2.5 rounded-xl border border-dark-400/40 text-dark-200 hover:text-white hover:border-dark-300 text-sm flex items-center justify-center gap-2 transition-colors">
                <MessageSquare size={15} /> Message Broker
              </button>
            ) : (
              <div className="glass rounded-xl border border-dark-400/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-medium">Message {load.broker.name}</p>
                  <button onClick={() => setMessageOpen(false)} className="text-dark-400 hover:text-white transition-colors">
                    <X size={15} />
                  </button>
                </div>
                <textarea
                  className="input resize-none text-sm"
                  rows={3}
                  placeholder="Ask about the load, negotiate rate, etc..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                />
                <button onClick={handleSendMessage} disabled={!messageText.trim()}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  <Send size={14} /> Send Message
                </button>
              </div>
            )}
          </div>

          {/* Warning if bad broker */}
          {load.broker.warns > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={15} className="text-red-400" />
                <p className="text-red-400 font-semibold text-sm">Broker Warning</p>
              </div>
              <p className="text-red-300/70 text-xs leading-relaxed">
                This broker has {load.broker.warns} active warning flag{load.broker.warns > 1 ? 's' : ''} from other drivers. Proceed with caution.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bid Modal */}
      {bidModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass border border-dark-400/40 rounded-2xl p-8 max-w-sm w-full">
            <h3 className="text-white font-bold text-lg mb-1">Place a Bid</h3>
            <p className="text-dark-300 text-sm mb-5">{load.origin} → {load.dest} · Listed at <span className="text-white font-semibold">${load.rate.toLocaleString()}</span></p>

            <div className="mb-4">
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Your bid amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">$</span>
                <input
                  className="input pl-7"
                  type="number"
                  placeholder={String(load.rate)}
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  autoFocus
                />
              </div>
              {bidAmount && !isNaN(parseFloat(bidAmount)) && (
                <p className={`text-xs mt-1.5 ${parseFloat(bidAmount) >= load.rate ? 'text-brand-400' : 'text-yellow-400'}`}>
                  {parseFloat(bidAmount) >= load.rate ? '+' : ''}{(((parseFloat(bidAmount) - load.rate) / load.rate) * 100).toFixed(1)}% vs listed rate
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-dark-100 text-sm font-medium mb-1.5">Note (optional)</label>
              <textarea
                className="input resize-none text-sm"
                rows={2}
                placeholder="Tell the broker why they should pick your bid..."
                value={bidNote}
                onChange={e => setBidNote(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setBidModalOpen(false); setBidAmount(''); setBidNote(''); }}
                className="flex-1 btn-secondary py-2.5 text-sm">
                Cancel
              </button>
              <button onClick={handlePlaceBid} disabled={!bidAmount || isNaN(parseFloat(bidAmount))}
                className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                Submit Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
