/**
 * ParentPage - Trang theo dõi xe buýt cho phụ huynh
 * 
 * Chức năng:
 * - Hiển thị thông tin học sinh (từ API students)
 * - Hiển thị thông tin xe buýt/tài xế đang chạy (từ API schedules)
 * - Theo dõi vị trí xe buýt realtime (qua WebSocket)
 * - Nhận thông báo sự cố và đón học sinh (qua WebSocket)
 * - Hiển thị danh sách sự cố gần đây (từ API incidents)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

// Services - gọi API backend
import { studentsService } from '../../services/studentsService';
import { schedulesService } from '../../services/schedulesService';
import { incidentsService } from '../../services/incidentsService';
import { routesService } from '../../services/routesService';
import busTrackingService from '../../services/busTrackingService';

// Components
import {
  ToastNotification,
  IncidentCard,
  StudentInfoCard,
  BusInfoCard,
  TripStatusCard,
  BusTrackingMap
} from '../../components/parent';

export default function ParentPage() {
  // === STATE ===
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [busInfo, setBusInfo] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [routeId, setRouteId] = useState(null);
  const [assignedRouteIds, setAssignedRouteIds] = useState([]);
  const [activeTripId, setActiveTripId] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // State cho tracking realtime
  const [busStatus, setBusStatus] = useState({
    driverStatus: 'idle',
    currentStopIndex: 0,
    currentPosition: null,
    isRunning: false
  });
  const [busPosition, setBusPosition] = useState(null);

  const displayedNotificationsRef = useRef(new Set());
  const activeScheduleIdRef = useRef(null);
  const lastWsLogAtRef = useRef(0);
  // Cache schedules để WS sync không phải gọi /admin-schedules lặp lại
  const schedulesByIdRef = useRef(new Map());

  const DEBUG_TAG = '[ParentTracking]';

  // === HELPER FUNCTIONS ===

  // Chuẩn hoá về số (tránh NaN khi data từ API/user là string)
  const toNumber = (v) => {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  // Kiểm tra schedule có thuộc các tuyến được gán cho phụ huynh không
  const isAssignedRouteSchedule = (schedule) => {
    const rid = toNumber(schedule?.route_id);
    return rid != null && assignedRouteIds.includes(rid);
  };

  // Đọc user routes từ session (dùng 1 lần ở bước init)
  const getAssignedRoutesFromSession = () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    return [user?.morning_route_id, user?.afternoon_route_id]
      .filter(Boolean)
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));
  };

  // Cập nhật UI theo schedule đã chọn (routeId, busInfo, activeTripId)
  const applyScheduleToUI = (schedule) => {
    const rid = toNumber(schedule?.route_id);
    const sid = toNumber(schedule?.id);
    if (rid != null) setRouteId(rid);
    if (sid != null) {
      activeScheduleIdRef.current = sid;
      setActiveTripId(sid);
    }

    setBusInfo({
      busNumber: schedule?.license_plate || schedule?.bus_number || 'N/A',
      route: schedule?.route_name || (rid != null ? `Tuyến ${rid}` : 'Tuyến'),
      driverName: schedule?.driver_name || 'Tài xế',
      driverPhone: schedule?.driver_phone || null,
      scheduleId: schedule?.id
    });

    // Debug: chọn lịch từ API/WS
    console.groupCollapsed(`${DEBUG_TAG} Using schedule`);
    console.log('assignedRouteIds:', assignedRouteIds);
    console.log('scheduleId:', schedule?.id, 'status:', schedule?.status);
    console.log('routeId:', rid, 'route_name:', schedule?.route_name);
    console.groupEnd();
  };

  // Chọn schedule phù hợp nhất (ưu tiên đang chạy)
  const pickBestSchedule = (schedules) => {
    // 1) Ưu tiên lịch đang chạy (in_progress)
    const inProgress = schedules
      .filter((s) => isAssignedRouteSchedule(s) && s.status === 'in_progress')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (inProgress[0]) return inProgress[0];

    // 2) Nếu đã có scheduleId active từ WS trước đó → ưu tiên khớp theo id
    if (activeScheduleIdRef.current != null) {
      const activeId = toNumber(activeScheduleIdRef.current);
      const matched = schedules.find((s) => toNumber(s?.id) === activeId);
      if (matched) return matched;
    }

    // 3) Nếu vẫn chưa có → chọn lịch phù hợp nhất trong hôm nay
    const today = new Date().toISOString().slice(0, 10);
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const toMinutes = (hhmm) => {
      if (!hhmm || typeof hhmm !== 'string') return null;
      const [h, m] = hhmm.split(':').map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) return null;
      return h * 60 + m;
    };

    const todays = schedules
      .filter((s) => isAssignedRouteSchedule(s) && s.date === today)
      .map((s) => ({
        s,
        startMin: toMinutes(s.start_time),
        endMin: toMinutes(s.end_time)
      }));

    const upcoming = todays
      .filter(({ endMin }) => endMin == null || nowMinutes <= endMin)
      .sort((a, b) => {
        if (a.startMin == null && b.startMin == null) return 0;
        if (a.startMin == null) return 1;
        if (b.startMin == null) return -1;
        return a.startMin - b.startMin;
      });

    return upcoming[0]?.s || null;
  };
  
  // Tạo notification ID unique
  const createNotificationId = (type) => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Thêm notification và tự động ẩn sau 10s
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 10000);
  }, []);

  // Xóa notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // === API CALLS ===

  /**
   * Load thông tin học sinh từ user session
   * API: GET /students/:id
   */
  useEffect(() => {
    const loadStudentInfo = async () => {
      try {
        setLoading(true);
        
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user) {
          console.error('Chưa đăng nhập');
          setLoading(false);
          return;
        }

        const { student_id, student_name, morning_route_id, afternoon_route_id } = user;

        // Lấy 2 tuyến được gán cho học sinh (phụ huynh chỉ theo dõi các tuyến này)
        setAssignedRouteIds(getAssignedRoutesFromSession());

        if (student_id) {
          const studentData = await studentsService.getStudentById(student_id);
          setStudentInfo({
            name: studentData.name,
            class: studentData.class_name || studentData.class || 'N/A',
            phone: studentData.phone
          });
        } else if (student_name) {
          setStudentInfo({
            name: student_name,
            class: 'N/A',
            phone: null
          });
        } else {
          setStudentInfo({ name: 'Không có dữ liệu', class: 'N/A', phone: null });
        }

      } catch (error) {
        console.error('Lỗi load thông tin học sinh:', error);
        setStudentInfo({ name: 'Lỗi tải dữ liệu', class: 'N/A', phone: null });
      } finally {
        setLoading(false);
      }
    };

    loadStudentInfo();
  }, []);

  /**
   * Chọn lịch trình phù hợp nhất cho phụ huynh (ưu tiên đang chạy)
   * - Nhiệm vụ của effect này: xác định schedule đang chạy + routeId tương ứng
   * - Map markers sẽ render theo routeId (thông qua loadRouteStops)
   */
  useEffect(() => {
    if (!assignedRouteIds || assignedRouteIds.length === 0) return;

    const loadActiveSchedule = async () => {
      try {
        // Chỉ cần gọi /admin-schedules 1 lần ở bước init.
        // Sau đó cache theo id để WS sync có thể dùng lại.
        const schedules = await schedulesService.getAllSchedules();
        schedulesByIdRef.current = new Map(
          (schedules || []).map((s) => [toNumber(s?.id), s])
        );

        const schedule = pickBestSchedule(schedules || []);

        // Fallback cuối: nếu không có schedule nào thì vẫn load markers theo route đầu tiên
        if (!schedule) {
          setRouteId(assignedRouteIds[0]);
          return;
        }

        applyScheduleToUI(schedule);
      } catch (error) {
        console.error('Error loading schedule:', error);
      }
    };

    loadActiveSchedule();
  }, [assignedRouteIds]);

  /**
   * Load route stops khi có routeId
   * API: GET /routes/:id/stops
   */
  useEffect(() => {
    if (!routeId) return;

    const loadRouteStops = async () => {
      try {
        const stopsData = await routesService.getRouteStops(routeId);
        const transformedStops = routesService.transformStopsForMap(stopsData);
        setRouteStops(transformedStops);
      } catch (error) {
        console.error('Lỗi load route stops:', error);
      }
    };

    loadRouteStops();
  }, [routeId]);

  /**
   * Load schedule đang chạy hôm nay
   * API: GET /admin-schedules
   */
  // (Đã được gộp vào effect chọn schedule dựa trên assignedRouteIds)

  /**
   * Load incidents và auto-refresh mỗi 30 giây
   * API: GET /incidents/route/:routeId
   */
  useEffect(() => {
    if (!routeId) return;

    const loadIncidents = async () => {
      try {
        const response = await incidentsService.getIncidentsByRoute(routeId);
        const incidentsData = response?.incidents || response || [];
        
        // Lọc sự cố trong 30 phút gần nhất
        const recentIncidents = incidentsData.filter(incident => {
          const incidentTime = new Date(incident.created_at);
          const minutesDiff = (Date.now() - incidentTime) / (1000 * 60);
          return minutesDiff <= 30;
        });
        
        setIncidents(recentIncidents);
      } catch (error) {
        console.error('Lỗi load incidents:', error);
      }
    };

    loadIncidents();
    const interval = setInterval(loadIncidents, 30000);
    return () => clearInterval(interval);
  }, [routeId]);

  // === WEBSOCKET - Realtime tracking ===

  useEffect(() => {
    if (!activeTripId) return;

    // Kết nối WebSocket và join đúng room theo tripId (= scheduleId)
    busTrackingService.connect('parent', String(activeTripId));

    // Handler nhận cập nhật từ driver
    const handleBusStatusUpdate = (status) => {
      // Log gọn: chỉ log khi đổi tripId hoặc mỗi vài giây
      if (status.tripId) {
        const scheduleId = parseInt(status.tripId);
        if (scheduleId !== activeScheduleIdRef.current) {
          console.groupCollapsed(`${DEBUG_TAG} WS trip changed`);
          console.log('prevTripId:', activeScheduleIdRef.current, 'newTripId:', scheduleId);
          console.log('assignedRouteIds:', assignedRouteIds);
          console.log('current routeId(state) before sync:', routeId);
          console.log('driverStatus:', status.driverStatus, 'currentStopIndex:', status.currentStopIndex);
          console.log('hasCurrentPosition:', Boolean(status.currentPosition));
          console.groupEnd();

          activeScheduleIdRef.current = scheduleId;
          setActiveTripId(scheduleId);

          // Đồng bộ routeId/busInfo theo scheduleId từ WS.
          // Ưu tiên dùng cache (init), chỉ fetch lại khi cache không có.
          const cached = schedulesByIdRef.current.get(Number(scheduleId));
          if (cached && isAssignedRouteSchedule(cached)) {
            applyScheduleToUI(cached);
          } else {
            schedulesService.getAllSchedules().then((schedules) => {
              const nextMap = new Map((schedules || []).map((s) => [toNumber(s?.id), s]));
              schedulesByIdRef.current = nextMap;

              const schedule = nextMap.get(Number(scheduleId));
              if (schedule && isAssignedRouteSchedule(schedule)) {
                applyScheduleToUI(schedule);
              }
            });
          }
        }
      }

      // Throttle log vị trí
      const now = Date.now();
      if (now - lastWsLogAtRef.current > 4000) {
        lastWsLogAtRef.current = now;
        console.debug(`${DEBUG_TAG} WS tick`, {
          tripId: status.tripId,
          driverStatus: status.driverStatus,
          currentStopIndex: status.currentStopIndex,
          hasCurrentPosition: Boolean(status.currentPosition),
        });
      }

      setBusStatus(prev => ({
        ...prev,
        ...status,
        driverStatus: status.driverStatus || prev.driverStatus,
        currentStopIndex: status.currentStopIndex ?? prev.currentStopIndex,
        currentPosition: status.currentPosition || prev.currentPosition
      }));

      if (status.currentPosition) {
        setBusPosition(status.currentPosition);
      }

      if (status.incidentAlert) {
        const incidentKey = `incident-${status.incidentAlert.description}-${status.incidentAlert.timestamp || Date.now()}`;
        
        if (!displayedNotificationsRef.current.has(incidentKey)) {
          displayedNotificationsRef.current.add(incidentKey);
          addNotification({
            id: createNotificationId('incident'),
            type: 'incident',
            message: status.incidentAlert.description,
            route: status.incidentAlert.route || 'Tuyến xe buýt',
            timestamp: new Date()
          });
        }
      }

      if (status.studentPickupAlert) {
        const pickupStudentName = status.studentPickupAlert.studentName;
        const pickupKey = `pickup-${pickupStudentName}-${status.studentPickupAlert.timestamp}`;
        
        const isMyChild = studentInfo && pickupStudentName === studentInfo.name;
        
        if (isMyChild && !displayedNotificationsRef.current.has(pickupKey)) {
          displayedNotificationsRef.current.add(pickupKey);
          addNotification({
            id: createNotificationId('pickup'),
            type: 'pickup',
            message: `Học sinh ${pickupStudentName} đã được đón tại ${status.studentPickupAlert.stopName}`,
            route: status.studentPickupAlert.routeName,
            driverName: status.studentPickupAlert.driverName,
            timestamp: new Date()
          });
        }
      }
    };

    // Backend emit: 'bus_status_update'
    busTrackingService.on('bus_status_update', handleBusStatusUpdate);

    return () => {
      busTrackingService.off('bus_status_update', handleBusStatusUpdate);
    };
  }, [addNotification, studentInfo, activeTripId, assignedRouteIds, routeId]);

  // === RENDER ===

  const nextStop = routeStops[busStatus.currentStopIndex + 1] || null;

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Theo dõi xe buýt
      </h1>

      <div className="flex flex-col gap-6">
        {/* Thông báo sự cố */}
        {incidents.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Thông báo sự cố ({incidents.length})
            </h2>
            <div className="space-y-3">
              {incidents.map(incident => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          </div>
        )}

        {/* Trạng thái chuyến đi */}
        <TripStatusCard
          driverStatus={busStatus.driverStatus}
          currentStopIndex={busStatus.currentStopIndex}
          stops={routeStops}
          nextStop={nextStop}
        />

        {/* Bản đồ tracking */}
        <BusTrackingMap
          stops={routeStops}
          busStatus={busStatus}
          busPosition={busPosition}
          currentStopIndex={busStatus.currentStopIndex}
        />

        {/* Thông tin học sinh */}
        <StudentInfoCard studentInfo={studentInfo} loading={loading} />

        {/* Thông tin xe buýt */}
        <BusInfoCard busInfo={busInfo} loading={loading} />

        {/* Toast Notifications */}
        {notifications.map(notification => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}
