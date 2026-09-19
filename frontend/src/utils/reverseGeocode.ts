// High-speed multi-provider Reverse Geocoding for Vietnam & Worldwide

const addressCache = new Map<string, string>();

export async function getExactAddress(lat: number, lon: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey)!;
  }

  // 1. Primary: Photon OSM (Rich street names, house numbers, wards)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.features?.length > 0) {
        const p = data.features[0].properties || {};
        const parts: string[] = [];
        if (p.housenumber) parts.push(`Số ${p.housenumber}`);
        if (p.street) parts.push(p.street);
        else if (p.name) parts.push(p.name);
        if (p.locality && p.locality !== p.street) parts.push(p.locality);
        if (p.district && p.district !== p.city) parts.push(p.district);
        if (p.city) parts.push(p.city);
        else if (p.state) parts.push(p.state);

        if (parts.length >= 2) {
          const formatted = parts.join(', ');
          addressCache.set(cacheKey, formatted);
          return formatted;
        }
      }
    }
  } catch (_) {}

  // 2. Secondary Fallback: BigDataCloud Reverse Client
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=vi`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const parts: string[] = [];
      if (data.locality) parts.push(data.locality);
      if (data.city && data.city !== data.locality) parts.push(data.city);
      if (data.principalSubdivision && data.principalSubdivision !== data.city) {
        parts.push(data.principalSubdivision);
      }
      if (data.countryName) parts.push(data.countryName);

      if (parts.length > 0) {
        const formatted = parts.join(', ');
        addressCache.set(cacheKey, formatted);
        return formatted;
      }
    }
  } catch (_) {}

  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}
