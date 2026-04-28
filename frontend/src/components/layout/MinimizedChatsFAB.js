import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IonButton, IonSpinner } from '@ionic/react';
import { useAuth } from '../../context/AuthContext';
import { useMinimizedChats } from '../../context/MinimizedChatsContext';
import IonIcon from '../IonIcon';

function MiniAvatar({ name, src, size = 40 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size < 30 ? 10 : 13, fontWeight: 700, color: '#fff' }}>{initials}</div>
      }
    </div>
  );
}

function getOtherParty(convo, userId) {
  if (!convo) return null;
  const isCarrier = String(convo.carrier_id) === String(userId);
  return isCarrier
    ? { name: convo.broker_name || convo.broker_company || 'Broker', avatar_url: convo.broker_avatar_url }
    : { name: convo.carrier_name || convo.carrier_company || 'Carrier', avatar_url: convo.carrier_avatar_url };
}

function parseSpecial(body) {
  try { const obj = JSON.parse(body); if (obj.__type) return obj; } catch {}
  return null;
}

export default function MinimizedChatsFAB() {
  const { user } = useAuth();
  const { minimizedConvos, openMiniId, miniInputs, miniSending, setMiniInputs, restore, close, sendMini, openMini } = useMinimizedChats();
  const miniScrollRef = useRef(null);

  useEffect(() => {
    if (miniScrollRef.current) miniScrollRef.current.scrollTop = miniScrollRef.current.scrollHeight;
  }, [openMiniId, minimizedConvos]);

  if (!minimizedConvos.length) return null;

  const fabRight = (idx) => 108 + idx * 72;

  return createPortal(
    <>
      {minimizedConvos.map((mc, idx) => {
        const op = getOtherParty(mc.convo, user?.id);
        const isOpen = openMiniId === mc.id;
        const fr = fabRight(idx);

        return (
          <div key={mc.id}>
            {/* FAB bubble */}
            <div
              onClick={() => openMini(mc.id)}
              title={op?.name || 'Chat'}
              style={{ position: 'fixed', bottom: 32, right: fr, zIndex: 99998, cursor: 'pointer', width: 56, height: 56 }}
            >
              <div style={{ position: 'relative', width: 56, height: 56 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}>
                  <MiniAvatar name={op?.name || '?'} src={op?.avatar_url} size={56} />
                </div>
                {mc.unreadCount > 0 && (
                  <div style={{ position: 'absolute', top: -2, right: -2, backgroundColor: 'var(--ion-color-danger)', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid #fff', boxSizing: 'border-box' }}>
                    {mc.unreadCount > 9 ? '9+' : mc.unreadCount}
                  </div>
                )}
              </div>
            </div>

            {/* Mini chat popup */}
            {isOpen && (
              <div style={{ position: 'fixed', bottom: 100, right: Math.max(fr - 132, 8), zIndex: 99999, width: 320, height: 420, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.4)', border: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-card-background)' }}>
                {/* Mini header */}
                <div style={{ backgroundColor: 'var(--ion-background-color)', padding: '0 8px 0 12px', height: 48, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, borderBottom: '1px solid var(--ion-border-color)' }}>
                  <MiniAvatar name={op?.name || '?'} src={op?.avatar_url} size={28} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '0.85rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {op?.name || 'Chat'}
                    {mc.convo.load_id && <span style={{ fontWeight: 400, fontSize: '0.72rem', color: 'var(--ion-color-medium)', marginLeft: 6 }}>Load #{mc.convo.load_id.slice(0, 8).toUpperCase()}</span>}
                  </span>
                  <IonButton fill="clear" color="medium" size="small" title="Expand" onClick={() => restore(mc.id, (found) => { window.dispatchEvent(new CustomEvent('hauliq-restore-mini', { detail: found })); })} style={{ '--border-radius': '50%' }}>
                    <IonIcon slot="icon-only" name="expand-outline" style={{ fontSize: 16 }} />
                  </IonButton>
                  <IonButton fill="clear" color="medium" size="small" title="Close" onClick={() => close(mc.id)} style={{ '--border-radius': '50%' }}>
                    <IonIcon slot="icon-only" name="close-outline" style={{ fontSize: 16 }} />
                  </IonButton>
                </div>

                {/* Mini messages */}
                <div ref={miniScrollRef} style={{ flex: 1, overflowY: 'auto' }}>
                  {mc.messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    const special = parseSpecial(msg.body);
                    const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const prevMsg = mc.messages[i - 1];
                    const grouped = prevMsg && prevMsg.sender_id === msg.sender_id;
                    const senderName = isMe ? (user?.name || 'You') : (op?.name || '?');
                    const senderAvatar = isMe ? user?.avatar_url : op?.avatar_url;
                    return (
                      <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: grouped ? '2px 12px' : '8px 12px 2px', backgroundColor: isMe ? 'rgba(var(--ion-color-primary-rgb),0.04)' : 'transparent' }}>
                        <div style={{ width: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                          {grouped
                            ? <span style={{ fontSize: '0.55rem', color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>{timeStr}</span>
                            : <MiniAvatar name={senderName} src={senderAvatar} size={28} />
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {!grouped && (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.78rem', color: isMe ? 'var(--ion-color-primary)' : 'var(--ion-text-color)' }}>{isMe ? 'You' : senderName}</span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--ion-color-medium)' }}>{timeStr}</span>
                            </div>
                          )}
                          {special?.__type === 'image_attachment' ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {(special.images || []).map((img, ii) => (
                                <img key={ii} src={img.data || img} alt="" style={{ maxWidth: 120, maxHeight: 100, borderRadius: 6, objectFit: 'cover', cursor: 'pointer' }}
                                  onClick={() => { const w = window.open(); w.document.write(`<img src="${img.data || img}" style="max-width:100%">`); }} />
                              ))}
                            </div>
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--ion-text-color)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.body}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mini input */}
                <div style={{ flexShrink: 0, borderTop: '1px solid var(--ion-border-color)', display: 'flex', alignItems: 'center', padding: '6px 8px', gap: 6 }}>
                  <input
                    value={miniInputs[mc.id] || ''}
                    onChange={e => setMiniInputs(prev => ({ ...prev, [mc.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMini(mc); } }}
                    placeholder="Message…"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--ion-text-color)', fontSize: '0.85rem', padding: '4px 0', caretColor: 'var(--ion-color-success)' }}
                  />
                  <IonButton fill="clear" color="success" size="small" disabled={!(miniInputs[mc.id] || '').trim() || miniSending[mc.id]} onClick={() => sendMini(mc)} style={{ '--border-radius': '50%' }}>
                    {miniSending[mc.id]
                      ? <IonSpinner slot="icon-only" name="crescent" style={{ width: 14, height: 14 }} />
                      : <IonIcon slot="icon-only" name="send-outline" style={{ fontSize: 16 }} />
                    }
                  </IonButton>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>,
    document.body
  );
}
