import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

function stopMarkerStyle({ isPassed, isNext, isCurrentPaused }) {
  if (isNext || isCurrentPaused) {
    return { bg: "#4CAF50", text: isCurrentPaused ? "Đang dừng" : "Đang tới" };
  }
  if (isPassed) return { bg: "#9E9E9E", text: "Đã qua" };
  return { bg: "#2196F3", text: "Chưa tới" };
}

export default function RouteStopMarker({
  stop,
  index,
  currentStopIndex = 0,
  driverStatus = "idle",
}) {
  const isPassed = index <= currentStopIndex;
  const isNext = driverStatus === "in_progress" && index === currentStopIndex + 1;
  const isCurrentPaused = driverStatus === "paused" && index === currentStopIndex;
  const { bg, text } = stopMarkerStyle({ isPassed, isNext, isCurrentPaused });

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
        <p>Trạng thái: {text}</p>
      </Popup>
    </Marker>
  );
}
