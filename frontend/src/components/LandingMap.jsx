import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, LocateFixed, Filter, Layers, MapPin, Plus } from 'lucide-react';
import api from '../utils/api';
import { priorityColor } from '../utils/priority';

const DELHI_CENTER = [28.6139, 77.209];

const CATEGORY_FILTERS = ['infrastructure', 'safety', 'environment', 'utilities', 'transportation', 'other'];
const CATEGORY_LABELS = {
  infrastructure: 'Infrastructure',
  safety: 'Safety',
  environment: 'Environment',
  utilities: 'Utilities',
  transportation: 'Transportation',
  other: 'Other'
};

const makeIcon = (priority) => {
  const color = priorityColor(priority);
  const label = Number.isFinite(Number(priority)) ? priority : '?';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 30px; height: 30px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 13px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      border: 3px solid rgba(255,255,255,0.95);
    ">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target.coords, target.zoom, { duration: 1.2 });
  }, [target, map]);
  return null;
}

function FitIssues({ issues }) {
  const map = useMap();
  useEffect(() => {
    if (!issues || issues.length === 0) return;
    const bounds = L.latLngBounds(issues.map((i) => [i.lat, i.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [issues, map]);
  return null;
}

const controlClass =
  'flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f22]/90 px-3 py-2 text-sm font-medium text-slate-300 backdrop-blur transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60';

export default function LandingMap() {
  const [layer, setLayer] = useState('dark');
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
      const real = (data.issues || []).filter(
        (i) =>
          i.location?.coordinates?.length === 2 &&
          i.location.coordinates[0] !== 0 &&
          i.location.coordinates[1] !== 0
      ).map((i) => ({
        _id: i._id,
        title: i.title,
        category: i.category,
        status: i.status,
        votes: i.voteCount,
        priority: i.aiPriority,
        lat: i.location.coordinates[1],
        lng: i.location.coordinates[0]
      }));
      setIssues(real);
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
    <div className="landing-map relative h-[400px] overflow-hidden rounded-[20px] border border-white/10 bg-[#0b0f22] shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:h-[460px] lg:h-[540px]">
      <MapContainer
        center={DELHI_CENTER}
        zoom={12}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          key={layer}
          url={
            layer === 'dark'
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
          attribution={
            layer === 'dark'
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        />
        <FlyTo target={flyTarget} />
        <FitIssues issues={visibleIssues} />
        {visibleIssues.map((issue) => (
          <Marker key={issue._id} position={[issue.lat, issue.lng]} icon={makeIcon(issue.priority)}>
            <Popup>
              <div className="min-w-44" style={{ color: 'var(--ink)' }}>
                <p className="mb-1 text-sm font-semibold">{issue.title}</p>
                <p className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className={`badge badge-${issue.status}`}>{issue.status}</span>
                  <span className="capitalize" style={{ color: 'var(--ink-soft)' }}>
                    {CATEGORY_LABELS[issue.category] || issue.category}
                  </span>
                </p>
                <p className="mb-2 flex items-center gap-1 text-xs" style={{ color: 'var(--ink-soft)' }}>
                  <MapPin size={12} aria-hidden="true" />
                  {issue.votes} votes · priority {issue.priority}/10
                </p>
                <Link
                  to={`/issues/${issue._id}`}
                  className="inline-block rounded-lg px-2.5 py-1 text-xs font-semibold text-white no-underline"
                  style={{ background: 'var(--accent)' }}
                >
                  View Details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

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
          aria-pressed={layer === 'dark'}
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
