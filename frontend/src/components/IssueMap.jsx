import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { priorityColor } from '../utils/priority';

export const INDIA_BOUNDS = [[6.5, 68.1], [37.1, 97.4]];

const TILE_URLS = {
  street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};

const TILE_ATTRIBUTIONS = {
  street: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  dark: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
};

const LEVEL_DOT = {
  high: { bg: 'var(--priority-high)', label: 'Critical (8–10)' },
  mid: { bg: 'var(--priority-mid)', label: 'Medium (5–7)' },
  low: { bg: 'var(--priority-low)', label: 'Low (1–4)' }
};

function FitView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, bounds]);
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target.coords, target.zoom, { duration: 1.2 });
  }, [target, map]);
  return null;
}

const createIcon = (priority) => {
  const color = priorityColor(priority);
  const label = Number.isFinite(Number(priority)) ? priority : '?';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      border: 2px solid rgba(255,255,255,0.95);
    ">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const clusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 50 ? 42 : 50;
  return L.divIcon({
    className: 'cluster-color',
    html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">${count}</div>`,
    iconSize: [size, size]
  });
};

export default function IssueMap({ issues, className = '', height = '100%', center, zoom, bounds, hideLegend = false, layer = 'street', target }) {
  const [userLocation, setUserLocation] = useState([20.5937, 78.9629]);

  useEffect(() => {
    if (center) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, [center]);

  const validIssues = issues.filter((i) =>
    i.location?.coordinates?.length === 2 &&
    i.location.coordinates[0] !== 0 &&
    i.location.coordinates[1] !== 0
  );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line shadow-card ${className}`}
      role="region"
      aria-label="Map of community issues"
    >
      <MapContainer
        center={center || userLocation}
        zoom={zoom ?? 12}
        scrollWheelZoom
        style={{ height, width: '100%' }}
        className="z-0"
      >
        <TileLayer
          key={layer}
          url={TILE_URLS[layer] || TILE_URLS.street}
          attribution={TILE_ATTRIBUTIONS[layer] || TILE_ATTRIBUTIONS.street}
        />
        {bounds && <FitView bounds={bounds} />}
        <FlyTo target={target} />
        <MarkerClusterGroup
          iconCreateFunction={clusterIcon}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom
          disableClusteringAtZoom={18}
          maxClusterRadius={55}
        >
          {validIssues.map((issue) => (
            <Marker
              key={issue._id}
              position={[issue.location.coordinates[1], issue.location.coordinates[0]]}
              icon={createIcon(issue.aiPriority)}
            >
              <Popup>
                <div className="min-w-44" style={{ color: 'var(--ink)' }}>
                  <p className="mb-1 text-sm font-semibold">{issue.title}</p>
                  <p className="mb-1 text-xs capitalize" style={{ color: 'var(--ink-soft)' }}>{issue.category}</p>
                  <p className="mb-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
                    Priority: <span className="font-semibold" style={{ color: priorityColor(issue.aiPriority) }}>
                      {issue.aiPriority}/10
                    </span> · {issue.voteCount} votes
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
        </MarkerClusterGroup>
      </MapContainer>

      {!hideLegend && (
        <div className="markercluster-legend right-3 top-3 flex flex-col gap-1.5" role="img" aria-label="Priority legend">
          {Object.entries(LEVEL_DOT).map(([key, val]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: val.bg }} aria-hidden="true" />
              {val.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
