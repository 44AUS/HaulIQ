import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { IonButton, IonSpinner } from '@ionic/react';
import { useAuth } from '../../context/AuthContext';
import { useMinimizedChats } from '../../context/MinimizedChatsContext';
import IonIcon from '../IonIcon';

const AVATAR_SIZE = 56;
const STACK_THRESHOLD = 48;
const DRAG_THRESHOLD = 4;

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

function loadPositions() {
  try { return JSON.parse(localStorage.getItem('hauliq-mini-positions') || '{}'); }
  catch { return {}; }
}

function getDefaultPos(idx) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  return {
    x: vw - AVATAR_SIZE - 24,
    y: vh - AVATAR_SIZE - 32 - idx * (AVATAR_SIZE + 8),
  };
}

function clampPos(x, y) {
  return {
    x: Math.max(0, Math.min(window.innerWidth - AVATAR_SIZE, x)),
    y: Math.max(0, Math.min(window.innerHeight - AVATAR_SIZE, y)),
  };
}

export default function MinimizedChatsFAB() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { minimizedConvos, openMiniId, miniInputs, miniSending, setMiniInputs, restore, close, sendMini, openMini } = useMinimizedChats();
  const miniScrollRef = useRef(null);

  const posRef = useRef(loadPositions());
  const [positions, setPositionsState] = useState(() => posRef.current);
  const draggingRef = useRef(null);

  const setPositions = useCallback((updater) => {
    setPositionsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      posRef.current = next;
      return next;
    });
  }, []);

  const handleRestore = useCallback((id) => {
    restore(id, (found) => {
      window.dispatchEvent(new CustomEvent('hauliq-restore-mini', { detail: found }));
      const role = user?.role || 'carrier';
      navigate(`/${role}/messages?conv=${found.id}`);
    });
  }, [restore, user, navigate]);

  useEffect(() => {
    if (miniScrollRef.current) miniScrollRef.current.scrollTop = miniScrollRef.current.scrollHeight;
  }, [openMiniId, minimizedConvos]);

  // Assign default positions to convos that don't have one yet
  useEffect(() => {
    let updated = { ...posRef.current };
    let changed = false;
    minimizedConvos.forEach((mc, idx) => {
      if (!updated[mc.id]) {
        updated[mc.id] = getDefaultPos(idx);
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem('hauliq-mini-positions', JSON.stringify(updated));
      setPositions(updated);
    }
  }, [minimizedConvos, setPositions]);

  const handlePointerDown = useCallback((e, id) => {
    e.preventDefault();
    e.stopPropagation();

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startPos = posRef.current[id] || getDefaultPos(0);

    draggingRef.current = {
      id,
      startClientX,
      startClientY,
      startPosX: startPos.x,
      startPosY: startPos.y,
      moved: false,
    };

    const onMove = (ev) => {
      if (!draggingRef.current || draggingRef.current.id !== id) return;
      const dx = ev.clientX - draggingRef.current.startClientX;
      const dy = ev.clientY - draggingRef.current.startClientY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        draggingRef.current.moved = true;
      }
      const { x, y } = clampPos(draggingRef.current.startPosX + dx, draggingRef.current.startPosY + dy);
      setPositions(prev => ({ ...prev, [id]: { x, y } }));
    };

    const onUp = () => {
      if (!draggingRef.current) return;
      const wasMoved = draggingRef.current.moved;
      draggingRef.current = null;
      localStorage.setItem('hauliq-mini-positions', JSON.stringify(posRef.current));
      if (!wasMoved) openMini(id);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [openMini, setPositions]);

  if (!minimizedConvos.length) return null;

  return createPortal(
    <>
      {minimizedConvos.map((mc, idx) => {
        const op = getOtherParty(mc.convo, user?.id);
        const isOpen = openMiniId === mc.id;
        const pos = positions[mc.id] || getDefaultPos(idx);

        // Count how many earlier avatars are stacked near this one
        let stackRank = 0;
        minimizedConvos.forEach((other, otherIdx) => {
          if (other.id === mc.id || otherIdx >= idx) return;
          const op2 = positions[other.id];
          if (!op2) return;
          if (Math.abs(op2.x - pos.x) < STACK_THRESHOLD && Math.abs(op2.y - pos.y) < STACK_THRESHOLD) stackRank++;
        });

        const offsetX = stackRank * 5;
        const offsetY = stackRank * -5;

        // Popup: appear above and aligned to avatar, clamped to viewport
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const popupW = 320;
        const popupH = 420;
        const popupLeft = Math.max(8, Math.min(vw - popupW - 8, pos.x + offsetX - popupW + AVATAR_SIZE));
        const popupTop = Math.max(8, Math.min(vh - popupH - 8, pos.y + offsetY - popupH - 12));

        return (
          <div key={mc.id}>
            {/* Draggable FAB bubble */}
            <div
              onPointerDown={(e) => handlePointerDown(e, mc.id)}
              title={op?.name || 'Chat'}
              style={{
                position: 'fixed',
                left: pos.x + offsetX,
                top: pos.y + offsetY,
                zIndex: 99998 + idx,
                cursor: 'grab',
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                userSelect: 'none',
                touchAction: 'none',
              }}
            >
              <div style={{ position: 'relative', width: AVATAR_SIZE, height: AVATAR_SIZE }}>
                <div style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}>
                  <MiniAvatar name={op?.name || '?'} src={op?.avatar_url} size={AVATAR_SIZE} />
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
              <div style={{ position: 'fixed', left: popupLeft, top: popupTop, zIndex: 99999 + idx, width: popupW, height: popupH, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.4)', border: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-card-background)' }}>
                {/* Mini header */}
                <div style={{ backgroundColor: 'var(--ion-background-color)', padding: '0 8px 0 12px', height: 48, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, borderBottom: '1px solid var(--ion-border-color)' }}>
                  <MiniAvatar name={op?.name || '?'} src={op?.avatar_url} size={28} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '0.85rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {op?.name || 'Chat'}
                    {mc.convo.load_id && <span style={{ fontWeight: 400, fontSize: '0.72rem', color: 'var(--ion-color-medium)', marginLeft: 6 }}>Load #{mc.convo.load_id.slice(0, 8).toUpperCase()}</span>}
                  </span>
                  <IonButton fill="clear" color="medium" size="small" title="Minimize" onClick={() => openMini(mc.id)} style={{ '--border-radius': '50%' }}>
                    <IonIcon slot="icon-only" name="remove-outline" style={{ fontSize: 16 }} />
                  </IonButton>
                  <IonButton fill="clear" color="medium" size="small" title="Expand" onClick={() => handleRestore(mc.id)} style={{ '--border-radius': '50%' }}>
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
