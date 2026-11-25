import { MapContainer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import BaseTileLayer from "./map/BaseTileLayer";
import { applyLeafletDefaultIcon, MAP_DEFAULT_CENTER } from "../utils/mapDefaults";

applyLeafletDefaultIcon();

export default function MapView({
  center = MAP_DEFAULT_CENTER,
  zoom = 13,
  height = "60vh",
}) {
  return (
    <div style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <BaseTileLayer />
        <Marker position={center}>
          <Popup>Vị trí trung tâm</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
