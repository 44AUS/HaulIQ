import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Box, Paper, Typography, List, ListItemButton, ListItemAvatar, ListItemText,
  Avatar, IconButton, TextField, CircularProgress, Button,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NavigationIcon from '@mui/icons-material/Navigation';
import BlockIcon from '@mui/icons-material/Block';
import GppBadIcon from '@mui/icons-material/GppBad';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useAuth } from '../../context/AuthContext';
import { messagesApi, networkApi, locationsApi, blocksApi } from '../../services/api';

function parseSpecial(body) {
  try {
    const obj = JSON.parse(body);
    if (obj.__type) return obj;
  } catch {}
  return null;
}

function UserAvatar({ name, size = 32 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <Avatar sx={{ width: size, height: size, bgcolor: 'primary.dark', fontSize: size < 30 ? 11 : 13, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </Avatar>
  );
}

function LocationRequestCard({ data, isMe, onShare }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        maxWidth: '75%',
        ml: isMe ? 'auto' : 0,
        bgcolor: isMe ? 'primary.dark' : 'background.paper',
        borderColor: isMe ? 'primary.main' : 'divider',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <NavigationIcon sx={{ fontSize: 14, color: 'primary.light' }} />
        <Typography variant="body2" fontWeight={600} color="text.primary">Location Requested</Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        {isMe
          ? 'You asked the carrier to share their location.'
          : 'The broker is asking for your current location.'}
      </Typography>
      {!isMe && (
        <Button
          variant="contained"
          size="small"
          fullWidth
          startIcon={<LocationOnIcon />}
          onClick={() => onShare(data.booking_id)}
          sx={{ fontSize: 11 }}
        >
          Share My Location
        </Button>
      )}
    </Paper>
  );
}

function LocationShareCard({ data, isMe }) {
  const city = data.city || 'Unknown location';
  const name = isMe ? 'You are' : `${data.carrier_name || 'Carrier'} is`;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        maxWidth: '75%',
        ml: isMe ? 'auto' : 0,
        bgcolor: isMe ? 'rgba(46,125,50,0.12)' : 'background.paper',
        borderColor: isMe ? 'success.main' : 'divider',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <LocationOnIcon sx={{ fontSize: 14, color: 'success.main' }} />
        <Typography variant="body2" fontWeight={600} color="text.primary">Location Shared</Typography>
      </Box>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        <Box component="span" color="text.primary" fontWeight={500}>{name} currently near </Box>
        <Box component="span" color="success.main" fontWeight={700}>{city}</Box>
      </Typography>
      {data.lat && data.lng && (
        <Button
          component={Link}
          to={`/map/${data.lat}/${data.lng}/${encodeURIComponent(city)}/${encodeURIComponent(data.carrier_name || 'Carrier')}`}
          variant="contained"
          size="small"
          fullWidth
          startIcon={<LocationOnIcon />}
          color="success"
          sx={{ fontSize: 11 }}
        >
          View Map
        </Button>
      )}
    </Paper>
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
          if (res.conversation_id) setActiveConvoId(res.conversation_id);
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
      .then(msg => { setActiveMessages(prev => [...prev, msg]); setInput(''); })
      .catch(() => {});
  };

  const handleStartDirect = (contact) => {
    setComposing(false);
    setNetworkQuery('');
    const existing = conversations.find(c =>
      (c.carrier_id === contact.user_id || c.broker_id === contact.user_id) && !c.load_id
    );
    if (existing) { setActiveConvoId(existing.id); return; }
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
    <Paper
      variant="outlined"
      sx={{
        height: 'calc(100vh - 140px)',
        display: 'flex',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Conversation list panel */}
      <Box
        sx={{
          width: { xs: '100%', md: 300 },
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          display: { xs: activeConvoId ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column',
        }}
      >
        {/* Panel header */}
        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" fontWeight={700}>Messages</Typography>
          </Box>
          <IconButton size="small" onClick={() => setComposing(true)} title="New Message">
            <EditNoteIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Compose panel */}
        {composing && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1.5, bgcolor: 'action.hover' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" fontWeight={600} sx={{ flex: 1 }}>New Message</Typography>
              <IconButton size="small" onClick={() => { setComposing(false); setNetworkQuery(''); }}>
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            <TextField
              size="small"
              fullWidth
              placeholder="Search your network..."
              value={networkQuery}
              onChange={e => setNetworkQuery(e.target.value)}
              autoFocus
              InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.disabled' }} /> }}
              sx={{ mb: 1, '& .MuiInputBase-input': { fontSize: 12 } }}
            />
            {filteredNetwork.length === 0 ? (
              <Typography variant="caption" color="text.disabled" sx={{ px: 0.5 }}>
                {network.length === 0 ? 'No connections yet.' : 'No matches.'}
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 160, overflowY: 'auto' }}>
                {filteredNetwork.map(contact => (
                  <ListItemButton key={contact.user_id} dense onClick={() => handleStartDirect(contact)} sx={{ borderRadius: 1 }}>
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <UserAvatar name={contact.name} size={28} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="caption" fontWeight={600}>{contact.name}</Typography>}
                      secondary={contact.company ? <Typography variant="caption" color="text.secondary">{contact.company}</Typography> : null}
                    />
                  </ListItemButton>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Conversations list */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress size={24} />
            </Box>
          ) : conversations.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', px: 3, textAlign: 'center' }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">No conversations yet</Typography>
              <Typography variant="caption" color="text.disabled" mt={0.5}>Use the compose button to start one</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {conversations.map(c => {
                const lastMsg = getLastMsg(c);
                const unread = hasUnread(c);
                const label = getConvoLabel(c);
                const otherRole = String(c.carrier_id) === String(user?.id) ? 'broker' : 'carrier';
                const otherId = otherRole === 'broker' ? c.broker_id : c.carrier_id;
                return (
                  <Box
                    key={c.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: 1,
                      borderColor: 'divider',
                      bgcolor: activeConvoId === c.id ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemButton onClick={() => setActiveConvoId(c.id)} sx={{ flex: 1, py: 1.5, pr: 0.5 }}>
                      <ListItemAvatar sx={{ minWidth: 42 }}>
                        <Box
                          component={Link}
                          to={otherRole === 'carrier' ? `/carrier-profile/${otherId}` : `/broker-profile/${otherId}`}
                          onClick={e => e.stopPropagation()}
                        >
                          <UserAvatar name={label} size={32} />
                        </Box>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {unread && <Box sx={{ width: 7, height: 7, bgcolor: 'primary.main', borderRadius: '50%', flexShrink: 0 }} />}
                            {c.is_blocked_by_me && <BlockIcon sx={{ fontSize: 10, color: 'error.main' }} />}
                            <Typography variant="caption" fontWeight={unread ? 700 : 500} noWrap>{label}</Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            {c.load_id && <Typography variant="caption" color="text.disabled" display="block">Load #{c.load_id.slice(0, 8)}</Typography>}
                            {lastMsg && <Typography variant="caption" color="text.secondary" noWrap display="block">{lastMsg.body}</Typography>}
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                      {lastMsg && (
                        <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, ml: 0.5, fontSize: 10 }}>
                          {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      )}
                    </ListItemButton>
                    <IconButton
                      size="small"
                      sx={{
                        mr: 0.5,
                        color: confirmDeleteId === c.id ? 'error.main' : 'text.disabled',
                        bgcolor: confirmDeleteId === c.id ? 'error.dark' : 'transparent',
                        '&:hover': { color: 'error.main' },
                      }}
                      onClick={(e) => handleDeleteConvo(e, c.id)}
                      title={confirmDeleteId === c.id ? 'Click again to confirm' : 'Delete conversation'}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                );
              })}
            </List>
          )}
        </Box>
      </Box>

      {/* Chat area */}
      {activeConvo ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Chat header */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton size="small" onClick={() => setActiveConvoId(null)} sx={{ display: { md: 'none' } }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            {otherParty && (
              <Box component={Link} to={getProfileLink(otherParty)} sx={{ flexShrink: 0 }}>
                <UserAvatar name={otherParty.name} size={32} />
              </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {otherParty ? (
                <Typography
                  component={Link}
                  to={getProfileLink(otherParty)}
                  variant="body2"
                  fontWeight={700}
                  sx={{ textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
                >
                  {otherParty.name}
                </Typography>
              ) : (
                <Typography variant="body2" fontWeight={700}>{getConvoLabel(activeConvo)}</Typography>
              )}
              {activeConvo.load_id && (
                <Typography variant="caption" color="text.secondary" display="block">Load #{activeConvo.load_id.slice(0, 8)}</Typography>
              )}
            </Box>
            {user?.role === 'broker' && activeConvo.active_booking_id && (
              <Button
                component={Link}
                to={`/broker/track/${activeConvo.active_booking_id}`}
                variant="outlined"
                size="small"
                color="success"
                startIcon={<NavigationIcon />}
                sx={{ fontSize: 11, flexShrink: 0 }}
              >
                Locate Load
              </Button>
            )}
            {otherParty && (
              <IconButton
                size="small"
                onClick={() => handleToggleBlock(otherParty.id)}
                disabled={blockLoading}
                title={activeConvo.is_blocked_by_me ? 'Unblock user' : 'Block user'}
                sx={{
                  flexShrink: 0,
                  color: activeConvo.is_blocked_by_me ? 'error.main' : 'text.disabled',
                  '&:hover': { color: 'error.main' },
                }}
              >
                {blockLoading
                  ? <CircularProgress size={14} color="inherit" />
                  : activeConvo.is_blocked_by_me
                    ? <GppBadIcon sx={{ fontSize: 18 }} />
                    : <BlockIcon sx={{ fontSize: 18 }} />
                }
              </IconButton>
            )}
          </Box>

          {/* Blocked notice */}
          {activeConvo.is_blocked_by_me && (
            <Box sx={{ mx: 2, mt: 1.5, px: 2, py: 1, borderRadius: 2, bgcolor: 'error.dark', border: 1, borderColor: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <BlockIcon sx={{ fontSize: 14, color: 'error.light' }} />
              <Typography variant="caption" color="error.light">You have blocked this user. They can no longer message you.</Typography>
            </Box>
          )}

          {/* Messages */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {activeMessages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              const special = parseSpecial(msg.body);
              const senderName = getSenderName(msg.sender_id, activeConvo);

              if (special?.__type === 'location_request') {
                return (
                  <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && <UserAvatar name={senderName} size={26} />}
                    {sharingLocation === special.booking_id
                      ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={13} /><Typography variant="caption" color="text.secondary">Getting your location…</Typography></Box>
                      : <LocationRequestCard data={special} isMe={isMe} onShare={handleShareLocation} />
                    }
                    {isMe && <UserAvatar name={senderName} size={26} />}
                  </Box>
                );
              }

              if (special?.__type === 'location_share') {
                return (
                  <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && <UserAvatar name={senderName} size={26} />}
                    <LocationShareCard data={special} isMe={isMe} />
                    {isMe && <UserAvatar name={senderName} size={26} />}
                  </Box>
                );
              }

              return (
                <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && <UserAvatar name={senderName} size={26} />}
                  <Box
                    sx={{
                      maxWidth: '72%',
                      px: 2,
                      py: 1.25,
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      bgcolor: isMe ? 'primary.main' : 'action.hover',
                    }}
                  >
                    <Typography variant="body2" sx={{ lineHeight: 1.5 }}>{msg.body}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, justifyContent: 'flex-end' }}>
                      <Typography variant="caption" sx={{ fontSize: 10, color: isMe ? 'primary.light' : 'text.disabled' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                      {isMe && (msg.is_read
                        ? <DoneAllIcon sx={{ fontSize: 12, color: 'primary.light' }} />
                        : <DoneIcon sx={{ fontSize: 12, color: 'primary.light', opacity: 0.6 }} />
                      )}
                    </Box>
                  </Box>
                  {isMe && <UserAvatar name={senderName} size={26} />}
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={activeConvo.is_blocked_by_me}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || activeConvo.is_blocked_by_me}
              sx={{ bgcolor: 'primary.main', color: '#fff', borderRadius: 2, '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'action.disabledBackground' } }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary">Select a conversation</Typography>
            <Typography variant="caption" color="text.disabled">or use the compose button to start a new one</Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
