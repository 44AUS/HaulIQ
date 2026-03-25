/**
 * Get driving miles between two city/state strings via geocoding + OSRM.
 * Used when lat/lng coords are not available.
 */
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

export async function getDrivingMiles(origin, dest) {
  const [o, d] = await Promise.all([geocode(origin), geocode(dest)]);
  if (!o || !d) return null;
  return getDrivingMilesByCoords(o.lat, o.lon, d.lat, d.lon);
}

/**
 * Get driving miles directly from lat/lng coordinates via OSRM.
 * Use this when coords are already known (e.g. from Google Places).
 */
export async function getDrivingMilesByCoords(lat1, lng1, lat2, lng2) {
  const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) return null;
  return Math.round(data.routes[0].distance / 1609.344);
}
