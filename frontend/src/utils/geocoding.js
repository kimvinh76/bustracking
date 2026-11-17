const HCMC_EXTENT = "106.50,10.60,106.92,10.95";
const ARCGIS_GEOCODE_BASE =
  "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";
const PHOTON_API_URL = "https://photon.komoot.io/api/";

function normalizePlaceName(rawName, fallbackAddress) {
  const clean = String(rawName || "").trim();
  if (clean) return clean;
  const firstPart = String(fallbackAddress || "").split(",")[0]?.trim();
  return firstPart || "Trạm dừng mới";
}

function formatPhotonAddress(props = {}) {
  const parts = [
    props.housenumber && props.street
      ? `${props.housenumber} ${props.street}`
      : props.street,
    props.district || props.suburb || props.locality,
    props.city || props.county || props.state,
  ].filter(Boolean);
  return [...new Set(parts)].join(", ");
}

async function queryArcgisPlaces(query, signal) {
  const text = query.toLowerCase().includes("hồ chí minh") || query.toLowerCase().includes("hcm")
    ? query
    : `${query}, TP.HCM`;
  const params = new URLSearchParams({
    SingleLine: text,
    countryCode: "VNM",
    searchExtent: HCMC_EXTENT,
    langCode: "vi",
    outFields: "PlaceName,Place_addr,Addr_type,ShortLabel",
    maxLocations: "6",
    f: "json",
  });

  const res = await fetch(`${ARCGIS_GEOCODE_BASE}/findAddressCandidates?${params}`, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];

  const specificTypes = new Set(["POI", "PointAddress", "StreetAddress", "StreetInt", "StreetName"]);
  const specific = candidates.filter((c) => specificTypes.has(c?.attributes?.Addr_type));
  const pool = specific.length > 0 ? specific : candidates.slice(0, 2);

  return pool
    .map((c) => {
      const lat = Number(c?.location?.y);
      const lng = Number(c?.location?.x);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const address = String(c?.attributes?.Place_addr || c?.address || "").trim();
      const name = normalizePlaceName(c?.attributes?.PlaceName || c?.attributes?.ShortLabel, c?.address);
      return {
        id: `arcgis-${lat.toFixed(5)}-${lng.toFixed(5)}`,
        name,
        address: address || name,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        source: "arcgis",
      };
    })
    .filter(Boolean);
}

async function queryPhotonPlaces(query, parentSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  const onParentAbort = () => controller.abort();
  parentSignal?.addEventListener("abort", onParentAbort, { once: true });

  try {
    const params = new URLSearchParams({
      q: query,
      lat: "10.773",
      lon: "106.694",
      bbox: HCMC_EXTENT,
      limit: "5",
    });
    const res = await fetch(`${PHOTON_API_URL}?${params}`, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const features = Array.isArray(data?.features) ? data.features : [];

    return features
      .map((f) => {
        const [lng, lat] = f?.geometry?.coordinates || [];
        if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
        const props = f?.properties || {};
        const address = formatPhotonAddress(props);
        const name = normalizePlaceName(props.name, address);
        return {
          id: `photon-${Number(lat).toFixed(5)}-${Number(lng).toFixed(5)}`,
          name,
          address: address || name,
          latitude: Number(Number(lat).toFixed(6)),
          longitude: Number(Number(lng).toFixed(6)),
          source: "osm",
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onParentAbort);
  }
}

/** Tìm địa điểm thực tế trong khu vực TP.HCM (ưu tiên POI/OSM + địa chỉ đường phố). */
export async function searchRealPlaces(rawQuery, signal) {
  const query = String(rawQuery || "").trim();
  if (query.length < 2) return [];

  const [photonRes, arcgisRes] = await Promise.allSettled([
    queryPhotonPlaces(query, signal),
    queryArcgisPlaces(query, signal),
  ]);

  const combined = [
    ...(photonRes.status === "fulfilled" ? photonRes.value : []),
    ...(arcgisRes.status === "fulfilled" ? arcgisRes.value : []),
  ];

  // Lọc trùng tọa độ gần nhau (~50m)
  const unique = [];
  for (const item of combined) {
    const isDuplicate = unique.some(
      (u) =>
        Math.abs(u.latitude - item.latitude) < 0.00045 &&
        Math.abs(u.longitude - item.longitude) < 0.00045 &&
        u.name.toLowerCase() === item.name.toLowerCase()
    );
    if (!isDuplicate) unique.push(item);
  }

  return unique.slice(0, 6);
}

/** Lấy tên địa điểm / địa chỉ tiếng Việt từ tọa độ vừa click trên bản đồ. */
export async function reverseGeocodeLocation(lat, lng, signal) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  try {
    const params = new URLSearchParams({
      location: `${lng},${lat}`,
      langCode: "vi",
      f: "json",
    });
    const res = await fetch(`${ARCGIS_GEOCODE_BASE}/reverseGeocode?${params}`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address;
    if (!addr) return null;

    const fullAddress = String(addr.Match_addr || addr.LongLabel || addr.Address || "").trim();
    const suggestedName = normalizePlaceName(
      addr.PlaceName || addr.ShortLabel || addr.Address,
      fullAddress
    );

    if (!fullAddress && !suggestedName) return null;
    return {
      name: suggestedName,
      address: fullAddress || suggestedName,
    };
  } catch {
    return null;
  }
}
