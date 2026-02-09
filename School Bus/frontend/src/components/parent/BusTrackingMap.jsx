// Component bản đồ theo dõi xe buýt
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BusRouteParent from '../map/BusRouteParent';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icon
const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_CENTER = [10.76, 106.68];
const DEFAULT_ZOOM = 16;
const RECENTER_ZOOM = 18;

// Nút tìm vị trí xe buýt
function BusLocationButton({ busPosition }) {
  const map = useMap();
  const handleClick = () => {
    if (busPosition) {
      map.flyTo(busPosition, RECENTER_ZOOM);
    }
  };
  
  return (
    <button 
      onClick={handleClick}
      disabled={!busPosition}
      className={`absolute bottom-5 right-5 z-[1000] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 ${
        busPosition 
          ? 'bg-blue-500 hover:bg-blue-700 text-white focus:ring-blue-400' 
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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

export default function BusTrackingMap({ 
  stops, 
  busStatus, 
  busPosition, 
  currentStopIndex 
}) {
  // Tạo waypoints từ danh sách điểm dừng
  const routeWaypoints = stops.map(s => [s.lat, s.lng]);
  const mapCenter = routeWaypoints[0] || DEFAULT_CENTER;

  // currentStopIndex trong websocket được hiểu là "điểm đã tới gần nhất".
  // Dùng ?? thay vì || để không làm mất giá trị 0.
  const effectiveCurrentStopIndex = Number.isFinite(busStatus?.currentStopIndex)
    ? busStatus.currentStopIndex
    : (Number.isFinite(currentStopIndex) ? currentStopIndex : 0);

  const effectiveDriverStatus = busStatus?.driverStatus || 'idle';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Bản đồ theo dõi xe buýt</h2>
      
      <div className="w-full h-[500px] relative rounded-lg overflow-hidden border">
        <MapContainer 
          center={mapCenter} 
          zoom={DEFAULT_ZOOM} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer 
            attribution='&copy; OpenStreetMap' 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          />

          {/* Route animation - chỉ hiển thị khi driver đang chạy */}
          {stops.length > 0 && (
            <BusRouteParent
              waypoints={routeWaypoints}
              isVisible={effectiveDriverStatus === "in_progress" || effectiveDriverStatus === "paused"}
              currentPosition={busStatus.currentPosition || busPosition}
              driverStatus={effectiveDriverStatus}
              currentStopIndex={effectiveCurrentStopIndex}
            />
          )}

          {/* Marker tĩnh khi chưa bắt đầu */}
          {effectiveDriverStatus === "idle" && routeWaypoints[0] && (
            <Marker position={routeWaypoints[0]}>
              <Popup>Xe buýt chưa bắt đầu chuyến</Popup>
            </Marker>
          )}

          {/* Hiển thị các điểm dừng */}
          {stops.map((stop, index) => (
            (() => {
              const isPassed = index <= effectiveCurrentStopIndex;
              const isNextInProgress = effectiveDriverStatus === 'in_progress' && index === effectiveCurrentStopIndex + 1;
              const isCurrentPaused = effectiveDriverStatus === 'paused' && index === effectiveCurrentStopIndex;

              const statusText = isCurrentPaused
                ? 'Đang dừng'
                : (isNextInProgress
                    ? 'Đang tới'
                    : (isPassed ? 'Đã qua' : 'Chưa tới'));

              const bg = isNextInProgress || isCurrentPaused
                ? '#4CAF50'
                : (isPassed ? '#9E9E9E' : '#2196F3');

              return (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lng]}
              icon={L.divIcon({
                className: 'custom-stop-marker',
                html: `<div style="
                  background: ${bg}; 
                  color: white; 
                  border-radius: 50%; 
                  width: 24px; 
                  height: 24px; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  font-size: 12px;
                  font-weight: bold;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">${index + 1}</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            >
              <Popup>
                <div>
                  <strong>{stop.name}</strong>
                  {stop.time && <p>Thời gian: {stop.time}</p>}
                  <p>Trạng thái: {statusText}</p>
                </div>
              </Popup>
            </Marker>
              );
            })()
          ))}

          <BusLocationButton busPosition={busPosition || busStatus.currentPosition} />
        </MapContainer>
      </div>
    </div>
  );
}
