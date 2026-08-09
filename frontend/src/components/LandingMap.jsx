import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, LocateFixed, Filter, Layers, MapPin, Plus } from 'lucide-react';
import IssueMap, { INDIA_BOUNDS } from './IssueMap';
import api from '../utils/api';

const CATEGORY_FILTERS = ['infrastructure', 'safety', 'environment', 'utilities', 'transportation', 'other'];
const CATEGORY_LABELS = {
  infrastructure: 'Infrastructure',
  safety: 'Safety',
  environment: 'Environment',
  utilities: 'Utilities',
  transportation: 'Transportation',
  other: 'Other'
};

const controlClass =
  'flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f22]/90 px-3 py-2 text-sm font-medium text-slate-300 backdrop-blur transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60';

export default function LandingMap() {
  const [layer, setLayer] = useState('street');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilters, setActiveFilters] = useState(CATEGORY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [flyTarget, setFlyTarget] = useState(null);
  const [locating, setLocating] = useState(false);
  const requestIdRef = useRef(0);

  const fetchIssues = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '100', sort: '-voteCount' });
      const { data } = await api.get(`/issues?${params}`);
      if (requestId !== requestIdRef.current) return;
      setIssues(data.issues || []);
      setError('');
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError('Could not load issues. Showing empty map.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const visibleIssues = issues.filter((i) => activeFilters.includes(i.category));

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSearchError('Location not found');
      } else {
        setFlyTarget({ coords: [parseFloat(data[0].lat), parseFloat(data[0].lon)], zoom: 14 });
      }
    } catch {
      setSearchError('Search failed. Try again.');
    }
    setSearching(false);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation not supported by this browser.');
      return;
    }
    setLocating(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFlyTarget({ coords: [pos.coords.latitude, pos.coords.longitude], zoom: 15 });
        setLocating(false);
      },
      () => {
        setSearchError('Could not fetch your location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleFilter = (cat) => {
    setSearchError('');
    setActiveFilters((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="relative">
      <IssueMap
        issues={visibleIssues}
        bounds={INDIA_BOUNDS}
        layer={layer}
        target={flyTarget}
        height="100%"
        className="h-[400px] sm:h-[460px] lg:h-[540px]"
      />

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
          <span className="rounded-xl bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur">
            Loading issues…
          </span>
        </div>
      )}

      {error && !loading && (
        <p className="absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2 rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-card">
          {error}
        </p>
      )}

      {/* Search + filter */}
      <form onSubmit={handleSearch} className="absolute left-3 right-3 top-3 z-[1000] flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f22]/90 px-3 py-2 shadow-card backdrop-blur">
          <Search size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a location…"
            aria-label="Search location"
            className="w-full min-w-0 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="shrink-0 rounded-lg bg-sky-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-sky-400 disabled:opacity-60"
          >
            {searching ? '…' : 'Search'}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          aria-label="Filter issues"
          aria-expanded={showFilters}
          className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-medium backdrop-blur transition-colors ${
            showFilters
              ? 'border-sky-400/50 bg-sky-500/20 text-sky-300'
              : 'border-white/10 bg-[#0b0f22]/90 text-slate-300 hover:text-white'
          }`}
        >
          <Filter size={15} aria-hidden="true" />
          <span className="ml-1.5 hidden sm:inline">Filter Issues</span>
        </button>
      </form>

      {searchError && !showFilters && (
        <p className="absolute left-3 top-[4.5rem] z-[1000] rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-card">
          {searchError}
        </p>
      )}

      {showFilters && (
        <div className="absolute left-3 top-[4.5rem] z-[1000] w-60 rounded-xl border border-white/10 bg-[#0b0f22]/95 p-3 shadow-pop backdrop-blur">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Filter issues
          </p>
          <div className="space-y-1.5">
            {CATEGORY_FILTERS.map((cat) => {
              const on = activeFilters.includes(cat);
              return (
                <label
                  key={cat}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-200 transition-colors hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleFilter(cat)}
                    className="h-4 w-4 cursor-pointer accent-sky-500"
                  />
                  {CATEGORY_LABELS[cat] || cat}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Locate + layer */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-2">
        <button type="button" onClick={handleLocate} disabled={locating} aria-label="Locate me" className={controlClass}>
          <LocateFixed size={15} aria-hidden="true" />
          {locating ? 'Locating…' : 'Locate Me'}
        </button>
        <button
          type="button"
          onClick={() => setLayer((l) => (l === 'street' ? 'dark' : 'street'))}
          aria-label={`Switch to ${layer === 'street' ? 'dark' : 'street'} map layer`}
          aria-pressed={layer === 'street'}
          className={controlClass}
        >
          <Layers size={15} aria-hidden="true" />
          {layer === 'street' ? 'Dark Map' : 'Street Map'}
        </button>
      </div>

      {/* Floating report button */}
      <Link
        to="/report"
        className="absolute bottom-3 right-3 z-[1000] flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-400 hover:shadow-pop"
      >
        <Plus size={16} aria-hidden="true" />
        Report Issue
      </Link>
    </div>
  );
}
