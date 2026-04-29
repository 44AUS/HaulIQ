import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  IonSpinner, IonModal, IonList, IonItem, IonLabel,
  IonRippleEffect, IonAvatar, IonButton, IonTextarea, IonSearchbar,
  IonReorderGroup, IonReorder, IonProgressBar, IonSegment, IonSegmentButton,
  IonHeader, IonToolbar, IonTitle, IonButtons, IonContent,
} from '@ionic/react';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { useMinimizedChats } from '../../context/MinimizedChatsContext';
import { messagesApi, networkApi, locationsApi, blocksApi, documentsApi, driversApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

function parseSpecial(body) {
  try { const obj = JSON.parse(body); if (obj.__type) return obj; } catch {}
  return null;
}


function UserAvatar({ name, src, size = 32 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <IonAvatar style={{ width: size, height: size, minWidth: size, flexShrink: 0 }}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size < 30 ? 11 : 13, fontWeight: 700, color: '#fff' }}>{initials}</div>
      }
    </IonAvatar>
  );
}

const DOC_TYPE_COLORS = {
  BOL: { bg: 'rgba(21,101,192,0.12)', color: '#1565C0' },
  POD: { bg: 'rgba(45,211,111,0.12)', color: '#2dd36f' },
  receipt: { bg: 'rgba(255,196,9,0.12)', color: '#ffc409' },
  rate_confirmation: { bg: 'rgba(83,177,253,0.12)', color: '#53b1fd' },
  other: { bg: 'rgba(0,0,0,0.07)', color: 'var(--ion-color-medium)' },
};

function LocationRequestCard({ data, isMe, onShare }) {
  return (
    <div style={{ padding: 12, maxWidth: '75%', marginLeft: isMe ? 'auto' : 0, backgroundColor: isMe ? 'var(--ion-color-primary)' : 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <IonIcon name="navigate-outline" style={{ fontSize: 13, color: '#93c5fd' }} />
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isMe ? '#fff' : 'var(--ion-text-color)' }}>Location Requested</span>
      </div>
      <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: isMe ? 'rgba(255,255,255,0.75)' : 'var(--ion-color-medium)' }}>
        {isMe ? 'You asked the carrier to share their location.' : 'The broker is asking for your current location.'}
      </p>
      {!isMe && (
        <IonButton expand="block" size="small" onClick={() => onShare(data.booking_id)}>
          <IonIcon slot="start" name="location-outline" />
          Share My Location
        </IonButton>
      )}
    </div>
  );
}

