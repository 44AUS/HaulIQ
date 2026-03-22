import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, Check, CheckCheck, SquarePen, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { messagesApi, networkApi } from '../../services/api';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // New message composer
  const [composing, setComposing] = useState(false);
  const [network, setNetwork] = useState([]);
  const [networkQuery, setNetworkQuery] = useState('');

  useEffect(() => {
    messagesApi.conversations()
      .then(data => setConversations(Array.isArray(data) ? data : []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

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

  const handleSend = () => {
    if (!input.trim() || !activeConvo) return;
    const loadId = activeConvo.load_id || null;
    // backend's broker_id field = "the other party's user_id"
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
    // Check if convo with this user already exists
    const existing = conversations.find(c =>
      (c.carrier_id === contact.user_id || c.broker_id === contact.user_id)
      && !c.load_id
    );
    if (existing) {
      setActiveConvoId(existing.id);
      return;
    }
    // Create a new direct conversation
    messagesApi.direct(contact.user_id)
      .then(convo => {
        setConversations(prev => [convo, ...prev]);
        setActiveConvoId(convo.id);
        setActiveMessages(convo.messages || []);
      })
      .catch(() => {});
  };

  const getConvoLabel = (c) => {
    if (user?.role === 'carrier') return c.broker_name || `Broker ${c.broker_id?.slice(0, 8) || ''}`;
    return c.carrier_name || `Carrier ${c.carrier_id?.slice(0, 8) || ''}`;
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
                    <div className="w-7 h-7 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
                      {contact.name.charAt(0)}
                    </div>
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
              return (
                <button key={c.id} onClick={() => setActiveConvoId(c.id)}
                  className={`w-full text-left p-4 border-b border-dark-400/20 hover:bg-dark-700/50 transition-colors ${activeConvoId === c.id ? 'bg-dark-700/50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {unread && <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />}
                        <p className={`text-sm font-medium truncate ${unread ? 'text-white' : 'text-dark-100'}`}>
                          {getConvoLabel(c)}
                        </p>
                      </div>
                      {c.load_id && (
                        <p className="text-dark-500 text-xs">Load #{c.load_id.slice(0, 8)}</p>
                      )}
                      {lastMsg && (
                        <p className="text-dark-300 text-xs truncate mt-0.5">{lastMsg.body}</p>
                      )}
                    </div>
                    <p className="text-dark-500 text-xs flex-shrink-0">
                      {lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      {activeConvo ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-dark-400/40 flex items-center gap-3">
            <button onClick={() => setActiveConvoId(null)} className="md:hidden text-dark-300 hover:text-white">
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-white font-semibold text-sm">{getConvoLabel(activeConvo)}</p>
              {activeConvo.load_id && (
                <p className="text-dark-400 text-xs">Load #{activeConvo.load_id.slice(0, 8)}</p>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeMessages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
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
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
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
