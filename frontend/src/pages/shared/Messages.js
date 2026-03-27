import { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LayoutContext } from '../../components/layout/DashboardLayout';
import {
  Box, Typography, List, ListItemButton, ListItemAvatar, ListItemText,
  Avatar, IconButton, TextField, CircularProgress, Button, Paper,
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
import { messagesApi, networkApi, locationsApi, blocksApi, documentsApi } from '../../services/api';
import DescriptionIcon from '@mui/icons-material/Description';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Chip from '@mui/material/Chip';

function parseSpecial(body) {
  try {
    const obj = JSON.parse(body);
    if (obj.__type) return obj;
  } catch {}
  return null;
}

function getPreview(body) {
  const obj = parseSpecial(body);
  if (!obj) return body;
  if (obj.__type === 'doc_upload') return `📄 Document uploaded: ${obj.file_name}`;
  if (obj.__type === 'location_share') return `📍 Location shared`;
  if (obj.__type === 'location_request') return `📍 Location requested`;
  return body;
}

function UserAvatar({ name, src, size = 32 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <Avatar src={src || undefined} sx={{ width: size, height: size, bgcolor: 'primary.dark', fontSize: size < 30 ? 11 : 13, fontWeight: 700, flexShrink: 0 }}>
      {!src && initials}
    </Avatar>
  );
}

function LocationRequestCard({ data, isMe, onShare }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5, maxWidth: '75%', ml: isMe ? 'auto' : 0,
        bgcolor: isMe ? 'primary.dark' : 'background.paper',
        borderColor: isMe ? 'primary.main' : 'divider', borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <NavigationIcon sx={{ fontSize: 14, color: 'primary.light' }} />
        <Typography variant="body2" fontWeight={600} color="text.primary">Location Requested</Typography>
      </Box>
      <Typography variant="caption" display="block" sx={{ mb: 1.5, color: isMe ? 'rgba(255,255,255,0.75)' : 'text.secondary' }}>
        {isMe ? 'You asked the carrier to share their location.' : 'The broker is asking for your current location.'}
      </Typography>
      {!isMe && (
        <Button variant="contained" size="small" fullWidth startIcon={<LocationOnIcon />} onClick={() => onShare(data.booking_id)} sx={{ fontSize: 11 }}>
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
        p: 1.5, maxWidth: '75%', ml: isMe ? 'auto' : 0,
        bgcolor: isMe ? 'rgba(46,125,50,0.12)' : 'background.paper',
        borderColor: isMe ? 'success.main' : 'divider', borderRadius: 2,
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
          variant="contained" size="small" fullWidth startIcon={<LocationOnIcon />} color="success" sx={{ fontSize: 11 }}
        >
          View Map
        </Button>
      )}
    </Paper>
  );
}

const DOC_TYPE_COLOR = {
  BOL: 'primary', POD: 'success', receipt: 'warning',
  rate_confirmation: 'info', other: 'default',
};

