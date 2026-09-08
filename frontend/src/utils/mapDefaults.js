import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

export const MAP_DEFAULT_CENTER = [10.76, 106.68];
export const MAP_DEFAULT_ZOOM = 16;

let defaultIconApplied = false;

export function applyLeafletDefaultIcon() {
  if (defaultIconApplied) return;
  L.Marker.prototype.options.icon = L.icon({
    iconUrl,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
  });
  defaultIconApplied = true;
}
