import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadsApi } from '../../services/api';
import IonIcon from '../IonIcon';

const SCORE_LABEL  = { green: 'High Profit', yellow: 'Marginal', red: 'Loss Risk' };
const SCORE_BORDER = { green: 'rgba(46,125,50,0.2)', yellow: 'rgba(237,108,2,0.2)', red: 'rgba(211,47,47,0.2)' };
const SCORE_ICONS  = { green: 'trending-up-outline', yellow: 'remove-outline', red: 'trending-down-outline' };
const SCORE_COLOR  = { green: '#2dd36f', yellow: '#ffc409', red: '#eb445a' };

export default function LoadCard({ load, onSave }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(load.saved);

  const handleSave = (e) => {
    e.stopPropagation();
    setSaved(s => !s);
    loadsApi.toggleSave(load._raw.id).catch(() => setSaved(s => !s));
    onSave && onSave(load.id, !saved);
  };

  const profitIcon = SCORE_ICONS[load.profitScore] || 'remove-outline';
  const broker = load.broker;
  const brokerInitials = broker?.name
    ? broker.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const Badge = ({ children, bg, color }) => (
    <span style={{ backgroundColor: bg, color, borderRadius: 10, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3, height: 21 }}>
      {children}
    </span>
  );

  return (
    <div
      onClick={() => navigate(`/carrier/loads/${load.id}`, { state: { from: 'Load Board' } })}
      style={{ backgroundColor: 'var(--ion-card-background)', border: `1px solid ${SCORE_BORDER[load.profitScore] || 'var(--ion-border-color)'}`, borderRadius: 8, cursor: 'pointer', position: 'relative', transition: 'box-shadow 0.15s, transform 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ padding: 20 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            {load.hot && (
              <Badge bg="rgba(235,68,90,0.12)" color="#eb445a">
                <IonIcon name="flash-outline" style={{ fontSize: 11 }} /> Hot
              </Badge>
            )}
            {load.instantBook && (
              <Badge bg="rgba(56,128,255,0.12)" color="#3880ff">
                <IonIcon name="flash-outline" style={{ fontSize: 11 }} /> Instant Book
              </Badge>
            )}
            <Badge bg="var(--ion-color-light)" color="var(--ion-text-color)">
              <IonIcon name="car-sport-outline" style={{ fontSize: 11 }} /> {load.type}
            </Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--ion-color-medium)' }}>{load.posted}</span>
            <button title={saved ? 'Remove bookmark' : 'Save load'} onClick={handleSave}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: saved ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', padding: 4, display: 'flex', alignItems: 'center' }}>
              <IonIcon name={saved ? 'bookmark' : 'bookmark-outline'} style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        {/* Route */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ion-color-medium)', fontWeight: 700 }}>Origin</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{load.origin}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <IonIcon name="arrow-forward-outline" style={{ fontSize: 15, color: 'var(--ion-color-medium)' }} />
            <span style={{ fontSize: '0.6rem', color: 'var(--ion-color-medium)' }}>{load.miles} mi</span>
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ion-color-medium)', fontWeight: 700 }}>Destination</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{load.dest}</div>
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>Pickup: <strong style={{ color: 'var(--ion-text-color)' }}>{load.pickup}</strong></span>
          <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>Drop: <strong style={{ color: 'var(--ion-text-color)' }}>{load.delivery}</strong></span>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Rate',       value: `$${load.rate?.toLocaleString()}`, color: null },
            { label: '$/mi',       value: `$${load.ratePerMile}`,            color: null },
            { label: 'Net Profit', value: `$${load.netProfit?.toLocaleString()}`, color: SCORE_COLOR[load.profitScore] },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: 'var(--ion-color-light)', borderRadius: 6, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--ion-color-medium)' }}>{label}</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: color || 'var(--ion-text-color)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Deadhead warning */}
        {load.deadhead > 60 && (
          <div style={{ marginBottom: 12, backgroundColor: 'var(--ion-color-warning)', borderRadius: 4, padding: '6px 12px', opacity: 0.9 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#000' }}>⚠ {load.deadhead} mi deadhead — reduces net profit</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {broker ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--ion-color-primary)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {brokerInitials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  {broker.name}
                </div>
                {broker.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IonIcon name="star" style={{ fontSize: 10, color: 'var(--ion-color-warning)' }} />
                    <span style={{ fontSize: '0.6rem', color: 'var(--ion-color-medium)' }}>{broker.rating?.toFixed(1)} ({broker.reviews})</span>
                  </div>
                )}
              </div>
            </div>
          ) : <div />}
          <span style={{ backgroundColor: load.profitScore ? `${SCORE_COLOR[load.profitScore]}1a` : 'var(--ion-color-light)', color: SCORE_COLOR[load.profitScore] || 'var(--ion-text-color)', borderRadius: 10, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3, height: 21, flexShrink: 0 }}>
            <IonIcon name={profitIcon} style={{ fontSize: 11 }} />
            {SCORE_LABEL[load.profitScore]}
          </span>
        </div>
      </div>
    </div>
  );
}
