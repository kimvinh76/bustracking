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

import { useState, useEffect, useCallback } from 'react';
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

        const studentId = user.student_id;
        const morningRouteId = user.morning_route_id;
        const afternoonRouteId = user.afternoon_route_id;
        
        // Tìm schedule đang chạy trong ngày
        if (morningRouteId || afternoonRouteId) {
          const today = new Date().toISOString().split('T')[0];
          const schedules = await schedulesService.getAllSchedules();
          
          const activeSchedule = schedules.find(s => 
            (s.route_id === morningRouteId || s.route_id === afternoonRouteId) &&
            s.date === today &&
            ['scheduled', 'in_progress'].includes(s.status)
          );
          
          if (activeSchedule) {
            setRouteId(activeSchedule.route_id);
            console.log('Tìm thấy schedule đang chạy:', activeSchedule.route_id, activeSchedule.shift_type);
          } else {
            // Fallback: dùng thời gian để quyết định
            const currentHour = new Date().getHours();
            setRouteId(currentHour < 14 ? morningRouteId : afternoonRouteId);
            console.log('Không tìm thấy schedule, dùng fallback');
          }
        }

        if (studentId) {
          const studentData = await studentsService.getStudentById(studentId);
          setStudentInfo({
            name: studentData.name,
            class: studentData.class_name || studentData.class || 'N/A',
            phone: studentData.phone
          });
        } else if (user.student_name) {
          setStudentInfo({
            name: user.student_name,
            class: 'N/A',
            phone: null
          });
        } else {
          console.error('Không tìm thấy thông tin học sinh trong session.');
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
        const today = new Date().toISOString().split('T')[0];
        const currentHour = new Date().getHours();
        const shift = currentHour < 12 ? 'morning' : 'afternoon';

        // Tìm schedule có route này và đang chạy
        const schedules = await schedulesService.getAllSchedules();
        const activeSchedule = schedules.find(s => 
          s.route_id === routeId && 
          s.date === today &&
          s.shift_type === shift &&
          ['scheduled', 'in_progress'].includes(s.status)
        );

        if (activeSchedule) {
          setBusInfo({
            busNumber: activeSchedule.license_plate || activeSchedule.bus_number || 'N/A',
            route: activeSchedule.route_name || `Tuyến ${routeId}`,
            driverName: activeSchedule.driver_name || 'Tài xế',
            driverPhone: activeSchedule.driver_phone || null,
            scheduleId: activeSchedule.id
          });
        }
      } catch (error) {
        console.error('Lỗi load schedule:', error);
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
      console.log('📡 Received bus status:', status);

      // Cập nhật trạng thái xe buýt
      setBusStatus(prev => ({
        ...prev,
        ...status,
        driverStatus: status.driverStatus || prev.driverStatus,
        currentStopIndex: status.currentStopIndex ?? prev.currentStopIndex,
        currentPosition: status.currentPosition || prev.currentPosition
      }));

      // Cập nhật vị trí xe
      if (status.currentPosition) {
        setBusPosition(status.currentPosition);
      }

      // Xử lý thông báo sự cố từ driver
      if (status.incidentAlert) {
        addNotification({
          id: createNotificationId('incident'),
          type: 'incident',
          message: status.incidentAlert.description,
          route: status.incidentAlert.route || 'Tuyến xe buýt',
          timestamp: new Date()
        });
      }

      // Xử lý thông báo đón học sinh
      if (status.studentPickupAlert) {
        addNotification({
          id: createNotificationId('pickup'),
          type: 'pickup',
          message: `Học sinh ${status.studentPickupAlert.studentName} đã được đón tại ${status.studentPickupAlert.stopName}`,
          route: status.studentPickupAlert.routeName,
          driverName: status.studentPickupAlert.driverName,
          timestamp: new Date()
        });
      }
    };

    busTrackingService.on('busStatusUpdate', handleBusStatusUpdate);

    // Cleanup khi unmount
    return () => {
      busTrackingService.off('busStatusUpdate', handleBusStatusUpdate);
      busTrackingService.disconnect();
    };
  }, [addNotification]);

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
