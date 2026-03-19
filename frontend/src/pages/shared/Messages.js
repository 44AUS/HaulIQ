import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMessaging } from '../../context/MessagingContext';

export default function Messages() {
  const { user } = useAuth();
  const { conversations, sendMessage, replyMessage, unreadCount } = useMessaging();
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const myConvos = user.role === 'carrier'
    ? conversations.filter(c => c.carrierId === user.id)
    : conversations.filter(c => c.brokerId === user.id || true); // brokers see all for demo

  const activeConvo = myConvos.find(c => c.id === activeConvoId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvo?.messages?.length]);

  const handleSend = () => {
    if (!input.trim() || !activeConvo) return;
    replyMessage(activeConvo.id, input.trim(), user);
    setInput('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0 glass rounded-xl border border-dark-400/40 overflow-hidden">
      {/* Conversation list */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-dark-400/40 flex flex-col ${activeConvoId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-dark-400/40">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-brand-400" />
            <h2 className="text-white font-semibold">Messages</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {myConvos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <MessageSquare size={32} className="text-dark-500 mb-3" />
              <p className="text-dark-300 text-sm">No conversations yet</p>
              <p className="text-dark-400 text-xs mt-1">Start a chat from a load detail page</p>
            </div>
          ) : (
            myConvos.map(c => {
              const lastMsg = c.messages[c.messages.length - 1];
              const hasUnread = c.messages.some(m => m.senderId !== user.id && !m.isRead);
              return (
                <button key={c.id} onClick={() => setActiveConvoId(c.id)}
                  className={`w-full text-left p-4 border-b border-dark-400/20 hover:bg-dark-700/50 transition-colors ${activeConvoId === c.id ? 'bg-dark-700/50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {hasUnread && <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />}
                        <p className={`text-sm font-medium truncate ${hasUnread ? 'text-white' : 'text-dark-100'}`}>
                          {user.role === 'carrier' ? c.brokerName : c.carrierId}
                        </p>
                      </div>
                      <p className="text-dark-400 text-xs truncate mt-0.5">{c.loadRoute}</p>
                      {lastMsg && (
                        <p className="text-dark-300 text-xs truncate mt-1">{lastMsg.body}</p>
                      )}
                    </div>
                    <p className="text-dark-500 text-xs flex-shrink-0">
                      {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
          {/* Chat header */}
          <div className="p-4 border-b border-dark-400/40 flex items-center gap-3">
            <button onClick={() => setActiveConvoId(null)} className="md:hidden text-dark-300 hover:text-white">
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-white font-semibold text-sm">
                {user.role === 'carrier' ? activeConvo.brokerName : 'Carrier'}
              </p>
              <p className="text-dark-400 text-xs">{activeConvo.loadRoute}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeConvo.messages.map(msg => {
              const isMe = msg.senderId === user.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMe ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-dark-700 text-dark-100 rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.body}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-brand-200' : 'text-dark-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
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
          </div>
        </div>
      )}
    </div>
  );
}
