import { useState, useEffect } from 'react';
import { IonSpinner, IonToast, IonBadge } from '@ionic/react';
import { settingsApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const thStyle = { backgroundColor: 'var(--ion-background-color)', color: 'var(--ion-color-medium)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' };
const tdStyle = { padding: '12px 16px', fontSize: '0.875rem', color: 'var(--ion-text-color)', borderTop: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

const STATUS_OPTIONS = ['normal', 'degraded', 'outage'];
const SEVERITY_COLORS = { low: '#2dd36f', normal: '#ffce00', high: '#eb445a' };

function inputStyle(extra = {}) {
  return { width: '100%', boxSizing: 'border-box', background: 'var(--ion-color-step-50)', border: '1px solid var(--ion-border-color)', borderRadius: 8, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', fontFamily: 'inherit', ...extra };
}

// ── App Info Tab ──────────────────────────────────────────────────────────────
function AppInfoTab() {
  const [info, setInfo]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState({ open: false, msg: '', color: 'success' });

  const [form, setForm] = useState({
    status: 'normal', current_version: '1.0.0', latest_version: '1.0.0',
    release_video_url: '', whats_new: [], known_issues: [],
  });
  const [newWhat, setNewWhat]   = useState('');
  const [newIssue, setNewIssue] = useState('');

  useEffect(() => {
    settingsApi.adminGetAppInfo()
      .then(d => { setInfo(d); setForm({ ...d, whats_new: d.whats_new || [], known_issues: d.known_issues || [], release_video_url: d.release_video_url || '' }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await settingsApi.adminUpdateAppInfo(form);
      setToast({ open: true, msg: 'App info saved!', color: 'success' });
    } catch { setToast({ open: true, msg: 'Save failed.', color: 'danger' }); }
    setSaving(false);
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (loading) return <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><IonSpinner name="crescent" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inputStyle(), background: 'var(--ion-card-background)' }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>Current Version</label>
          <input value={form.current_version} onChange={e => set('current_version', e.target.value)} style={inputStyle()} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>Latest Version</label>
          <input value={form.latest_version} onChange={e => set('latest_version', e.target.value)} style={inputStyle()} />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 4, fontWeight: 500 }}>Release Video URL (YouTube)</label>
        <input value={form.release_video_url} onChange={e => set('release_video_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." style={inputStyle()} />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 8, fontWeight: 500 }}>What's New</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {form.whats_new.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8, padding: '8px 12px' }}>
              <span style={{ flex: 1, fontSize: '0.875rem' }}>{item}</span>
              <button onClick={() => set('whats_new', form.whats_new.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-danger)', padding: 4, display: 'flex', alignItems: 'center' }}>
                <IonIcon name="close-circle-outline" style={{ fontSize: 18 }} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newWhat} onChange={e => setNewWhat(e.target.value)} placeholder="Add item…"
            onKeyDown={e => { if (e.key === 'Enter' && newWhat.trim()) { set('whats_new', [...form.whats_new, newWhat.trim()]); setNewWhat(''); } }}
            style={{ ...inputStyle(), flex: 1 }} />
          <button onClick={() => { if (newWhat.trim()) { set('whats_new', [...form.whats_new, newWhat.trim()]); setNewWhat(''); } }}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: 'var(--ion-color-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>Add</button>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ion-color-medium)', marginBottom: 8, fontWeight: 500 }}>Known Issues</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {form.known_issues.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8, padding: '8px 12px' }}>
              <span style={{ flex: 1, fontSize: '0.875rem' }}>{item}</span>
              <button onClick={() => set('known_issues', form.known_issues.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-danger)', padding: 4, display: 'flex', alignItems: 'center' }}>
                <IonIcon name="close-circle-outline" style={{ fontSize: 18 }} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newIssue} onChange={e => setNewIssue(e.target.value)} placeholder="Add issue…"
            onKeyDown={e => { if (e.key === 'Enter' && newIssue.trim()) { set('known_issues', [...form.known_issues, newIssue.trim()]); setNewIssue(''); } }}
            style={{ ...inputStyle(), flex: 1 }} />
          <button onClick={() => { if (newIssue.trim()) { set('known_issues', [...form.known_issues, newIssue.trim()]); setNewIssue(''); } }}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: 'var(--ion-color-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>Add</button>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        style={{ alignSelf: 'flex-start', padding: '10px 28px', border: 'none', borderRadius: 8, background: 'var(--ion-color-primary)', color: '#fff', cursor: saving ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'inherit', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        {saving && <IonSpinner name="crescent" style={{ width: 14, height: 14 }} />} Save Changes
      </button>

      <IonToast isOpen={toast.open} message={toast.msg} duration={3000} color={toast.color} onDidDismiss={() => setToast(t => ({ ...t, open: false }))} />
    </div>
  );
}

// ── Tutorials Tab ─────────────────────────────────────────────────────────────
function TutorialsTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [videos, setVideos]         = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [toast, setToast]           = useState({ open: false, msg: '', color: 'success' });

  const [newCat, setNewCat]     = useState({ name: '', thumbnail_url: '', description: '' });
  const [newVid, setNewVid]     = useState({ title: '', youtube_url: '', description: '', duration: '' });
  const [addingCat, setAddingCat]   = useState(false);
  const [addingVid, setAddingVid]   = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showVidForm, setShowVidForm] = useState(false);

  const loadCats = () => {
    setLoading(true);
    settingsApi.adminListCategories().then(setCategories).catch(() => {}).finally(() => setLoading(false));
  };

  const loadVideos = (catId) => {
    setVideosLoading(true);
    settingsApi.adminListVideos(catId).then(setVideos).catch(() => {}).finally(() => setVideosLoading(false));
  };

  useEffect(() => { loadCats(); }, []);

  const createCategory = async () => {
    if (!newCat.name.trim()) return;
    setAddingCat(true);
    try {
      await settingsApi.adminCreateCategory(newCat);
      setNewCat({ name: '', thumbnail_url: '', description: '' });
      setShowCatForm(false);
      loadCats();
      setToast({ open: true, msg: 'Category created!', color: 'success' });
    } catch { setToast({ open: true, msg: 'Failed to create category.', color: 'danger' }); }
    setAddingCat(false);
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category and all its videos?')) return;
    try {
      await settingsApi.adminDeleteCategory(id);
      if (selected?.id === id) { setSelected(null); setVideos([]); }
      loadCats();
      setToast({ open: true, msg: 'Category deleted.', color: 'success' });
    } catch { setToast({ open: true, msg: 'Failed to delete.', color: 'danger' }); }
  };

  const selectCategory = (cat) => { setSelected(cat); loadVideos(cat.id); setShowVidForm(false); };

  const createVideo = async () => {
    if (!newVid.title.trim() || !newVid.youtube_url.trim()) return;
    setAddingVid(true);
    try {
      await settingsApi.adminCreateVideo(selected.id, newVid);
      setNewVid({ title: '', youtube_url: '', description: '', duration: '' });
      setShowVidForm(false);
      loadVideos(selected.id);
      setToast({ open: true, msg: 'Video added!', color: 'success' });
    } catch { setToast({ open: true, msg: 'Failed to add video.', color: 'danger' }); }
    setAddingVid(false);
  };

  const deleteVideo = async (id) => {
    try {
      await settingsApi.adminDeleteVideo(id);
      loadVideos(selected.id);
    } catch { setToast({ open: true, msg: 'Failed to delete video.', color: 'danger' }); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
      {/* Category sidebar */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Categories</span>
          <button onClick={() => setShowCatForm(v => !v)}
            style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--ion-color-primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IonIcon name={showCatForm ? 'close-outline' : 'add-outline'} style={{ fontSize: 16 }} />
          </button>
        </div>

        {showCatForm && (
          <div style={{ backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 10, padding: 14, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} placeholder="Category name *" style={{ ...inputStyle() }} />
            <input value={newCat.thumbnail_url} onChange={e => setNewCat(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="Thumbnail URL (optional)" style={{ ...inputStyle() }} />
            <button onClick={createCategory} disabled={addingCat}
              style={{ padding: '7px 0', border: 'none', borderRadius: 8, background: 'var(--ion-color-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {addingCat && <IonSpinner name="crescent" style={{ width: 13, height: 13 }} />} Create
            </button>
          </div>
        )}

        {loading ? <IonSpinner name="crescent" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {categories.map(cat => (
              <div key={cat.id} onClick={() => selectCategory(cat)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', backgroundColor: selected?.id === cat.id ? 'var(--ion-color-primary)' : 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', transition: 'background-color 0.15s' }}>
                <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: selected?.id === cat.id ? 700 : 400, color: selected?.id === cat.id ? '#fff' : 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                <span style={{ fontSize: '0.75rem', color: selected?.id === cat.id ? 'rgba(255,255,255,0.7)' : 'var(--ion-color-medium)', flexShrink: 0 }}>{cat.video_count}</span>
                <button onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: selected?.id === cat.id ? 'rgba(255,255,255,0.8)' : 'var(--ion-color-danger)', padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <IonIcon name="trash-outline" style={{ fontSize: 15 }} />
                </button>
              </div>
            ))}
            {categories.length === 0 && <div style={{ color: 'var(--ion-color-medium)', fontSize: '0.875rem', textAlign: 'center', paddingTop: 20 }}>No categories yet.</div>}
          </div>
        )}
      </div>

      {/* Video list */}
      <div>
        {!selected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>
            Select a category to manage its videos
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{selected.name} — Videos</span>
              <button onClick={() => setShowVidForm(v => !v)}
                style={{ padding: '6px 14px', border: 'none', borderRadius: 8, background: 'var(--ion-color-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                <IonIcon name="add-outline" style={{ fontSize: 16 }} /> Add Video
              </button>
            </div>

            {showVidForm && (
              <div style={{ backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 10, padding: 16, marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input value={newVid.title} onChange={e => setNewVid(p => ({ ...p, title: e.target.value }))} placeholder="Video title *" style={{ ...inputStyle(), gridColumn: '1 / -1' }} />
                <input value={newVid.youtube_url} onChange={e => setNewVid(p => ({ ...p, youtube_url: e.target.value }))} placeholder="YouTube URL *" style={{ ...inputStyle() }} />
                <input value={newVid.duration} onChange={e => setNewVid(p => ({ ...p, duration: e.target.value }))} placeholder="Duration (e.g. 5:30)" style={{ ...inputStyle() }} />
                <input value={newVid.description} onChange={e => setNewVid(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" style={{ ...inputStyle(), gridColumn: '1 / -1' }} />
                <button onClick={createVideo} disabled={addingVid}
                  style={{ gridColumn: '1 / -1', padding: '8px 0', border: 'none', borderRadius: 8, background: 'var(--ion-color-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {addingVid && <IonSpinner name="crescent" style={{ width: 13, height: 13 }} />} Add Video
                </button>
              </div>
            )}

            {videosLoading ? <IonSpinner name="crescent" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {videos.map(v => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 10, padding: '10px 14px' }}>
                    <IonIcon name="play-circle-outline" style={{ fontSize: 22, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.youtube_url}</div>
                    </div>
                    {v.duration && <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', flexShrink: 0 }}>{v.duration}</span>}
                    <button onClick={() => deleteVideo(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-danger)', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <IonIcon name="trash-outline" style={{ fontSize: 16 }} />
                    </button>
                  </div>
                ))}
                {videos.length === 0 && <div style={{ color: 'var(--ion-color-medium)', fontSize: '0.875rem', textAlign: 'center', paddingTop: 20 }}>No videos yet. Add one above.</div>}
              </div>
            )}
          </>
        )}
      </div>

      <IonToast isOpen={toast.open} message={toast.msg} duration={3000} color={toast.color} onDidDismiss={() => setToast(t => ({ ...t, open: false }))} />
    </div>
  );
}

// ── Feature Requests Tab ──────────────────────────────────────────────────────
function FeatureRequestsTab() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState({ open: false, msg: '', color: 'success' });

  useEffect(() => {
    settingsApi.adminFeatureRequests().then(setRows).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await settingsApi.adminUpdateFeatureReq(id, status);
      setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch { setToast({ open: true, msg: 'Failed to update.', color: 'danger' }); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><IonSpinner name="crescent" /></div>;

  return (
    <div>
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--ion-border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--ion-card-background)' }}>
          <thead>
            <tr>
              {['User', 'Title', 'Description', 'Status', 'Date', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--ion-color-medium)' }}>No feature requests yet.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td style={tdStyle}><div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{r.user_name}</div><div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{r.user_email}</div></td>
                <td style={tdStyle}>{r.title}</td>
                <td style={{ ...tdStyle, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '—'}</td>
                <td style={tdStyle}><IonBadge color={r.status === 'open' ? 'primary' : r.status === 'planned' ? 'warning' : 'success'} style={{ fontSize: '0.7rem' }}>{r.status}</IonBadge></td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                    style={{ background: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.8rem', padding: '4px 8px', cursor: 'pointer' }}>
                    {['open', 'planned', 'done', 'rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <IonToast isOpen={toast.open} message={toast.msg} duration={3000} color={toast.color} onDidDismiss={() => setToast(t => ({ ...t, open: false }))} />
    </div>
  );
}

// ── Reported Problems Tab ─────────────────────────────────────────────────────
function ReportedProblemsTab() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState({ open: false, msg: '', color: 'success' });

  useEffect(() => {
    settingsApi.adminReportedProblems().then(setRows).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await settingsApi.adminUpdateProblem(id, status);
      setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch { setToast({ open: true, msg: 'Failed to update.', color: 'danger' }); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><IonSpinner name="crescent" /></div>;

  return (
    <div>
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--ion-border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--ion-card-background)' }}>
          <thead>
            <tr>
              {['User', 'Title', 'Description', 'Severity', 'Status', 'Date', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--ion-color-medium)' }}>No problems reported yet.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td style={tdStyle}><div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{r.user_name}</div><div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{r.user_email}</div></td>
                <td style={tdStyle}>{r.title}</td>
                <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '—'}</td>
                <td style={tdStyle}><span style={{ fontSize: '0.78rem', fontWeight: 700, color: SEVERITY_COLORS[r.severity] || '#aaa' }}>{r.severity}</span></td>
                <td style={tdStyle}><IonBadge color={r.status === 'open' ? 'danger' : r.status === 'in_progress' ? 'warning' : 'success'} style={{ fontSize: '0.7rem' }}>{r.status}</IonBadge></td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                    style={{ background: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.8rem', padding: '4px 8px', cursor: 'pointer' }}>
                    {['open', 'in_progress', 'resolved', 'dismissed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <IonToast isOpen={toast.open} message={toast.msg} duration={3000} color={toast.color} onDidDismiss={() => setToast(t => ({ ...t, open: false }))} />
    </div>
  );
}

// ── Admin Settings main page ──────────────────────────────────────────────────
const TABS = [
  { key: 'app-info',   label: 'App Info' },
  { key: 'tutorials',  label: 'Tutorials' },
  { key: 'features',   label: 'Feature Requests' },
  { key: 'problems',   label: 'Reported Problems' },
];

export default function AdminSettings() {
  const [tab, setTab] = useState('app-info');

  return (
    <div style={{ padding: '0 0 40px' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.4rem', fontWeight: 700 }}>App Settings</h2>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--ion-border-color)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', borderBottom: tab === t.key ? '2px solid var(--ion-color-primary)' : '2px solid transparent', marginBottom: -1, transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'app-info'  && <AppInfoTab />}
      {tab === 'tutorials' && <TutorialsTab />}
      {tab === 'features'  && <FeatureRequestsTab />}
      {tab === 'problems'  && <ReportedProblemsTab />}
    </div>
  );
}
