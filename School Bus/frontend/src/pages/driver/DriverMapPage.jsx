import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import BusRouteLayer from "../../components/map/BusRouteLayer.jsx";
import { applyLeafletDefaultIcon } from "../../utils/mapDefaults.js";
import DriverHeader from "../../components/driver/DriverHeader.jsx";
import AlertsContainer from "../../components/driver/AlertsContainer.jsx";
import TripStatusPanel from "../../components/driver/TripStatusPanel.jsx";
import ArrivalConfirmModal from "../../components/driver/ArrivalConfirmModal.jsx";
import IncidentReportModal from "../../components/driver/IncidentReportModal.jsx";
import EndTripModal from "../../components/driver/EndTripModal.jsx";
import StudentsPanel from "../../components/driver/StudentsPanel.jsx";
import ConfirmDialog from "../../components/UI/ConfirmDialog.jsx";
import { schedulesService } from "../../services/schedulesService.js";
import routesService from "../../services/routesService.js";
import busTrackingService from "../../services/busTrackingService.js";
import { 
  FaPlay, FaUsers, FaCheckCircle, FaExclamationTriangle, 
  FaPhone
} from "react-icons/fa";

applyLeafletDefaultIcon();

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
  const [pausedWpIdx, setPausedWpIdx] = useState(null);
  const [busCurrentPosition, setBusCurrentPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNoActiveTripDialog, setShowNoActiveTripDialog] = useState(false);

  const isStartingTripRef = useRef(false);
  const busPosRef = useRef(null);
  const lastPausedIdxRef = useRef(null);
  const completedHandledRef = useRef(false);

  // Data from API
  const [schedule, setSchedule] = useState(null);
  const [stops, setStops] = useState([]);

 
  const currentStop = stops[stopIdx];
  const nextStop = stops[stopIdx + 1];
  
  // Tính toán khoảng cách động và thời gian dự kiến 
  // (Đã chuyển logic tính ETA sang BE, nhưng FE vẫn hiển thị khoảng cách đơn giản)
  const calculateRemainingDistance = () => {
    if (!nextStop || status === "completed") return "0 km";
    
    // Sử dụng vị trí bus hiện tại nếu có, nếu không thì dùng điểm dừng hiện tại
    const fromLat = busCurrentPosition?.lat || currentStop?.lat || stops[0]?.lat;
    const fromLng = busCurrentPosition?.lng || currentStop?.lng || stops[0]?.lng;
    const toLat = nextStop.lat;
    const toLng = nextStop.lng;
    
    if (!fromLat || !fromLng || !toLat || !toLng) return "-- km";
    
    // Công thức Haversine để tính khoảng cách thực tế
    // Vẫn giữ lại để hiển thị UI cho tài xế thấy họ còn cách bao xa (về mặt địa lý)
    const R = 6371; 
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

// Tìm trạm cuối cùng để lấy giờ kết thúc thực tế (đã tính toán)
const lastStop = stops.length > 0 ? stops[stops.length - 1] : null;

// Nếu còn trạm tiếp theo -> lấy giờ trạm đó. 
// Nếu hết trạm -> lấy giờ của trạm cuối cùng.
const estimatedTime = nextStop 
    ? nextStop.time 
    : (lastStop ? lastStop.time : 'Waiting...');

  const remainingDistance = calculateRemainingDistance();
  
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
 

  // Khởi tạo WebSocket connection
  useEffect(() => {
    let hasConnected = false;

    try {
        // Lấy đúng tripId (scheduleId) để join room
        if (scheduleId) {
            // Kết nối WebSocket với vai trò driver và tripId cụ thể
            busTrackingService.connect('driver', scheduleId);
            hasConnected = true;
        }
    } catch (error) {
       console.warn(' WebSocket not available; realtime tracking disabled:', error);
    }

    return () => {
      /* 
         Không cần ngắt kết nối ở đây nếu user chỉ chuyển qua lại giữa các tab trong app.
         Tuy nhiên, nếu user rời hẳn trang map, có thể cân nhắc disconnect 
         hoặc để service tự quản lý (singleton).
         Ở đây ta giữ kết nối để không phải reconnect liên tục.
      */
     // if (hasConnected) busTrackingService.disconnect(); 
    };
  }, [scheduleId]);

  // Reset các cờ nội bộ khi đổi schedule
  useEffect(() => {
    completedHandledRef.current = false;
    lastPausedIdxRef.current = null;
  }, [scheduleId]);

  // Nhận trạng thái từ backend để driver UI luôn đồng bộ (passive)
  useEffect(() => {
    if (!scheduleId) return;
    

    const handleStatusUpdate = (statusPayload) => {
      if (!statusPayload) return;

      const serverTripId = statusPayload.tripId != null ? String(statusPayload.tripId) : null;
      if (serverTripId && String(scheduleId) !== serverTripId) return;

      const driverStatus = statusPayload.driverStatus;
      if (!driverStatus) return;

      const serverStopIndex = Number.isFinite(statusPayload.currentStopIndex)
        ? statusPayload.currentStopIndex
        : 0;

      const hasPosition =
        statusPayload.currentPosition &&
        Number.isFinite(statusPayload.currentPosition.lat) &&
        Number.isFinite(statusPayload.currentPosition.lng);

      if (hasPosition) {
        setBusCurrentPosition(statusPayload.currentPosition);
        busPosRef.current = statusPayload.currentPosition;
      }

      setStopIdx(serverStopIndex);
      setStatus(driverStatus);
      updateActiveTripSession(driverStatus);

      if (driverStatus === 'paused') {
        setPausedWpIdx(serverStopIndex);
        if (lastPausedIdxRef.current !== serverStopIndex) {
          lastPausedIdxRef.current = serverStopIndex;
          setShowStudents(true);
          pushNotice("warning", ` Đã đến điểm dừng: ${stops[serverStopIndex]?.name || "N/A"}`);
        }
      } else {
        setPausedWpIdx(null);
      }

      if (driverStatus === 'completed' && !completedHandledRef.current) {
        completedHandledRef.current = true;
        setShowStudents(false);
        setShowArrival(false);
        updateActiveTripSession("cleared");

        if (scheduleId) {
          schedulesService
            .updateScheduleStatus(scheduleId, "completed")
            .catch((err) => {
              console.error(" Không thể cập nhật trạng thái lịch trình (auto):", err);
            });
        }

        if (schedule?.routeId) {
          routesService
            .recalculateRouteDistance(schedule.routeId)
            .catch((err) => {
              console.error(" Không thể tính lại quãng đường tuyến:", err);
            });
        }
      }
    };

    busTrackingService.on('bus_status_update', handleStatusUpdate);
    return () => {
      busTrackingService.off('bus_status_update', handleStatusUpdate);
    };
  }, [scheduleId]);

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
 
  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        setLoading(true);
        
        // Lấy driver ID từ session (driverId là drivers.id, không phải users.id)
        const user = JSON.parse(sessionStorage.getItem('user'));
        const driverId = user?.driverId ;

        // 1. Lấy thông tin schedule
        const scheduleData = await schedulesService.getScheduleById(scheduleId, driverId);

        // 2. Lấy danh sách stops kèm thời gian từ Backend
        const stopsData = await schedulesService.getScheduleStops(driverId, scheduleId);
        
        // Map về format mà frontend đang dùng
        const stopsWithStudents = (stopsData.stops || []).map((stop) => ({
          id: stop.id,
          name: stop.name,
          address: stop.address,
          lat: stop.latitude,
          lng: stop.longitude,
          order: stop.order,
          time: stop.estimatedTime ?? stop.time,
          isStartOrEnd: stop.type === 'Xuất phát' || stop.type === 'Kết thúc',
          students: stop.students || []
        }));

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
  const startTrip = async () => {
    if (!scheduleId) {
      pushNotice('error', 'Không xác định được lịch để bắt đầu');
      return;
    }
    if (isStartingTripRef.current) return;

    if (!schedule?.routeId) {
      pushNotice("error", "Đang tải tuyến, vui lòng thử lại sau vài giây");
      return;
    }

    isStartingTripRef.current = true;
    try {
      await schedulesService.updateScheduleStatus(scheduleId, "in_progress");

      setStatus('in_progress');
      updateActiveTripSession('in_progress');
      pushNotice('success', 'Đã bắt đầu chuyến đi!');

      busTrackingService.controlTrip("start", {
        routeId: schedule.routeId,
        speedMetersPerSec: 15,
      });
    } catch (err) {
      const msg = err?.message || 'Không thể bắt đầu chuyến đi';
      console.warn('Không cập nhật được schedule status in_progress:', err);
      pushNotice('error', msg);
      // giữ nguyên not_started để không gây nhầm lẫn (Parent sẽ không tracking nếu BE từ chối)
    } finally {
      isStartingTripRef.current = false;
    }
  };

  const confirmArrival = () => {
    if (!pickedAllAt(stopIdx)) {
      pushNotice("error", " Chưa đón đủ học sinh tại điểm này");
      return;
    }

    pushNotice("success", ` Đã đón xong tại ${currentStop.name}`);

    const isLastStop = stopIdx === stops.length - 1;
    if (isLastStop) {
      pushNotice("success", " Đã hoàn thành tuyến đường");
    }
    busTrackingService.controlTrip("resume");

    setPausedWpIdx(null);
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
          route: schedule?.routeName || `Tuyến ${schedule?.routeId || ""}`
        }
      });
      console.log(' Driver broadcasted incident alert:', createdIncident);
    }
    setIncidentMsg("");
    setShowIncident(false);
  };

  const confirmEndTrip = async () => {
    setShowEndTrip(false);
    try {
      if (scheduleId) {
        await schedulesService.updateScheduleStatus(scheduleId, "completed");
      }
      busTrackingService.controlTrip("stop");
      setStatus("completed");
      setTracking(false);
      updateActiveTripSession("cleared");
      pushNotice("success", " Đã kết thúc chuyến đi");
    } catch (err) {
      pushNotice("error", err?.message || "Không thể kết thúc chuyến");
      return;
    }
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
            
            //  Gửi thông báo đón học sinh qua WebSocket đến parent
            busTrackingService.updateDriverStatus({
              studentPickupAlert: {
                studentName: updated.name,
                stopName: stop.name,
                routeName: schedule?.routeName ,
                driverName: schedule?.driverName ,
                timestamp: new Date().toISOString()
              }
            });
          
            
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
  // Quan trọng: memoize để không tạo array mới mỗi render (DriverMapPage re-render theo từng frame)
  const routeWaypoints = useMemo(() => stops.map((s) => [s.lat, s.lng]), [stops]);

  // Trường hợp đặc biệt: truy cập /driver/map khi chưa chọn lịch
  // và không có chuyến nào đang chạy trong sessionStorage
  // -> chỉ hiển thị dialog yêu cầu quay lại trang Lịch làm việc
  if (showNoActiveTripDialog) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <ConfirmDialog
          isOpen={showNoActiveTripDialog}
          title="Chưa chọn lịch làm việc"
          message="Vui lòng vào trang Lịch làm việc và bấm 'Bắt đầu tuyến' cho ca bạn muốn trước khi bắt đầu chuyến."

       
          onConfirm={() => {
            navigate("/driver/schedule");
          }}
          onClose={() => {
            setShowNoActiveTripDialog(false);
            navigate("/driver/schedule");
          }}
        />
      </div>
    );
  }

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

            {status !== "not_started" && stops.length > 0 && (
              <BusRouteLayer
                waypoints={routeWaypoints}
                isVisible={status !== "not_started"}
                currentPosition={busCurrentPosition}
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
