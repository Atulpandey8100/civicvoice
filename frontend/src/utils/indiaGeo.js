export async function reverseGeocodeState(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
    );
    const data = await res.json();
    return data?.address?.state || '';
  } catch {
    return '';
  }
}
