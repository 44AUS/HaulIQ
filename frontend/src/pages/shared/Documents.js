import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IonSpinner, IonModal } from '@ionic/react';
import { useAuth } from '../../context/AuthContext';
import { documentsApi } from '../../services/api';
import IonIcon from '../../components/IonIcon';

const DOC_TYPE_LABELS = {
  BOL: 'Bill of Lading',
  POD: 'Proof of Delivery',
  receipt: 'Receipt',
  rate_confirmation: 'Rate Confirmation',
  other: 'Other',
};

const DOC_TYPE_COLORS = {
  BOL: { bg: 'rgba(21,101,192,0.12)', color: '#1565C0' },
  POD: { bg: 'rgba(45,211,111,0.12)', color: '#2dd36f' },
  receipt: { bg: 'rgba(255,196,9,0.12)', color: '#ffc409' },
  rate_confirmation: { bg: 'rgba(83,177,253,0.12)', color: '#53b1fd' },
  other: { bg: 'rgba(0,0,0,0.07)', color: 'var(--ion-color-medium)' },
};

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', fontFamily: 'inherit' };

function DocTypeChip({ type }) {
  const c = DOC_TYPE_COLORS[type] || DOC_TYPE_COLORS.other;
  return (
    <span style={{ backgroundColor: c.bg, color: c.color, borderRadius: 10, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {DOC_TYPE_LABELS[type] || type}
    </span>
  );
}

function DocViewer({ doc, open, onClose }) {
  const [page, setPage] = useState(0);
  const pages = doc?.pages || [];
  useEffect(() => { setPage(0); }, [doc]);
  if (!doc) return null;
  return (
    <IonModal isOpen={open} onDidDismiss={onClose} style={{ '--width': '720px', '--height': 'auto', '--max-height': '90vh', '--border-radius': '12px' }}>
      <div style={{ backgroundColor: 'var(--ion-card-background)', borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--ion-border-color)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ion-text-color)' }}>{doc.file_name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{doc.load_origin} → {doc.load_destination}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex' }}>
            <IonIcon name="close-outline" style={{ fontSize: 20 }} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {pages.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--ion-color-medium)', fontSize: '0.875rem' }}>No preview available.</div>
          ) : (
            <div style={{ position: 'relative', backgroundColor: 'rgba(0,0,0,0.06)' }}>
              <img src={pages[page]} alt={`Page ${page + 1}`} style={{ width: '100%', display: 'block', maxHeight: 600, objectFit: 'contain' }} />
              {pages.length > 1 && (
                <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '4px 12px' }}>
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ background: 'none', border: 'none', cursor: page === 0 ? 'default' : 'pointer', color: '#fff', opacity: page === 0 ? 0.4 : 1, padding: 2, display: 'flex' }}>
                    <IonIcon name="chevron-back-outline" style={{ fontSize: 16 }} />
                  </button>
                  <span style={{ color: '#fff', fontSize: '0.75rem', minWidth: 44, textAlign: 'center' }}>{page + 1} / {pages.length}</span>
                  <button onClick={() => setPage(p => Math.min(pages.length - 1, p + 1))} disabled={page === pages.length - 1} style={{ background: 'none', border: 'none', cursor: page === pages.length - 1 ? 'default' : 'pointer', color: '#fff', opacity: page === pages.length - 1 ? 0.4 : 1, padding: 2, display: 'flex' }}>
                    <IonIcon name="chevron-forward-outline" style={{ fontSize: 16 }} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </IonModal>
  );
}

