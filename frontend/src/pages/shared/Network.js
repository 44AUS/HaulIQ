import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useAuth } from '../../context/AuthContext';
import { networkApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

function profilePath(entry) {
  return entry.role === 'carrier'
    ? `/c/${(entry.user_id || entry.id)?.slice(0, 8)}`
    : `/b/${(entry.user_id || entry.id)?.slice(0, 8)}`;
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const avatarStyle = (bg = 'var(--ion-color-primary)') => ({
  width: 40, height: 40, borderRadius: '50%', backgroundColor: bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, fontSize: '0.85rem', color: '#fff', flexShrink: 0,
  overflow: 'hidden',
});

function ConnectionRow({ conn, onRemove, userRole }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(profilePath(conn))}
      style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--ion-border-color)', cursor: 'pointer', gap: 12 }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
    >
      <div style={avatarStyle()}>
        {conn.avatar_url ? <img src={conn.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(conn.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conn.name}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {conn.role}{conn.company ? ` · ${conn.company}` : ''}{conn.mc_number ? ` · MC-${conn.mc_number}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <Link to={`/${userRole}/messages?userId=${conn.user_id}`} title="Message" style={{ display: 'flex', padding: 6, color: 'var(--ion-color-medium)', borderRadius: 4 }}>
          <IonIcon name="chatbubble-outline" style={{ fontSize: 16 }} />
        </Link>
        <button title="Remove" onClick={() => onRemove(conn.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 6, display: 'flex', borderRadius: 4 }}>
          <IonIcon name="trash-outline" style={{ fontSize: 16 }} />
        </button>
      </div>
      <IonIcon name="chevron-forward-outline" style={{ fontSize: 17, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
    </div>
  );
}

function PendingRow({ req, onRespond, responding }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--ion-border-color)', gap: 12 }}>
      <Link to={profilePath(req)} style={{ textDecoration: 'none' }}>
        <div style={avatarStyle('#b45309')}>
          {req.avatar_url ? <img src={req.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(req.name)}
        </div>
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.name}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.company || 'Wants to connect with you'}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button title="Accept" onClick={() => onRespond(req.id, true)} disabled={responding === req.id + '_accept'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2dd36f', padding: 6, display: 'flex', borderRadius: 4 }}>
          <IonIcon name="checkmark-outline" style={{ fontSize: 16 }} />
        </button>
        <button title="Ignore" onClick={() => onRespond(req.id, false)} disabled={responding === req.id + '_decline'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 6, display: 'flex', borderRadius: 4 }}>
          <IonIcon name="close-outline" style={{ fontSize: 16 }} />
        </button>
      </div>
      <IonIcon name="chevron-forward-outline" style={{ fontSize: 17, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
    </div>
  );
}

function SuggestRow({ user, onConnect, connecting }) {
  const navigate = useNavigate();
  const status = user.connection_status;
  return (
    <div onClick={() => navigate(profilePath(user))} style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--ion-border-color)', cursor: 'pointer', gap: 12 }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
      <div style={avatarStyle('#374151')}>
        {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(user.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.role}{user.company ? ` · ${user.company}` : ''}{user.mc_number ? ` · MC-${user.mc_number}` : ''}
        </div>
      </div>
      <div style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        {status === 'accepted' ? (
          <span style={{ color: '#2dd36f', border: '1px solid rgba(45,211,111,0.4)', borderRadius: 10, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>Connected</span>
        ) : status === 'pending' ? (
          <span style={{ color: 'var(--ion-color-warning)', border: '1px solid rgba(255,196,9,0.4)', borderRadius: 10, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>Pending</span>
        ) : (
          <button title="Connect" onClick={() => onConnect(user)} disabled={connecting === user.user_id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-primary)', padding: 6, display: 'flex', borderRadius: 4 }}>
            <IonIcon name="person-add-outline" style={{ fontSize: 16 }} />
          </button>
        )}
      </div>
      <IonIcon name="chevron-forward-outline" style={{ fontSize: 17, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
    </div>
  );
}

function SectionHeader({ label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 24px', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-background-color)' }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ion-color-medium)', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ion-color-medium)' }}>{count}</span>
    </div>
  );
}

export default function Network() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'connections';

  const [connections, setConnections] = useState([]);
  const [pending, setPending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [responding, setResponding] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [query, setQuery] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    Promise.all([
      networkApi.list().catch(() => []),
      networkApi.requests().catch(() => []),
      networkApi.suggestions().catch(() => []),
    ]).then(([conns, reqs, suggs]) => {
      setConnections(Array.isArray(conns) ? conns : []);
      setPending(Array.isArray(reqs) ? reqs : []);
      setSuggestions(Array.isArray(suggs) ? suggs : []);
    }).finally(() => setLoading(false));
  }, []);

  const runSearch = useCallback((q) => {
    if (!q) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    networkApi.search(q, null)
      .then(res => setSearchResults(Array.isArray(res) ? res : []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  const handleRespond = (id, accepted) => {
    setResponding(id + (accepted ? '_accept' : '_decline'));
    networkApi.respond(id, accepted)
      .then(() => setPending(prev => prev.filter(r => r.id !== id)))
      .catch(() => {})
      .finally(() => setResponding(null));
  };

  const handleRemove = (id) => {
    networkApi.remove(id).then(() => setConnections(prev => prev.filter(c => c.id !== id))).catch(() => {});
  };

  const handleConnect = (targetUser) => {
    setConnecting(targetUser.user_id);
    networkApi.add(targetUser.user_id)
      .then(() => {
        const patch = list => list.map(u => u.user_id === targetUser.user_id ? { ...u, connection_status: 'pending' } : u);
        setSuggestions(patch);
        setSearchResults(patch);
      })
      .catch(err => alert(err.message || 'Failed to send connection request'))
      .finally(() => setConnecting(null));
  };

  const filteredConnections = query
    ? connections.filter(c => {
        const q = query.toLowerCase();
        return c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.mc_number?.toLowerCase().includes(q);
      })
    : connections;

  const isSearchActive = Boolean(query);
  const rightColumnItems = isSearchActive
    ? searchResults.filter(u => u.connection_status !== 'accepted')
    : suggestions;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 10, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', backgroundColor: 'var(--ion-card-background)', borderRadius: 8, width: '100%', maxWidth: 1200, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ion-text-color)' }}>Network</span>
        </div>

        {/* Search */}
        <div style={{ padding: '0 24px 12px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <IonIcon name="search-outline" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--ion-color-medium)', pointerEvents: 'none' }} />
            <input
              placeholder="Search by name, company, or MC number…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 36px', outline: 'none', fontFamily: 'inherit' }}
            />
            {searching && (
              <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                <IonSpinner name="crescent" style={{ width: 14, height: 14 }} />
              </div>
            )}
            {!searching && query && (
              <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
                <IonIcon name="close-outline" style={{ fontSize: 14 }} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><IonSpinner name="crescent" /></div>
          ) : activeTab === 'connections' ? (
            <>
              {pending.length > 0 && (
                <>
                  <SectionHeader label="PENDING REQUESTS" count={pending.length} />
                  {pending.map(req => <PendingRow key={req.id} req={req} onRespond={handleRespond} responding={responding} />)}
                </>
              )}
              <SectionHeader label="MY CONNECTIONS" count={filteredConnections.length} />
              {filteredConnections.length === 0 ? (
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                    {isSearchActive ? 'No connections match your search' : 'No connections yet'}
                  </span>
                </div>
              ) : (
                filteredConnections.map(conn => <ConnectionRow key={conn.id} conn={conn} onRemove={handleRemove} userRole={user?.role} />)
              )}
            </>
          ) : (
            <>
              <SectionHeader label={isSearchActive ? 'SEARCH RESULTS' : 'SUGGESTED'} count={rightColumnItems.length} />
              {searching ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><IonSpinner name="crescent" style={{ width: 24, height: 24 }} /></div>
              ) : rightColumnItems.length === 0 ? (
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--ion-border-color)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                    {isSearchActive ? 'No results found' : 'No suggestions right now'}
                  </span>
                </div>
              ) : (
                rightColumnItems.map(u => <SuggestRow key={u.user_id} user={u} onConnect={handleConnect} connecting={connecting} />)
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
