import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';

// Debounce helper
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

export default function CityAutocomplete({ value, onChange, placeholder, required, className }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const fetchSuggestions = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=us&featuretype=city&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      const results = data
        .filter(r => r.address?.city || r.address?.town || r.address?.village || r.address?.county)
        .map(r => {
          const place = r.address?.city || r.address?.town || r.address?.village || r.address?.county;
          const state = r.address?.state;
          const label = state ? `${place}, ${state}` : place;
          return { label, display_name: r.display_name };
        })
        .filter((r, i, arr) => arr.findIndex(x => x.label === r.label) === i) // dedupe
        .slice(0, 6);
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useDebounce(fetchSuggestions, 300);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q);
    debouncedFetch(q);
  };

  const handleSelect = (label) => {
    setQuery(label);
    onChange(label);
    setSuggestions([]);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        className={className || 'input'}
        value={query}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder || 'City, State'}
        required={required}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-3.5 h-3.5 border border-dark-400/40 border-t-brand-400 rounded-full animate-spin" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-dark-800 border border-dark-400/40 rounded-lg shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-dark-100 hover:bg-dark-700 transition-colors text-left"
                onMouseDown={() => handleSelect(s.label)}
              >
                <MapPin size={12} className="text-brand-400 flex-shrink-0" />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