export default function Documents() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewing, setViewing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    documentsApi.mine()
      .then(data => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = () => {
    if (!confirmDelete) return;
    setDeleting(true);
    documentsApi.delete(confirmDelete.load_id, confirmDelete.id)
      .then(() => { setDocs(prev => prev.filter(d => d.id !== confirmDelete.id)); setConfirmDelete(null); })
      .catch(() => {})
      .finally(() => setDeleting(false));
  };

  const loadPath = (loadId) => user?.role === 'broker' ? `/broker/loads/${loadId}` : `/carrier/active`;

  const filtered = docs.filter(d => {
    const matchSearch = !search ||
      d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      d.load_origin?.toLowerCase().includes(search.toLowerCase()) ||
      d.load_destination?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.doc_type === typeFilter;
    return matchSearch && matchType;
  });

  const byLoad = filtered.reduce((acc, doc) => {
    const key = doc.load_id;
    if (!acc[key]) acc[key] = { load_id: key, origin: doc.load_origin, destination: doc.load_destination, docs: [] };
    acc[key].docs.push(doc);
    return acc;
  }, {});
  const groups = Object.values(byLoad);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ height: 72, borderRadius: 8, backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', opacity: 0.5 }} />
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <IonIcon name="folder-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 22 }} />
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: 'var(--ion-text-color)' }}>My Documents</h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>All documents you've uploaded, organized by load</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', minWidth: 260 }}>
          <IonIcon name="search-outline" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--ion-color-medium)', pointerEvents: 'none' }} />
          <input
            placeholder="Search by filename or route…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: 32 }}
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}>
          <option value="all">All Types</option>
          {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
          {filtered.length} document{filtered.length !== 1 ? 's' : ''} across {groups.length} load{groups.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      {groups.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px 24px', textAlign: 'center' }}>
          <IonIcon name="folder-outline" style={{ fontSize: 48, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ion-color-medium)', marginBottom: 4 }}>
            {search || typeFilter !== 'all' ? 'No documents match your filters' : 'No documents uploaded yet'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)', opacity: 0.7 }}>Documents you upload to loads will appear here</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {groups.map(group => (
            <div key={group.load_id} style={cardStyle}>
              <div style={{ padding: '16px 20px' }}>
                {/* Load header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IonIcon name="car-sport-outline" style={{ fontSize: 17, color: '#fff' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ion-text-color)' }}>{group.origin} → {group.destination}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)' }}>Load ID: {group.load_id.slice(0, 8)}…</div>
                    </div>
                  </div>
                  <Link to={loadPath(group.load_id)} state={{ from: 'Documents' }} title="View load" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, border: '1px solid var(--ion-border-color)', color: 'var(--ion-color-medium)', textDecoration: 'none' }}>
                    <IonIcon name="open-outline" style={{ fontSize: 15 }} />
                  </Link>
                </div>

                {/* Documents table */}
                <div style={{ border: '1px solid var(--ion-border-color)', borderRadius: 6, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: 'var(--ion-color-medium)', borderBottom: '1px solid var(--ion-border-color)' }}>File</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: 'var(--ion-color-medium)', borderBottom: '1px solid var(--ion-border-color)' }}>Type</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: 'var(--ion-color-medium)', borderBottom: '1px solid var(--ion-border-color)' }}>Pages</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: 'var(--ion-color-medium)', borderBottom: '1px solid var(--ion-border-color)' }}>Uploaded</th>
                        <th style={{ padding: '8px 12px', width: 72, borderBottom: '1px solid var(--ion-border-color)' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {group.docs.map((doc, idx) => (
                        <tr key={doc.id} onClick={() => setViewing(doc)} style={{ cursor: 'pointer', borderTop: idx > 0 ? '1px solid var(--ion-border-color)' : undefined }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <IonIcon name="document-text-outline" style={{ fontSize: 14, color: 'var(--ion-color-medium)', flexShrink: 0 }} />
                              <span style={{ fontSize: '0.875rem', color: 'var(--ion-text-color)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{doc.file_name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}><DocTypeChip type={doc.doc_type} /></td>
                          <td style={{ padding: '10px 12px', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{doc.page_count}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{new Date(doc.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button title="Preview" onClick={() => setViewing(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-medium)', padding: 4, display: 'flex', borderRadius: 4 }}>
                                <IonIcon name="open-outline" style={{ fontSize: 14 }} />
                              </button>
                              <button title="Delete" onClick={() => setConfirmDelete(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ion-color-danger)', padding: 4, display: 'flex', borderRadius: 4 }}>
                                <IonIcon name="trash-outline" style={{ fontSize: 14 }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocViewer doc={viewing} open={!!viewing} onClose={() => setViewing(null)} />

      {/* Delete confirmation */}
      <IonModal isOpen={!!confirmDelete} onDidDismiss={() => setConfirmDelete(null)} style={{ '--width': '400px', '--height': 'auto', '--border-radius': '12px' }}>
        <div style={{ padding: 24, backgroundColor: 'var(--ion-card-background)', borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Delete Document?</h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--ion-color-medium)', lineHeight: 1.6 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--ion-text-color)' }}>{confirmDelete?.file_name}</strong>? This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: 'none', border: '1px solid var(--ion-border-color)', color: 'var(--ion-text-color)', borderRadius: 6, padding: '9px 0', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'var(--ion-color-danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 0', cursor: deleting ? 'default' : 'pointer', fontWeight: 700, fontFamily: 'inherit', opacity: deleting ? 0.7 : 1 }}>
              {deleting ? <IonSpinner name="crescent" style={{ width: 14, height: 14, color: '#fff' }} /> : <IonIcon name="trash-outline" style={{ fontSize: 14 }} />}
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </IonModal>
    </div>
  );
}
