import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Component vẽ tuyến đường + di chuyển bus cho tài xế
// Lưu ý: Trang Driver dùng BusRouteDriver; các biến thể khác như
// BusRoutePause/BusRouteControlled/BusRouteParentPause có thể dành cho parent/admin.
// Nếu không còn dùng, cân nhắc loại bỏ để tránh trùng lặp.
import BusRouteDriver from "../../components/map/BusRouteDriver.jsx";
import DriverHeader from "../../components/driver/DriverHeader.jsx";
import AlertsContainer from "../../components/driver/AlertsContainer.jsx";
import TripStatusPanel from "../../components/driver/TripStatusPanel.jsx";
import ArrivalConfirmModal from "../../components/driver/ArrivalConfirmModal.jsx";
import IncidentReportModal from "../../components/driver/IncidentReportModal.jsx";
import EndTripModal from "../../components/driver/EndTripModal.jsx";
import StudentsPanel from "../../components/driver/StudentsPanel.jsx";
import ConfirmDialog from "../../components/UI/ConfirmDialog.jsx";
import { studentsService } from "../../services/studentsService.js";
import { schedulesService } from "../../services/schedulesService.js";
import routesService from "../../services/routesService.js";
import busTrackingService from "../../services/busTrackingService.js";
import trackingService from "../../services/trackingService.js";
import { 
  FaPlay, FaUsers, FaCheckCircle, FaExclamationTriangle, 
  FaPhone
} from "react-icons/fa";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function DriverMapPage() {
  const navigate = useNavigate();
  const { scheduleId } = useParams();

  // States
  const [status, setStatus] = useState("not_started");
  const [stopIdx, setStopIdx] = useState(0);
  const [notices, setNotices] = useState([]);
  const [showStudents, setShowStudents] = useState(false);
  const [showIncident, setShowIncident] = useState(false);
  const [showArrival, setShowArrival] = useState(false);
  const [showEndTrip, setShowEndTrip] = useState(false);
  const [incidentMsg, setIncidentMsg] = useState("");
  const [tracking, setTracking] = useState(true);
  const [clock, setClock] = useState(new Date());
  const [resumeFn, setResumeFn] = useState(null);
  const [pausedWpIdx, setPausedWpIdx] = useState(null);
  const [busCurrentPosition, setBusCurrentPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNoActiveTripDialog, setShowNoActiveTripDialog] = useState(false);

  // Data from API
  const [schedule, setSchedule] = useState(null);
  const [stops, setStops] = useState([]);

 
  const currentStop = stops[stopIdx];
  const nextStop = stops[stopIdx + 1];
  
  // Tính toán khoảng cách động và thời gian dự kiến
  const calculateRemainingDistance = () => {
    if (!nextStop || status === "completed") return "0 km";
    
    // Sử dụng vị trí bus hiện tại nếu có, nếu không thì dùng điểm dừng hiện tại
    const fromLat = busCurrentPosition?.lat || currentStop?.lat || stops[0]?.lat;
    const fromLng = busCurrentPosition?.lng || currentStop?.lng || stops[0]?.lng;
    const toLat = nextStop.lat;
    const toLng = nextStop.lng;
    
    if (!fromLat || !fromLng || !toLat || !toLng) return "1.2 km"; // fallback
    
    // Công thức Haversine để tính khoảng cách thực tế
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (toLat - fromLat) * Math.PI / 180;
    const dLng = (toLng - fromLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 0.1 ? "< 0.1 km" : `${distance.toFixed(1)} km`;
  };

  const calculateEstimatedTime = () => {
    if (!nextStop || status === "completed") return schedule?.endTime ;
    return nextStop.time;
  };

  const remainingDistance = calculateRemainingDistance();
  const estimatedTime = nextStop ? calculateEstimatedTime() : (schedule?.endTime || '07:00');

  // Ghi lại trạng thái chuyến đang chạy vào sessionStorage để sidebar "Bắt đầu chuyến"
  // có thể đưa tài xế quay lại đúng chuyến chưa kết thúc.
  const updateActiveTripSession = (newStatus) => {
    if (!scheduleId) return;
    if (newStatus === "cleared") {
      sessionStorage.removeItem("driverActiveTrip");
      return;
    }

    const payload = {
      scheduleId: String(scheduleId),
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    sessionStorage.setItem("driverActiveTrip", JSON.stringify(payload));
  };

  // Khởi tạo WebSocket connection (disable tạm thời nếu backend chưa có WebSocket server)
  useEffect(() => {
    let connectTimer = null;
    let hasConnected = false;

    try {
      connectTimer = setTimeout(() => {
        try {
          // Lấy đúng driverId (id trong bảng drivers) từ sessionStorage
          const user = JSON.parse(sessionStorage.getItem('user'));
          const driverId = (user?.driverId ?? user?.id ?? 1);
          // Kết nối WebSocket với vai trò driver và driverId để server nhận diện
          busTrackingService.connect('driver', driverId);
          hasConnected = true;
        } catch (connectError) {
          console.warn('⚠️ WebSocket connection skipped:', connectError);
        }
      }, 0);
    } catch (error) {
      console.warn('⚠️ WebSocket not available; realtime tracking disabled:', error);
    }

    return () => {
      if (connectTimer) {
        clearTimeout(connectTimer);
      }
      if (hasConnected) {
        try {
          busTrackingService.disconnect();
        } catch (err) {
          console.log('WebSocket disconnect error (ignored):', err);
        }
      }
    };
  }, []);

  // Khi người dùng vào /driver/map (không có scheduleId):
  // - Nếu có chuyến đang chạy trong sessionStorage → tự điều hướng tới /driver/map/:scheduleId đó
  // - Nếu không có chuyến đang chạy → hiện dialog yêu cầu quay lại trang Lịch làm việc
  useEffect(() => {
    if (scheduleId) return;

    try {
      const raw = sessionStorage.getItem("driverActiveTrip");
      if (raw) {
        const active = JSON.parse(raw);
        if (active?.scheduleId && active.status !== "completed") {
          navigate(`/driver/map/${active.scheduleId}`, { replace: true });
          return;
        }
      }
    } catch (err) {
      console.warn("Lỗi đọc driverActiveTrip từ sessionStorage:", err);
    }

    // Không có chuyến nào đang chạy → yêu cầu chọn lịch trước
    setShowNoActiveTripDialog(true);
    setLoading(false);
  }, [scheduleId, navigate]);

  // Load schedule và route stops từ API
  // Pipeline dữ liệu:
  // 1) Lấy driverId từ sessionStorage (id trong bảng drivers)
  // 2) GET /api/schedules/:driverId/:scheduleId → nhận routeId, thời gian, xe buýt...
  // 3) GET /api/routes/:routeId/stops → danh sách điểm dừng của tuyến
  // 4) transformStopsForMap + calculateStopTimes → chuẩn dữ liệu cho map + ETA
  // 5) Phân bổ danh sách học sinh (giả lập tạm) vào từng điểm dừng
  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        setLoading(true);
        
        // Lấy driver ID từ session (driverId là drivers.id, không phải users.id)
        const user = JSON.parse(sessionStorage.getItem('user'));
        const driverId = user?.driverId ;

        // 1. Lấy thông tin schedule
        const scheduleData = await schedulesService.getScheduleById(scheduleId, driverId);

        // 2. Lấy route stops từ route_id
        const routeStops = await routesService.getRouteStops(scheduleData.routeId);

        // 3. Transform stops
        const transformedStops = routesService.transformStopsForMap(routeStops);
        
        // 4. Tính thời gian dự kiến cho các điểm dừng
        const stopsWithTime = routesService.calculateStopTimes(
          transformedStops,
          scheduleData.startTime,
          25 // Vận tốc trung bình 25 km/h
        );

        // 5. Load students theo route và shift (morning/afternoon)
        const timeOfDay = scheduleData.shiftType === 'morning' ? 'morning' : 'afternoon';
        const routeStudentsRaw = await studentsService.getStudentsByRoute(scheduleData.routeId, timeOfDay);

        // Chuẩn hóa field stop-id (backend trả snake_case)
        const routeStudents = (routeStudentsRaw || []).map((s) => ({
          ...s,
          morningPickupStopId: s.morningPickupStopId ?? s.morning_pickup_stop_id ?? s.pickup_stop_id,
          afternoonDropoffStopId: s.afternoonDropoffStopId ?? s.afternoon_dropoff_stop_id ?? s.dropoff_stop_id,
        }));
        
        // 6. Gán students vào đúng stops dựa trên pickup_stop_id hoặc dropoff_stop_id
        const stopsWithStudents = stopsWithTime.map((stop) => {
          if (stop.isStartOrEnd) {
            return { ...stop, students: [] };
          }
          
          // Lọc học sinh thuộc điểm dừng này
          const studentsForStop = routeStudents.filter(student => {
            if (timeOfDay === 'morning') {
              return student.morningPickupStopId === stop.id;
            } else {
              return student.afternoonDropoffStopId === stop.id;
            }
          });
          
          return {
            ...stop,
            students: studentsForStop.map(s => ({ 
              id: s.id,
              name: s.name,
              class: s.class,
              phone: s.phone,
              status: 'waiting' 
            }))
          };
        });

        const totalStudents = stopsWithStudents.reduce(
          (sum, stop) => sum + stop.students.length, 0
        );

        setSchedule({
          ...scheduleData,
          totalStudents
        });
        setStops(stopsWithStudents);

        // Nếu trong sessionStorage đang lưu chuyến in_progress cho schedule này
        // thì khôi phục trạng thái in_progress để không phải bấm Bắt đầu lại.
        try {
          const raw = sessionStorage.getItem("driverActiveTrip");
          if (raw) {
            const active = JSON.parse(raw);
            if (String(active?.scheduleId) === String(scheduleId) && active.status === "in_progress") {
              setStatus("in_progress");
            }
          }
        } catch (err) {
          console.warn("Không đọc được driverActiveTrip khi khôi phục trạng thái:", err);
        }
      } catch (error) {
        console.error(' Error loading schedule data:', error);
        pushNotice('error', 'Không thể tải dữ liệu chuyến đi');
      } finally {
        setLoading(false);
      }
    };

    if (scheduleId) {
      loadScheduleData();
    }
  }, [scheduleId]);
  
  // Đồng hồ
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handlers
  const startTrip = () => {
    setStatus("in_progress");
    updateActiveTripSession("in_progress");
    pushNotice("success", "Đã bắt đầu chuyến đi!");
    
    // Gửi status qua WebSocket
    const statusUpdate = {
      isRunning: true,
      driverStatus: "in_progress",
      currentStopIndex: stopIdx,
      tripId: scheduleId || 1
    };
    console.log('🚌 Driver starting trip, sending status:', statusUpdate);
    busTrackingService.updateDriverStatus(statusUpdate);
  };

  const confirmArrival = () => {
    if (!pickedAllAt(stopIdx)) {
      pushNotice("error", " Chưa đón đủ học sinh tại điểm này");
      return;
    }

    if (resumeFn) resumeFn();

    pushNotice("success", ` Đã đón xong tại ${currentStop.name}`);

    const isCompleted = stopIdx === stops.length - 1;
    if (isCompleted) {
      pushNotice("success", " Đã hoàn thành tuyến đường");
      setStatus("completed");
      updateActiveTripSession("cleared");
      
      // Gửi trạng thái hoàn thành
      busTrackingService.updateDriverStatus({
        isRunning: false,
        driverStatus: "completed",
        currentStopIndex: stopIdx
      });
    } else {
      // Tiếp tục chuyến đi - gửi signal để các map khác tiếp tục
      const nextStopIndex = stopIdx + 1;
      busTrackingService.updateDriverStatus({
        isRunning: true,
        driverStatus: "in_progress", 
        currentStopIndex: nextStopIndex,
        resumeFromPause: true
      });
      console.log('🚌 Driver continuing trip, sending resume signal to admin/parent');
    }

    setPausedWpIdx(null);
    setResumeFn(null);
    setShowArrival(false);
    setShowStudents(false);
  };

  const submitIncident = (createdIncident) => {
    if (createdIncident) {
      pushNotice("success", ` Đã gửi báo cáo sự cố thành công - Mã số: #${createdIncident.id}`);
      
      // Gửi thông báo sự cố qua WebSocket đến admin và parent
      busTrackingService.updateDriverStatus({
        incidentAlert: {
          id: createdIncident.id,
          description: createdIncident.description,
          type: createdIncident.incident_type,
          timestamp: new Date(),
          route: 'Tuyến 1'
        }
      });
      console.log('🚨 Driver broadcasted incident alert:', createdIncident);
    }
    setIncidentMsg("");
    setShowIncident(false);
  };

  const confirmEndTrip = () => {
    setStatus("completed");
    setTracking(false);
    updateActiveTripSession("cleared");
    
    // Gửi trạng thái kết thúc qua WebSocket
    busTrackingService.updateDriverStatus({
      isRunning: false,
      driverStatus: "completed",
      currentStopIndex: stops.length - 1
    });
    
    pushNotice("success", " Đã kết thúc chuyến đi");
    setShowEndTrip(false);
    setTimeout(() => navigate("/driver/schedule"), 2000);
  };

  const toggleStudentStatus = (stopId, studentId) => {
    if (!canManageStop(stopId)) {
      pushNotice("warning", "Chỉ thao tác khi xe đã đến đúng điểm dừng");
      return;
    }
    setStops((prev) =>
      prev.map((stop) => {
        if (stop.id !== stopId) return stop;
        return {
          ...stop,
          students: stop.students.map((stu) => {
            if (stu.id !== studentId) return stu;
            if (stu.status === "picked_up") return stu; // không revert
            const updated = { ...stu, status: "picked_up" };
            pushNotice("success", ` Đã đón ${updated.name}`);
            return updated;
          }),
        };
      })
    );
  };

  const markStudentAbsent = (stopId, studentId) => {
    if (!canManageStop(stopId)) {
      pushNotice("warning", "Chỉ thao tác khi xe đã đến đúng điểm dừng");
      return;
    }
    setStops((prevStops) =>
      prevStops.map((stop) => {
        if (stop.id === stopId) {
          return {
            ...stop,
            students: stop.students.map((student) => {
              if (student.id === studentId) {
                const newStatus =
                  student.status === "absent" ? "waiting" : "absent";
                pushNotice(
                  "warning",
                  `${newStatus === "absent" ? " Vắng mặt" : " Có mặt"} ${
                    student.name
                  }`
                );
                return { ...student, status: newStatus };
              }
              return student;
            }),
          };
        }
        return stop;
      })
    );
  };

  const pushNotice = (type, message) => {
    const item = { id: Date.now(), type, message, time: new Date() };
    setNotices((prev) => [item, ...prev.slice(0, 4)]);
    
    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
      setNotices((prev) => prev.filter(notice => notice.id !== item.id));
    }, 3000);
  };

  const totalPicked = () => {
    return stops.reduce(
      (total, stop) =>
        total + stop.students.filter((s) => s.status === "picked_up").length,
      0
    );
  };

  const totalAbsent = () => {
    return stops.reduce(
      (total, stop) =>
        total + stop.students.filter((s) => s.status === "absent").length,
      0
    );
  };

  // Chỉ cho phép thao tác học sinh khi xe đã dừng tại điểm (pausedWpIdx)
  const canManageStop = (stopId) => {
    if (pausedWpIdx === null) return false;
    const current = stops[pausedWpIdx];
    return current && current.id === stopId;
  };

  const remainingStudents = () => {
    return stops.reduce(
      (total, stop) =>
        total + stop.students.filter((s) => s.status === "waiting").length,
      0
    );
  };

  const pickedAllAt = (index) => {
    const stop = stops[index];
    if (!stop) return false;
    if (stop.students.length === 0) return true;
    return stop.students.every(
      (s) => s.status === "picked_up" || s.status === "absent"
    );
  };

  // Tuyến đường tuyến tính (không khép kín)
  const routeWaypoints = stops.map((s) => [s.lat, s.lng]);

  // Loading state
  if (loading || !schedule) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải thông tin chuyến đi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <DriverHeader
        schedule={schedule}
        currentTime={clock}
        isTracking={tracking}
        onBack={() => navigate("/driver/schedule")}
        onToggleTracking={() => setTracking(!tracking)}
        onOpenSettings={() => setShowEndTrip(true)}
      />
      <AlertsContainer alerts={notices} />

      {/* Map  */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <MapContainer
            center={
              stops.length ? [stops[0].lat, stops[0].lng] : [10.76, 106.68]
            }
            zoom={16}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {stops.map((s, i) => (
              <Marker key={s.id} position={[s.lat, s.lng]}>
                <Popup>
                  <strong>
                    {i === 0 ? "Điểm xuất phát" : `Điểm dừng ${i}`}
                  </strong>
                  <br />
                  {s.name}
                </Popup>
              </Marker>
            ))}

            {status === "in_progress" && stops.length > 0 && (
              <BusRouteDriver
                waypoints={routeWaypoints}
                speedMetersPerSec={15}
                loop={false}
                isRunning={true} // Driver component - always running when in_progress
                onPositionUpdate={(position) => {
                  setBusCurrentPosition(position);
                  
                  // Gửi vị trí realtime qua WebSocket
                  busTrackingService.updateDriverStatus({
                    currentPosition: position
                  });

                  // Ghi log GPS vào DB (background, không chặn UI)
                  try {
                    trackingService.logLocation({
                      busId: schedule?.busId,
                      driverId: schedule?.driverId,
                      scheduleId: scheduleId ? Number(scheduleId) : null,
                      latitude: position.lat,
                      longitude: position.lng,
                      speed: null,
                      heading: null,
                      accuracy: null
                    });
                  } catch (err) {
                    console.warn('⚠️ Failed to log location:', err?.message || err);
                  }
                }}
                onTripComplete={({ finalStopIndex, finalPosition }) => {
                  const fallbackIndex = stops.length > 0 ? stops.length - 1 : 0;
                  const finalIndex = typeof finalStopIndex === "number" ? finalStopIndex : fallbackIndex;
                  const finalStop = stops[finalIndex];
                  const lastPos = finalPosition || (finalStop ? { lat: finalStop.lat, lng: finalStop.lng } : null);

                  setStopIdx(finalIndex);
                  setPausedWpIdx(null);
                  setResumeFn(null);
                  setShowStudents(false);
                  setShowArrival(false);
                  setStatus("completed");
                  updateActiveTripSession("cleared");
                  if (lastPos) {
                    setBusCurrentPosition(lastPos);
                  }

                  busTrackingService.updateDriverStatus({
                    isRunning: false,
                    driverStatus: "completed",
                    currentStopIndex: finalIndex,
                    currentPosition: lastPos || busCurrentPosition
                  });

                  pushNotice("success", " Đã hoàn thành tuyến đường (tự động)");
                }}
                onReachStop={(wpIdx, resumeFn) => {
                  setStopIdx(wpIdx);
                  setPausedWpIdx(wpIdx);
                  setResumeFn(() => resumeFn);
                  setShowStudents(true);
                  
                  // Gửi trạng thái pause qua WebSocket
                  busTrackingService.updateDriverStatus({
                    isRunning: false,
                    driverStatus: "paused",
                    currentStopIndex: wpIdx,
                    currentPosition: busCurrentPosition
                  });
                  
                  pushNotice(
                    "warning",
                    `⚠️ Đã đến điểm dừng: ${stops[wpIdx].name} - chờ xác nhận`
                  );
                }}
              />
            )}
          </MapContainer>
        </div>

        <TripStatusPanel
          tripStatus={status}
          currentStopIndex={stopIdx}
          stops={stops}
          nextStop={nextStop}
          remainingDistance={remainingDistance}
          estimatedTime={estimatedTime}
          getRemainingStudents={remainingStudents}
        />

        {/* Dialog: chưa chọn lịch nhưng bấm Bắt đầu chuyến ở sidebar */}
        <ConfirmDialog
          isOpen={showNoActiveTripDialog}
          title="Chưa chọn lịch làm việc"
          message="Vui lòng vào trang Lịch làm việc và bấm 'Bắt đầu tuyến' cho ca bạn muốn trước khi bắt đầu chuyến."
          confirmText="Đi tới Lịch làm việc"
          cancelText="Đóng"
          onConfirm={() => {
            navigate("/driver/schedule");
          }}
          onClose={() => {
            setShowNoActiveTripDialog(false);
            navigate("/driver/schedule");
          }}
        />

        {/* Floating Action Buttons */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-50">
          {/* Start Trip Button */}
          {status === "not_started" && (
            <button
              onClick={startTrip}
              className="w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-xl flex items-center justify-center transform hover:scale-105 transition-all"
              title="Bắt đầu chuyến"
            >
              <FaPlay className="w-7 h-7" />
            </button>
          )}
          
          {/* Students Button */}
          {status !== "not_started" && (
            <button
              onClick={() => setShowStudents(true)}
              disabled={pausedWpIdx === null}
              className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transform hover:scale-105 transition-all relative"
              title="Danh sách học sinh"
            >
              <FaUsers className="w-7 h-7" />
              {remainingStudents() > 0 && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {remainingStudents()}
                </div>
              )}
            </button>
          )}
          
          {/* Confirm Arrival Button */}
          {status !== "not_started" && pausedWpIdx !== null && (
            <button
              onClick={() => setShowArrival(true)}
              disabled={!pickedAllAt(stopIdx)}
              className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-all transform hover:scale-105 ${
                pickedAllAt(stopIdx)
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
              title={pickedAllAt(stopIdx) ? "Đã đón xong - tiếp tục" : "Cần đón đủ học sinh trước"}
            >
              <FaCheckCircle className="w-7 h-7" />
            </button>
          )}
          
          {/* Incident Report Button */}
          <button
            onClick={() => setShowIncident(true)}
            className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xl flex items-center justify-center transform hover:scale-105 transition-all"
            title="Báo cáo sự cố"
          >
            <FaExclamationTriangle className="w-7 h-7" />
          </button>
          
          {/* Emergency Call Button */}
          <button
            onClick={() => window.open("tel:1900-1234")}
            className="w-16 h-16 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full shadow-xl flex items-center justify-center transform hover:scale-105 transition-all"
            title="Liên hệ khẩn cấp"
          >
            <FaPhone className="w-7 h-7" />
          </button>
        </div>

        {/* Modals */}
        <ArrivalConfirmModal
          isOpen={showArrival}
          currentStop={currentStop}
          allStudentsPickedUp={pickedAllAt(stopIdx)}
          onConfirm={confirmArrival}
          onCancel={() => setShowArrival(false)}
        />

        <IncidentReportModal
          isOpen={showIncident}
          incidentText={incidentMsg}
          onIncidentTextChange={setIncidentMsg}
          onSubmit={submitIncident}
          onClose={() => setShowIncident(false)}
          driverInfo={{
            id: schedule?.driverId || 1,
            busId: schedule?.busId || 1,
            routeId: schedule?.routeId || 1
          }}
          currentPosition={busCurrentPosition}
        />

        <EndTripModal
          isOpen={showEndTrip}
          routeName={schedule.routeName}
          onConfirm={confirmEndTrip}
          onCancel={() => setShowEndTrip(false)}
        />

        {/* Students Panel */}
        <StudentsPanel
          isOpen={showStudents}
          stops={stops}
          currentStopIndex={stopIdx}
          pausedWaypointIdx={pausedWpIdx}
          busNumber={schedule.busNumber}
          totalStudents={schedule.totalStudents}
          getTotalPickedUp={totalPicked}
          getTotalAbsent={totalAbsent}
          getRemainingStudents={remainingStudents}
          allStudentsPickedUp={pickedAllAt(stopIdx)}
          toggleStudentStatus={toggleStudentStatus}
          markStudentAbsent={markStudentAbsent}
          onClose={() => setShowStudents(false)}
          onConfirmArrival={confirmArrival}
        />
      </div>
    </div>
  );
}
