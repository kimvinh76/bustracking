import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Tọa độ Trường Đại học Sài Gòn (273 An Dương Vương, P.3, Q.5, TP.HCM)
export const MAP_DEFAULT_CENTER = [10.760618, 106.682049];
export const MAP_DEFAULT_ZOOM = 15;

export const MAP_TILE_LAYERS = {
  google: {
    id: "google",
    label: "Google Maps",
    url: "https://mt{s}.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}",
    subdomains: ["0", "1", "2", "3"],
    attribution: "&copy; Google Maps",
  },
  carto: {
    id: "carto",
    label: "Bản đồ sáng",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
};

export const MAP_TILE_URL = MAP_TILE_LAYERS.google.url;
export const MAP_TILE_SUBDOMAINS = MAP_TILE_LAYERS.google.subdomains;
export const MAP_TILE_ATTRIBUTION = MAP_TILE_LAYERS.google.attribution;

let defaultIconApplied = false;
const circleIconCache = new Map();

export function applyLeafletDefaultIcon() {
  if (defaultIconApplied) return;
  L.Marker.prototype.options.icon = L.icon({
    iconUrl,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
  });
  defaultIconApplied = true;
}

export function getStopCircleIcon(label, bgColor = "#2563eb", size = 30) {
  const key = `${label}-${bgColor}-${size}`;
  if (circleIconCache.has(key)) return circleIconCache.get(key);
  const icon = L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${bgColor};color:#ffffff;border:2px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:${size >= 30 ? 12 : 10}px;font-weight:700;">${label}</div>`,
  });
  circleIconCache.set(key, icon);
  return icon;
}
