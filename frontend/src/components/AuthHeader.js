import React from 'react';
import IonIcon from './IonIcon';

export default function AuthHeader({ lang, setLang, mode, toggleMode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <img src="/urload-logo.png" alt="Urload" style={{ height: 38, filter: 'brightness(0) invert(1)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          style={{
            height: 32, color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', fontWeight: 600,
            background: 'transparent', border: 'none', borderRadius: 6,
            padding: '0 10px', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="en" style={{ color: '#000' }}>English</option>
          <option value="es" style={{ color: '#000' }}>Español</option>
          <option value="fr" style={{ color: '#000' }}>Français</option>
        </select>
        <button
          onClick={toggleMode}
          style={{
            color: 'rgba(255,255,255,0.85)', width: 32, height: 32,
            border: 'none', borderRadius: 6,
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <IonIcon name={mode === 'dark' ? 'moon-outline' : 'sunny-outline'} style={{ fontSize: 16 }} />
        </button>
      </div>
    </div>
  );
}
