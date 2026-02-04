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

  // === HELPER FUNCTIONS ===
  
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
        
        if (morning_route_id || afternoon_route_id) {
          const schedules = await schedulesService.getAllSchedules();
          
          const activeSchedule = schedules.find(s => 
            (s.route_id === morning_route_id || s.route_id === afternoon_route_id) &&
            s.status === 'in_progress'
          );
          
          if (activeSchedule) {
            setRouteId(activeSchedule.route_id);
            activeScheduleIdRef.current = activeSchedule.id;
            console.log('Found active schedule (in_progress):', activeSchedule.id, 'route:', activeSchedule.route_id);
          } else {
            const currentHour = new Date().getHours();
            setRouteId(currentHour < 14 ? morning_route_id : afternoon_route_id);
            console.log('No active schedule, using fallback route');
          }
        }

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
  useEffect(() => {
    if (!routeId) return;

    const loadActiveSchedule = async () => {
      try {
        const schedules = await schedulesService.getAllSchedules();
        
        let schedule = schedules.find(s => 
          s.route_id === routeId && 
          s.status === 'in_progress'
        );

        if (!schedule && activeScheduleIdRef.current) {
          schedule = schedules.find(s => s.id === activeScheduleIdRef.current);
        }

        if (!schedule) {
          const routeSchedules = schedules
            .filter(s => s.route_id === routeId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          schedule = routeSchedules[0];
        }

        if (schedule) {
          setBusInfo({
            busNumber: schedule.license_plate || schedule.bus_number || 'N/A',
            route: schedule.route_name || `Tuyến ${routeId}`,
            driverName: schedule.driver_name || 'Tài xế',
            driverPhone: schedule.driver_phone || null,
            scheduleId: schedule.id
          });
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
      }
    };

    loadActiveSchedule();
  }, [routeId]);

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
    // Kết nối WebSocket
    const user = JSON.parse(sessionStorage.getItem('user'));
    const parentId = user?.id || 1;
    busTrackingService.connect('parent', parentId);

    // Handler nhận cập nhật từ driver
    const handleBusStatusUpdate = (status) => {
      console.log('Received bus status:', status);

      if (status.tripId) {
        const scheduleId = parseInt(status.tripId);
        if (scheduleId !== activeScheduleIdRef.current) {
          activeScheduleIdRef.current = scheduleId;
          
          const user = JSON.parse(sessionStorage.getItem('user'));
          const myRoutes = [user?.morning_route_id, user?.afternoon_route_id].filter(Boolean);
          
          schedulesService.getAllSchedules().then(schedules => {
            const schedule = schedules.find(s => s.id === scheduleId);
            if (schedule && myRoutes.includes(schedule.route_id)) {
              console.log('Detected active schedule from WebSocket:', scheduleId);
              setRouteId(schedule.route_id);
            }
          });
        }
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

    busTrackingService.on('busStatusUpdate', handleBusStatusUpdate);

    return () => {
      busTrackingService.off('busStatusUpdate', handleBusStatusUpdate);
      busTrackingService.disconnect();
    };
  }, [addNotification, studentInfo]);

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
