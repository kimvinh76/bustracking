import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import BusRouteLayer from "../map/BusRouteLayer";
import RouteStopMarker from "../map/RouteStopMarker";
import { applyLeafletDefaultIcon, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "../../utils/mapDefaults";
import { isTripActiveOnMap, isPreTripOnMap, normalizeDriverStatus } from "../../utils/mergeBusStatus";

applyLeafletDefaultIcon();

function BusLocationButton({ busPosition }) {
  const map = useMap();
  return (
    <button
      onClick={() => busPosition && map.flyTo(busPosition, 18)}
      disabled={!busPosition}
      className={`absolute bottom-5 right-5 z-[1000] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 ${
        busPosition
          ? "bg-blue-500 hover:bg-blue-700 text-white focus:ring-blue-400"
          : "bg-gray-300 text-gray-500 cursor-not-allowed"
      }`}
      title="Tìm vị trí xe buýt"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  );
}

/** Bản đồ theo dõi dành riêng cho phụ huynh: khung UI + điểm dừng có trạng thái + nút tìm xe. */
export default function BusTrackingMap({ stops, busStatus }) {
  const routeWaypoints = stops.map((s) => [s.lat, s.lng]);
  const mapCenter = routeWaypoints[0] || MAP_DEFAULT_CENTER;
  const driverStatus = normalizeDriverStatus(busStatus?.driverStatus);
  const currentStopIndex = Number.isFinite(busStatus?.currentStopIndex)
    ? busStatus.currentStopIndex
    : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Bản đồ theo dõi xe buýt</h2>

      <div className="w-full h-[500px] relative rounded-lg overflow-hidden border">
        <MapContainer center={mapCenter} zoom={MAP_DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {stops.length > 0 && (
            <BusRouteLayer
              waypoints={routeWaypoints}
              isVisible={isTripActiveOnMap(driverStatus)}
              currentPosition={busStatus?.currentPosition}
            />
          )}

          {isPreTripOnMap(driverStatus) && routeWaypoints[0] && (
            <Marker position={routeWaypoints[0]}>
              <Popup>Xe buýt chưa bắt đầu chuyến</Popup>
            </Marker>
          )}

          {stops.map((stop, index) => (
            <RouteStopMarker
              key={stop.id}
              stop={stop}
              index={index}
              currentStopIndex={currentStopIndex}
              driverStatus={driverStatus}
            />
          ))}

          <BusLocationButton busPosition={busStatus?.currentPosition} /> 
        </MapContainer>
      </div>
    </div>
  );
}
