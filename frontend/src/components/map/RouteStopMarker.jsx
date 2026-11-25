import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { getStopProgressState } from "../../utils/mergeBusStatus";

function stopMarkerColor(state) {
  if (state === "stopped") return "#F59E0B";
  if (state === "approaching") return "#16A34A";
  if (state === "passed") return "#9E9E9E";
  return "#2196F3";
}

export default function RouteStopMarker({
  stop,
  index,
  currentStopIndex = 0,
  driverStatus = "idle",
}) {
  const { state, label } = getStopProgressState(index, currentStopIndex, driverStatus);
  const bg = stopMarkerColor(state);

  return (
    <Marker
      position={[stop.lat, stop.lng]}
      icon={L.divIcon({
        className: "custom-stop-marker",
        html: `<div style="
          background:${bg};color:white;border-radius:50%;
          width:24px;height:24px;display:flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:bold;border:2px solid white;
          box-shadow:0 2px 4px rgba(0,0,0,0.3);
        ">${index + 1}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })}
    >
      <Popup>
        <strong>{stop.name}</strong>
        {stop.time && <p>Thời gian: {stop.time}</p>}
        <p>Trạng thái: {label}</p>
      </Popup>
    </Marker>
  );
}
