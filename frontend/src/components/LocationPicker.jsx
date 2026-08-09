import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair } from 'lucide-react';

const DEFAULT_CENTER = [20.5937, 78.9629];

const pinIcon = L.divIcon({
  className: '',
  html: `
    <svg width="30" height="42" viewBox="0 0 24 36" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#2563eb" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4.5" fill="white"/>
    </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 40]
});

function ClickToSet() {
  useMapEvents({
    click(e) {
      const el = e.originalEvent.target;
      if (el && el.closest && el.closest('.leaflet-popup, a')) return;
      window.__civicMapSet?.(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function FitView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
      const id = setTimeout(() => map.setView(coords, 14), 0);
      return () => clearTimeout(id);
    }
  }, [coords, map]);
  return null;
}

export default function LocationPicker({ value, onChange }) {
  const lat = parseFloat(value?.lat);
  const lng = parseFloat(value?.lng);
  const hasValid = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
  const coords = hasValid ? [lat, lng] : null;
  const [status, setStatus] = useState('');

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    window.__civicMapSet = (newLat, newLng) => {
      onChangeRef.current?.({ lat: newLat.toFixed(6), lng: newLng.toFixed(6) });
    };
    return () => {
      delete window.__civicMapSet;
    };
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported by this browser.');
      return;
    }
    setStatus('Locating…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChangeRef.current?.({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6)
        });
        setStatus('');
      },
      () => setStatus('Could not fetch location. Enter coordinates manually.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-xl border border-line"
        role="region"
        aria-label="Map to pick a location"
      >
        <MapContainer
          center={coords || DEFAULT_CENTER}
          zoom={hasValid ? 14 : 5}
          style={{ height: '220px', width: '100%' }}
          scrollWheelZoom={false}
          className="z-0"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {hasValid && <Marker position={coords} icon={pinIcon} />}
          <ClickToSet />
          <FitView coords={coords} />
        </MapContainer>
        <span className="pointer-events-none absolute bottom-2 left-2 z-[500] rounded-md bg-surface/90 px-2 py-1 text-[11px] text-ink-soft shadow-card">
          Click the map to drop the pin
        </span>
      </div>

      {status && <p className="mt-1.5 text-xs text-warning">{status}</p>}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-soft">Latitude</span>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={value?.lat || ''}
            onChange={(e) => onChange?.({ ...value, lat: e.target.value })}
            placeholder="e.g. 28.6139"
            aria-label="Latitude"
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-soft">Longitude</span>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={value?.lng || ''}
            onChange={(e) => onChange?.({ ...value, lng: e.target.value })}
            placeholder="e.g. 77.2090"
            aria-label="Longitude"
            className="input"
          />
        </label>
      </div>

      <button type="button" onClick={useMyLocation} className="btn btn-secondary mt-3 w-full">
        <Crosshair size={16} aria-hidden="true" />
        Use My Current Location
      </button>
    </div>
  );
}
