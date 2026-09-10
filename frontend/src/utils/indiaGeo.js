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

export async function reverseGeocodeLocation(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
    );
    const data = await res.json();
    if (!data || !data.address) return { location: '', pincode: '' };
    const a = data.address;
    const parts = [];
    const localName = a.neighbourhood || a.suburb || a.residential || a.neighbourhood || '';
    const road = a.road || a.pedestrian || a.footway || '';
    const area = a.city_district || a.city || a.town || a.village || a.county || a.municipality || '';
    if (localName) parts.push(localName);
    if (road) parts.push(road);
    if (area) parts.push(area);
    if (a.state && !parts.includes(a.state)) parts.push(a.state);
    return { location: parts.join(', '), pincode: a.postcode || '' };
  } catch {
    return { location: '', pincode: '' };
  }
}
