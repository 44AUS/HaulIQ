import { useState, useEffect, useRef } from 'react';
import { Zap, Search, Upload, Check, UserPlus, Trash2, AlertCircle, FileText, Users } from 'lucide-react';
import { instantBookApi } from '../../services/api';

export default function InstantBookSettings() {
  const [tab, setTab] = useState('list');

  // Allowlist state
  const [allowlist, setAllowlist] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  // Search tab state
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);

  // Upload tab state
  const [uploadText, setUploadText] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Remove confirm
  const [confirmRemove, setConfirmRemove] = useState(null);

  // Load allowlist on mount
  useEffect(() => {
    instantBookApi.allowlist()
      .then(data => setAllowlist(Array.isArray(data) ? data : []))
      .catch(err => setListError(err.message))
      .finally(() => setListLoading(false));
  }, []);

  // Search carriers with debounce
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

  const isAlreadyAdded = (carrier) =>
    allowlist.some(e => e.carrier_id === carrier.id || e.carrier_email === carrier.email);

  const handleAdd = (carrier) => {
    if (isAlreadyAdded(carrier) || addingId) return;
    setAddingId(carrier.id);
    instantBookApi.add(carrier.id)
      .then(entry => {
        setAllowlist(prev => [entry, ...prev]);
      })
      .catch(() => {})
      .finally(() => setAddingId(null));
  };

  const handleRemove = (entryId) => {
    instantBookApi.remove(entryId)
      .then(() => {
        setAllowlist(prev => prev.filter(e => e.id !== entryId));
        setConfirmRemove(null);
      })
      .catch(() => setConfirmRemove(null));
  };

  // Parse pasted CSV/text
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
      .then(result => {
        setUploadResult(result);
        setUploadText('');
        // Refresh the allowlist
        return instantBookApi.allowlist();
      })
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={20} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Instant Book Settings</h1>
          </div>
          <p className="text-dark-300 text-sm">
            Only carriers on your allowlist can instantly book your loads. Others must submit a Book Now request.
          </p>
        </div>
        <div className="glass border border-dark-400/40 rounded-xl px-4 py-3 text-center">
          <p className="text-white font-bold text-2xl">{allowlist.length}</p>
          <p className="text-dark-400 text-xs">Approved carriers</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-emerald-300/80 text-sm leading-relaxed">
          When a load has <strong className="text-emerald-400">Instant Book</strong> enabled, only your approved carriers will see the Instant Book button. All other carriers will see a standard Book Now request that requires your approval.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-dark-400/40 w-fit">
        {[
          { key: 'list',   label: `Allowlist (${allowlist.length})`, icon: Users },
          { key: 'search', label: 'Add from HaulIQ',                 icon: Search },
          { key: 'upload', label: 'Upload a list',                   icon: Upload },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-dark-600 text-white' : 'text-dark-300 hover:text-white'
            }`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Allowlist tab ── */}
      {tab === 'list' && (
        <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
          {listLoading ? (
            <div className="py-16 flex justify-center">
              <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : listError ? (
            <div className="py-16 text-center">
              <p className="text-red-400 text-sm">{listError}</p>
            </div>
          ) : allowlist.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={36} className="text-dark-600 mx-auto mb-3" />
              <p className="text-dark-300 text-sm">No carriers on your allowlist yet</p>
              <p className="text-dark-500 text-xs mt-1">Add carriers via search or upload</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-400/40">
                  <th className="text-left px-5 py-3 text-dark-300 text-xs font-medium">Carrier</th>
                  <th className="text-left px-5 py-3 text-dark-300 text-xs font-medium hidden sm:table-cell">MC Number</th>
                  <th className="text-left px-5 py-3 text-dark-300 text-xs font-medium hidden md:table-cell">Source</th>
                  <th className="text-left px-5 py-3 text-dark-300 text-xs font-medium hidden md:table-cell">Added</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {allowlist.map(entry => (
                  <tr key={entry.id} className="border-b border-dark-400/20 hover:bg-dark-700/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
                          {(entry.carrier_name || entry.carrier_email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{entry.carrier_name || '—'}</p>
                          <p className="text-dark-400 text-xs">{entry.carrier_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-dark-300 text-sm">{entry.carrier_mc || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${
                        entry.source === 'upload'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                      }`}>
                        {entry.source}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-dark-400 text-xs">
                        {new Date(entry.added_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {confirmRemove === entry.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-dark-400 text-xs">Remove?</span>
                          <button onClick={() => handleRemove(entry.id)}
                            className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors">Yes</button>
                          <button onClick={() => setConfirmRemove(null)}
                            className="text-dark-400 hover:text-white text-xs transition-colors">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmRemove(entry.id)}
                          className="text-dark-500 hover:text-red-400 transition-colors p-1">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Search tab ── */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" />
            <input
              className="input pl-9"
              placeholder="Search by name, email, or MC number..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            )}
          </div>

          {query.length >= 2 && !searching && searchResults.length === 0 && (
            <div className="glass rounded-xl border border-dark-400/40 p-8 text-center">
              <p className="text-dark-300 text-sm">No carriers found matching "{query}"</p>
              <p className="text-dark-500 text-xs mt-1">Only registered HaulIQ carriers appear here</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="glass rounded-xl border border-dark-400/40 overflow-hidden">
              {searchResults.map(carrier => {
                const already = isAlreadyAdded(carrier);
                const adding = addingId === carrier.id;
                return (
                  <div key={carrier.id}
                    className="flex items-center gap-4 px-5 py-4 border-b border-dark-400/20 last:border-0 hover:bg-dark-700/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-bold flex-shrink-0">
                      {carrier.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{carrier.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-dark-400 text-xs">{carrier.email}</p>
                        {carrier.mc_number && (
                          <>
                            <span className="text-dark-600">·</span>
                            <p className="text-dark-400 text-xs">{carrier.mc_number}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(carrier)}
                      disabled={already || adding}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        already
                          ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 cursor-default'
                          : 'bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-60'
                      }`}>
                      {already ? <><Check size={12} /> Added</> : adding ? 'Adding…' : <><UserPlus size={12} /> Add</>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {query.length < 2 && (
            <div className="glass rounded-xl border border-dark-400/40 p-8 text-center">
              <Search size={28} className="text-dark-600 mx-auto mb-2" />
              <p className="text-dark-300 text-sm">Search HaulIQ's carrier database</p>
              <p className="text-dark-500 text-xs mt-1">Type at least 2 characters to search by name, email, or MC number</p>
            </div>
          )}
        </div>
      )}

      {/* ── Upload tab ── */}
      {tab === 'upload' && (
        <div className="space-y-5">
          <div className="glass rounded-xl border border-dark-400/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={15} className="text-dark-300" />
              <p className="text-white text-sm font-medium">Accepted formats</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: 'Email only',        example: 'driver@company.com' },
                { label: 'CSV (Name, Email)', example: 'John Smith, john@co.com' },
                { label: 'CSV (Name, Email, MC)', example: 'John Smith, john@co.com, MC-123' },
              ].map(({ label, example }) => (
                <div key={label} className="bg-dark-700/50 rounded-lg p-3">
                  <p className="text-dark-200 text-xs font-medium mb-1">{label}</p>
                  <p className="text-dark-400 text-xs font-mono">{example}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            onDrop={handleFileDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver ? 'border-brand-500/60 bg-brand-500/5' : 'border-dark-400/40 hover:border-dark-300/60'
            }`}>
            <Upload size={24} className="text-dark-400 mx-auto mb-2" />
            <p className="text-dark-200 text-sm">Drop a .csv or .txt file here</p>
            <p className="text-dark-500 text-xs mt-1">or click to browse</p>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileDrop} />
          </div>

          <div>
            <label className="block text-dark-100 text-sm font-medium mb-2">Or paste your list</label>
            <textarea
              className="input resize-none font-mono text-sm"
              rows={8}
              placeholder={"driver@company.com\nJohn Smith, john@co.com, MC-123456\nJane Doe, jane@fleet.com"}
              value={uploadText}
              onChange={e => { setUploadText(e.target.value); setUploadResult(null); }}
            />
          </div>

          {uploadResult && (
            <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 flex items-center gap-3">
              <Check size={18} className="text-brand-400 flex-shrink-0" />
              <div>
                <p className="text-brand-400 font-semibold text-sm">Upload complete</p>
                <p className="text-dark-300 text-xs mt-0.5">
                  {uploadResult.added} carrier{uploadResult.added !== 1 ? 's' : ''} added
                  {uploadResult.skipped > 0 && `, ${uploadResult.skipped} skipped (duplicates or invalid)`}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleUploadSubmit}
            disabled={!uploadText.trim() || uploading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-40">
            <Upload size={16} /> {uploading ? 'Importing…' : 'Import Carriers'}
          </button>
        </div>
      )}
    </div>
  );
}
