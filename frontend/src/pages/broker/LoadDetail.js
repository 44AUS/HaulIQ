import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, Calendar, Package, Weight, DollarSign, Eye, Users, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { loadsApi, bidsApi } from '../../services/api';
import { adaptLoad } from '../../services/adapters';

const RouteMap = lazy(() => import('../../components/shared/RouteMap'));

const BID_STATUS_CFG = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  accepted:  { label: 'Accepted',  cls: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  rejected:  { label: 'Rejected',  cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  countered: { label: 'Countered', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  withdrawn: { label: 'Withdrawn', cls: 'bg-dark-600 text-dark-400 border-dark-400/20' },
};

export default function BrokerLoadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [load, setLoad] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      loadsApi.get(id).then(adaptLoad),
      bidsApi.forLoad(id).catch(() => []),
    ])
      .then(([l, b]) => { setLoad(l); setBids(Array.isArray(b) ? b : []); })
      .catch(() => setError('Load not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAcceptBid = (bidId) => {
    setActionLoading(bidId);
    bidsApi.accept(bidId)
      .then(() => setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'accepted' } : b)))
      .catch(err => alert(err.message))
      .finally(() => setActionLoading(null));
  };

  const handleRejectBid = (bidId) => {
    setActionLoading(bidId + '_reject');
    bidsApi.reject(bidId)
      .then(() => setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'rejected' } : b)))
      .catch(err => alert(err.message))
      .finally(() => setActionLoading(null));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  if (error || !load) return (
    <div className="glass rounded-xl border border-red-500/20 p-12 text-center">
      <p className="text-red-400">{error || 'Load not found'}</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4 text-sm">Go back</button>
    </div>
  );

  const pendingBids = bids.filter(b => b.status === 'pending');

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back nav */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-300 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Manage Loads
      </button>

      {/* Load header */}
      <div className="glass rounded-xl border border-dark-400/40 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div>
            <p className="text-dark-400 text-xs mb-1">Load #{load.id.slice(0, 8)}</p>
            <h1 className="text-white text-xl font-bold">{load.origin} → {load.dest}</h1>
            <p className="text-dark-300 text-sm mt-0.5">{load.type} · {load.miles} miles</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${
            load.status === 'active' ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' :
            load.status === 'filled' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>{load.status}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div className="bg-dark-700/50 rounded-lg p-3 text-center">
            <p className="text-dark-400 text-xs mb-1 flex items-center justify-center gap-1"><DollarSign size={10} />Rate</p>
            <p className="text-white font-bold">${(load.rate || 0).toLocaleString()}</p>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-3 text-center">
            <p className="text-dark-400 text-xs mb-1">Per Mile</p>
            <p className="text-white font-bold">${(load.ratePerMile || 0).toFixed(2)}</p>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-3 text-center">
            <p className="text-dark-400 text-xs mb-1 flex items-center justify-center gap-1"><Eye size={10} />Views</p>
            <p className="text-white font-bold">{load.viewCount || 0}</p>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-3 text-center">
            <p className="text-dark-400 text-xs mb-1 flex items-center justify-center gap-1"><Users size={10} />Bids</p>
            <p className="text-white font-bold">{bids.length}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-dark-300">
              <MapPin size={13} className="text-brand-400 flex-shrink-0" />
              <span>Origin: <span className="text-white">{load.origin}</span></span>
            </div>
            <div className="flex items-center gap-2 text-dark-300">
              <MapPin size={13} className="text-dark-400 flex-shrink-0" />
              <span>Dest: <span className="text-white">{load.dest}</span></span>
            </div>
            <div className="flex items-center gap-2 text-dark-300">
              <Calendar size={13} className="flex-shrink-0" />
              <span>Pickup: <span className="text-white">{load.pickup}</span></span>
            </div>
            <div className="flex items-center gap-2 text-dark-300">
              <Calendar size={13} className="flex-shrink-0" />
              <span>Delivery: <span className="text-white">{load.delivery}</span></span>
            </div>
          </div>
          <div className="space-y-2">
            {load.commodity && (
              <div className="flex items-center gap-2 text-dark-300">
                <Package size={13} className="flex-shrink-0" />
                <span>Commodity: <span className="text-white">{load.commodity}</span></span>
              </div>
            )}
            {load.weight && (
              <div className="flex items-center gap-2 text-dark-300">
                <Weight size={13} className="flex-shrink-0" />
                <span>Weight: <span className="text-white">{load.weight}</span></span>
              </div>
            )}
            <div className="flex items-center gap-2 text-dark-300">
              <Truck size={13} className="flex-shrink-0" />
              <span>Type: <span className="text-white">{load.type}</span></span>
            </div>
          </div>
        </div>

        {load.notes && (
          <div className="mt-4 bg-dark-700/30 rounded-lg px-4 py-3">
            <p className="text-dark-400 text-xs mb-1">Notes</p>
            <p className="text-dark-100 text-sm">{load.notes}</p>
          </div>
        )}

        <div className="mt-5">
          <Suspense fallback={<div className="h-56 rounded-lg bg-dark-700/50 flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div>}>
            <RouteMap origin={load.origin} dest={load.dest} miles={load._raw?.miles} />
          </Suspense>
        </div>
      </div>

      {/* Bids */}
      <div className="glass rounded-xl border border-dark-400/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-brand-400" />
          <h2 className="text-white font-semibold">Bids</h2>
          {pendingBids.length > 0 && (
            <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs px-2 py-0.5 rounded-full">
              {pendingBids.length} pending
            </span>
          )}
        </div>

        {bids.length === 0 ? (
          <p className="text-dark-400 text-sm text-center py-6">No bids yet</p>
        ) : (
          <div className="space-y-3">
            {bids.map(bid => {
              const cfg = BID_STATUS_CFG[bid.status] || BID_STATUS_CFG.pending;
              return (
                <div key={bid.id} className="bg-dark-700/40 rounded-xl p-4 border border-dark-400/20">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/carrier-profile/${bid.carrier_id}`} className="text-white font-semibold text-sm hover:text-brand-400 transition-colors">
                          {bid.carrier_name || 'Carrier'}
                        </Link>
                        {bid.carrier_mc && <span className="text-dark-400 text-xs">MC-{bid.carrier_mc}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                      <p className="text-brand-400 font-bold text-lg">${(bid.amount || 0).toLocaleString()}</p>
                      {bid.note && <p className="text-dark-300 text-xs mt-1 italic">"{bid.note}"</p>}
                      {bid.counter_amount && (
                        <p className="text-blue-400 text-xs mt-1">Counter offer: ${bid.counter_amount.toLocaleString()}{bid.counter_note && ` — ${bid.counter_note}`}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link to={`/broker/messages`} className="p-1.5 text-dark-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors" title="Message carrier">
                        <MessageSquare size={14} />
                      </Link>
                      {bid.status === 'pending' && load.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleAcceptBid(bid.id)}
                            disabled={actionLoading === bid.id}
                            className="flex items-center gap-1 text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} /> Accept
                          </button>
                          <button
                            onClick={() => handleRejectBid(bid.id)}
                            disabled={actionLoading === bid.id + '_reject'}
                            className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
