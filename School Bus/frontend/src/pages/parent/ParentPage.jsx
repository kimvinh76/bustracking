import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BusRouteParent from '../../components/map/BusRouteParent'; 
import { incidentsService } from '../../services/incidentsService.js';
import busTrackingService from '../../services/busTrackingService.js';
import { Car, AlertTriangle, Users, PhoneCall, Info } from 'lucide-react';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Simple MapPin SVG Icon component
const MapPin = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// --- ICONS ---
// Fix for default marker icon
const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const busLocationIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Red location pin
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const schoolIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2602/2602414.png', // School icon
  iconSize: [35, 35],
  iconAnchor: [17, 45],
  popupAnchor: [0, -35],
});

const pickupIcon = new L.Icon({
  // Hình cột biển báo xe buýt
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

/// --- PLACEHOLDER DATA ---

const tripStatusData = {
  status: 'on',  
  nextStop: 'Nguyễn Văn Cừ',
  eta: '20 phút',
  incident: '',
  passedStops: [ 'Nhà Văn hóa Thanh Niên'],
};

const studentInfo = {
  name: 'Lâm Xuân Mai',
  class: '7A1',
};

const busInfo = {
  busNumber: '51K-123.45',
  route: 'Tuyến Quận 1 - Sáng',
  driverName: 'Nguyễn Văn A',
  driverPhone: '0901234567',
};

// Sử dụng cùng tuyến đường với driver
const mockStops = [
  {
    id: 1,
    name: "Nhà Văn hóa Thanh Niên",
    time: "06:00",
    lat: 10.75875,
    lng: 106.68095,
    isStartOrEnd: true,
  },
  {
    id: 2,
    name: "Nguyễn Văn Cừ", 
    time: "06:20",
    lat: 10.76055,
    lng: 106.6834,
  },
  {
    id: 3,
    name: "Nguyễn Biểu",
    time: "06:40", 
    lat: 10.7579,
    lng: 106.6831,
  },
  {
    id: 4,
    name: "Trường THCS Nguyễn Du",
    time: "07:00",
    lat: 10.7545,
    lng: 106.6815,
    isStartOrEnd: true,
  },
];

const mapCenter = [10.76, 106.68];
const defaultZoom = 16;
const recenterZoom = 18; // Zoom level khi click nút recenter

// Định nghĩa các vị trí cần thiết
const pickupLocation = [10.7634, 106.682]; // Điểm đón học sinh
const schoolLocation = [10.7545, 106.6815]; // Trường học 
const busLocation = [10.76055, 106.6834]; // Vị trí xe bus hiện tại

// --- HELPER COMPONENTS ---

const TripStatusCard = ({ statusInfo }) => {
  const isLate = (statusInfo.status || '').toLowerCase() === 'late';
  const cardStyle = isLate ? 'bg-red-100 border-l-4 border-red-500 text-red-800' : 'bg-blue-100 border-l-4 border-blue-500 text-blue-800';
  const eta = isLate ? statusInfo.eta : '5 phút';
  const etaNumber = eta.split(' ')[0]; 

  return (
  <div className={`p-6 rounded-lg shadow-md ${cardStyle}`}>
    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8">
      {/* CỘT 1: Trạng thái & Trạm kế tiếp */}
      <div className="md:flex-1">
        <h2 className="text-xl font-bold mb-4">Trạng thái chuyến đi</h2>
        {isLate && <div className="font-bold text-lg mb-4">CẢNH BÁO: XE ĐẾN TRỄ</div>}
        
        <div className="space-y-2 text-sm">
          <p><strong>Trạm kế tiếp:</strong> {statusInfo.nextStop}</p>
          {isLate && <p><strong>Lý do trễ:</strong> {statusInfo.incident}</p>}
        </div>
      </div>

      {/* CỘT 2: Các trạm đã đi qua */}
      <div className="md:flex-1">
        <h3 className="font-semibold text-base mb-2">Các trạm đã đi qua:</h3>
        <ul className="list-disc list-inside mt-1 text-sm text-gray-700">
          {statusInfo.passedStops.map((stop, index) => <li key={index}>{stop}</li>)}
        </ul>
      </div>

      {/* CỘT 3: Thời gian dự kiến (ETA) */}
      <div className="md:flex-1 text-center">
        <div className="text-sm text-gray-500 font-medium">
          {isLate ? 'Dự kiến trễ' : 'Dự kiến đến trong'}
        </div>
        <div className={`text-5xl font-bold ${isLate ? 'text-red-600' : 'text-green-600'}`}>
          {etaNumber}
        </div>
        <div className="text-lg text-gray-600 font-medium">phút</div>
      </div>

    </div>
  </div>
  );
};

function BusLocationButton({ busPosition }) {
  const map = useMap();
  const handleClick = () => map.flyTo(busPosition || busLocation, recenterZoom);
  return (
    <button onClick={handleClick} 
    className="absolute bottom-5 right-5 z-[1000] w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400" title="Tìm vị trí xe buýt">
      <MapPin className="w-8 h-8 object-contain" />
    </button>
  );
}

function FindPickupButton({ pickupLocation }) {
  const map = useMap();
  const handleClick = () => map.flyTo(pickupLocation, recenterZoom); 
  return (
    <button 
      onClick={handleClick} 
      className="absolute bottom-20 right-5 z-[1000] w-12 h-12 bg-orange-100 rounded-full shadow-lg transition-colors duration-200 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 flex items-center justify-center" 
      title="Xem điểm đón" >
      <img src={pickupIcon.options.iconUrl} alt="Pickup Icon" 
        className="w-8 h-8 object-contain" 
      />
    </button>
  );
}

// --- MAIN PARENT PAGE COMPONENT ---

const ParentPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverStatus, setDriverStatus] = useState("idle"); // Trạng thái từ driver - Mặc định idle
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [busPosition, setBusPosition] = useState(null);
  const [resumeFromPause, setResumeFromPause] = useState(false);
  
  // State để đồng bộ với driver - giống như AdminMapPage
  const [busStatus, setBusStatus] = useState({
    isRunning: false,
    driverStatus: "idle",
    currentStopIndex: 0,
    resumeFromPause: false
  });

  // Tuyến đường giống driver
  const routeWaypoints = useMemo(() => mockStops.map((s) => [s.lat, s.lng]), []);

  // Component hiển thị thông báo nổi
  const ToastNotification = ({ notification, onClose }) => (
    <div className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg border max-w-sm animate-fade-in ${
      notification.type === 'incident' ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Thông báo sự cố!</h4>
            <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-2">Tuyến: {notification.route}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );

  // Component hiển thị thông báo sự cố
  const IncidentAlert = ({ incident }) => (
    <div className={`p-4 rounded-lg border mb-3 ${
      incident.severity === 'high' ? 'border-red-300 bg-red-50' :
      incident.severity === 'medium' ? 'border-yellow-300 bg-yellow-50' :
      'border-blue-300 bg-blue-50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full ${
            incident.severity === 'high' ? 'bg-red-100' :
            incident.severity === 'medium' ? 'bg-yellow-100' :
            'bg-blue-100'
          }`}>
            {incident.incident_type === 'traffic' && <Car className="h-5 w-5 text-gray-600" />}
            {incident.incident_type === 'vehicle' && <AlertTriangle className="h-5 w-5 text-gray-600" />}
            {incident.incident_type === 'student' && <Users className="h-5 w-5 text-gray-600" />}
            {incident.incident_type === 'emergency' && <PhoneCall className="h-5 w-5 text-gray-600" />}
            {!['traffic', 'vehicle', 'student', 'emergency'].includes(incident.incident_type) && 
              <Info className="h-5 w-5 text-gray-600" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900 capitalize">
                {incident.incident_type === 'traffic' ? 'Giao thông' :
                 incident.incident_type === 'vehicle' ? 'Phương tiện' :
                 incident.incident_type === 'student' ? 'Học sinh' :
                 incident.incident_type === 'emergency' ? 'Khẩn cấp' :
                 'Khác'}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                incident.severity === 'high' ? 'bg-red-100 text-red-700' :
                incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {incident.severity === 'high' ? 'Cao' :
                 incident.severity === 'medium' ? 'Trung bình' : 'Thấp'}
              </span>
            </div>
            <p className="text-gray-700 text-sm mb-2">{incident.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Tuyến: {incident.route_name || `Route ${incident.route_id}`}</span>
              <span>{new Date(incident.created_at).toLocaleString('vi-VN')}</span>
            </div>
            <div className="mt-2 inline-flex px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
              Thông báo mới
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Kết nối WebSocket để nhận trạng thái từ driver
  useEffect(() => {
    busTrackingService.connect('parent', 1); // parent ID = 1

    const handleBusStatusUpdate = (status) => {
      console.log('👩‍👧‍👦 Parent received bus status update:', status);
      console.log('👩‍👧‍👦 Parent current busStatus:', busStatus);
      
      // Xử lý incident alert
      if (status.incidentAlert) {
        const notification = {
          id: Date.now(),
          type: 'incident',
          message: status.incidentAlert.description,
          route: status.incidentAlert.route || 'Tuyến 1',
          timestamp: new Date(status.incidentAlert.timestamp)
        };
        
        setNotifications(prev => [notification, ...prev]);
        console.log('👩‍👧‍👦 Parent received incident notification:', notification);
        
        // Tự động ẩn sau 10 giây
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 10000);
      }
      
      // Update busStatus state giống như admin
      setBusStatus(prevStatus => ({
        ...prevStatus,
        ...status,
        resumeFromPause: status.resumeFromPause || false
      }));
      
      // Legacy states cho backward compatibility
      setDriverStatus(status.driverStatus || "idle");
      setCurrentStopIndex(status.currentStopIndex || 0);
      if (status.currentPosition) {
        setBusPosition(status.currentPosition);
      }
      if (status.resumeFromPause) {
        setResumeFromPause(true);
        // Reset flag sau một chút để tránh loop
        setTimeout(() => {
          setResumeFromPause(false);
          setBusStatus(prev => ({...prev, resumeFromPause: false}));
        }, 100);
      }
      console.log('👩‍👧‍👦 Parent updated busStatus:', status);
    };

    busTrackingService.on('busStatusUpdate', handleBusStatusUpdate);

    return () => {
      busTrackingService.off('busStatusUpdate', handleBusStatusUpdate);
      busTrackingService.disconnect();
    };
  }, []);

  // Lấy incidents và hiển thị thông báo nổi
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const routeId = 1; 
        const response = await incidentsService.getIncidentsByRoute(routeId);
        console.log('Parent incidents response:', response);
        
        const incidentsData = response?.incidents || response || [];
        
        // Hiển thị tất cả sự cố trong 30 phút gần nhất
        const relevantIncidents = Array.isArray(incidentsData) ? incidentsData.filter(incident => {
          const incidentTime = new Date(incident.created_at);
          const now = new Date();
          const minutesDiff = (now - incidentTime) / (1000 * 60);
          return minutesDiff <= 30; // Hiển thị sự cố trong 30 phút gần nhất
        }) : [];
        
        // Kiểm tra sự cố mới để hiển thị thông báo nổi
        const newIncidents = relevantIncidents.filter(incident => {
          return !incidents.some(oldIncident => oldIncident.id === incident.id);
        });

        if (newIncidents.length > 0) {
          newIncidents.forEach(incident => {
            const notification = {
              id: incident.id,
              type: 'incident',
              message: incident.description,
              route: incident.route_name || 'Tuyến 1',
              timestamp: new Date()
            };
            
            setNotifications(prev => [...prev, notification]);
            
            // Tự động ẩn sau 10 giây
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }, 10000);
          });
        }
        
        setIncidents(relevantIncidents);
      } catch (error) {
        console.error('Lỗi khi tải thông tin sự cố:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
    
    // Tự động refresh mỗi 5 giây để cập nhật realtime
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, [incidents]);
  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Trang thông tin cho Phụ Huynh</h1>
      <div className="flex flex-col gap-6">
        {/* Thông báo sự cố */}
        {incidents.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-red-600">
              <AlertTriangle className="inline-block h-5 w-5 mr-2" />
              Thông báo sự cố
            </h2>
            <div className="space-y-3">
              {incidents.map((incident) => (
                <IncidentAlert key={incident.id} incident={incident} />
              ))}
            </div>
          </div>
        )}

        {/* 1. Trip Status */}
        <TripStatusCard statusInfo={tripStatusData} />

        {/* 2. Map View */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Bản đồ theo dõi xe buýt</h2>
            {(tripStatusData.status || '').toLowerCase() === 'late' && (
              <span className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                Cảnh báo xe đến trễ
              </span>
            )}
          </div>
          <div className="w-full h-[600px] relative rounded-lg overflow-hidden border">
            <MapContainer 
              center={routeWaypoints[0] || mapCenter} 
              zoom={defaultZoom} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer 
                attribution='&copy; OpenStreetMap' 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              />

              {/* Parent view - chỉ hiển thị khi driver đã bắt đầu */}
              <BusRouteParent
                waypoints={routeWaypoints}
                isVisible={busStatus.driverStatus === "in_progress" || busStatus.driverStatus === "paused"}
                currentPosition={busStatus.currentPosition || busPosition}
                driverStatus={busStatus.driverStatus}
                currentStopIndex={busStatus.currentStopIndex || currentStopIndex}
              />
              
              {console.log('👩‍👧‍👦 Parent busStatus.driverStatus:', busStatus.driverStatus, 'isRunning calculated:', busStatus.driverStatus === "in_progress" && busStatus.isRunning)}
              
              {/* Hiển thị marker tĩnh khi driver chưa bắt đầu */}
              {busStatus.driverStatus === "idle" && (
                <Marker position={routeWaypoints[0] || mapCenter}>
                  <Popup>Xe buýt chưa bắt đầu chuyến</Popup>
                </Marker>
              )}
              
              {/* Hiển thị các điểm dừng với icon tùy chỉnh */}
              {mockStops.map((stop, index) => (
                <Marker
                  key={index}
                  position={[stop.lat, stop.lng]}
                  icon={L.divIcon({
                    className: 'custom-stop-marker',
                    html: `<div style="
                      background: ${index === currentStopIndex ? '#4CAF50' : '#2196F3'}; 
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
                      <p>Thời gian dự kiến: {stop.estimatedTime}</p>
                      <p>Trạng thái: {index < currentStopIndex ? 'Đã qua' : index === currentStopIndex ? 'Đang tới' : 'Chưa tới'}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              <FindPickupButton pickupLocation={pickupLocation} />             
              <BusLocationButton busPosition={busPosition} />
            </MapContainer>
          </div>
        </div>

        {/* 3. Student Information */}
        <div className="bg-yellow-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Thông tin học sinh</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-700">
            <p><strong>Họ và tên:</strong> {studentInfo.name}</p>
            <p><strong>Lớp:</strong> {studentInfo.class}</p>
          </div>
        </div>        {/* 4. Bus Information */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-5">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Thông tin xe buýt</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-700">
            <p><strong>Số xe:</strong> {busInfo.busNumber}</p>
            <p><strong>Tuyến đường:</strong> {busInfo.route}</p>
            <p><strong>Tài xế:</strong> {busInfo.driverName}</p>
            <p><strong>SĐT Tài xế:</strong> {busInfo.driverPhone}</p>
          </div>
        </div>

        
        {/* THÔNG BÁO NỔI - Toast Notifications */}
        {notifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          />
        ))}
      </div>
    </div>
  );
};

// Component Toast Notification cho thông báo sự cố realtime
const ToastNotification = ({ notification, onClose }) => {
  return (
    <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm animate-slide-in">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="font-semibold"> Cảnh báo sự cố!</h4>
          </div>
          <p className="text-sm mb-1">{notification.message}</p>
          <p className="text-xs opacity-90">
            Tuyến: {notification.route} | {notification.timestamp.toLocaleTimeString('vi-VN')}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200 ml-2 text-lg font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ParentPage;