function LocationShareCard({ data, isMe }) {
  const city = data.city || 'Unknown location';
  const name = isMe ? 'You are' : `${data.carrier_name || 'Carrier'} is`;
  return (
    <div style={{ padding: 12, maxWidth: '75%', marginLeft: isMe ? 'auto' : 0, backgroundColor: isMe ? 'rgba(46,125,50,0.12)' : 'var(--ion-card-background)', border: `1px solid ${isMe ? '#2dd36f' : 'var(--ion-border-color)'}`, borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <IonIcon name="location-outline" style={{ fontSize: 13, color: '#2dd36f' }} />
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>Location Shared</span>
      </div>
      <p style={{ margin: '0 0 10px', fontSize: '0.875rem' }}>
        <span style={{ color: 'var(--ion-text-color)', fontWeight: 500 }}>{name} currently near </span>
        <span style={{ color: '#2dd36f', fontWeight: 700 }}>{city}</span>
      </p>
      {data.lat && data.lng && (
        <IonButton expand="block" size="small" color="success" routerLink={`/map/${data.lat}/${data.lng}/${encodeURIComponent(city)}/${encodeURIComponent(data.carrier_name || 'Carrier')}`}>
          <IonIcon slot="start" name="location-outline" />
          View Map
        </IonButton>
      )}
    </div>
  );
}

function DocUploadCard({ data, isMe, onView, isDeleted }) {
  const label = (data.doc_type || 'other').replace('_', ' ').toUpperCase();
  const docColor = DOC_TYPE_COLORS[data.doc_type] || DOC_TYPE_COLORS.other;
  return (
    <div style={{ padding: 12, width: 220, marginLeft: isMe ? 'auto' : 0, backgroundColor: isDeleted ? 'rgba(0,0,0,0.06)' : isMe ? 'var(--ion-color-primary)' : 'var(--ion-card-background)', border: `1px solid ${isDeleted ? 'var(--ion-color-danger)' : isMe ? 'var(--ion-color-primary)' : 'var(--ion-border-color)'}`, borderRadius: 8, opacity: isDeleted ? 0.75 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <IonIcon name="document-text-outline" style={{ fontSize: 13, color: isDeleted ? 'var(--ion-color-danger)' : '#93c5fd' }} />
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isDeleted ? 'var(--ion-color-danger)' : isMe ? '#fff' : 'var(--ion-text-color)' }}>
          {isDeleted ? 'Document Deleted' : 'Document Uploaded'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ backgroundColor: isDeleted ? 'rgba(235,68,90,0.12)' : docColor.bg, color: isDeleted ? 'var(--ion-color-danger)' : docColor.color, borderRadius: 8, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 700 }}>{label}</span>
        {data.page_count > 1 && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{data.page_count} pages</span>}
      </div>
      <div style={{ fontWeight: 500, fontSize: '0.875rem', color: isDeleted ? 'var(--ion-color-medium)' : isMe ? '#fff' : 'var(--ion-text-color)', textDecoration: isDeleted ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{data.file_name}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', marginBottom: 8 }}>{data.uploader_name} · {data.uploader_role}</div>
      {!isDeleted && (
        <IonButton expand="block" size="small" fill={isMe ? 'outline' : 'solid'} color={isMe ? 'light' : 'primary'} onClick={onView}>
          <IonIcon slot="start" name="document-text-outline" />
          View Document
        </IonButton>
      )}
    </div>
  );
}

function DocViewer({ doc, onClose }) {
  const [page, setPage] = useState(0);
  if (!doc) return null;
  return (
    <IonModal isOpen onDidDismiss={onClose} style={{ '--width': '720px', '--height': 'auto', '--max-height': '90vh', '--border-radius': '12px' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 8px 16px', borderBottom: '1px solid var(--ion-border-color)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '1px 6px', borderRadius: 8, backgroundColor: (DOC_TYPE_COLORS[doc.doc_type] || DOC_TYPE_COLORS.other).bg, color: (DOC_TYPE_COLORS[doc.doc_type] || DOC_TYPE_COLORS.other).color }}>
            {(doc.doc_type || 'other').replace('_', ' ').toUpperCase()}
          </span>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ion-text-color)' }}>{doc.file_name}</span>
          {doc.page_count > 1 && <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', flexShrink: 0 }}>{page + 1} / {doc.page_count}</span>}
          <IonButton fill="clear" color="medium" size="small" onClick={onClose} style={{ '--border-radius': '50%' }}>
            <IonIcon slot="icon-only" name="close-outline" />
          </IonButton>
        </div>
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#111', position: 'relative' }}>
          <img src={doc.pages[page]} alt="" style={{ width: '100%', display: 'block', maxHeight: '72vh', objectFit: 'contain' }} />
          {doc.page_count > 1 && (
            <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
              <IonButton disabled={page === 0} onClick={() => setPage(p => p - 1)} color="dark" size="small">
                <IonIcon slot="icon-only" name="chevron-back-outline" />
              </IonButton>
              <IonButton disabled={page >= doc.page_count - 1} onClick={() => setPage(p => p + 1)} color="dark" size="small">
                <IonIcon slot="icon-only" name="chevron-forward-outline" />
              </IonButton>
            </div>
          )}
        </div>
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--ion-border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>
            Uploaded by <strong>{doc.uploader_name}</strong> ({doc.uploader_role})
          </span>
        </div>
      </div>
    </IonModal>
  );
}

function LoadDocsModal({ loadId, onClose, onView }) {
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  useEffect(() => {
    if (!loadId) return;
    setLoadingDocs(true);
    documentsApi.list(loadId).then(d => setDocs(Array.isArray(d) ? d : [])).catch(() => setDocs([])).finally(() => setLoadingDocs(false));
  }, [loadId]);
  return (
    <IonModal isOpen onDidDismiss={onClose} style={{ '--width': '500px', '--height': 'auto', '--max-height': '80vh', '--border-radius': '12px' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 8px 16px', borderBottom: '1px solid var(--ion-border-color)' }}>
          <IonIcon name="folder-open-outline" style={{ fontSize: 17, color: 'var(--ion-color-primary)', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem', flex: 1, color: 'var(--ion-text-color)' }}>Load Documents</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', marginRight: 4 }}>Load #{String(loadId).slice(0, 8)}</span>
          <IonButton fill="clear" color="medium" size="small" onClick={onClose} style={{ '--border-radius': '50%' }}>
            <IonIcon slot="icon-only" name="close-outline" />
          </IonButton>
        </div>
        <div style={{ padding: '8px 16px 16px', overflowY: 'auto' }}>
          {loadingDocs ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><IonSpinner name="crescent" style={{ width: 24, height: 24 }} /></div>
          ) : docs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <IonIcon name="document-text-outline" style={{ fontSize: 36, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No documents uploaded for this load yet.</p>
            </div>
          ) : docs.map(doc => {
            const label = (doc.doc_type || 'other').replace('_', ' ').toUpperCase();
            const dc = DOC_TYPE_COLORS[doc.doc_type] || DOC_TYPE_COLORS.other;
            return (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--ion-border-color)' }}>
                <IonIcon name="document-text-outline" style={{ fontSize: 20, color: 'var(--ion-color-primary)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 8, backgroundColor: dc.bg, color: dc.color }}>{label}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{doc.uploader_name}</span>
                  </div>
                </div>
                <IonButton fill="outline" size="small" onClick={() => onView(doc)}>View</IonButton>
              </div>
            );
          })}
        </div>
      </div>
    </IonModal>
  );
}

function TypingIndicator() {
  return (
    <>
      <style>{`@keyframes typingBounce{0%,60%,100%{transform:translateY(0);opacity:0.5}30%{transform:translateY(-5px);opacity:1}}`}</style>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: '16px 16px 16px 4px', backgroundColor: 'rgba(0,0,0,0.07)' }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--ion-color-medium)', animation: 'typingBounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}
        </div>
      </div>
    </>
  );
}

function getPresenceInfo(isoString) {
  if (!isoString) return null;
  const diffMs  = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMs / 3600000);
  if (diffMin < 5)  return { label: 'Active now',             color: '#2dd36f' };
  if (diffMin < 60) return { label: `Active ${diffMin}m ago`, color: '#ffce00' };
  if (diffHr < 24)  return { label: `Active ${diffHr}h ago`,  color: '#eb445a' };
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return { label: 'Active yesterday',     color: '#eb445a' };
  return null;
}

function PresenceDot({ lastActiveAt, size = 10 }) {
  const info = getPresenceInfo(lastActiveAt);
  if (!info) return null;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: info.color, border: '2px solid var(--ion-card-background)', flexShrink: 0 }} />
  );
}

