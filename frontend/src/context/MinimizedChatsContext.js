import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { messagesApi } from '../services/api';

const MinimizedChatsContext = createContext(null);

const STORAGE_KEY = 'hauliq-minimized-convos';

function saveToStorage(convos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convos.map(mc => ({ id: mc.id, convo: mc.convo }))));
  } catch {}
}

function loadFromStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

export function MinimizedChatsProvider({ children }) {
  const { user } = useAuth();
  const [minimizedConvos, setMinimizedConvos] = useState([]);
  const [openMiniId, setOpenMiniId] = useState(null);
  const [miniInputs, setMiniInputs] = useState({});
  const [miniSending, setMiniSending] = useState({});
  const minimizedRef = useRef([]);
  const openMiniRef = useRef(null);
  const restoredRef = useRef(false);

  useEffect(() => { minimizedRef.current = minimizedConvos; }, [minimizedConvos]);
  useEffect(() => { openMiniRef.current = openMiniId; }, [openMiniId]);

  // Persist minimized list whenever it changes
  useEffect(() => { saveToStorage(minimizedConvos); }, [minimizedConvos]);

  // Restore from localStorage on login; clear on logout
  useEffect(() => {
    if (!user?.id) {
      if (restoredRef.current) {
        setMinimizedConvos([]);
        setOpenMiniId(null);
        localStorage.removeItem(STORAGE_KEY);
        restoredRef.current = false;
      }
      return;
    }
    if (restoredRef.current) return;
    restoredRef.current = true;
    const stored = loadFromStorage();
    if (!stored.length) return;
    stored.forEach(({ id, convo }) => {
      messagesApi.conversation(id)
        .then(data => {
          const messages = data.messages || (Array.isArray(data) ? data : []);
          setMinimizedConvos(prev =>
            prev.find(m => m.id === id) ? prev : [...prev, { id, convo, messages, unreadCount: 0 }]
          );
        })
        .catch(() => {
          setMinimizedConvos(prev =>
            prev.find(m => m.id === id) ? prev : [...prev, { id, convo, messages: [], unreadCount: 0 }]
          );
        });
    });
  }, [user?.id]); // eslint-disable-line

  useEffect(() => {
    const poll = setInterval(() => {
      minimizedRef.current.forEach(mc => {
        messagesApi.conversation(mc.id).then(data => {
          const incoming = data.messages || (Array.isArray(data) ? data : []);
          setMinimizedConvos(prev => prev.map(m => {
            if (m.id !== mc.id) return m;
            const newCount = Math.max(0, incoming.length - m.messages.length);
            return { ...m, messages: incoming, unreadCount: openMiniRef.current === mc.id ? 0 : m.unreadCount + newCount };
          }));
        }).catch(() => {});
      });
    }, 3000);
    return () => clearInterval(poll);
  }, []); // eslint-disable-line

  const minimize = (convo, messages) => {
    setMinimizedConvos(prev =>
      prev.find(m => m.id === convo.id)
        ? prev
        : [...prev, { id: convo.id, convo, messages, unreadCount: 0 }]
    );
  };

  const restore = (id, onRestore) => {
    const found = minimizedRef.current.find(m => m.id === id);
    setMinimizedConvos(prev => prev.filter(m => m.id !== id));
    setOpenMiniId(null);
    if (found && onRestore) onRestore(found);
  };

  const close = (id) => {
    setMinimizedConvos(prev => prev.filter(m => m.id !== id));
    if (openMiniRef.current === id) setOpenMiniId(null);
  };

  const openMini = (id) => {
    setOpenMiniId(prev => (prev === id ? null : id));
    setMinimizedConvos(prev => prev.map(m => m.id === id ? { ...m, unreadCount: 0 } : m));
  };

  const sendMini = async (mc) => {
    const text = (miniInputs[mc.id] || '').trim();
    if (!text || !user) return;
    const recipientId = user.role === 'carrier' ? mc.convo.broker_id : mc.convo.carrier_id;
    setMiniSending(prev => ({ ...prev, [mc.id]: true }));
    try {
      const msg = await messagesApi.send(mc.convo.load_id || null, recipientId, text);
      setMinimizedConvos(prev => prev.map(m => m.id === mc.id ? { ...m, messages: [...m.messages, msg] } : m));
      setMiniInputs(prev => ({ ...prev, [mc.id]: '' }));
    } catch {}
    finally { setMiniSending(prev => ({ ...prev, [mc.id]: false })); }
  };

  return (
    <MinimizedChatsContext.Provider value={{
      minimizedConvos, openMiniId, miniInputs, miniSending,
      setMiniInputs, minimize, restore, close, sendMini, openMini,
    }}>
      {children}
    </MinimizedChatsContext.Provider>
  );
}

export function useMinimizedChats() {
  return useContext(MinimizedChatsContext);
}
