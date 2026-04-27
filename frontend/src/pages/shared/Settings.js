import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IonToggle, IonToast, IonSpinner, IonBadge } from '@ionic/react';
import { useThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { settingsApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const LANG_OPTIONS = [
  { key: 'en', label: 'English' },
  { key: 'es', label: 'Español' },
  { key: 'fr', label: 'Français' },
];

const STATUS_CONFIG = {
  normal:   { label: 'Normal',   ionColor: 'success' },
  degraded: { label: 'Degraded', ionColor: 'warning' },
  outage:   { label: 'Outage',   ionColor: 'danger'  },
};

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return m ? m[1] : null;
}

// ── Reusable section card ─────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ion-text-color)', padding: '14px 20px 12px' }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

// ── Row inside a section ──────────────────────────────────────────────────────
function Row({ icon, label, children, onClick, noBorder }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0 0 20px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {icon && (
        <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 14 }}>
          <IonIcon name={icon} style={{ fontSize: 17, color: 'var(--ion-color-medium)' }} />
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingBottom: 14, paddingRight: 20, borderBottom: noBorder ? 'none' : '1px solid var(--ion-border-color)', minWidth: 0 }}>
        <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, color: 'var(--ion-text-color)' }}>{label}</span>
        {children}
      </div>
    </div>
  );
}

