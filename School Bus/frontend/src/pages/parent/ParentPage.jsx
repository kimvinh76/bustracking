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
  // Chống race-condition khi load route stops (request cũ về sau không được ghi đè)
  const routeStopsReqIdRef = useRef(0);

  // === HELPER FUNCTIONS ===

  // Chuẩn hoá về số (tránh NaN khi data từ API/user là string)
  const toNumber = (v) => {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const  normalizeStatus = (status) => String(status || '').trim().toLowerCase();

  // Kiểm tra schedule có thuộc các tuyến được gán cho phụ huynh không
  const isAssignedRouteSchedule = (schedule) => {
    const rid = toNumber(schedule?.route_id);
    return rid != null && assignedRouteIds.includes(rid);
  };

  // Cập nhật UI theo schedule đang chạy (Option B):
  // - Chỉ set routeId/busInfo khi schedule.status === in_progress
  // - Clear tuyến cũ ngay khi đổi tuyến
  const applyActiveScheduleToUI = (schedule) => {
    const rid = toNumber(schedule?.route_id);
    const sid = toNumber(schedule?.id);
    if (rid == null || sid == null) return;

    setRouteStops([]);
    setRouteId(rid);
    setActiveTripId(sid);
    setBusInfo({
      busNumber: schedule?.license_plate || schedule?.bus_number || 'N/A',
      route: schedule?.route_name || `Tuyến ${rid}`,
      driverName: schedule?.driver_name || 'Tài xế',
      driverPhone: schedule?.driver_phone || null,
      scheduleId: schedule?.id
    });
  };

  //  (strict realtime): nếu không có chuyến đang chạy thì không vẽ tuyến/businfo.
  // Hàm này reset các state liên quan đến chuyến đi.
  const clearActiveTripUI = () => {
    setActiveTripId(null);
    setRouteId(null);
    setRouteStops([]);
    setBusInfo(null);
    setBusPosition(null);
    setBusStatus({
      driverStatus: 'idle',
      currentStopIndex: 0,
      currentPosition: null,
      isRunning: false
    });
  };

  // Chọn schedule cho tracking realtime:
  // - CHỈ lấy schedule đang chạy (in_progress) thuộc tuyến được gán.
  // - Nếu không có -> coi như không có chuyến đang chạy.
  const pickInProgressSchedule = (schedules) => {
    const inProgress = (schedules || [])
      .filter(
        (s) =>
          isAssignedRouteSchedule(s) &&
          normalizeStatus(s.status) === 'in_progress'
      )
      .sort((a, b) => {
        const byDate = new Date(b.date) - new Date(a.date);
        if (byDate !== 0) return byDate;
        // cùng ngày: ưu tiên chuyến mới hơn theo start_time/scheduled_start_time nếu có
        const aTime = a?.start_time || a?.scheduled_start_time || '';
        const bTime = b?.start_time || b?.scheduled_start_time || '';
        return String(bTime).localeCompare(String(aTime));
      });
    return inProgress[0] || null;
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
        const routes = [morning_route_id, afternoon_route_id]
          .filter(Boolean)
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id));
        setAssignedRouteIds(routes);

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

  // Nếu chưa có chuyến đang chạy, poll nhẹ để phát hiện khi tài xế bắt đầu chuyến.
  // (Tránh phụ huynh phải F5 trang)
  useEffect(() => {
    if (!assignedRouteIds || assignedRouteIds.length === 0) return;
    if (activeTripId) return;

    const checkInProgress = async () => {
      try {
        const schedule = await schedulesService.getActiveSchedule(assignedRouteIds);
        if (schedule && isAssignedRouteSchedule(schedule) && normalizeStatus(schedule.status) === 'in_progress') {
          applyActiveScheduleToUI(schedule);
        }
      } catch {
        // im lặng để không spam console nếu backend/db tạm thời lỗi
      }
    };

    // Check ngay khi vào trang (để không phải chờ 8s)
    checkInProgress();
    const interval = setInterval(checkInProgress, 8000);
    return () => clearInterval(interval);
  }, [assignedRouteIds, activeTripId]);

  /**
   * Load route stops khi có routeId
   * API: GET /routes/:id/stops
   */
  useEffect(() => {
    if (!routeId) return;

    const loadRouteStops = async () => {
      const reqId = ++routeStopsReqIdRef.current;
      try {
        const stopsData = await routesService.getRouteStops(routeId);
        const transformedStops = routesService.transformStopsForMap(stopsData);
        // Chỉ set nếu đây là request mới nhất
        if (reqId === routeStopsReqIdRef.current) {
          setRouteStops(transformedStops);
        }
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
      // Nếu trip đã kết thúc thì clear UI theo Option B
      if (status?.driverStatus === 'completed') {
        clearActiveTripUI();
        return;
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
  }, [addNotification, studentInfo, activeTripId]);

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

        {/* Option B: nếu chưa có chuyến đang chạy thì chỉ hiện thông báo */}
        {!activeTripId ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Chưa có chuyến đang chạy</h2>
            <p className="text-gray-600">
              Khi tài xế bắt đầu chuyến (trạng thái <span className="font-medium">in_progress</span>), bản đồ và thông tin xe buýt sẽ tự hiển thị.
            </p>
          </div>
        ) : (
          <>
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
          </>
        )}

        {/* Thông tin học sinh */}
        <StudentInfoCard studentInfo={studentInfo} loading={loading} />

        {/* Thông tin xe buýt: chỉ hiện khi có chuyến đang chạy */}
        {activeTripId && <BusInfoCard busInfo={busInfo} loading={loading} />}

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
