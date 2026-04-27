import React, { useState } from 'react';
import { IonPopover, IonList, IonItem, IonLabel } from '@ionic/react';
import IonIcon from './IonIcon';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
];

export default function AuthHeader({ lang, setLang, mode, toggleMode }) {
  const [langOpen, setLangOpen] = useState(false);
  const currentLabel = LANGUAGES.find(l => l.value === lang)?.label || 'English';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <img src="/urload-logo.png" alt="Urload" style={{ height: 38, filter: 'brightness(0) invert(1)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          id="lang-trigger"
          onClick={() => setLangOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', fontWeight: 600,
            background: 'transparent', border: 'none', borderRadius: 6,
            padding: '0 8px', height: 32, cursor: 'pointer', outline: 'none',
          }}
        >
          <IonIcon name="globe-outline" style={{ fontSize: 15 }} />
          {currentLabel}
          <IonIcon name="chevron-down-outline" style={{ fontSize: 12, opacity: 0.7 }} />
        </button>

        <IonPopover
          isOpen={langOpen}
          onDidDismiss={() => setLangOpen(false)}
          trigger="lang-trigger"
          triggerAction="click"
          style={{ '--width': '180px', '--border-radius': '12px' }}
        >
          <IonList lines="none">
            {LANGUAGES.map(l => (
              <IonItem
                key={l.value}
                button
                detail={false}
                onClick={() => { setLang(l.value); setLangOpen(false); }}
                style={{
                  '--padding-start': '20px',
                  '--padding-end': '20px',
                  '--inner-padding-end': '0',
                  '--background': lang === l.value ? 'var(--ion-color-step-100)' : 'transparent',
                }}
              >
                <IonLabel style={{ fontSize: '0.9rem' }}>{l.label}</IonLabel>
                {lang === l.value && (
                  <IonIcon name="checkmark-outline" slot="end" style={{ fontSize: 16, color: 'var(--ion-color-primary)' }} />
                )}
              </IonItem>
            ))}
          </IonList>
        </IonPopover>

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