function DocUploadCard({ data, isMe, onView }) {
  const label = (data.doc_type || 'other').replace('_', ' ').toUpperCase();
  return (
    <Paper variant="outlined" sx={{
      p: 1.5, width: 220, ml: isMe ? 'auto' : 0,
      bgcolor: isMe ? 'primary.dark' : 'background.paper',
      borderColor: isMe ? 'primary.main' : 'divider', borderRadius: 2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
        <DescriptionIcon sx={{ fontSize: 14, color: 'primary.light' }} />
        <Typography variant="body2" fontWeight={600} color="text.primary">Document Uploaded</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
        <Chip label={label} size="small" color={DOC_TYPE_COLOR[data.doc_type] || 'default'} sx={{ fontSize: 9, height: 18 }} />
        {data.page_count > 1 && <Typography variant="caption" color="text.secondary">{data.page_count} pages</Typography>}
      </Box>
      <Typography variant="body2" color="text.primary" sx={{ mb: 1, fontWeight: 500 }} noWrap>{data.file_name}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        {data.uploader_name} · {data.uploader_role}
      </Typography>
      <Button variant="contained" size="small" fullWidth startIcon={<DescriptionIcon />} onClick={onView} sx={{ fontSize: 11 }}>
        View Document
      </Button>
    </Paper>
  );
}

function DocViewer({ doc, onClose }) {
  const [page, setPage] = useState(0);
  if (!doc) return null;
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5 }}>
        <Chip label={(doc.doc_type || 'other').replace('_', ' ').toUpperCase()} size="small"
          color={DOC_TYPE_COLOR[doc.doc_type] || 'default'} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }} noWrap>{doc.file_name}</Typography>
        {doc.page_count > 1 && (
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{page + 1} / {doc.page_count}</Typography>
        )}
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative', bgcolor: '#111' }}>
          <Box component="img" src={doc.pages[page]}
            sx={{ width: '100%', display: 'block', maxHeight: '72vh', objectFit: 'contain' }} />
          {doc.page_count > 1 && (
            <Box sx={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1 }}>
              <IconButton size="small" disabled={page === 0} onClick={() => setPage(p => p - 1)}
                sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' }, '&:disabled': { bgcolor: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.3)' } }}>
                <NavigateBeforeIcon />
              </IconButton>
              <IconButton size="small" disabled={page >= doc.page_count - 1} onClick={() => setPage(p => p + 1)}
                sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' }, '&:disabled': { bgcolor: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.3)' } }}>
                <NavigateNextIcon />
              </IconButton>
            </Box>
          )}
        </Box>
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="caption" color="text.secondary">
            Uploaded by <strong>{doc.uploader_name}</strong> ({doc.uploader_role})
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function TypingIndicator() {
  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 1, borderRadius: '16px 16px 16px 4px', bgcolor: 'action.hover', width: 'fit-content' }}>
          {[0, 1, 2].map(i => (
            <Box key={i} sx={{
              width: 7, height: 7, borderRadius: '50%', bgcolor: 'text.secondary',
              animation: 'typingBounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </Box>
      </Box>
    </>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const { drawerWidth } = useContext(LayoutContext);
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [deletingId, setDeletingId] = useState(null);
  const [sharingLocation, setSharingLocation] = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [network, setNetwork] = useState([]);
  const [networkQuery, setNetworkQuery] = useState('');
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [viewerDoc, setViewerDoc] = useState(null);

  const handleShareLocation = (bookingId) => {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    setSharingLocation(bookingId);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await locationsApi.share(bookingId, { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
          if (activeConvoId) messagesApi.conversation(activeConvoId).then(d => setActiveMessages(d.messages || [])).catch(() => {});
          if (res.conversation_id) setActiveConvoId(res.conversation_id);
        } catch (e) { alert('Failed to share location: ' + e.message); }
        finally { setSharingLocation(null); }
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
    } catch (e) { alert(e.message); }
    finally { setBlockLoading(false); }
  };

  useEffect(() => {
    const targetUserId = new URLSearchParams(location.search).get('userId');
    messagesApi.conversations()
      .then(data => {
        const convos = Array.isArray(data) ? data : [];
        setConversations(convos);
        if (targetUserId) {
          const existing = convos.find(c => String(c.carrier_id) === String(targetUserId) || String(c.broker_id) === String(targetUserId));
          if (existing) {
            setActiveConvoId(existing.id);
          } else {
            messagesApi.direct(targetUserId)
              .then(convo => { setConversations(prev => [convo, ...prev]); setActiveConvoId(convo.id); setActiveMessages(convo.messages || []); })
              .catch(() => {});
          }
        }
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [location.search]);

  useEffect(() => {
    if (!composing) return;
    networkApi.list().then(d => setNetwork(Array.isArray(d) ? d : [])).catch(() => setNetwork([]));
  }, [composing]);

  useEffect(() => {
    if (!activeConvoId) return;
    messagesApi.conversation(activeConvoId)
      .then(data => {
        setActiveMessages(data.messages || (Array.isArray(data) ? data : []));
        setConversations(prev => prev.map(c => c.id === activeConvoId ? { ...c, messages: (c.messages || []).map(m => ({ ...m, is_read: true })) } : c));
      })
      .catch(() => setActiveMessages([]));
  }, [activeConvoId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeMessages.length]);

  // Poll for other user typing status
  useEffect(() => {
    if (!activeConvoId) return;
    const poll = setInterval(() => {
      messagesApi.typingStatus(activeConvoId)
        .then(d => setOtherIsTyping(!!d?.is_typing))
        .catch(() => {});
      messagesApi.conversation(activeConvoId)
        .then(data => {
          const incoming = data.messages || (Array.isArray(data) ? data : []);
          setActiveMessages(prev => {
            if (incoming.length !== prev.length) return incoming;
            const changed = incoming.some((m, i) => m.is_read !== prev[i]?.is_read);
            return changed ? incoming : prev;
          });
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(poll);
  }, [activeConvoId]);

  const activeConvo = conversations.find(c => c.id === activeConvoId);

  const getOtherParty = (convo) => {
    if (!convo || !user) return null;
    if (String(convo.carrier_id) === String(user.id)) return { id: convo.broker_id, name: convo.broker_name, role: 'broker', avatar_url: convo.broker_avatar_url };
    return { id: convo.carrier_id, name: convo.carrier_name, role: 'carrier', avatar_url: convo.carrier_avatar_url };
  };
  const getSenderName = (senderId, convo) => {
    if (!convo) return '';
    return String(senderId) === String(convo.carrier_id) ? convo.carrier_name || 'Carrier' : convo.broker_name || 'Broker';
  };
  const getSenderAvatar = (senderId, convo) => {
    if (!convo) return null;
    return String(senderId) === String(convo.carrier_id) ? convo.carrier_avatar_url : convo.broker_avatar_url;
  };
  const getProfileLink = (party) => party?.role === 'carrier' ? `/c/${party.id?.slice(0,8)}` : `/broker-profile/${party.id}`;
  const getConvoLabel = (c) => String(c.carrier_id) === String(user?.id) ? (c.broker_name || `Broker ${String(c.broker_id || '').slice(0, 8)}`) : (c.carrier_name || `Carrier ${String(c.carrier_id || '').slice(0, 8)}`);
  const getLastMsg = (c) => { const msgs = c.messages || []; return msgs[msgs.length - 1] || null; };
  const hasUnread = (c) => (c.messages || []).some(m => m.sender_id !== user?.id && !m.is_read);

  const handleViewDoc = async (data) => {
    try {
      const docs = await documentsApi.list(data.load_id);
      const doc = docs.find(d => String(d.id) === String(data.doc_id));
      if (doc) setViewerDoc(doc);
    } catch {}
  };

  const handleTyping = (convoId) => {
    messagesApi.typing(convoId).catch(() => {});
    clearTimeout(typingTimeoutRef.current);
  };

  const handleSend = () => {
    if (!input.trim() || !activeConvo) return;
    clearTimeout(typingTimeoutRef.current);
    messagesApi.send(activeConvo.load_id || null, user?.role === 'carrier' ? activeConvo.broker_id : activeConvo.carrier_id, input.trim())
      .then(msg => { setActiveMessages(prev => [...prev, msg]); setInput(''); })
      .catch(() => {});
  };

  const handleStartDirect = (contact) => {
    setComposing(false); setNetworkQuery('');
    const existing = conversations.find(c => (c.carrier_id === contact.user_id || c.broker_id === contact.user_id) && !c.load_id);
    if (existing) { setActiveConvoId(existing.id); return; }
    messagesApi.direct(contact.user_id)
      .then(convo => { setConversations(prev => [convo, ...prev]); setActiveConvoId(convo.id); setActiveMessages(convo.messages || []); })
      .catch(() => {});
  };

  const handleDeleteConvo = (e, id) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvoId === id) { setActiveConvoId(null); setActiveMessages([]); }
    setDeletingId(id);
    messagesApi.deleteConvo(id)
      .catch(() => { messagesApi.conversations().then(d => setConversations(Array.isArray(d) ? d : [])).catch(() => {}); })
      .finally(() => setDeletingId(null));
  };

  const filteredNetwork = networkQuery
    ? network.filter(n => n.name.toLowerCase().includes(networkQuery.toLowerCase()) || (n.company || '').toLowerCase().includes(networkQuery.toLowerCase()))
    : network;

  const otherParty = getOtherParty(activeConvo);

  return (
    <>
    <Paper
      variant="outlined"
      sx={{
        position: 'fixed',
        top: { xs: '48px', lg: 0 },
        left: drawerWidth,
        right: 0,
        bottom: 0,
        display: 'flex',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        borderRadius: 0,
        border: 'none',
        zIndex: 1,
      }}
    >
      {/* ── Conversation list panel ── */}
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
        {/* Header */}
        <Box sx={{ px: 2, py: 1.75, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
          <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>Message Center</Typography>
        </Box>

        {/* New Message button */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Button
            fullWidth variant="contained" size="small" startIcon={<EditNoteIcon />}
            onClick={() => setComposing(v => !v)}
            sx={{ fontWeight: 700, letterSpacing: 0.5, fontSize: '0.78rem' }}
          >
            New Message
          </Button>
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
              size="small" fullWidth placeholder="Search your network..." value={networkQuery}
              onChange={e => setNetworkQuery(e.target.value)} autoFocus
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
                    <ListItemAvatar sx={{ minWidth: 36 }}><UserAvatar name={contact.name} src={contact.avatar_url} size={28} /></ListItemAvatar>
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
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>Use New Message to start one</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {conversations.map(c => {
                const lastMsg = getLastMsg(c);
                const unread = hasUnread(c);
                const label = getConvoLabel(c);
                const otherRole = String(c.carrier_id) === String(user?.id) ? 'broker' : 'carrier';
                const otherId = otherRole === 'broker' ? c.broker_id : c.carrier_id;
                const otherAvatar = otherRole === 'broker' ? c.broker_avatar_url : c.carrier_avatar_url;
                return (
                  <Box
                    key={c.id}
                    sx={{
                      display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider',
                      bgcolor: activeConvoId === c.id ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemButton onClick={() => setActiveConvoId(c.id)} sx={{ flex: 1, py: 1.5, pr: 0.5 }}>
                      <ListItemAvatar sx={{ minWidth: 42 }}>
                        <Box component={Link} to={otherRole === 'carrier' ? `/c/${otherId?.slice(0,8)}` : `/broker-profile/${otherId}`} onClick={e => e.stopPropagation()}>
                          <UserAvatar name={label} src={otherAvatar} size={34} />
                        </Box>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {unread && <Box sx={{ width: 7, height: 7, bgcolor: 'primary.main', borderRadius: '50%', flexShrink: 0 }} />}
                            {c.is_blocked_by_me && <BlockIcon sx={{ fontSize: 10, color: 'error.main' }} />}
                            <Typography variant="body2" fontWeight={unread ? 700 : 500} noWrap color="text.primary">{label}</Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            {c.load_id && <Typography variant="caption" color="text.disabled" display="block" noWrap>Load #{c.load_id.slice(0, 8)}</Typography>}
                            {lastMsg && <Typography variant="caption" color="text.secondary" display="block" noWrap>{getPreview(lastMsg.body)}</Typography>}
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
                  </Box>
                );
              })}
            </List>
          )}
        </Box>
      </Box>

      {/* ── Chat area ── */}
      {activeConvo ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Chat header */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton size="small" onClick={() => setActiveConvoId(null)} sx={{ display: { md: 'none' } }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            {otherParty && (
              <Box component={Link} to={getProfileLink(otherParty)} sx={{ flexShrink: 0 }}>
                <UserAvatar name={otherParty.name} src={otherParty.avatar_url} size={34} />
              </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {otherParty ? (
                <Typography component={Link} to={getProfileLink(otherParty)} variant="body2" fontWeight={700}
                  sx={{ textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' } }}>
                  {otherParty.name}
                </Typography>
              ) : (
                <Typography variant="body2" fontWeight={700}>{getConvoLabel(activeConvo)}</Typography>
              )}
              {activeConvo.load_id && <Typography variant="caption" color="text.secondary" display="block">Load #{activeConvo.load_id.slice(0, 8)}</Typography>}
            </Box>
            {user?.role === 'broker' && activeConvo.active_booking_id && (
              <Button component={Link} to={`/broker/track/${activeConvo.active_booking_id}`}
                variant="outlined" size="small" color="success" startIcon={<NavigationIcon />} sx={{ fontSize: 11, flexShrink: 0 }}>
                Locate Load
              </Button>
            )}
            <IconButton
              size="small" disabled={deletingId === activeConvoId}
              title="Delete conversation"
              sx={{ flexShrink: 0, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
              onClick={(e) => handleDeleteConvo(e, activeConvoId)}
            >
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
            {otherParty && (
              <IconButton size="small" onClick={() => handleToggleBlock(otherParty.id)} disabled={blockLoading}
                title={activeConvo.is_blocked_by_me ? 'Unblock user' : 'Block user'}
                sx={{ flexShrink: 0, color: activeConvo.is_blocked_by_me ? 'error.main' : 'text.disabled', '&:hover': { color: 'error.main' } }}>
                {blockLoading ? <CircularProgress size={14} color="inherit" /> : activeConvo.is_blocked_by_me ? <GppBadIcon sx={{ fontSize: 18 }} /> : <BlockIcon sx={{ fontSize: 18 }} />}
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
              const senderAvatar = getSenderAvatar(msg.sender_id, activeConvo);

              if (special?.__type === 'location_request') return (
                <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && <UserAvatar name={senderName} src={senderAvatar} size={26} />}
                  {sharingLocation === special.booking_id
                    ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={13} /><Typography variant="caption" color="text.secondary">Getting your location…</Typography></Box>
                    : <LocationRequestCard data={special} isMe={isMe} onShare={handleShareLocation} />
                  }
                  {isMe && <UserAvatar name={senderName} src={senderAvatar} size={26} />}
                </Box>
              );

              if (special?.__type === 'doc_upload') return (
                <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && <UserAvatar name={senderName} src={senderAvatar} size={26} />}
                  <DocUploadCard data={special} isMe={isMe} onView={() => handleViewDoc(special)} />
                  {isMe && <UserAvatar name={senderName} src={senderAvatar} size={26} />}
                </Box>
              );

              if (special?.__type === 'location_share') return (
                <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && <UserAvatar name={senderName} src={senderAvatar} size={26} />}
                  <LocationShareCard data={special} isMe={isMe} />
                  {isMe && <UserAvatar name={senderName} src={senderAvatar} size={26} />}
                </Box>
              );

              return (
                <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && <UserAvatar name={senderName} src={senderAvatar} size={26} />}
                  <Box sx={{ maxWidth: '72%', px: 2, py: 1.25, borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', bgcolor: isMe ? 'primary.main' : 'action.hover' }}>
                    <Typography variant="body2" sx={{ lineHeight: 1.5, color: isMe ? '#fff' : 'text.primary' }}>{msg.body}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, justifyContent: 'flex-end' }}>
                      <Typography variant="caption" sx={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : 'text.disabled' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                      {isMe && (msg.is_read ? <DoneAllIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }} /> : <DoneIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }} />)}
                    </Box>
                  </Box>
                  {isMe && <UserAvatar name={senderName} src={senderAvatar} size={26} />}
                </Box>
              );
            })}
            {otherIsTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
            <TextField
              fullWidth size="small" placeholder="Type a message..." value={input}
              onChange={e => { setInput(e.target.value); if (activeConvoId) handleTyping(activeConvoId); }}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={activeConvo.is_blocked_by_me}
            />
            <IconButton color="primary" onClick={handleSend} disabled={!input.trim() || activeConvo.is_blocked_by_me}
              sx={{ bgcolor: 'primary.main', color: '#fff', borderRadius: 2, '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'action.disabledBackground' } }}>
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary">Select a conversation</Typography>
            <Typography variant="caption" color="text.disabled">or use New Message to start one</Typography>
          </Box>
        </Box>
      )}
    </Paper>
    {viewerDoc && <DocViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />}
    </>
  );
}
