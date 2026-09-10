import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, LocateFixed, Filter, Layers, Plus, X } from 'lucide-react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { INDIAN_STATES } from '../data/india';
import { normalizeStateName } from '../utils/indiaStates';
import { fetchAllIssues } from '../utils/api';

const INDIA_CENTER = [22.5, 79.5];
const INDIA_BOUNDS = [[6.5, 68.1], [37.4, 97.4]];

const TILE_URLS = {
  street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};

const TILE_ATTRIBUTIONS = {
  street: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  dark: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
};

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

function MapController({ target, geo }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(INDIA_BOUNDS, { padding: [16, 16] });
  }, [map]);

  useEffect(() => {
    if (!target) return;
    map.flyTo(target.coords, target.zoom ?? 5, { duration: 1.2 });
  }, [map, target]);

  return null;
}

export default function LandingMap() {
  const [layer, setLayer] = useState('street');
  const [issues, setIssues] = useState([]);
  const [geo, setGeo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilters, setActiveFilters] = useState(CATEGORY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [flyTarget, setFlyTarget] = useState(null);
  const [locating, setLocating] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [glowIndex, setGlowIndex] = useState(0);
  const requestIdRef = useRef(0);
  const layersRef = useRef({});

  useEffect(() => {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    if (accent) setAccentColor(accent);
    const onTheme = () => {
      const a = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      if (a) setAccentColor(a);
    };
    window.addEventListener('themechange', onTheme);
    const mo = new MutationObserver(onTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      window.removeEventListener('themechange', onTheme);
      mo.disconnect();
    };
  }, []);

  const fetchIssues = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const all = await fetchAllIssues({ sort: '-voteCount' });
      if (requestId !== requestIdRef.current) return;
      setIssues(all);
      setError('');
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError('Could not load issues. Showing empty map.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  useEffect(() => {
    fetch('/india-states.geojson')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no geo'))))
      .then((data) => setGeo(data))
      .catch(() => setError((prev) => prev || 'Could not load state boundaries.'));
  }, []);

  const shadedIssues = issues.filter((i) => activeFilters.includes(i.category));
  const reported = {};
  for (const issue of shadedIssues) {
    const key = normalizeStateName(issue.state);
    if (key) reported[key] = (reported[key] || 0) + 1;
  }

  const reportedList = Object.keys(reported);
  const activeName = reportedList.length ? reportedList[glowIndex % reportedList.length] : null;

  useEffect(() => {
    if (reportedList.length < 2) return;
    const id = setInterval(() => {
      setGlowIndex((i) => (i + 1) % reportedList.length);
    }, 1400);
    return () => clearInterval(id);
  }, [reportedList.length]);

  useEffect(() => {
    for (const [name, layer] of Object.entries(layersRef.current)) {
      const count = reported[name] || 0;
      const isActive = name === activeName;
      const isWaiting = count > 0 && !isActive;
      layer.setStyle(styleForName(name, isActive, isWaiting));
      layer.getElement()?.classList.toggle('state-glow', isActive);
      if (isActive) layer.bringToFront();
    }
  }, [glowIndex, reportedList, accentColor, activeFilters, geo]);

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
        setFlyTarget({ coords: [parseFloat(data[0].lat), parseFloat(data[0].lon)], zoom: 12 });
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
        setFlyTarget({ coords: [pos.coords.latitude, pos.coords.longitude], zoom: 12 });
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
    setFlyTarget(null);
    setActiveFilters((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setSearchError('');
    if (!geo) return;
    if (!state) {
      setFlyTarget({ coords: INDIA_CENTER, zoom: 5 });
      return;
    }
    const norm = normalizeStateName(state);
    const feature = (geo.features || []).find(
      (f) => normalizeStateName(f.properties?.NAME_1) === norm
    );
    if (feature) {
      const bounds = L.geoJSON(feature).getBounds();
      setFlyTarget({ coords: bounds.getCenter(), zoom: 6 });
    } else {
      setSearchError('Could not locate that state');
    }
  };

  const styleForName = (name, isActive, isWaiting) => {
    if (isActive) {
      return {
        color: '#ffffff',
        weight: 2.5,
        fillColor: accentColor,
        fillOpacity: 0.95
      };
    }
    if (isWaiting) {
      return {
        color: accentColor,
        weight: 1.2,
        fillColor: accentColor,
        fillOpacity: 0.4
      };
    }
    return {
      color: '#475569',
      weight: 1,
      fillColor: '#334155',
      fillOpacity: 0.28
    };
  };

  const styleFeature = (feature) => {
    const name = normalizeStateName(feature.properties?.NAME_1);
    const count = reported[name] || 0;
    return styleForName(name, name === activeName, count > 0 && name !== activeName);
  };

  const onEachFeature = (feature, layer) => {
    const name = normalizeStateName(feature.properties?.NAME_1);
    const count = reported[name] || 0;
    const label = feature.properties?.NAME_1 || 'Unknown';
    layersRef.current[name] = layer;
    layer.bindTooltip(
      `<strong>${label}</strong><br/>${
        count > 0
          ? `${count} reported issue${count > 1 ? 's' : ''}`
          : 'No issues reported'
      }`,
      { sticky: true, direction: 'top' }
    );
    layer.on({
      mouseover: (e) => {
        if (!reported[name]) return;
        const el = e.target;
        el.setStyle({ fillOpacity: 0.98, weight: 2, color: '#ffffff' });
        el.bringToFront();
      },
      mouseout: (e) => {
        const isActive = name === activeName;
        const isWaiting = count > 0 && !isActive;
        e.target.setStyle(styleForName(name, isActive, isWaiting));
      }
    });
  };

  const numReported = Object.keys(reported).length;
  const numStates = geo?.features?.length ?? 0;
  const reportedKey = Object.keys(reported).sort().join(',');

  return (
    <div className="relative">
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 shadow-card landing-map h-[400px] sm:h-[460px] lg:h-[540px]"
        role="region"
        aria-label="Map of Indian states with reported civic issues"
      >
        <MapContainer
          center={INDIA_CENTER}
          zoom={5}
          scrollWheelZoom
          minZoom={5}
          maxZoom={12}
          maxBounds={INDIA_BOUNDS}
          maxBoundsViscosity={1}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            key={layer}
            url={TILE_URLS[layer] || TILE_URLS.street}
            attribution={TILE_ATTRIBUTIONS[layer] || TILE_ATTRIBUTIONS.street}
          />
          <MapController target={flyTarget} />
          {geo && (
            <GeoJSON
              key={reportedKey}
              data={geo}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>

        <div className="markercluster-legend right-3 top-3 flex flex-col gap-1.5" role="img" aria-label="State issues legend">
          <span className="flex items-center gap-2">
            <span className="state-glow-legend h-3 w-3 rounded-sm border" style={{ borderColor: '#ffffff' }} aria-hidden="true" />
            Glowing now
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border" style={{ background: accentColor, borderColor: accentColor, opacity: 0.4 }} aria-hidden="true" />
            Issues reported
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-slate-600 bg-slate-700" aria-hidden="true" />
            No issues reported
          </span>
        </div>

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

        <form onSubmit={handleSearch} className="absolute left-3 right-3 top-3 z-[1000] flex items-center gap-2">
          <select
            value={selectedState}
            onChange={handleStateChange}
            aria-label="Select state"
            className="w-40 shrink-0 rounded-xl border border-white/10 bg-[#0b0f22]/90 px-2.5 py-2 text-sm font-medium text-slate-200 backdrop-blur focus:outline-none focus:border-sky-400/50 sm:w-48"
          >
            <option value="">All India</option>
            {INDIAN_STATES.map((s) => (
              <option key={s.state} value={s.state}>{s.state}</option>
            ))}
          </select>
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
            aria-label="Filter issues by category"
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

        {selectedState && !showFilters && !searchError && (
          <div className="absolute right-3 top-[8.5rem] z-[1000] flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0f22]/90 px-3 py-2 text-xs font-medium text-sky-300 shadow-card backdrop-blur">
            <span>Showing {selectedState}</span>
            <button
              type="button"
              onClick={() => handleStateChange({ target: { value: '' } })}
              aria-label="Clear state selection"
              className="rounded-md p-0.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
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

        <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-2">
          <p className="rounded-xl border border-white/10 bg-[#0b0f22]/85 px-3 py-2 text-xs text-slate-300 backdrop-blur">
            <span className="font-semibold text-white">{numReported}</span> of{' '}
            <span className="font-semibold text-white">{numStates || '—'}</span> states with reported issues
          </p>
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

        <Link
          to="/report"
          className="absolute bottom-3 right-3 z-[1000] flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-400 hover:shadow-pop"
        >
          <Plus size={16} aria-hidden="true" />
          Report Issue
        </Link>
      </div>
    </div>
  );
}