const LIST_WIDTH = 300;

export default function Messages() {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const btnTextColor = isDark ? '#ffffff' : '#1a1a1a';
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const query = searchParams.get('q') || '';

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
  const [docsModalLoadId, setDocsModalLoadId] = useState(null);
  const [loadDocs, setLoadDocs] = useState(null);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [sending, setSending] = useState(false);
  const imageInputRef = useRef(null);
  const { minimize: minimizeConvo } = useMinimizedChats();
  const [listVisible, setListVisible] = useState(true);
  const [listTab, setListTab] = useState('main');
  const [selectOpen, setSelectOpen] = useState(false);
  const [selectQuery, setSelectQuery] = useState('');
  const [selectList, setSelectList] = useState([]);
  const [selectLoading, setSelectLoading] = useState(false);
  const [hoveredConvoId, setHoveredConvoId] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hauliq_pinned_convos') || '[]'); } catch { return []; }
  });
  const [convoOrder, setConvoOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hauliq_convo_order') || '[]'); } catch { return []; }
  });

  const applyOrder = (arr) => {
    if (!convoOrder.length) return arr;
    return [...arr].sort((a, b) => {
      const ia = convoOrder.indexOf(a.id);
      const ib = convoOrder.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  };

  const handleSectionReorder = (e, sectionItems) => {
    const reorderedSection = e.detail.complete([...sectionItems]);
    const sectionIds = new Set(sectionItems.map(c => c.id));
    const reorderedIds = reorderedSection.map(c => c.id);
    setConvoOrder(prev => {
      const base = prev.length ? prev : conversations.map(c => c.id);
      let ri = 0;
      const next = base.map(id => sectionIds.has(id) ? reorderedIds[ri++] : id);
      reorderedIds.slice(ri).forEach(id => next.push(id));
      localStorage.setItem('hauliq_convo_order', JSON.stringify(next));
      return next;
    });
  };

  const togglePin = (id, e) => {
    e.stopPropagation();
    setPinnedIds(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [id, ...prev];
      localStorage.setItem('hauliq_pinned_convos', JSON.stringify(next));
      return next;
    });
  };

  const handleMinimize = () => {
    if (!activeConvo) return;
    minimizeConvo(activeConvo, activeMessages);
    setActiveConvoId(null);
    setActiveMessages([]);
    navigate(-1);
  };

  // Listen for restore events dispatched by MinimizedChatsFAB
  useEffect(() => {
    const onRestore = (e) => {
      const found = e.detail;
      if (found) { setActiveConvoId(found.id); setActiveMessages(found.messages); }
    };
    window.addEventListener('hauliq-restore-mini', onRestore);
    return () => window.removeEventListener('hauliq-restore-mini', onRestore);
  }, []);

  useEffect(() => {
    messagesApi.presence().catch(() => {});
    const interval = setInterval(() => messagesApi.presence().catch(() => {}), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const convId = searchParams.get('conv');
    if (convId && conversations.length > 0) {
      const found = conversations.find(c => c.id === convId);
      if (found) setActiveConvoId(found.id);
    }
  }, [searchParams, conversations]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const activeConvoForDocs = conversations.find(c => c.id === activeConvoId);
  useEffect(() => {
    const loadId = activeConvoForDocs?.load_id;
    if (!loadId) { setLoadDocs(null); return; }
    setLoadDocs(null);
    documentsApi.list(loadId).then(docs => setLoadDocs(Array.isArray(docs) ? docs : [])).catch(() => setLoadDocs([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvoForDocs?.load_id]);

  useEffect(() => {
    if (!activeConvoId) return;
    const poll = setInterval(() => {
      messagesApi.typingStatus(activeConvoId).then(d => setOtherIsTyping(!!d?.is_typing)).catch(() => {});
      messagesApi.conversation(activeConvoId).then(data => {
        const incoming = data.messages || (Array.isArray(data) ? data : []);
        setActiveMessages(prev => {
          if (incoming.length !== prev.length) return incoming;
          const changed = incoming.some((m, i) => m.is_read !== prev[i]?.is_read);
          return changed ? incoming : prev;
        });
      }).catch(() => {});
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
  const getProfileLink  = (party) => party?.role === 'carrier' ? `/c/${party.id?.slice(0,8)}` : `/b/${party.id?.slice(0,8)}`;
  const getConvoLabel   = (c) => String(c.carrier_id) === String(user?.id) ? (c.broker_name || `Broker ${String(c.broker_id || '').slice(0, 8)}`) : (c.carrier_name || `Carrier ${String(c.carrier_id || '').slice(0, 8)}`);
  const getLastMsg      = (c) => { const msgs = c.messages || []; return msgs[msgs.length - 1] || null; };
  const hasUnread       = (c) => (c.messages || []).some(m => m.sender_id !== user?.id && !m.is_read);

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

  const handleSend = async () => {
    if ((!input.trim() && pendingImages.length === 0) || !activeConvo) return;
    clearTimeout(typingTimeoutRef.current);
    const recipientId = user?.role === 'carrier' ? activeConvo.broker_id : activeConvo.carrier_id;

    if (pendingImages.length > 0) {
      setUploadingImages(true);
      try {
        const toBase64 = (file) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const images = await Promise.all(
          pendingImages.map(p => toBase64(p.file).then(data => ({ data, name: p.file.name })))
        );
        const body = JSON.stringify({ __type: 'image_attachment', images, caption: input.trim() || undefined });
        const msg = await messagesApi.send(activeConvo.load_id || null, recipientId, body);
        setActiveMessages(prev => [...prev, msg]);
        setPendingImages(prev => { prev.forEach(p => URL.revokeObjectURL(p.previewUrl)); return []; });
        setInput('');
      } catch (err) {
        console.error('Image send failed:', err);
        alert('Failed to send image: ' + (err?.message || 'Unknown error'));
      } finally { setUploadingImages(false); }
      return;
    }

    setSending(true);
    messagesApi.send(activeConvo.load_id || null, recipientId, input.trim())
      .then(msg => { setActiveMessages(prev => [...prev, msg]); setInput(''); })
      .catch(() => {})
      .finally(() => setSending(false));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newImages = files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPendingImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  };

  const removePendingImage = (idx) => {
    setPendingImages(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const openSelectModal = async () => {
    setSelectOpen(true);
    setSelectQuery('');
    setSelectLoading(true);
    try {
      if (listTab === 'employees') {
        const data = await driversApi.list();
        setSelectList(Array.isArray(data) ? data : []);
      } else {
        const data = await networkApi.list();
        setSelectList(Array.isArray(data) ? data : []);
      }
    } catch { setSelectList([]); }
    finally { setSelectLoading(false); }
  };

  const handleSelectContact = (contact) => {
    setSelectOpen(false);
    setSelectQuery('');
    const uid = contact.user_id || contact.id;
    const existing = conversations.find(c => (c.carrier_id === uid || c.broker_id === uid) && !c.load_id);
    if (existing) { setActiveConvoId(existing.id); return; }
    messagesApi.direct(uid)
      .then(convo => { setConversations(prev => [convo, ...prev]); setActiveConvoId(convo.id); setActiveMessages(convo.messages || []); })
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

  const isEmployeeConvo = (c) => c.other_role === 'driver' || c.other_role === 'employee';

  const tabConvos = conversations.filter(c =>
    listTab === 'employees' ? isEmployeeConvo(c) : !isEmployeeConvo(c)
  );

  const filteredConvos = query
    ? tabConvos.filter(c => {
        const q = query.toLowerCase();
        return getConvoLabel(c).toLowerCase().includes(q)
          || (getLastMsg(c)?.body || '').toLowerCase().includes(q);
      })
    : tabConvos;


  const otherParty = getOtherParty(activeConvo);

  const showList = isMobile ? !activeConvoId : listVisible;
  const showChat = !!activeConvoId;

  const renderConvo = (c) => {
    const label       = getConvoLabel(c);
    const unread      = hasUnread(c);
    const isActive    = activeConvoId === c.id;
    const isPinned    = pinnedIds.includes(c.id);
    const isHovered   = hoveredConvoId === c.id;
    const otherRole   = String(c.carrier_id) === String(user?.id) ? 'broker' : 'carrier';
    const otherId     = otherRole === 'broker' ? c.broker_id : c.carrier_id;
    const otherAvatar = otherRole === 'broker' ? c.broker_avatar_url : c.carrier_avatar_url;
    const displayName = c.load_id ? `Load #${c.load_id.slice(0, 8).toUpperCase()} — ${label}` : label;

    return (
      <IonItem
        key={c.id}
        button
        detail={false}
        onClick={() => setActiveConvoId(c.id)}
        onMouseEnter={() => setHoveredConvoId(c.id)}
        onMouseLeave={() => setHoveredConvoId(null)}
        style={{
          '--background':               isActive ? 'rgba(var(--ion-color-primary-rgb),0.08)' : 'transparent',
          '--background-hover':         'rgba(0,0,0,0.04)',
          '--background-hover-opacity': '1',
          '--min-height':               '60px',
          '--padding-start':            '16px',
          '--padding-end':              '4px',
          '--inner-padding-end':        '0',
        }}
      >
        <div slot="start" style={{ position: 'relative', flexShrink: 0, marginRight: 12 }}>
          <Link to={otherRole === 'carrier' ? `/c/${otherId?.slice(0,8)}` : `/b/${String(otherId||'').slice(0,8)}`} onClick={e => e.stopPropagation()}>
            <UserAvatar name={label} src={otherAvatar} size={42} />
          </Link>
          {c.other_last_active_at && (
            <div style={{ position: 'absolute', bottom: 1, right: 1 }}>
              <PresenceDot lastActiveAt={c.other_last_active_at} size={10} />
            </div>
          )}
        </div>
        <IonLabel style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {unread && <div style={{ width: 8, height: 8, backgroundColor: 'var(--ion-color-primary)', borderRadius: '50%', flexShrink: 0 }} />}
            {c.is_blocked_by_me && <IonIcon name="ban-outline" style={{ fontSize: 12, color: 'var(--ion-color-danger)', flexShrink: 0 }} />}
            <span style={{ fontSize: '0.95rem', fontWeight: unread ? 700 : 500, color: isActive ? 'var(--ion-color-primary)' : 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
          </div>
        </IonLabel>
        <div slot="end" style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ opacity: isMobile || isHovered || isPinned ? 1 : 0, transition: 'opacity 0.15s' }}>
            <IonButton fill="clear" color={isPinned ? 'warning' : 'medium'} size="small" onClick={(e) => togglePin(c.id, e)} style={{ '--border-radius': '50%' }} title={isPinned ? 'Unpin' : 'Pin'}>
              <IonIcon slot="icon-only" name={isPinned ? 'star' : 'star-outline'} />
            </IonButton>
          </div>
          <IonReorder />
        </div>
      </IonItem>
    );
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 60, left: 0, right: 0, bottom: 0, display: 'flex', overflow: 'hidden', backgroundColor: 'var(--ion-card-background)', zIndex: 1 }}>

        {/* ── Conversation list panel ── */}
        {showList && (
          <div style={{ width: isMobile ? '100%' : LIST_WIDTH, flexShrink: 0, borderRight: isMobile ? 'none' : '1px solid var(--ion-border-color)', display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Tab toggle */}
            <div style={{ padding: '0 10px', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0, height: 60, display: 'flex', alignItems: 'center' }}>
              <IonSegment mode="ios" value={listTab} onIonChange={e => setListTab(String(e.detail.value))}
                style={{ '--background': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', minHeight: 36, width: '100%' }}>
                <IonSegmentButton value="main"
                  style={{ '--indicator-color': 'var(--ion-card-background)', '--color': 'var(--ion-color-medium)', '--color-checked': 'var(--ion-text-color)', '--border-radius': '8px', '--indicator-box-shadow': '0 1px 4px rgba(0,0,0,0.15)', minHeight: 30 }}>
                  <IonLabel style={{ fontSize: '0.8rem', fontWeight: 600, margin: '4px 0' }}>
                    {user?.role === 'carrier' ? 'Brokers' : 'Carriers'}
                  </IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="employees"
                  style={{ '--indicator-color': 'var(--ion-card-background)', '--color': 'var(--ion-color-medium)', '--color-checked': 'var(--ion-text-color)', '--border-radius': '8px', '--indicator-box-shadow': '0 1px 4px rgba(0,0,0,0.15)', minHeight: 30 }}>
                  <IonLabel style={{ fontSize: '0.8rem', fontWeight: 600, margin: '4px 0' }}>Employees</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </div>

            {/* Mobile create message button */}
            {isMobile && user?.role !== 'driver' && (
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
                <IonButton expand="block" fill="outline" color="medium" onClick={openSelectModal}>
                  <IonIcon slot="start" name="add-outline" style={{ marginRight: 6 }} />
                  Create a Message
                </IonButton>
              </div>
            )}

            {/* Compose panel */}
            {composing && (
              <div style={{ borderBottom: '1px solid var(--ion-border-color)', padding: '8px 12px', backgroundColor: 'rgba(0,0,0,0.03)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, flex: 1, color: 'var(--ion-text-color)' }}>New Message</span>
                  <IonButton fill="clear" color="medium" size="small" onClick={() => { setComposing(false); setNetworkQuery(''); }} style={{ '--border-radius': '50%' }}>
                    <IonIcon slot="icon-only" name="close-outline" />
                  </IonButton>
                </div>
                <IonSearchbar
                  placeholder="Search your network..."
                  value={networkQuery}
                  onIonInput={e => setNetworkQuery(e.detail.value || '')}
                  style={{ '--border-radius': '6px', '--box-shadow': 'none', '--background': 'var(--ion-input-background, rgba(0,0,0,0.04))', padding: 0, height: 36 }}
                />
                {filteredNetwork.length === 0 ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', padding: '4px 4px 0', display: 'block' }}>{network.length === 0 ? 'No connections yet.' : 'No matches.'}</span>
                ) : (
                  <div style={{ maxHeight: 160, overflowY: 'auto', marginTop: 4 }}>
                    {filteredNetwork.map(contact => (
                      <div key={contact.user_id} onClick={() => handleStartDirect(contact)}
                        className="ion-activatable"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                        <IonRippleEffect />
                        <UserAvatar name={contact.name} src={contact.avatar_url} size={28} />
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{contact.name}</div>
                          {contact.company && <div style={{ fontSize: '0.68rem', color: 'var(--ion-color-medium)' }}>{contact.company}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Conversation list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <IonSpinner name="crescent" style={{ width: 24, height: 24 }} />
                </div>
              ) : filteredConvos.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 24px', textAlign: 'center' }}>
                  <IonIcon name="chatbubble-outline" style={{ fontSize: 36, color: 'var(--ion-color-medium)', display: 'block', marginBottom: 12 }} />
                  <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
                    {query ? 'No conversations match your search' : 'No conversations yet'}
                  </p>
                  {!query && user?.role === 'driver' && user?.carrier_id ? (
                    <IonButton size="small" onClick={() => {
                      messagesApi.direct(user.carrier_id)
                        .then(convo => { setConversations([convo]); setActiveConvoId(convo.id); setActiveMessages(convo.messages || []); })
                        .catch(() => {});
                    }}>
                      Message your carrier
                    </IonButton>
                  ) : !query && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Use New Message to start one</span>
                  )}
                </div>
              ) : (() => {
                const pinnedConvos  = applyOrder(filteredConvos.filter(c => pinnedIds.includes(c.id)));
                const loadConvos    = applyOrder(filteredConvos.filter(c => !pinnedIds.includes(c.id) && c.load_id));
                const directConvos  = applyOrder(filteredConvos.filter(c => !pinnedIds.includes(c.id) && !c.load_id));
                const SectionHeader = ({ label }) => (
                  <div style={{ padding: '5px 16px', backgroundColor: 'var(--ion-background-color)', borderBottom: '1px solid var(--ion-border-color)', borderTop: '1px solid var(--ion-border-color)' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--ion-color-medium)' }}>{label}</span>
                  </div>
                );
                return (
                  <>
                    {pinnedConvos.length > 0 && (
                      <>
                        <SectionHeader label="Pinned" />
                        <IonList lines="full" style={{ padding: 0 }}>
                          <IonReorderGroup disabled={false} onIonItemReorder={e => handleSectionReorder(e, pinnedConvos)}>
                            {pinnedConvos.map(renderConvo)}
                          </IonReorderGroup>
                        </IonList>
                      </>
                    )}
                    {loadConvos.length > 0 && (
                      <>
                        <SectionHeader label="Load Conversations" />
                        <IonList lines="full" style={{ padding: 0 }}>
                          <IonReorderGroup disabled={false} onIonItemReorder={e => handleSectionReorder(e, loadConvos)}>
                            {loadConvos.map(renderConvo)}
                          </IonReorderGroup>
                        </IonList>
                      </>
                    )}
                    {directConvos.length > 0 && (
                      <>
                        <SectionHeader label="Direct Messages" />
                        <IonList lines="full" style={{ padding: 0 }}>
                          <IonReorderGroup disabled={false} onIonItemReorder={e => handleSectionReorder(e, directConvos)}>
                            {directConvos.map(renderConvo)}
                          </IonReorderGroup>
                        </IonList>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Chat area ── */}
        {(showChat || !isMobile) && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
            {/* Chat header — always visible */}
            <div style={{ padding: '0 12px', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-background-color)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, height: 60 }}>
              {/* Hamburger / back */}
              <IonButton fill="clear" color="medium" onClick={isMobile ? () => setActiveConvoId(null) : () => setListVisible(v => !v)} style={{ '--border-radius': '50%' }}>
                <ion-icon slot="icon-only" name={isMobile ? 'arrow-back-outline' : 'menu-outline'} />
              </IonButton>

              {/* Avatar — only when a convo is selected */}
              {showChat && otherParty && (
                <Link to={getProfileLink(otherParty)} style={{ flexShrink: 0, position: 'relative', textDecoration: 'none' }}>
                  <UserAvatar name={otherParty.name} src={otherParty.avatar_url} size={38} />
                  {activeConvo.other_last_active_at && (
                    <div style={{ position: 'absolute', bottom: 1, right: 1 }}>
                      <PresenceDot lastActiveAt={activeConvo.other_last_active_at} size={10} />
                    </div>
                  )}
                </Link>
              )}

              {/* Spacer when no convo selected */}
              {!showChat && <div style={{ flex: 1 }} />}

              {/* Name + subtitle — only when a convo is selected */}
              {showChat && <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                  {otherParty?.name || getConvoLabel(activeConvo)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                  {activeConvo.load_id
                    ? `Load #${activeConvo.load_id.slice(0, 8).toUpperCase()}`
                    : getPresenceInfo(activeConvo.other_last_active_at)?.label || (otherParty?.role || '')}
                </div>
              </div>}

              {/* Action buttons — only when a convo is selected */}
              {showChat && user?.role === 'broker' && activeConvo.active_booking_id && (
                <IonButton fill="outline" color="success" size="small" routerLink={`/broker/track/${activeConvo.active_booking_id}`}>
                  <IonIcon slot="start" name="navigate-outline" />
                  Locate Load
                </IonButton>
              )}
              {showChat && activeConvo.load_id && (
                <IonButton fill="clear" color="medium" routerLink={`/${user?.role}/loads/${activeConvo.load_id}`} title="View load" style={{ '--border-radius': '50%' }}>
                  <IonIcon slot="icon-only" name="car-sport-outline" />
                </IonButton>
              )}
              {showChat && activeConvo.load_id && (
                <IonButton fill="clear" color="medium" title="View load documents" onClick={() => setDocsModalLoadId(activeConvo.load_id)} style={{ '--border-radius': '50%' }}>
                  <IonIcon slot="icon-only" name="folder-open-outline" />
                </IonButton>
              )}
              {showChat && (
                <IonButton fill="clear" color="medium" title="Delete conversation" disabled={deletingId === activeConvoId} onClick={(e) => handleDeleteConvo(e, activeConvoId)} style={{ '--border-radius': '50%' }}>
                  <IonIcon slot="icon-only" name="trash-outline" />
                </IonButton>
              )}
              {showChat && otherParty && (
                <IonButton fill="clear" color={activeConvo.is_blocked_by_me ? 'danger' : 'medium'} title={activeConvo.is_blocked_by_me ? 'Unblock user' : 'Block user'} disabled={blockLoading} onClick={() => handleToggleBlock(otherParty.id)} style={{ '--border-radius': '50%' }}>
                  {blockLoading
                    ? <IonSpinner slot="icon-only" name="crescent" style={{ width: 14, height: 14 }} />
                    : <IonIcon slot="icon-only" name={activeConvo.is_blocked_by_me ? 'shield-outline' : 'ban-outline'} />
                  }
                </IonButton>
              )}
              {showChat && (
                <IonButton fill="clear" color="medium" title="Minimize" onClick={handleMinimize} style={{ '--border-radius': '50%' }}>
                  <IonIcon slot="icon-only" name="remove-outline" />
                </IonButton>
              )}
              {showChat && (
                <IonButton fill="clear" color="medium" title="Close conversation" onClick={() => { setActiveConvoId(null); setActiveMessages([]); }} style={{ '--border-radius': '50%' }}>
                  <IonIcon slot="icon-only" name="close-outline" />
                </IonButton>
              )}
              {!showChat && user?.role !== 'driver' && (
                <IonButton fill="clear" color="medium" onClick={openSelectModal} style={{ '--border-radius': '8px' }}>
                  <IonIcon slot="start" name="person-outline" style={{ marginRight: 6 }} />
                  {listTab === 'employees' ? 'Select Employee' : 'Select Connection'}
                </IonButton>
              )}
            </div>

            {showChat && activeConvo.is_blocked_by_me && (
              <div style={{ margin: '12px 16px 0', padding: '8px 16px', borderRadius: 8, backgroundColor: 'rgba(235,68,90,0.15)', border: '1px solid var(--ion-color-danger)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <IonIcon name="ban-outline" style={{ fontSize: 13, color: 'var(--ion-color-danger)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-danger)' }}>You have blocked this user. They can no longer message you.</span>
              </div>
            )}

            {/* Messages + input — only when a convo is selected */}
            {showChat ? <IonList lines="none" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
              {activeMessages.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                const prevMsg = activeMessages[idx - 1];
                const isGrouped = prevMsg && prevMsg.sender_id === msg.sender_id;
                const special = parseSpecial(msg.body);
                const senderName   = getSenderName(msg.sender_id, activeConvo);
                const senderAvatar = getSenderAvatar(msg.sender_id, activeConvo);
                const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                let content;
                if (special?.__type === 'location_request') {
                  content = sharingLocation === special.booking_id
                    ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IonSpinner name="crescent" style={{ width: 13, height: 13 }} /><span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>Getting your location…</span></div>
                    : <LocationRequestCard data={special} isMe={isMe} onShare={handleShareLocation} />;
                } else if (special?.__type === 'doc_upload') {
                  const isDocDeleted = loadDocs !== null && !loadDocs.some(d => String(d.id) === String(special.doc_id));
                  content = <DocUploadCard data={special} isMe={isMe} onView={() => handleViewDoc(special)} isDeleted={isDocDeleted} />;
                } else if (special?.__type === 'location_share') {
                  content = <LocationShareCard data={special} isMe={isMe} />;
                } else if (special?.__type === 'image_attachment') {
                  content = (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isMe ? 'var(--ion-color-primary)' : 'var(--ion-text-color)' }}>{isMe ? 'You' : senderName}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{timeStr}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(special.images || []).map((img, i) => (
                          <img key={i} src={img.data || img} alt="" onClick={() => { const w = window.open(); w.document.write(`<img src="${img.data || img}" style="max-width:100%">`); }}
                            style={{ maxWidth: 220, maxHeight: 200, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--ion-border-color)' }} />
                        ))}
                      </div>
                      {special.caption && <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{special.caption}</p>}
                    </>
                  );
                } else {
                  content = (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isMe ? 'var(--ion-color-primary)' : 'var(--ion-text-color)' }}>{isMe ? 'You' : senderName}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>{timeStr}</span>
                        {isMe && <IonIcon name={msg.is_read ? 'checkmark-done-outline' : 'checkmark-outline'} style={{ fontSize: 11, color: 'var(--ion-color-medium)' }} />}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--ion-text-color)', whiteSpace: 'pre-wrap' }}>{msg.body}</p>
                    </>
                  );
                }

                const isHovered = hoveredMsgId === msg.id;

                return (
                  <IonItem
                    key={msg.id}
                    button
                    detail={false}
                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                    onMouseLeave={() => setHoveredMsgId(null)}
                    style={{
                      '--background': isMe ? 'rgba(var(--ion-color-primary-rgb), 0.04)' : 'transparent',
                      '--background-hover': 'rgba(0,0,0,0.04)',
                      '--background-hover-opacity': '1',
                      '--padding-start': '16px',
                      '--padding-end': '16px',
                      '--inner-padding-end': '0',
                      '--min-height': '0',
                      alignItems: isGrouped ? 'center' : 'flex-start',
                      marginTop: isGrouped ? 0 : 4,
                    }}
                  >
                    <div slot="start" style={{ marginTop: isGrouped ? 0 : 12, marginRight: 12, flexShrink: 0, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isGrouped
                        ? <span style={{ fontSize: '0.6rem', color: 'var(--ion-color-medium)', opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{timeStr}</span>
                        : <UserAvatar name={senderName} src={senderAvatar} size={36} />
                      }
                    </div>
                    <IonLabel style={{ margin: isGrouped ? '2px 0' : '10px 0', whiteSpace: 'normal' }}>
                      {isGrouped ? (
                        special?.__type ? content : <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--ion-text-color)', whiteSpace: 'pre-wrap' }}>{msg.body}</p>
                      ) : content}
                    </IonLabel>
                    {!special && (
                      <div slot="end" style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s', alignSelf: 'center', flexShrink: 0 }}>
                        <IonButton fill="clear" color="medium" size="small" style={{ '--border-radius': '50%' }}
                          onClick={() => navigator.clipboard.writeText(msg.body).catch(() => {})}>
                          <IonIcon slot="icon-only" name="copy-outline" style={{ fontSize: 16 }} />
                        </IonButton>
                      </div>
                    )}
                  </IonItem>
                );
              })}
              {otherIsTyping && (
                <IonItem lines="none" style={{ '--background': 'transparent', '--padding-start': '16px', '--min-height': '0' }}>
                  <div slot="start" style={{ marginTop: 8, marginRight: 12 }}><TypingIndicator /></div>
                </IonItem>
              )}
              <div ref={messagesEndRef} />
            </IonList> : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <IonIcon name="chatbubbles-outline" style={{ fontSize: 48, color: isDark ? '#ffffff' : '#333333', display: 'block', marginBottom: 14 }} />
                  <IonButton fill="outline" color={isDark ? 'light' : 'dark'} onClick={openSelectModal}>
                    <IonIcon slot="start" name="add-outline" style={{ marginRight: 6 }} />
                    Create a Message
                  </IonButton>
                </div>
              </div>
            )}

            {/* Input — only when a convo is selected */}
            {showChat && <><style>{`.msg-input textarea { caret-color: var(--ion-color-success) !important; }`}</style>
            <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              {(sending || uploadingImages)
                ? <IonProgressBar type="indeterminate" color="success" style={{ height: 2 }} />
                : <div style={{ height: 1, backgroundColor: 'var(--ion-border-color)', flexShrink: 0 }} />
              }
              {pendingImages.length > 0 && (
                <div style={{ display: 'flex', gap: 8, padding: '8px 16px 0', flexWrap: 'wrap' }}>
                  {pendingImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={img.previewUrl} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--ion-border-color)', display: 'block' }} />
                      <IonButton fill="clear" size="small" color="medium" onClick={() => removePendingImage(idx)}
                        style={{ '--border-radius': '50%', position: 'absolute', top: -8, right: -8, '--padding-start': '0', '--padding-end': '0', width: 22, height: 22, '--min-height': '22px' }}>
                        <IonIcon slot="icon-only" name="close-circle" style={{ fontSize: 18 }} />
                      </IonButton>
                    </div>
                  ))}
                </div>
              )}
              <IonTextarea
                className="msg-input"
                placeholder="Write your message here"
                value={input}
                onIonInput={e => { setInput(String(e.detail.value ?? '')); if (activeConvoId) handleTyping(activeConvoId); }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                disabled={activeConvo.is_blocked_by_me}
                autoGrow
                rows={3}
                style={{ '--background': 'transparent', '--padding-start': '16px', '--padding-end': '16px', '--padding-top': '12px', '--padding-bottom': '8px', '--color': 'var(--ion-text-color)', '--highlight-color-focused': 'transparent', '--highlight-height': '0px', fontSize: '0.9rem', width: '100%' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 8px' }}>
                <IonButton fill="clear" color="medium" disabled={activeConvo.is_blocked_by_me} style={{ '--border-radius': '50%' }} onClick={() => imageInputRef.current?.click()}>
                  <IonIcon slot="icon-only" name="image-outline" />
                </IonButton>
                <IonButton
                  color="success"
                  size="small"
                  onClick={handleSend}
                  disabled={(!input.trim() && pendingImages.length === 0) || activeConvo.is_blocked_by_me || uploadingImages}
                  style={{ '--border-radius': '8px', '--color': btnTextColor, fontWeight: 700, letterSpacing: '0.05em' }}
                >
                  {uploadingImages
                    ? <IonSpinner slot="start" name="crescent" style={{ width: 14, height: 14, color: btnTextColor }} />
                    : <IonIcon slot="start" name="send-outline" style={{ color: btnTextColor }} />
                  }
                  SEND
                </IonButton>
              </div>
            </div></>}
          </div>
        )}
      </div>

      {/* ── Select Connection / Employee Modal ── */}
      <style>{`
        .select-contact-modal { --border-radius: 0px; }
        @media (min-width: 768px) {
          .select-contact-modal { --width: 580px; --max-height: 85vh; --border-radius: 0px; }
        }
      `}</style>
      <IonModal isOpen={selectOpen} onDidDismiss={() => { setSelectOpen(false); setSelectQuery(''); }} className="select-contact-modal">
        <IonHeader>
          <IonToolbar style={{ '--background': 'var(--ion-card-background)', '--color': 'var(--ion-text-color)' }}>
            <IonButtons slot="start">
              <IonButton fill="clear" shape="round" onClick={() => setSelectOpen(false)} style={{ '--color': 'var(--ion-text-color)' }}>
                <ion-icon slot="icon-only" name="close-outline" />
              </IonButton>
            </IonButtons>
            <IonTitle style={{ fontWeight: 700 }}>
              {listTab === 'employees' ? 'Select Employee' : 'Select Connection'}
            </IonTitle>
          </IonToolbar>
          <IonToolbar style={{ '--background': 'var(--ion-card-background)' }}>
            <IonSearchbar
              mode="md"
              value={selectQuery}
              onIonInput={e => setSelectQuery(e.detail.value || '')}
              placeholder={listTab === 'employees' ? 'Search employees…' : 'Search connections…'}
              style={{
                '--background': isDark ? 'var(--ion-background-color)' : '#ffffff',
                '--color': isDark ? '#ffffff' : '#000000',
                '--placeholder-color': isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                '--icon-color': isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                '--box-shadow': 'none',
              }}
            />
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--ion-card-background)' }}>
          {selectLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <IonSpinner name="crescent" />
            </div>
          ) : (() => {
            const q = selectQuery.toLowerCase();
            const filtered = selectList.filter(c =>
              (c.name || c.company || '').toLowerCase().includes(q) ||
              (c.company || '').toLowerCase().includes(q)
            );
            if (!filtered.length) return (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>
                {selectQuery ? 'No matches found' : (listTab === 'employees' ? 'No employees found' : 'No connections found')}
              </div>
            );
            return filtered.map(contact => {
              const name = contact.name || contact.company || '?';
              return (
                <div key={contact.user_id || contact.id}
                  className="ion-activatable"
                  onClick={() => handleSelectContact(contact)}
                  style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--ion-border-color)', cursor: 'pointer', gap: 12, position: 'relative', overflow: 'hidden' }}
                >
                  <IonRippleEffect />
                  <UserAvatar name={name} src={contact.avatar_url} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    {contact.company && contact.name && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.company}</div>
                    )}
                    {contact.role && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', textTransform: 'capitalize' }}>{contact.role}</div>
                    )}
                  </div>
                  <IonIcon name="chevron-forward-outline" style={{ fontSize: 17, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
                </div>
              );
            });
          })()}
        </IonContent>
      </IonModal>

      {viewerDoc && <DocViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />}
      {docsModalLoadId && (
        <LoadDocsModal loadId={docsModalLoadId} onClose={() => setDocsModalLoadId(null)} onView={(doc) => { setDocsModalLoadId(null); setViewerDoc(doc); }} />
      )}

    </>
  );
}
