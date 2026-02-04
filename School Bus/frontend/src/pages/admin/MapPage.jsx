// src/pages/admin/MapPage.jsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css"; // CSS cho đường đi thực tế
import BusRouteAdmin from "../../components/map/BusRouteAdmin.jsx";
import busTrackingService from "../../services/busTrackingService.js";
import { useState, useEffect } from "react";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;


export default function MapPage() {
  // State để đồng bộ với driver
  const [busStatus, setBusStatus] = useState({
    isRunning: false,
    driverStatus: "idle", // Sử dụng "idle" thay vì "not_started"
    currentStopIndex: 0,
    currentPosition: null,
    resumeFromPause: false
  });
  const [incidentAlerts, setIncidentAlerts] = useState([]);

  // Tọa độ Đại học Sài Gòn (273 An Dương Vương, Quận 5, TP.HCM) gần chính xác
  const campus = [10.75875, 106.68095];
  const center = campus;

  const stops = [
    { id: 1, name: "Nhà Văn hóa Thanh Niên", lat: 10.75875, lng: 106.68095 },
    { id: 2, name: "Nguyễn Văn Cừ", lat: 10.76055, lng: 106.6834 },
    { id: 3, name: "Nguyễn Biểu", lat: 10.7579, lng: 106.6831 },
    { id: 4, name: "Trường THCS Nguyễn Du", lat: 10.7545, lng: 106.6815 },
  ];

  // Tuyến đường tuyến tính (không quay về điểm xuất phát)
  const routeWaypoints = stops.map((s) => [s.lat, s.lng]);

  // Kết nối WebSocket để nhận trạng thái từ driver
  useEffect(() => {
    busTrackingService.connect('admin', 1);

    const handleBusStatusUpdate = (status) => {
      console.log('👑 Admin received bus status update:', status);
      console.log('👑 Admin current busStatus before update:', busStatus);
      
      // Xử lý incident alert
      if (status.incidentAlert) {
        const alert = {
          ...status.incidentAlert,
          id: Date.now() // Unique ID for admin
        };
        setIncidentAlerts(prev => [alert, ...prev.slice(0, 4)]);  // Keep last 5 alerts
        console.log('👑 Admin received incident alert:', alert);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          setIncidentAlerts(prev => prev.filter(a => a.id !== alert.id));
        }, 10000);
      }
      
      setBusStatus(prevStatus => ({
        ...prevStatus,
        ...status,
        resumeFromPause: status.resumeFromPause || false
      }));
      
      // Reset resume flag sau một chút
      if (status.resumeFromPause) {
        setTimeout(() => {
          setBusStatus(prev => ({...prev, resumeFromPause: false}));
        }, 100);
      }
      console.log('👑 Admin busStatus after setState:', status);
    };

    busTrackingService.on('busStatusUpdate', handleBusStatusUpdate);

    return () => {
      busTrackingService.off('busStatusUpdate', handleBusStatusUpdate);
      busTrackingService.disconnect();
    };
  }, []);

  return (
    <div
      className="flex flex-col w-full h-[88vh] bg-white p-4"
      style={{
        margin: 0,
        padding: 0,
      }}
    >
      <div className="flex justify-between items-center mb-3 pl-4">
        <h1 className="text-3xl font-bold text-[#174D2C]">Bản đồ</h1>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            busStatus.driverStatus === 'in_progress' ? 'bg-green-100 text-green-800' :
            busStatus.driverStatus === 'paused' ? 'bg-yellow-100 text-yellow-800' :
            busStatus.driverStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {busStatus.driverStatus === 'in_progress' ? '🚌 Đang chạy' :
             busStatus.driverStatus === 'paused' ? '⏸️ Đang dừng' :
             busStatus.driverStatus === 'completed' ? ' Hoàn thành' :
             '⏹️ Chưa bắt đầu'}
          </div>
          <div className="text-sm text-gray-600">
            Điểm hiện tại: {busStatus.currentStopIndex + 1}/{stops.length}
          </div>
        </div>
      </div>
      
      {/* Incident Alerts cho Admin */}
      {incidentAlerts.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {incidentAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg shadow-lg max-w-sm animate-slide-in"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg"></span>
                <h4 className="font-semibold">Cảnh báo sự cố!</h4>
              </div>
              <p className="text-sm mb-1">{alert.description}</p>
              <p className="text-xs opacity-75">
                {alert.route} | {new Date(alert.timestamp).toLocaleTimeString('vi-VN')}
              </p>
            </div>
          ))}
        </div>
      )}

      <div
        className="flex-1 rounded-xl overflow-hidden shadow-md border border-gray-300"
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <MapContainer
          center={routeWaypoints.length ? routeWaypoints[0] : center}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Hiển thị các điểm dừng */}
          {stops.map((s, index) => (
            <Marker key={s.id} position={[s.lat, s.lng]}>
              <Popup>
                <strong>{s.name}</strong>
                <br />Lat: {s.lat.toFixed(5)}
                <br />Lng: {s.lng.toFixed(5)}
                <br />Trạng thái: {index < busStatus.currentStopIndex ? 'Đã qua' : 
                                   index === busStatus.currentStopIndex ? 'Hiện tại' : 'Chưa tới'}
              </Popup>
            </Marker>
          ))}

          {/* Admin view - chỉ hiển thị khi driver đã bắt đầu */}
          <BusRouteAdmin
            waypoints={routeWaypoints}
            isVisible={busStatus.driverStatus === "in_progress" || busStatus.driverStatus === "paused"}
            currentPosition={busStatus.currentPosition}
            driverStatus={busStatus.driverStatus}
            currentStopIndex={busStatus.currentStopIndex}
          />
          
          {console.log('👑 Admin busStatus.driverStatus:', busStatus.driverStatus, 'isRunning calculated:', busStatus.driverStatus === "in_progress" && busStatus.isRunning)}
          
          {/* Hiển thị marker tĩnh khi driver chưa bắt đầu */}
          {busStatus.driverStatus === "idle" && (
            <Marker position={routeWaypoints[0] || [10.76, 106.68]}>
              <Popup>Xe buýt chưa bắt đầu</Popup>
            </Marker>
          )}
          
          {/* Hiển thị marker tĩnh khi driver pause tại điểm dừng */}
          {busStatus.driverStatus === "paused" && busStatus.currentPosition && (
            <Marker position={[busStatus.currentPosition.lat, busStatus.currentPosition.lng]}>
              <Popup>
                Xe buýt đang dừng tại: {stops[busStatus.currentStopIndex]?.name}
                <br />Đang đón học sinh...
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
