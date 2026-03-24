import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { MessageSquare, Send, ArrowLeft, Check, CheckCheck, SquarePen, Search, X, Trash2, MapPin, Navigation, Loader, Ban, ShieldOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { messagesApi, networkApi, locationsApi, blocksApi } from '../../services/api';

function parseSpecial(body) {
  try {
    const obj = JSON.parse(body);
    if (obj.__type) return obj;
  } catch {}
  return null;
}

function Avatar({ name, size = 'sm', className = '' }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const dim = size === 'lg' ? 'w-10 h-10 text-sm' : size === 'md' ? 'w-8 h-8 text-xs' : 'w-7 h-7 text-xs';
  return (
    <div className={`${dim} rounded-full bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400 font-bold flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
}

function LocationRequestCard({ data, isMe, onShare }) {
  return (
    <div className={`rounded-xl border p-3.5 max-w-[75%] ${isMe ? 'ml-auto bg-brand-500/10 border-brand-500/30' : 'bg-dark-700/80 border-dark-500/40'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Navigation size={14} className="text-brand-400 flex-shrink-0" />
        <p className="text-white text-sm font-semibold">Location Requested</p>
      </div>
      <p className="text-dark-300 text-xs leading-relaxed mb-3">
        {isMe
          ? `You asked ${data.requester_name ? 'the carrier' : 'them'} to share their location.`
          : `${data.requester_name || 'The broker'} is asking for your current location.`}
      </p>
      {!isMe && (
        <button
          onClick={() => onShare(data.booking_id)}
          className="w-full py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <MapPin size={12} /> Share My Location
        </button>
      )}
    </div>
  );
}

function LocationShareCard({ data, isMe }) {
  const city = data.city || 'Unknown location';
  const name = isMe ? 'You are' : `${data.carrier_name || 'Carrier'} is`;
  return (
    <div className={`rounded-xl border p-3.5 max-w-[75%] ${isMe ? 'ml-auto bg-emerald-500/10 border-emerald-500/30' : 'bg-dark-700/80 border-dark-500/40'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <MapPin size={14} className="text-emerald-400 flex-shrink-0" />
        <p className="text-white text-sm font-semibold">Location Shared</p>
      </div>
      <p className="text-dark-300 text-sm mb-3">
        <span className="text-white font-medium">{name} currently near </span>
        <span className="text-emerald-400 font-bold">{city}</span>
      </p>
      {data.lat && data.lng && (
        <Link
          to={`/map/${data.lat}/${data.lng}/${encodeURIComponent(city)}/${encodeURIComponent(data.carrier_name || 'Carrier')}`}
          className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <MapPin size={12} /> View Map
        </Link>
      )}
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [sharingLocation, setSharingLocation] = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);

  const handleShareLocation = (bookingId) => {
    if (!navigator.geolocation) { alert('Geolocation not supported by your browser.'); return; }
    setSharingLocation(bookingId);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await locationsApi.share(bookingId, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          if (activeConvoId) {
            messagesApi.conversation(activeConvoId)
              .then(data => setActiveMessages(data.messages || (Array.isArray(data) ? data : [])))
              .catch(() => {});
          }
          if (res.conversation_id) {
            setActiveConvoId(res.conversation_id);
          }
        } catch (e) {
          alert('Failed to share location: ' + e.message);
        } finally {
          setSharingLocation(null);
        }
      },
      (err) => { alert('Location access denied: ' + err.message); setSharingLocation(null); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleToggleBlock = async (otherUserId) => {
    if (!otherUserId || blockLoading) return;
    setBlockLoading(true);
    try {
      const convo = conversations.find(c => c.id === activeConvoId);
      if (convo?.is_blocked_by_me) {
        await blocksApi.unblock(otherUserId);
        setConversations(prev => prev.map(c => c.id === activeConvoId ? { ...c, is_blocked_by_me: false } : c));
      } else {
        await blocksApi.block(otherUserId);
        setConversations(prev => prev.map(c => c.id === activeConvoId ? { ...c, is_blocked_by_me: true } : c));
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setBlockLoading(false);
    }
  };

  // New message composer
  const [composing, setComposing] = useState(false);
  const [network, setNetwork] = useState([]);
  const [networkQuery, setNetworkQuery] = useState('');

  useEffect(() => {
    const targetUserId = new URLSearchParams(location.search).get('userId');
    messagesApi.conversations()
      .then(data => {
        const convos = Array.isArray(data) ? data : [];
        setConversations(convos);
        if (targetUserId) {
          const existing = convos.find(c =>
            String(c.carrier_id) === String(targetUserId) || String(c.broker_id) === String(targetUserId)
          );
          if (existing) {
            setActiveConvoId(existing.id);
          } else {
            messagesApi.direct(targetUserId)
              .then(convo => {
                setConversations(prev => [convo, ...prev]);
                setActiveConvoId(convo.id);
                setActiveMessages(convo.messages || []);
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [location.search]);

  useEffect(() => {
    if (!composing) return;
    networkApi.list()
      .then(data => setNetwork(Array.isArray(data) ? data : []))
      .catch(() => setNetwork([]));
  }, [composing]);

  useEffect(() => {
    if (!activeConvoId) return;
    messagesApi.conversation(activeConvoId)
      .then(data => {
        const msgs = data.messages || (Array.isArray(data) ? data : []);
        setActiveMessages(msgs);
        setConversations(prev =>
          prev.map(c => c.id === activeConvoId
            ? { ...c, messages: (c.messages || []).map(m => ({ ...m, is_read: true })) }
            : c
          )
        );
      })
      .catch(() => setActiveMessages([]));
  }, [activeConvoId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const activeConvo = conversations.find(c => c.id === activeConvoId);

  // Derive the other party's info from the active conversation
  const getOtherParty = (convo) => {
    if (!convo || !user) return null;
    if (String(convo.carrier_id) === String(user.id)) {
      return { id: convo.broker_id, name: convo.broker_name, role: 'broker' };
    }
    return { id: convo.carrier_id, name: convo.carrier_name, role: 'carrier' };
  };

  const getSenderName = (senderId, convo) => {
    if (!convo) return '';
    if (String(senderId) === String(convo.carrier_id)) return convo.carrier_name || 'Carrier';
    return convo.broker_name || 'Broker';
  };

  const getProfileLink = (party) => {
    if (!party) return '#';
    return party.role === 'carrier' ? `/carrier-profile/${party.id}` : `/broker-profile/${party.id}`;
  };

  const handleSend = () => {
    if (!input.trim() || !activeConvo) return;
    const loadId = activeConvo.load_id || null;
    const otherPartyId = user?.role === 'carrier' ? activeConvo.broker_id : activeConvo.carrier_id;
    messagesApi.send(loadId, otherPartyId, input.trim())
      .then(msg => {
        setActiveMessages(prev => [...prev, msg]);
        setInput('');
      })
      .catch(() => {});
  };

  const handleStartDirect = (contact) => {
    setComposing(false);
    setNetworkQuery('');
    const existing = conversations.find(c =>
      (c.carrier_id === contact.user_id || c.broker_id === contact.user_id)
      && !c.load_id
    );
    if (existing) {
      setActiveConvoId(existing.id);
      return;
    }
    messagesApi.direct(contact.user_id)
      .then(convo => {
        setConversations(prev => [convo, ...prev]);
        setActiveConvoId(convo.id);
        setActiveMessages(convo.messages || []);
      })
      .catch(() => {});
  };

  const handleDeleteConvo = (e, id) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      messagesApi.deleteConvo(id)
        .then(() => {
          setConversations(prev => prev.filter(c => c.id !== id));
          if (activeConvoId === id) { setActiveConvoId(null); setActiveMessages([]); }
          setConfirmDeleteId(null);
        })
        .catch(() => setConfirmDeleteId(null));
    } else {
      setConfirmDeleteId(id);
    }
  };

  const getConvoLabel = (c) => {
    if (String(c.carrier_id) === String(user?.id)) {
      return c.broker_name || `Broker ${String(c.broker_id || '').slice(0, 8)}`;
    }
    return c.carrier_name || `Carrier ${String(c.carrier_id || '').slice(0, 8)}`;
  };

  const getLastMsg = (c) => {
    const msgs = c.messages || [];
    return msgs[msgs.length - 1] || null;
  };

  const hasUnread = (c) => {
    const msgs = c.messages || [];
    return msgs.some(m => m.sender_id !== user?.id && !m.is_read);
  };

  const filteredNetwork = networkQuery
    ? network.filter(n => n.name.toLowerCase().includes(networkQuery.toLowerCase()) || (n.company || '').toLowerCase().includes(networkQuery.toLowerCase()))
    : network;

  const otherParty = getOtherParty(activeConvo);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0 glass rounded-xl border border-dark-400/40 overflow-hidden">
      {/* Conversation list */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-dark-400/40 flex flex-col ${activeConvoId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-dark-400/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-brand-400" />
              <h2 className="text-white font-semibold">Messages</h2>
            </div>
            <button
              onClick={() => setComposing(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-dark-300 hover:text-white hover:bg-dark-600 transition-colors"
              title="New Message">
              <SquarePen size={16} />
            </button>
          </div>
        </div>

        {/* New message composer */}
        {composing && (
          <div className="border-b border-dark-400/40 p-3 bg-dark-700/30">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-white text-sm font-medium flex-1">New Message</p>
              <button onClick={() => { setComposing(false); setNetworkQuery(''); }}
                className="text-dark-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                className="w-full bg-dark-700 border border-dark-500/40 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50"
                placeholder="Search your network..."
                value={networkQuery}
                onChange={e => setNetworkQuery(e.target.value)}
                autoFocus
              />
            </div>
            {filteredNetwork.length === 0 ? (
              <p className="text-dark-500 text-xs px-1 py-2">
                {network.length === 0 ? 'No connections yet. Add carriers to your network first.' : 'No matches.'}
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {filteredNetwork.map(contact => (
                  <button key={contact.user_id}
                    onClick={() => handleStartDirect(contact)}
                    className="w-full text-left flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-dark-600 transition-colors">
                    <Avatar name={contact.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium truncate">{contact.name}</p>
                      {contact.company && <p className="text-dark-400 text-xs truncate">{contact.company}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <MessageSquare size={32} className="text-dark-500 mb-3" />
              <p className="text-dark-300 text-sm">No conversations yet</p>
              <p className="text-dark-400 text-xs mt-1">Use the compose button to message your network</p>
            </div>
          ) : (
            conversations.map(c => {
              const lastMsg = getLastMsg(c);
              const unread = hasUnread(c);
              const label = getConvoLabel(c);
              const otherRole = String(c.carrier_id) === String(user?.id) ? 'broker' : 'carrier';
              const otherId = otherRole === 'broker' ? c.broker_id : c.carrier_id;
              return (
                <div key={c.id}
                  className={`flex items-center border-b border-dark-400/20 hover:bg-dark-700/50 transition-colors ${activeConvoId === c.id ? 'bg-dark-700/50' : ''}`}>
                  <button onClick={() => setActiveConvoId(c.id)} className="flex-1 text-left p-3 min-w-0">
                    <div className="flex items-start gap-2.5">
                      <Link
                        to={otherRole === 'carrier' ? `/carrier-profile/${otherId}` : `/broker-profile/${otherId}`}
                        onClick={e => e.stopPropagation()}
                        className="flex-shrink-0 mt-0.5"
                      >
                        <Avatar name={label} size="md" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {unread && <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />}
                              {c.is_blocked_by_me && <Ban size={10} className="text-red-400 flex-shrink-0" />}
                              <p className={`text-sm font-medium truncate ${unread ? 'text-white' : 'text-dark-100'}`}>
                                {label}
                              </p>
                            </div>
                            {c.load_id && (
                              <p className="text-dark-500 text-xs">Load #{c.load_id.slice(0, 8)}</p>
                            )}
                            {lastMsg && (
                              <p className="text-dark-300 text-xs truncate mt-0.5">{lastMsg.body}</p>
                            )}
                          </div>
                          <p className="text-dark-500 text-xs flex-shrink-0 mt-0.5">
                            {lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDeleteConvo(e, c.id)}
                    className={`flex-shrink-0 mr-3 p-1.5 rounded transition-colors ${
                      confirmDeleteId === c.id
                        ? 'text-red-400 bg-red-500/10'
                        : 'text-dark-500 hover:text-red-400'
                    }`}
                    title={confirmDeleteId === c.id ? 'Click again to confirm delete' : 'Delete conversation'}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      {activeConvo ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="p-3.5 border-b border-dark-400/40 flex items-center gap-3">
            <button onClick={() => setActiveConvoId(null)} className="md:hidden text-dark-300 hover:text-white">
              <ArrowLeft size={18} />
            </button>
            {otherParty && (
              <Link to={getProfileLink(otherParty)} className="flex-shrink-0">
                <Avatar name={otherParty.name} size="md" />
              </Link>
            )}
            <div className="flex-1 min-w-0">
              {otherParty ? (
                <Link
                  to={getProfileLink(otherParty)}
                  className="text-white font-semibold text-sm hover:text-brand-400 transition-colors"
                >
                  {otherParty.name}
                </Link>
              ) : (
                <p className="text-white font-semibold text-sm">{getConvoLabel(activeConvo)}</p>
              )}
              {activeConvo.load_id && (
                <p className="text-dark-400 text-xs">Load #{activeConvo.load_id.slice(0, 8)}</p>
              )}
            </div>
            {/* Locate Load button — broker only, when carrier has an in-transit booking */}
            {user?.role === 'broker' && activeConvo.active_booking_id && (
              <Link
                to={`/broker/track/${activeConvo.active_booking_id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-colors flex-shrink-0"
              >
                <Navigation size={12} /> Locate Load
              </Link>
            )}
            {/* Block / Unblock button */}
            {otherParty && (
              <button
                onClick={() => handleToggleBlock(otherParty.id)}
                disabled={blockLoading}
                title={activeConvo.is_blocked_by_me ? 'Unblock user' : 'Block user'}
                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                  activeConvo.is_blocked_by_me
                    ? 'text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20'
                    : 'text-dark-400 hover:text-red-400 hover:bg-dark-700'
                }`}
              >
                {blockLoading
                  ? <div className="w-3.5 h-3.5 border border-current/30 border-t-current rounded-full animate-spin" />
                  : activeConvo.is_blocked_by_me
                    ? <ShieldOff size={15} />
                    : <Ban size={15} />
                }
              </button>
            )}
          </div>

          {/* Blocked notice */}
          {activeConvo.is_blocked_by_me && (
            <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20 flex items-center gap-2">
              <Ban size={13} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs">You have blocked this user. They can no longer message you.</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeMessages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              const special = parseSpecial(msg.body);
              const senderName = getSenderName(msg.sender_id, activeConvo);

              if (special?.__type === 'location_request') {
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && <Avatar name={senderName} size="sm" />}
                    {sharingLocation === special.booking_id
                      ? <div className="flex items-center gap-2 text-dark-400 text-xs py-2"><Loader size={13} className="animate-spin" /> Getting your location…</div>
                      : <LocationRequestCard data={special} isMe={isMe} onShare={handleShareLocation} />
                    }
                    {isMe && <Avatar name={senderName} size="sm" />}
                  </div>
                );
              }

              if (special?.__type === 'location_share') {
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && <Avatar name={senderName} size="sm" />}
                    <LocationShareCard data={special} isMe={isMe} />
                    {isMe && <Avatar name={senderName} size="sm" />}
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && <Avatar name={senderName} size="sm" />}
                  <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${
                    isMe ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-dark-700 text-dark-100 rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.body}</p>
                    <p className={`text-xs mt-1 flex items-center gap-1 ${isMe ? 'text-brand-200' : 'text-dark-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && (msg.is_read
                        ? <CheckCheck size={12} className="text-brand-300" />
                        : <Check size={12} className="text-brand-400/60" />
                      )}
                    </p>
                  </div>
                  {isMe && <Avatar name={senderName} size="sm" />}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-dark-400/40">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Type a message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={activeConvo.is_blocked_by_me}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || activeConvo.is_blocked_by_me}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-4 rounded-xl transition-colors flex items-center justify-center">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageSquare size={40} className="text-dark-600 mx-auto mb-3" />
            <p className="text-dark-300 text-sm">Select a conversation</p>
            <p className="text-dark-400 text-xs mt-1">or use the compose button to start a new one</p>
          </div>
        </div>
      )}
    </div>
  );
}
