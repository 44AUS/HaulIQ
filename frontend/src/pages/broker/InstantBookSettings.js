import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { instantBookApi, networkApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const thStyle = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ion-color-medium)', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--ion-border-color)', backgroundColor: 'var(--ion-background-color)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: '0.82rem', color: 'var(--ion-text-color)', borderBottom: '1px solid var(--ion-border-color)', verticalAlign: 'middle' };

const tabBtnStyle = (active) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, flex: 1, padding: '8px 12px', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: active ? 600 : 400,
  background: 'none', border: 'none', borderBottom: active ? '2px solid var(--ion-color-primary)' : '2px solid transparent',
  color: active ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)', cursor: 'pointer',
});

function Avatar({ name, size = 36 }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#1565c0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
      {initial}
    </div>
  );
}

export default function InstantBookSettings() {
  const [tab, setTab] = useState(0);

  const [allowlist, setAllowlist] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const [uploadText, setUploadText] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [confirmRemove, setConfirmRemove] = useState(null);
  const [networkStatus, setNetworkStatus] = useState({});

  const handleAddToNetwork = (carrierId) => {
    setNetworkStatus(prev => ({ ...prev, [carrierId]: { ...prev[carrierId], loading: true } }));
    networkApi.add(carrierId)
      .then(res => setNetworkStatus(prev => ({ ...prev, [carrierId]: { status: res.status, entry_id: res.id, loading: false } })))
      .catch(() => setNetworkStatus(prev => ({ ...prev, [carrierId]: { ...prev[carrierId], loading: false } })));
  };

  useEffect(() => {
    instantBookApi.allowlist()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setAllowlist(list);
        list.forEach(entry => {
          if (!entry.carrier_id) return;
          networkApi.check(entry.carrier_id)
            .then(res => { if (res?.status) setNetworkStatus(prev => ({ ...prev, [entry.carrier_id]: { status: res.status, entry_id: res.id } })); })
            .catch(() => {});
        });
      })
      .catch(err => setListError(err.message))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (query.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      instantBookApi.searchCarriers(query)
        .then(data => setSearchResults(Array.isArray(data) ? data : []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const isAlreadyAdded = (carrier) => allowlist.some(e => e.carrier_id === carrier.id || e.carrier_email === carrier.email);

  const handleAdd = (carrier) => {
    if (isAlreadyAdded(carrier) || addingId) return;
    setAddingId(carrier.id);
    instantBookApi.add(carrier.id)
      .then(entry => setAllowlist(prev => [entry, ...prev]))
      .catch(() => {})
      .finally(() => setAddingId(null));
  };

  const handleRemove = (entryId) => {
    instantBookApi.remove(entryId)
      .then(() => { setAllowlist(prev => prev.filter(e => e.id !== entryId)); setConfirmRemove(null); })
      .catch(() => setConfirmRemove(null));
  };

  const parseUploadText = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    return lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length === 1) return { email: parts[0] };
      return { name: parts[0], email: parts[1] || '', mc: parts[2] || '' };
    }).filter(r => r.email);
  };

  const handleUploadSubmit = () => {
    if (!uploadText.trim()) return;
    const rows = parseUploadText(uploadText);
    if (!rows.length) return;
    setUploading(true);
    instantBookApi.bulkUpload(rows)
      .then(result => { setUploadResult(result); setUploadText(''); return instantBookApi.allowlist(); })
      .then(data => setAllowlist(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setUploading(false));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadText(ev.target.result);
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ion-text-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IonIcon name="flash-outline" style={{ color: '#2e7d32' }} /> Instant Book Settings
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
            Only carriers on your allowlist can instantly book your loads. Others must submit a Book Now request.
          </p>
        </div>
        <div style={{ ...cardStyle, padding: '12px 24px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 2px', fontSize: '1.6rem', fontWeight: 800, color: 'var(--ion-text-color)' }}>{allowlist.length}</p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Approved carriers</p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, border: '1px solid #2e7d32', borderRadius: 8, backgroundColor: 'rgba(46,125,50,0.04)' }}>
        <IonIcon name="information-circle-outline" style={{ color: '#2e7d32', flexShrink: 0, marginTop: 2, fontSize: 18 }} />
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
          When a load has <strong>Instant Book</strong> enabled, only your approved carriers will see the Instant Book button. All other carriers will see a standard Book Now request that requires your approval.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--ion-border-color)' }}>
        <button style={tabBtnStyle(tab === 0)} onClick={() => setTab(0)}>
          <IonIcon name="people-outline" style={{ fontSize: 15 }} /> Allowlist ({allowlist.length})
        </button>
        <button style={tabBtnStyle(tab === 1)} onClick={() => setTab(1)}>
          <IonIcon name="search-outline" style={{ fontSize: 15 }} /> Add from Urload
        </button>
        <button style={tabBtnStyle(tab === 2)} onClick={() => setTab(2)}>
          <IonIcon name="cloud-upload-outline" style={{ fontSize: 15 }} /> Upload a list
        </button>
      </div>

      {/* Allowlist tab */}
      {tab === 0 && (
        <div style={cardStyle}>
          {listLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><IonSpinner name="crescent" /></div>
          ) : listError ? (
            <div style={{ margin: 16, padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>{listError}</div>
          ) : allowlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <IonIcon name="people-outline" style={{ fontSize: 40, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
              <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No carriers on your allowlist yet</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Add carriers via search or upload</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Carrier', 'MC Number', 'Source', 'Added', 'Network', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {allowlist.map((entry, idx) => {
                    const ns = networkStatus[entry.carrier_id] || {};
                    return (
                      <tr key={entry.id} style={{ backgroundColor: idx % 2 === 1 ? 'var(--ion-color-light)' : 'transparent' }}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar name={entry.carrier_name || entry.carrier_email} size={32} />
                            <div>
                              {entry.carrier_id ? (
                                <Link
                                  to={`/c/${entry.carrier_id?.slice(0,8)}`}
                                  state={{ carrierId: entry.carrier_id }}
                                  style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-color-primary)', textDecoration: 'none' }}
                                >
                                  {entry.carrier_name || '—'}
                                </Link>
                              ) : (
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{entry.carrier_name || '—'}</span>
                              )}
                              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>{entry.carrier_email}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--ion-color-medium)' }}>{entry.carrier_mc || '—'}</td>
                        <td style={tdStyle}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: `1px solid ${entry.source === 'upload' ? '#0288d1' : 'var(--ion-color-primary)'}`, color: entry.source === 'upload' ? '#0288d1' : 'var(--ion-color-primary)', textTransform: 'capitalize' }}>
                            {entry.source}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--ion-color-medium)', fontSize: '0.75rem' }}>
                          {new Date(entry.added_at).toLocaleDateString()}
                        </td>
                        <td style={tdStyle}>
                          {entry.carrier_id && (
                            ns.status === 'accepted' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 600, color: '#2e7d32' }}>
                                <IonIcon name="checkmark-outline" style={{ fontSize: 14 }} /> Network
                              </span>
                            ) : ns.status === 'pending' ? (
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ed6c02' }}>Request Sent</span>
                            ) : (
                              <button
                                onClick={() => handleAddToNetwork(entry.carrier_id)}
                                disabled={ns.loading}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'none', border: 'none', cursor: ns.loading ? 'not-allowed' : 'pointer', fontSize: '0.7rem', color: 'var(--ion-color-primary)', fontFamily: 'inherit' }}
                              >
                                {ns.loading ? <IonSpinner name="crescent" style={{ width: 12, height: 12 }} /> : <IonIcon name="git-network-outline" style={{ fontSize: 14 }} />}
                                {ns.loading ? '…' : 'Add to Network'}
                              </button>
                            )
                          )}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          {confirmRemove === entry.id ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Remove?</span>
                              <button onClick={() => handleRemove(entry.id)} style={{ padding: '2px 6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: '#d32f2f', fontFamily: 'inherit', fontWeight: 600 }}>Yes</button>
                              <button onClick={() => setConfirmRemove(null)} style={{ padding: '2px 6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontFamily: 'inherit' }}>No</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmRemove(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', padding: 4, display: 'flex', alignItems: 'center' }}>
                              <IonIcon name="trash-outline" style={{ fontSize: 16 }} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Search tab */}
      {tab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <IonIcon name="search-outline" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--ion-color-medium)' }} />
            <input
              style={{ ...inputStyle, paddingLeft: 38, paddingRight: searching ? 38 : 12 }}
              placeholder="Search by name, email, or MC number..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {searching && (
              <IonSpinner name="crescent" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16 }} />
            )}
          </div>

          {query.length >= 2 && !searching && searchResults.length === 0 && (
            <div style={{ ...cardStyle, padding: '32px 0', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>No carriers found matching "{query}"</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Only registered Urload carriers appear here</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div style={cardStyle}>
              {searchResults.map((carrier, idx) => {
                const already = isAlreadyAdded(carrier);
                const adding = addingId === carrier.id;
                return (
                  <div key={carrier.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: idx < searchResults.length - 1 ? '1px solid var(--ion-border-color)' : 'none' }}>
                    <Avatar name={carrier.name} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>{carrier.name}</p>
                      <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>
                        {carrier.email}{carrier.mc_number ? ` · ${carrier.mc_number}` : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAdd(carrier)}
                      disabled={already || adding}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', backgroundColor: already ? 'transparent' : 'var(--ion-color-primary)', color: already ? '#2e7d32' : '#fff', border: already ? '1px solid #2e7d32' : 'none', borderRadius: 6, cursor: (already || adding) ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', fontWeight: 600, opacity: (already || adding) ? 0.8 : 1 }}
                    >
                      {already ? <IonIcon name="checkmark-outline" style={{ fontSize: 14 }} /> : adding ? <IonSpinner name="crescent" style={{ width: 12, height: 12, color: '#fff' }} /> : <IonIcon name="person-add-outline" style={{ fontSize: 14 }} />}
                      {already ? 'Added' : adding ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {query.length < 2 && (
            <div style={{ ...cardStyle, padding: '32px 0', textAlign: 'center' }}>
              <IonIcon name="search-outline" style={{ fontSize: 36, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 8px' }} />
              <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Search Urload's carrier database</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Type at least 2 characters to search by name, email, or MC number</p>
            </div>
          )}
        </div>
      )}

      {/* Upload tab */}
      {tab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ ...cardStyle, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <IonIcon name="document-text-outline" style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ion-text-color)' }}>Accepted formats</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Email only', example: 'driver@company.com' },
                { label: 'CSV (Name, Email)', example: 'John Smith, john@co.com' },
                { label: 'CSV (Name, Email, MC)', example: 'John Smith, john@co.com, MC-123' },
              ].map(({ label, example }) => (
                <div key={label} style={{ padding: 12, border: '1px solid var(--ion-border-color)', borderRadius: 6 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ion-text-color)', display: 'block', marginBottom: 4 }}>{label}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontFamily: 'monospace' }}>{example}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            onDrop={handleFileDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: 32, textAlign: 'center', cursor: 'pointer', border: `2px dashed ${dragOver ? 'var(--ion-color-primary)' : 'var(--ion-border-color)'}`, borderRadius: 8, backgroundColor: dragOver ? 'rgba(var(--ion-color-primary-rgb),0.04)' : 'transparent', transition: 'all 0.2s' }}
          >
            <IonIcon name="cloud-upload-outline" style={{ fontSize: 32, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 8px' }} />
            <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Drop a .csv or .txt file here</p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>or click to browse</p>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleFileDrop} />
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Or paste your list</label>
            <textarea
              style={{ ...inputStyle, height: 160, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
              placeholder={"driver@company.com\nJohn Smith, john@co.com, MC-123456\nJane Doe, jane@fleet.com"}
              value={uploadText}
              onChange={e => { setUploadText(e.target.value); setUploadResult(null); }}
            />
          </div>

          {uploadResult && (
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(46,125,50,0.08)', border: '1px solid rgba(46,125,50,0.3)', borderRadius: 6, color: '#2e7d32', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon name="checkmark-outline" style={{ fontSize: 16 }} />
              <span>
                <strong>Upload complete — </strong>
                {uploadResult.added} carrier{uploadResult.added !== 1 ? 's' : ''} added
                {uploadResult.skipped > 0 && `, ${uploadResult.skipped} skipped (duplicates or invalid)`}
              </span>
            </div>
          )}

          <button
            onClick={handleUploadSubmit}
            disabled={!uploadText.trim() || uploading}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', backgroundColor: 'var(--ion-color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: (!uploadText.trim() || uploading) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600, opacity: (!uploadText.trim() || uploading) ? 0.7 : 1 }}
          >
            {uploading ? <IonSpinner name="crescent" style={{ width: 16, height: 16, color: '#fff' }} /> : <IonIcon name="cloud-upload-outline" style={{ fontSize: 16 }} />}
            {uploading ? 'Importing…' : 'Import Carriers'}
          </button>
        </div>
      )}
    </div>
  );
}
