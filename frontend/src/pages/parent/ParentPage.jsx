/**
 * ParentPage - Trang theo dõi xe buýt cho phụ huynh
 * - Hỗ trợ phụ huynh có 1 hoặc nhiều con (chuyển đổi theo từng bé)
 * - Theo dõi vị trí xe realtime + timeline từng trạm + trạm đón/trả của bé
 * - Hiển thị trạng thái lên/xuống xe & vắng mặt realtime + nhật ký thông báo chuyến
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AlertTriangle, Bell } from 'lucide-react';

import { studentsService } from '../../services/studentsService';
import { parentsService } from '../../services/parentsService';
import { schedulesService } from '../../services/schedulesService';
import { incidentsService } from '../../services/incidentsService';
import { routesService } from '../../services/routesService';
import busTrackingService from '../../services/busTrackingService';
import { parseSafeDate, formatTimeShortVi } from '../../utils/dateFormat';
import { normalizeDriverStatus } from '../../utils/mergeBusStatus';

import {
  ToastNotification,
  IncidentCard,
  StudentInfoCard,
  BusInfoCard,
  TripStatusCard,
  BusTrackingMap,
} from '../../components/parent';

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

export default function ParentPage() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);

  const [busInfo, setBusInfo] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [routeId, setRouteId] = useState(null);
  const [activeShiftType, setActiveShiftType] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tripLogs, setTripLogs] = useState([]);

  const [busStatus, setBusStatus] = useState({
    driverStatus: 'idle',
    currentStopIndex: 0,
    currentPosition: null,
    isRunning: false,
    studentStatuses: {},
  });

  const displayedNotificationsRef = useRef(new Set());
  const routeStopsReqIdRef = useRef(0);
  const clearCompletedTimeoutRef = useRef(null);

  const selectedChild = useMemo(
    () =>
      children.find((c) => String(c.id) === String(selectedChildId)) ||
      children[0] ||
      null,
    [children, selectedChildId]
  );

  const assignedRouteIds = useMemo(() => {
    if (!selectedChild) return [];
    return [selectedChild.morning_route_id, selectedChild.afternoon_route_id]
      .map(toNumber)
      .filter((id, idx, arr) => id !== null && arr.indexOf(id) === idx);
  }, [selectedChild]);

  const studentInfo = useMemo(() => {
    if (!selectedChild) return null;
    return {
      id: selectedChild.id,
      name: selectedChild.name,
      class: selectedChild.class_name || selectedChild.class || 'N/A',
      grade: selectedChild.grade,
      phone: selectedChild.phone,
      morning_route_name: selectedChild.morning_route_name,
      morning_stop_name: selectedChild.morning_stop_name,
      afternoon_route_name: selectedChild.afternoon_route_name,
      afternoon_stop_name: selectedChild.afternoon_stop_name,
    };
  }, [selectedChild]);

  const childStopId = useMemo(() => {
    if (!selectedChild || !routeId) return null;
    if (activeShiftType === 'morning') {
      return selectedChild.morning_pickup_stop_id || null;
    }
    if (activeShiftType === 'afternoon') {
      return selectedChild.afternoon_dropoff_stop_id || null;
    }
    if (Number(selectedChild.morning_route_id) === Number(routeId)) {
      return selectedChild.morning_pickup_stop_id || null;
    }
    if (Number(selectedChild.afternoon_route_id) === Number(routeId)) {
      return selectedChild.afternoon_dropoff_stop_id || null;
    }
    return null;
  }, [selectedChild, routeId, activeShiftType]);

  const clearActiveTripUI = useCallback(() => {
    setActiveTripId(null);
    setRouteId(null);
    setActiveShiftType(null);
    setRouteStops([]);
    setBusInfo(null);
    setBusStatus({
      driverStatus: 'idle',
      currentStopIndex: 0,
      currentPosition: null,
      isRunning: false,
      studentStatuses: {},
    });
  }, []);

  const applyActiveScheduleToUI = useCallback((schedule) => {
    const rid = toNumber(schedule?.route_id);
    const sid = toNumber(schedule?.id);
    if (rid == null || sid == null) return;

    setRouteStops([]);
    setRouteId(rid);
    setActiveShiftType(schedule?.shift_type || null);
    setActiveTripId(sid);
    setBusInfo({
      busNumber: schedule?.license_plate || schedule?.bus_number || 'N/A',
      route: schedule?.route_name || `Tuyến ${rid}`,
      driverName: schedule?.driver_name || 'Tài xế',
      driverPhone: schedule?.driver_phone || null,
      scheduleId: schedule?.id,
    });
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setTripLogs((prev) => [notification, ...prev].slice(0, 15));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 10000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Tải toàn bộ danh sách con của phụ huynh
  useEffect(() => {
    const loadChildren = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user) {
          setLoading(false);
          return;
        }

        let list = user.id ? await parentsService.getChildrenByUserId(user.id) : [];

        // Fallback nếu tài khoản cũ chỉ có student_id trong session
        if ((!list || list.length === 0) && user.student_id) {
          const stu = await studentsService.getStudentById(user.student_id);
          if (stu) {
            const morningSub = stu.subscriptions?.find((s) => s.shift_type === 'morning');
            const afternoonSub = stu.subscriptions?.find((s) => s.shift_type === 'afternoon');
            list = [
              {
                ...stu,
                morning_route_id: morningSub?.route_id ?? user.morning_route_id ?? null,
                morning_route_name: morningSub?.route_name ?? null,
                morning_pickup_stop_id: morningSub?.stop_id ?? null,
                morning_stop_name: morningSub?.stop_name ?? null,
                afternoon_route_id: afternoonSub?.route_id ?? user.afternoon_route_id ?? null,
                afternoon_route_name: afternoonSub?.route_name ?? null,
                afternoon_dropoff_stop_id: afternoonSub?.stop_id ?? null,
                afternoon_stop_name: afternoonSub?.stop_name ?? null,
              },
            ];
          }
        }

        const safeList = Array.isArray(list) ? list : [];
        setChildren(safeList);
        if (safeList.length > 0) {
          setSelectedChildId(safeList[0].id);
        }
      } catch (error) {
        console.error('Lỗi load danh sách con:', error);
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, []);

  // Reset chuyến khi chuyển sang bé khác
  useEffect(() => {
    clearActiveTripUI();
    setIncidents([]);
    setTripLogs([]);
    displayedNotificationsRef.current.clear();
  }, [selectedChildId, clearActiveTripUI]);

  // Poll phát hiện chuyến đang chạy của bé đang chọn
  useEffect(() => {
    if (!assignedRouteIds.length || activeTripId) return;

    const checkInProgress = async () => {
      try {
        const schedule = await schedulesService.getActiveSchedule(assignedRouteIds);
        const rid = toNumber(schedule?.route_id);
        if (
          schedule &&
          rid != null &&
          assignedRouteIds.includes(rid) &&
          normalizeStatus(schedule.status) === 'in_progress'
        ) {
          applyActiveScheduleToUI(schedule);
        }
      } catch {
        // Im lặng khi poll
      }
    };

    checkInProgress();
    const interval = setInterval(checkInProgress, 8000);
    return () => clearInterval(interval);
  }, [assignedRouteIds, activeTripId, applyActiveScheduleToUI]);

  // Load route stops khi có routeId
  useEffect(() => {
    if (!routeId) return;

    const loadRouteStops = async () => {
      const reqId = ++routeStopsReqIdRef.current;
      try {
        const stopsData = await routesService.getRouteStops(routeId);
        const transformedStops = routesService.transformStopsForMap(stopsData);
        if (reqId === routeStopsReqIdRef.current) {
          setRouteStops(transformedStops);
        }
      } catch (error) {
        console.error('Lỗi load route stops:', error);
      }
    };

    loadRouteStops();
  }, [routeId]);

  // Load sự cố gần đây theo tuyến
  useEffect(() => {
    if (!routeId) return;

    const loadIncidents = async () => {
      try {
        const response = await incidentsService.getIncidentsByRoute(routeId);
        const incidentsData = response?.incidents || response || [];
        const recentIncidents = incidentsData.filter((incident) => {
          const incidentMs =
            Number(incident.created_at_ms) ||
            parseSafeDate(incident.created_at)?.getTime();
          if (!Number.isFinite(incidentMs)) return false;
          const minutesDiff = (Date.now() - incidentMs) / (1000 * 60);
          return minutesDiff >= -5 && minutesDiff <= 30;
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

  // WebSocket realtime theo chuyến của bé
  useEffect(() => {
    if (!activeTripId) return;

    busTrackingService.connect('parent', String(activeTripId));

    const handleBusStatusUpdate = (status) => {
      if (clearCompletedTimeoutRef.current) {
        clearTimeout(clearCompletedTimeoutRef.current);
        clearCompletedTimeoutRef.current = null;
      }

      if (status?.driverStatus === 'completed') {
        setBusStatus((prev) => ({
          ...prev,
          ...status,
          driverStatus: 'completed',
          currentStopIndex: status.currentStopIndex ?? prev.currentStopIndex,
          currentPosition: status.currentPosition || prev.currentPosition,
          studentStatuses: status.studentStatuses || prev.studentStatuses,
          isRunning: false,
        }));

        clearCompletedTimeoutRef.current = setTimeout(() => {
          clearActiveTripUI();
          clearCompletedTimeoutRef.current = null;
        }, 15000);
        return;
      }

      setBusStatus((prev) => ({
        ...prev,
        ...status,
        driverStatus: normalizeDriverStatus(status.driverStatus || prev.driverStatus),
        currentStopIndex: status.currentStopIndex ?? prev.currentStopIndex,
        currentPosition: status.currentPosition || prev.currentPosition,
        studentStatuses: status.studentStatuses || prev.studentStatuses,
      }));

      if (status.incidentAlert) {
        const incidentKey = `incident-${status.incidentAlert.id ?? status.incidentAlert.description}-${status.incidentAlert.timestamp || ''}`;
        if (!displayedNotificationsRef.current.has(incidentKey)) {
          displayedNotificationsRef.current.add(incidentKey);
          addNotification({
            id: `${incidentKey}-${Date.now()}`,
            type: 'incident',
            message: status.incidentAlert.description,
            route: status.incidentAlert.route || 'Tuyến xe buýt',
            timestamp: new Date(),
          });
        }
      }

      if (status.studentPickupAlert) {
        const alert = status.studentPickupAlert;
        const isMyChild =
          selectedChild &&
          (String(alert.studentId) === String(selectedChild.id) ||
            alert.studentName === selectedChild.name);
        const pickupKey = `pickup-${alert.studentName}-${alert.action || 'picked_up'}-${alert.timestamp}`;

        if (isMyChild && !displayedNotificationsRef.current.has(pickupKey)) {
          displayedNotificationsRef.current.add(pickupKey);
          const actionText =
            alert.action === 'absent'
              ? `được đánh dấu vắng mặt tại ${alert.stopName}`
              : alert.action === 'waiting'
                ? `chuyển lại trạng thái chờ đón tại ${alert.stopName}`
                : `đã lên xe tại ${alert.stopName}`;

          addNotification({
            id: `${pickupKey}-${Date.now()}`,
            type: 'pickup',
            message: `Học sinh ${alert.studentName} ${actionText}`,
            route: alert.routeName,
            driverName: alert.driverName,
            timestamp: new Date(),
          });
        }
      }
    };

    busTrackingService.on('bus_status_update', handleBusStatusUpdate);

    return () => {
      busTrackingService.off('bus_status_update', handleBusStatusUpdate);
      busTrackingService.leaveTrip(String(activeTripId));
      if (clearCompletedTimeoutRef.current) {
        clearTimeout(clearCompletedTimeoutRef.current);
        clearCompletedTimeoutRef.current = null;
      }
    };
  }, [addNotification, selectedChild, activeTripId, clearActiveTripUI]);

  // Tính badge trạng thái lên/xuống xe của bé hiện tại
  const boardingBadge = useMemo(() => {
    if (!activeTripId || !selectedChild) return null;
    const entry = busStatus.studentStatuses?.[String(selectedChild.id)];
    const st = entry?.status;
    const timeText = entry?.updatedAt ? ` (${formatTimeShortVi(entry.updatedAt, '')})` : '';

    if (busStatus.driverStatus === 'completed') {
      if (st === 'absent') {
        return {
          label: '❌ Vắng mặt hôm nay',
          className: 'bg-red-50 border-red-200 text-red-700',
        };
      }
      if (st === 'picked_up') {
        return {
          label:
            activeShiftType === 'afternoon'
              ? '🏁 Đã hoàn thành / Đã trả bé'
              : '🏫 Xe đã đến trường an toàn',
          className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        };
      }
    }

    if (st === 'picked_up') {
      return {
        label: `🚌 Đã lên xe${entry?.stopName ? ` tại ${entry.stopName}` : ''}${timeText}`,
        className: 'bg-emerald-100 border-emerald-300 text-emerald-800',
      };
    }
    if (st === 'absent') {
      return {
        label: `❌ Tài xế đánh dấu vắng${timeText}`,
        className: 'bg-red-100 border-red-300 text-red-800',
      };
    }
    return {
      label: '⏳ Đang chờ đón tại trạm',
      className: 'bg-amber-50 border-amber-200 text-amber-800',
    };
  }, [activeTripId, selectedChild, busStatus.studentStatuses, busStatus.driverStatus, activeShiftType]);

  const nextStop = routeStops[busStatus.currentStopIndex + 1] || null;

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#174D2C]">
          Theo dõi xe buýt
        </h1>

        {children.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Chọn con:</span>
            {children.map((child) => {
              const active = String(child.id) === String(selectedChild?.id);
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-[#174D2C] text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {child.name} ({child.class_name || child.class || 'N/A'})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Thông tin học sinh + trạng thái đón/trả */}
      <StudentInfoCard
        studentInfo={studentInfo}
        loading={loading}
        boardingBadge={boardingBadge}
      />

      {/* Cảnh báo sự cố */}
      {incidents.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-red-200">
          <h2 className="text-lg font-semibold mb-3 text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Thông báo sự cố ({incidents.length})
          </h2>
          <div className="space-y-3">
            {incidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        </div>
      )}

      {/* Trạng thái chuyến + Bản đồ */}
      {!activeTripId ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-1.5">
            Chưa có chuyến xe đang chạy
          </h2>
          <p className="text-sm text-gray-600">
            {assignedRouteIds.length > 0
              ? 'Khi tài xế bấm Bắt đầu chuyến trên tuyến của bé, bản đồ vị trí xe và trạng thái từng trạm sẽ tự động hiển thị tại đây.'
              : 'Học sinh hiện chưa được đăng ký tuyến xe buýt nào. Vui lòng liên hệ nhà trường.'}
          </p>
        </div>
      ) : (
        <>
          <TripStatusCard
            driverStatus={busStatus.driverStatus}
            currentStopIndex={busStatus.currentStopIndex}
            stops={routeStops}
            nextStop={nextStop}
            childStopId={childStopId}
          />

          <BusTrackingMap stops={routeStops} busStatus={busStatus} />

          <BusInfoCard busInfo={busInfo} loading={loading} />
        </>
      )}

      {/* Nhật ký thông báo trong chuyến để phụ huynh không bị lỡ nếu toast tắt sau 10s */}
      {tripLogs.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#174D2C]" />
            Nhật ký thông báo trong chuyến ({tripLogs.length})
          </h2>
          <div className="space-y-2 text-sm">
            {tripLogs.map((item) => (
              <div
                key={item.id}
                className={`px-3 py-2 rounded-lg border flex justify-between items-center gap-2 ${
                  item.type === 'incident'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <span>{item.message}</span>
                <span className="text-xs opacity-75 shrink-0">
                  {formatTimeShortVi(item.timestamp, '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {notifications.map((notification) => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