// ── Form modal ────────────────────────────────────────────────────────────────
function FormModal({ title, open, onClose, onSubmit, loading, fields, setFields }) {
  if (!open) return null;
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 16, padding: 28, width: 'min(92%, 500px)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{title}</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.15)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <IonIcon name="close-outline" style={{ fontSize: 20, pointerEvents: 'none' }} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea rows={4} value={f.value} onChange={e => setFields(prev => prev.map(x => x.key === f.key ? { ...x, value: e.target.value } : x))}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--ion-color-step-50)', border: '1px solid var(--ion-border-color)', borderRadius: 8, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
              ) : f.type === 'select' ? (
                <select value={f.value} onChange={e => setFields(prev => prev.map(x => x.key === f.key ? { ...x, value: e.target.value } : x))}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', fontFamily: 'inherit' }}>
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={f.type || 'text'} value={f.value} onChange={e => setFields(prev => prev.map(x => x.key === f.key ? { ...x, value: e.target.value } : x))}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--ion-color-step-50)', border: '1px solid var(--ion-border-color)', borderRadius: 8, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', fontFamily: 'inherit' }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid var(--ion-border-color)', borderRadius: 8, background: 'none', cursor: 'pointer', color: 'var(--ion-text-color)', fontSize: '0.875rem', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onSubmit} disabled={loading} style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: 'var(--ion-color-primary)', cursor: loading ? 'default' : 'pointer', color: '#fff', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'inherit', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading && <IonSpinner name="crescent" style={{ width: 14, height: 14 }} />} Submit
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Tutorials modal ───────────────────────────────────────────────────────────
function TutorialsModal({ open, onClose }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null); // category
  const [playingVideo, setPlayingVideo] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    settingsApi.tutorials()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
    setTimeout(() => searchRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (!open) { setSearch(''); setSelected(null); setPlayingVideo(null); }
  }, [open]);

  const filteredCats = search.trim()
    ? categories.map(c => ({
        ...c,
        videos: c.videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase())),
      })).filter(c => c.videos.length > 0 || c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  if (!open) return null;

  const embedUrl = playingVideo ? `https://www.youtube.com/embed/${getYouTubeId(playingVideo.youtube_url)}?autoplay=1` : null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, backgroundColor: 'var(--ion-background-color)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 56, borderBottom: '1px solid var(--ion-border-color)', flexShrink: 0 }}>
        <button
          onClick={() => { if (playingVideo) { setPlayingVideo(null); } else if (selected) { setSelected(null); } else { onClose(); } }}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.15)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <IonIcon name={playingVideo || selected ? 'arrow-back-outline' : 'close-outline'} style={{ fontSize: 20, pointerEvents: 'none' }} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '1.05rem', flex: 1 }}>
          {playingVideo ? playingVideo.title : selected ? selected.name : 'Tutorials'}
        </span>
        {!playingVideo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--ion-color-step-50)', borderRadius: 8, padding: '6px 12px', flex: '0 0 auto', width: 260 }}>
            <IonIcon name="search-outline" style={{ fontSize: 16, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(null); }}
              placeholder="Search videos…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--ion-text-color)', fontSize: '0.875rem', fontFamily: 'inherit' }}
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}>
            <IonSpinner name="crescent" />
          </div>
        ) : playingVideo ? (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <iframe
                src={embedUrl}
                title={playingVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
            {playingVideo.description && (
              <p style={{ color: 'var(--ion-color-medium)', fontSize: '0.9rem', lineHeight: 1.6 }}>{playingVideo.description}</p>
            )}
          </div>
        ) : selected ? (
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selected.videos.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--ion-color-medium)', marginTop: 60 }}>No videos in this category yet.</div>
            ) : selected.videos.map(v => {
              const vid = getYouTubeId(v.youtube_url);
              return (
                <div key={v.id} onClick={() => setPlayingVideo(v)} style={{ display: 'flex', gap: 14, cursor: 'pointer', backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 12, overflow: 'hidden', transition: 'background-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--ion-color-step-50)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--ion-card-background)'}>
                  <div style={{ position: 'relative', width: 180, flexShrink: 0 }}>
                    <img src={vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : ''} alt={v.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IonIcon name="play-outline" style={{ fontSize: 18, color: '#fff', marginLeft: 2 }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: '12px 16px 12px 0', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{v.title}</div>
                    {v.description && <div style={{ fontSize: '0.8rem', color: 'var(--ion-color-medium)', lineHeight: 1.5 }}>{v.description}</div>}
                    {v.duration && <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-step-400)', marginTop: 6 }}>{v.duration}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {filteredCats.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--ion-color-medium)', marginTop: 60 }}>No tutorials found.</div>
            ) : (
              <>
                {!search && <div style={{ fontWeight: 700, color: 'var(--ion-color-medium)', marginBottom: 14, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Playlists</div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, maxWidth: 1100, margin: '0 auto' }}>
                  {filteredCats.map(cat => {
                    const firstVid = cat.videos[0];
                    const thumbVid = firstVid ? getYouTubeId(firstVid.youtube_url) : null;
                    const thumb = cat.thumbnail_url || (thumbVid ? `https://img.youtube.com/vi/${thumbVid}/mqdefault.jpg` : null);
                    return (
                      <div key={cat.id} onClick={() => setSelected(cat)} style={{ cursor: 'pointer', borderRadius: 10, overflow: 'hidden', backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', transition: 'transform 0.15s', userSelect: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <div style={{ width: '100%', paddingBottom: '56.25%', position: 'relative', backgroundColor: 'var(--ion-color-step-100)' }}>
                          {thumb
                            ? <img src={thumb} alt={cat.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IonIcon name="play-circle-outline" style={{ fontSize: 40, color: 'var(--ion-color-step-400)' }} />
                              </div>
                          }
                        </div>
                        <div style={{ padding: '10px 12px 12px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{cat.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--ion-color-medium)' }}>{cat.video_count} video{cat.video_count !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Main Settings page ────────────────────────────────────────────────────────
export default function Settings() {
  const { mode, toggleTheme } = useThemeMode();
  useAuth();
  const isDark = mode === 'dark';

  const [lang, setLang]           = useState(() => localStorage.getItem('urload_lang') || 'en');
  const [showHelp, setShowHelp]   = useState(() => localStorage.getItem('hauliq_show_help') === 'true');
  const [appInfo, setAppInfo]     = useState(null);
  const [showToken, setShowToken] = useState(false);
  const token = localStorage.getItem('urload_token') || '';

  const [tutorialsOpen, setTutorialsOpen]   = useState(false);
  const [featureOpen, setFeatureOpen]       = useState(false);
  const [reportOpen, setReportOpen]         = useState(false);
  const [submitLoading, setSubmitLoading]   = useState(false);
  const [toast, setToast]                   = useState({ open: false, msg: '', color: 'success' });

  const [featureFields, setFeatureFields] = useState([
    { key: 'title', label: 'Feature title', type: 'text', value: '' },
    { key: 'description', label: 'Description', type: 'textarea', value: '' },
  ]);
  const [reportFields, setReportFields] = useState([
    { key: 'title', label: 'Problem summary', type: 'text', value: '' },
    { key: 'description', label: 'Description', type: 'textarea', value: '' },
    { key: 'severity', label: 'Severity', type: 'select', value: 'normal', options: [
      { value: 'low', label: 'Low — cosmetic / minor' },
      { value: 'normal', label: 'Normal — affects workflow' },
      { value: 'high', label: 'High — blocks critical task' },
    ]},
  ]);

  useEffect(() => {
    settingsApi.appInfo().then(setAppInfo).catch(() => {});
  }, []);

  const handleLang = (key) => { setLang(key); localStorage.setItem('urload_lang', key); };
  const handleShowHelp = (val) => { setShowHelp(val); localStorage.setItem('hauliq_show_help', val ? 'true' : 'false'); };

  const handleFeatureSubmit = async () => {
    const title = featureFields.find(f => f.key === 'title')?.value?.trim();
    if (!title) return;
    setSubmitLoading(true);
    try {
      await settingsApi.featureRequest({ title, description: featureFields.find(f => f.key === 'description')?.value || '' });
      setFeatureOpen(false);
      setFeatureFields(prev => prev.map(f => ({ ...f, value: f.key === 'severity' ? 'normal' : '' })));
      setToast({ open: true, msg: 'Feature request submitted!', color: 'success' });
    } catch { setToast({ open: true, msg: 'Failed to submit. Try again.', color: 'danger' }); }
    setSubmitLoading(false);
  };

  const handleReportSubmit = async () => {
    const title = reportFields.find(f => f.key === 'title')?.value?.trim();
    if (!title) return;
    setSubmitLoading(true);
    try {
      await settingsApi.reportProblem({
        title,
        description: reportFields.find(f => f.key === 'description')?.value || '',
        severity: reportFields.find(f => f.key === 'severity')?.value || 'normal',
      });
      setReportOpen(false);
      setReportFields(prev => prev.map(f => ({ ...f, value: f.key === 'severity' ? 'normal' : '' })));
      setToast({ open: true, msg: 'Problem reported. Thank you!', color: 'success' });
    } catch { setToast({ open: true, msg: 'Failed to submit. Try again.', color: 'danger' }); }
    setSubmitLoading(false);
  };

  const status = appInfo?.status || 'normal';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.normal;
  const releaseVideoId = getYouTubeId(appInfo?.release_video_url);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 0 48px' }}>

      {/* ── Status ─────────────────────────────────────────────────────────── */}
      <Section title="Status">
        <Row label="App Status">
          <IonBadge color={statusCfg.ionColor} style={{ color: '#fff' }}>{statusCfg.label}</IonBadge>
        </Row>
        {appInfo && (
          <Row label={`Current version: ${appInfo.current_version}`}>
            <span style={{ fontSize: '0.8rem', color: 'var(--ion-color-medium)' }}>Latest: {appInfo.latest_version}</span>
          </Row>
        )}

        {releaseVideoId && (
          <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 16, paddingBottom: 16 }}>
            <div style={{ width: 600, height: 300, borderRadius: 8, overflow: 'hidden' }}>
              <iframe
                src={`https://www.youtube.com/embed/${releaseVideoId}`}
                title="What's New"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        )}

        {appInfo?.whats_new?.length > 0 && (
          <div style={{ paddingLeft: 20, paddingTop: 0, paddingBottom: 0 }}>
            <div style={{ paddingBottom: 14, paddingRight: 20, borderBottom: '1px solid var(--ion-border-color)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ion-color-medium)', marginBottom: 8 }}>What's New</div>
              <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 5, listStyleType: 'disc' }}>
                {appInfo.whats_new.map((item, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: 'var(--ion-text-color)', lineHeight: 1.6 }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div style={{ paddingLeft: 20, paddingTop: 14, paddingBottom: 14, paddingRight: 20 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Known Issues</div>
          <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {appInfo?.known_issues?.length > 0
              ? appInfo.known_issues.map((item, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: 'var(--ion-text-color)', lineHeight: 1.6 }}>{item}</li>
                ))
              : <li style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)', lineHeight: 1.6 }}>None :)</li>
            }
          </ul>
        </div>
      </Section>

      {/* ── Appearance ─────────────────────────────────────────────────────── */}
      <Section title="Appearance">
        <Row icon="globe-outline" label="Language">
          <div style={{ display: 'flex', gap: 4 }}>
            {LANG_OPTIONS.map(o => (
              <button key={o.key} onClick={() => handleLang(o.key)}
                style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${lang === o.key ? 'var(--ion-color-primary)' : 'var(--ion-border-color)'}`, background: lang === o.key ? 'var(--ion-color-primary)' : 'none', color: lang === o.key ? '#fff' : 'var(--ion-text-color)', fontWeight: lang === o.key ? 700 : 500, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                {o.label}
              </button>
            ))}
          </div>
        </Row>
        <Row icon="moon-outline" label="Dark theme">
          <IonToggle checked={isDark} onIonChange={() => toggleTheme()} style={{ '--handle-width': '20px', '--handle-height': '20px' }} />
        </Row>
        <Row icon="help-circle-outline" label="Show help button" noBorder>
          <IonToggle checked={showHelp} onIonChange={e => handleShowHelp(e.detail.checked)} style={{ '--handle-width': '20px', '--handle-height': '20px' }} />
        </Row>
      </Section>

      {/* ── Support ────────────────────────────────────────────────────────── */}
      <Section title="Support">
        <Row icon="play-circle-outline" label="Tutorials" onClick={() => setTutorialsOpen(true)}>
          <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
        </Row>
        <Row icon="calendar-outline" label="Book a Q&A" onClick={() => window.open('https://calendly.com', '_blank')}>
          <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
        </Row>
        <Row icon="calendar-outline" label="Book a Demo" onClick={() => window.open('https://calendly.com', '_blank')}>
          <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
        </Row>
        <Row icon="send-outline" label="Feature Request" onClick={() => setFeatureOpen(true)}>
          <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
        </Row>
        <Row icon="bug-outline" label="Report a Problem" onClick={() => setReportOpen(true)} noBorder>
          <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
        </Row>
      </Section>

      {/* ── Developer ──────────────────────────────────────────────────────── */}
      <Section title="Developer">
        <Row icon="code-slash-outline" label="API Reference" onClick={() => window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/docs`, '_blank')}>
          <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
        </Row>
        <Row icon="key-outline" label="Access Token" noBorder>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--ion-color-medium)', fontFamily: 'monospace', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {showToken ? token : '•'.repeat(Math.min(token.length, 36))}
            </span>
            <button onClick={() => setShowToken(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-primary)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', fontFamily: 'inherit', padding: '4px 8px' }}>
              {showToken ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </Row>
      </Section>

      {/* ── About ──────────────────────────────────────────────────────────── */}
      <Section title="About">
        <Row icon="document-text-outline" label="Terms of Service" onClick={() => window.open('/terms', '_blank')}>
          <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
        </Row>
        <Row icon="shield-outline" label="Privacy Policy" onClick={() => window.open('/privacy', '_blank')} noBorder>
          <IonIcon name="chevron-forward-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
        </Row>
      </Section>

      <div style={{ textAlign: 'center', color: 'var(--ion-color-step-400)', fontSize: '0.78rem', marginTop: 8 }}>
        v{appInfo?.current_version || '1.0.0'}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <TutorialsModal open={tutorialsOpen} onClose={() => setTutorialsOpen(false)} />

      <FormModal
        title="Feature Request"
        open={featureOpen}
        onClose={() => setFeatureOpen(false)}
        onSubmit={handleFeatureSubmit}
        loading={submitLoading}
        fields={featureFields}
        setFields={setFeatureFields}
      />

      <FormModal
        title="Report a Problem"
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportSubmit}
        loading={submitLoading}
        fields={reportFields}
        setFields={setReportFields}
      />

      <IonToast
        isOpen={toast.open}
        message={toast.msg}
        duration={3000}
        color={toast.color}
        onDidDismiss={() => setToast(t => ({ ...t, open: false }))}
      />
    </div>
  );
}
