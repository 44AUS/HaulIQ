import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Check, X, Clock, ExternalLink, Building2, Hash, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { networkApi } from '../../services/api';

export default function Network() {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    Promise.all([
      networkApi.list().catch(() => []),
      networkApi.requests().catch(() => []),
    ]).then(([conns, reqs]) => {
      setConnections(Array.isArray(conns) ? conns : []);
      setPending(Array.isArray(reqs) ? reqs : []);
    }).finally(() => setLoading(false));
  }, []);

  const handleRespond = (id, accepted) => {
    setResponding(id + (accepted ? '_accept' : '_decline'));
    networkApi.respond(id, accepted)
      .then(() => setPending(prev => prev.filter(r => r.id !== id)))
      .catch(() => {})
      .finally(() => setResponding(null));
  };

  const handleRemove = (id) => {
    networkApi.remove(id)
      .then(() => setConnections(prev => prev.filter(c => c.id !== id)))
      .catch(() => {});
  };

  const profilePath = (entry) =>
    entry.role === 'carrier' ? `/carrier-profile/${entry.user_id}` : `/broker-profile/${entry.user_id}`;

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={22} className="text-brand-400" /> My Network
        </h1>
        <p className="text-dark-300 text-sm mt-1">
          {user?.role === 'broker' ? 'Carriers you\'ve connected with' : 'Brokers you\'re connected with'}
        </p>
      </div>

      {/* Pending requests (carrier only — they approve) */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-yellow-400" />
            <h2 className="text-white font-semibold">Pending Requests</h2>
            <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-semibold px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {pending.map(req => (
              <div key={req.id} className="glass rounded-xl border border-yellow-500/20 p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold flex-shrink-0">
                      {req.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{req.name}</p>
                      {req.company && (
                        <p className="text-dark-400 text-xs flex items-center gap-1">
                          <Building2 size={10} /> {req.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link to={profilePath(req)} className="text-brand-400 hover:text-brand-300 transition-colors" title="View profile">
                    <ExternalLink size={14} />
                  </Link>
                </div>
                <p className="text-dark-400 text-xs mb-4 italic">Wants to connect with you</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(req.id, true)}
                    disabled={responding === req.id + '_accept'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 hover:bg-brand-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                    <Check size={12} /> Accept
                  </button>
                  <button
                    onClick={() => handleRespond(req.id, false)}
                    disabled={responding === req.id + '_decline'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                    <X size={12} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Broker pending sent (they can see their outbound pending) */}
      {/* Connections */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Check size={16} className="text-brand-400" />
          <h2 className="text-white font-semibold">Connections</h2>
          <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold px-2 py-0.5 rounded-full">
            {connections.length}
          </span>
        </div>

        {connections.length === 0 ? (
          <div className="glass rounded-xl border border-dark-400/40 p-12 text-center">
            <Users size={36} className="text-dark-500 mx-auto mb-3" />
            <p className="text-dark-300 text-sm font-medium">No connections yet</p>
            <p className="text-dark-500 text-xs mt-1">
              {user?.role === 'broker'
                ? 'Add carriers from their profile page or the Instant Book settings'
                : 'Brokers will appear here after you accept their connection requests'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map(conn => (
              <div key={conn.id} className="glass rounded-xl border border-dark-400/40 p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold flex-shrink-0">
                      {conn.name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{conn.name}</p>
                      <p className="text-dark-400 text-xs capitalize">{conn.role}</p>
                    </div>
                  </div>
                  <Link to={profilePath(conn)} className="text-brand-400 hover:text-brand-300 transition-colors flex-shrink-0" title="View profile">
                    <ExternalLink size={14} />
                  </Link>
                </div>

                <div className="space-y-1.5 text-xs text-dark-300">
                  {conn.company && (
                    <div className="flex items-center gap-2">
                      <Building2 size={11} className="flex-shrink-0 text-dark-500" />
                      <span className="truncate">{conn.company}</span>
                    </div>
                  )}
                  {conn.mc_number && (
                    <div className="flex items-center gap-2">
                      <Hash size={11} className="flex-shrink-0 text-dark-500" />
                      <span>MC-{conn.mc_number}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-dark-400/20">
                  <Link
                    to={profilePath(conn)}
                    className="flex-1 text-center py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 hover:bg-brand-500/20 text-xs font-medium transition-colors">
                    View Profile
                  </Link>
                  <button
                    onClick={() => handleRemove(conn.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-dark-700 border border-dark-400/30 text-dark-400 hover:text-red-400 hover:border-red-500/30 text-xs transition-colors"
                    title="Remove connection">
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
