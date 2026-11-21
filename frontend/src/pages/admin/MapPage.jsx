// src/pages/admin/MapPage.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BaseTileLayer from "../../components/map/BaseTileLayer.jsx";
import BusRouteLayer from "../../components/map/BusRouteLayer.jsx";
import {
  mergeBusStatus,
  INITIAL_BUS_STATUS,
  isTripActiveOnMap,
  isPreTripOnMap,
} from "../../utils/mergeBusStatus.js";
import {
  applyLeafletDefaultIcon,
  MAP_DEFAULT_CENTER,
  getStopCircleIcon,
} from "../../utils/mapDefaults.js";
import { isSchoolStop, isValidLatLng } from "../../utils/routeStopHelpers.js";
import { formatTimeFullVi } from "../../utils/dateFormat.js";
import busTrackingService from "../../services/busTrackingService.js";
import { schedulesService } from "../../services/schedulesService.js";
import { routesService } from "../../services/routesService.js";
import stopsService from "../../services/stopsService.js";

applyLeafletDefaultIcon();

function AdminMapController({ coords, fitKey, defaultCenter }) {
  const map = useMap();
  const lastFitKeyRef = useRef("");

  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 150);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);

  useEffect(() => {
    if (!fitKey || lastFitKeyRef.current === fitKey) return;
    lastFitKeyRef.current = fitKey;

    if (!coords.length) {
      map.setView(defaultCenter, 14, { animate: true });
      return;
    }
    if (coords.length === 1) {
      map.setView(coords[0], 15, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(coords);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15, animate: true });
    }
  }, [map, coords, fitKey, defaultCenter]);

  return null;
}

AdminMapController.propTypes = {
  coords: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  fitKey: PropTypes.string.isRequired,
  defaultCenter: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default function MapPage() {
  const [busStatus, setBusStatus] = useState(INITIAL_BUS_STATUS);
  const [incidentAlerts, setIncidentAlerts] = useState([]);
  const seenIncidentKeysRef = useRef(new Set());
  const [activeSchedules, setActiveSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Dữ liệu mạng lưới trạm & tuyến dùng khi chưa có chuyến xe chạy (hoặc xem trước)
  const [allStops, setAllStops] = useState([]);
  const [allRoutes, setAllRoutes] = useState([]);
  const [previewRouteId, setPreviewRouteId] = useState("");
  const [previewStops, setPreviewStops] = useState([]);

  // Tải danh sách trạm & tuyến 1 lần để luôn có bản đồ trực quan ngay cả khi chưa có chuyến chạy
  useEffect(() => {
    let mounted = true;
    const loadNetwork = async () => {
      try {
        const [stopsData, routesData] = await Promise.all([
          stopsService.getAllStops(),
          routesService.getAllRoutes(),
        ]);
        if (!mounted) return;
        setAllStops(Array.isArray(stopsData) ? stopsData : []);
        setAllRoutes(Array.isArray(routesData) ? routesData : []);
      } catch (error) {
        console.error("Lỗi tải danh sách trạm/tuyến cho bản đồ:", error);
      }
    };
    loadNetwork();
    return () => {
      mounted = false;
    };
  }, []);

  // Load danh sách chuyến đang chạy (Admin)
  useEffect(() => {
    let isMounted = true;
    const loadActiveSchedules = async () => {
      try {
        setLoadingSchedules(true);
        const rows = await schedulesService.getActiveSchedulesList(50);
        if (!isMounted) return;

        setActiveSchedules(rows);

        if (!rows.length) {
          setSelectedScheduleId(null);
          setRouteStops([]);
          setBusStatus(INITIAL_BUS_STATUS);
          return;
        }

        const stillExists = rows.some((s) => String(s.id) === String(selectedScheduleId));
        if (!selectedScheduleId || !stillExists) {
          setSelectedScheduleId(rows[0].id);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách chuyến đang chạy:", error);
      } finally {
        if (isMounted) setLoadingSchedules(false);
      }
    };

    loadActiveSchedules();
    const interval = setInterval(loadActiveSchedules, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedScheduleId]);

  const selectedSchedule = useMemo(
    () => activeSchedules.find((s) => String(s.id) === String(selectedScheduleId)) || null,
    [activeSchedules, selectedScheduleId]
  );

  const selectedTripId = useMemo(
    () => (selectedScheduleId ? String(selectedScheduleId) : null),
    [selectedScheduleId]
  );

  // Khi chọn chuyến đang chạy: load route stops + join room WebSocket
  useEffect(() => {
    if (!selectedSchedule) return;

    setBusStatus(INITIAL_BUS_STATUS);
    busTrackingService.connect("admin", String(selectedSchedule.id));

    const loadStops = async () => {
      try {
        const stopsData = await routesService.getRouteStops(selectedSchedule.route_id);
        setRouteStops(routesService.transformStopsForMap(stopsData));
      } catch (error) {
        console.error("Lỗi tải điểm dừng tuyến:", error);
        setRouteStops([]);
      }
    };

    loadStops();
  }, [selectedSchedule]);

  // Khi ở chế độ xem trước tuyến (khi chưa có chuyến chạy hoặc Admin chọn tuyến xem trước)
  useEffect(() => {
    if (selectedSchedule || !previewRouteId) {
      setPreviewStops([]);
      return;
    }

    let mounted = true;
    const loadPreviewStops = async () => {
      try {
        const stopsData = await routesService.getRouteStops(previewRouteId);
        if (mounted) setPreviewStops(routesService.transformStopsForMap(stopsData));
      } catch (error) {
        console.error("Lỗi tải trạm tuyến xem trước:", error);
        if (mounted) setPreviewStops([]);
      }
    };
    loadPreviewStops();
    return () => {
      mounted = false;
    };
  }, [selectedSchedule, previewRouteId]);

  // Kết nối WebSocket để nhận trạng thái từ driver
  useEffect(() => {
    const handleBusStatusUpdate = (status) => {
      if (selectedTripId && status?.tripId && String(status.tripId) !== selectedTripId) {
        return;
      }

      if (status.incidentAlert) {
        const alertKey = String(
          status.incidentAlert.id ??
            `${status.incidentAlert.description || ""}-${status.incidentAlert.timestamp || ""}`
        );
        if (!seenIncidentKeysRef.current.has(alertKey)) {
          seenIncidentKeysRef.current.add(alertKey);
          setIncidentAlerts((prev) => [
            { ...status.incidentAlert, id: alertKey },
            ...prev.slice(0, 4),
          ]);
          setTimeout(() => {
            setIncidentAlerts((prev) => prev.filter((a) => a.id !== alertKey));
          }, 10000);
        }
      }

      setBusStatus((prev) => mergeBusStatus(prev, status));
    };

    busTrackingService.on("bus_status_update", handleBusStatusUpdate);

    return () => {
      busTrackingService.off("bus_status_update", handleBusStatusUpdate);
      if (selectedTripId) busTrackingService.leaveTrip(selectedTripId);
    };
  }, [selectedTripId]);

  const validLiveStops = useMemo(
    () =>
      routeStops.filter(
        (s) => s && isValidLatLng(Number(s.lat), Number(s.lng))
      ),
    [routeStops]
  );

  const validPreviewStops = useMemo(
    () =>
      previewStops.filter(
        (s) => s && isValidLatLng(Number(s.lat), Number(s.lng))
      ),
    [previewStops]
  );

  const validLibraryStops = useMemo(
    () =>
      allStops
        .filter((s) => s && s.status !== "inactive")
        .map((s) => ({
          id: s.id,
          name: s.name,
          address: s.address,
          lat: Number(s.latitude ?? s.lat),
          lng: Number(s.longitude ?? s.lng),
        }))
        .filter((s) => isValidLatLng(s.lat, s.lng)),
    [allStops]
  );

  const schoolCenter = useMemo(() => {
    const school = validLibraryStops.find(isSchoolStop);
    return school ? [school.lat, school.lng] : MAP_DEFAULT_CENTER;
  }, [validLibraryStops]);

  const isLiveMode = Boolean(selectedSchedule);
  const displayedStops = useMemo(() => {
    if (isLiveMode) return validLiveStops;
    if (previewRouteId) return validPreviewStops;
    return validLibraryStops;
  }, [isLiveMode, previewRouteId, validLiveStops, validPreviewStops, validLibraryStops]);

  const routeWaypoints = useMemo(
    () => (isLiveMode || previewRouteId ? displayedStops.map((s) => [s.lat, s.lng]) : []),
    [isLiveMode, previewRouteId, displayedStops]
  );

  const fitCoords = useMemo(
    () => displayedStops.map((s) => [s.lat, s.lng]),
    [displayedStops]
  );

  const fitKey = isLiveMode
    ? `live-${selectedTripId}-${validLiveStops.length}`
    : previewRouteId
      ? `preview-${previewRouteId}-${validPreviewStops.length}`
      : `all-stops-${validLibraryStops.length}`;

  const previewRouteObj = useMemo(
    () => allRoutes.find((r) => String(r.id) === String(previewRouteId)) || null,
    [allRoutes, previewRouteId]
  );

  const schoolStopIcon = getStopCircleIcon("T", "#dc2626", 28);
  const libraryStopIcon = getStopCircleIcon("•", "#174D2C", 22);

  return (
    <MapErrorBoundary>
      <div className="flex flex-col w-full h-[calc(100vh-0.5rem)] min-h-[560px] p-4 bg-gray-50 gap-3">
        <div className="flex flex-wrap justify-between items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#174D2C]">Bản đồ</h1>

          <div className="flex flex-wrap items-center gap-3">
            {isLiveMode ? (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Chuyến đang chạy:</label>
                  <select
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white"
                    value={selectedScheduleId || ""}
                    onChange={(e) => setSelectedScheduleId(e.target.value || null)}
                    disabled={loadingSchedules}
                  >
                    {activeSchedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.route_name || `Tuyến ${s.route_id}`} | {s.license_plate || s.bus_number || "N/A"}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    busStatus.driverStatus === "in_progress"
                      ? "bg-green-100 text-green-800"
                      : busStatus.driverStatus === "paused"
                        ? "bg-yellow-100 text-yellow-800"
                        : busStatus.driverStatus === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {busStatus.driverStatus === "in_progress"
                    ? "🚌 Đang chạy"
                    : busStatus.driverStatus === "paused"
                      ? "⏸️ Đang dừng"
                      : busStatus.driverStatus === "completed"
                        ? "✅ Hoàn thành"
                        : "⏹️ Chưa bắt đầu"}
                </div>

                <div className="text-sm text-gray-600 whitespace-nowrap">
                  Điểm hiện tại:{" "}
                  {routeStops.length > 0
                    ? `${Math.min(busStatus.currentStopIndex + 1, routeStops.length)}/${routeStops.length}`
                    : "0/0"}
                </div>
              </>
            ) : (
              <>
                <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-amber-100 text-amber-800">
                  Chưa có chuyến xe đang chạy
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Xem trước:</label>
                  <select
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white"
                    value={previewRouteId}
                    onChange={(e) => setPreviewRouteId(e.target.value)}
                  >
                    <option value="">
                      Tất cả trạm dừng ({validLibraryStops.length} trạm)
                    </option>
                    {allRoutes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.route_name} ({r.shift_type === "afternoon" ? "Chiều" : "Sáng"}
                        {Number(r.distance) > 0 ? ` · ${Number(r.distance).toFixed(2)} km` : ""})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Incident Alerts cho Admin — z-[1200] để luôn nổi trên Leaflet panes (z 400–1000) */}
        {incidentAlerts.length > 0 && (
          <div className="fixed top-20 right-6 z-[1200] space-y-2 pointer-events-auto">
            {incidentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-red-50 border border-red-300 text-red-900 p-4 rounded-xl shadow-xl max-w-sm animate-slide-in"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-red-800">⚠️ Cảnh báo sự cố!</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setIncidentAlerts((prev) => prev.filter((a) => a.id !== alert.id))
                    }
                    className="text-red-500 hover:text-red-800 text-sm font-bold leading-none px-1 cursor-pointer"
                    aria-label="Đóng thông báo"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm mb-1">{alert.description}</p>
                <p className="text-xs text-red-700/80">
                  {alert.route} | {formatTimeFullVi(alert.timestamp)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-[420px] rounded-xl overflow-hidden shadow-md border border-gray-300 relative bg-white">
          {/* Thanh thông báo trạng thái khi chưa có chuyến chạy */}
          {!isLiveMode && (
            <div className="absolute top-3 left-14 z-[500] bg-white/95 backdrop-blur px-3.5 py-1.5 rounded-full shadow border border-gray-200 text-xs sm:text-sm text-gray-700 font-medium max-w-[calc(100%-5rem)] truncate">
              {previewRouteObj
                ? `Xem trước lộ trình: ${previewRouteObj.route_name} (${displayedStops.length} trạm)`
                : `Chưa có chuyến xe đang chạy · Đang hiển thị ${validLibraryStops.length} trạm dừng`}
            </div>
          )}

          <MapContainer
            center={schoolCenter}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <BaseTileLayer />

            <AdminMapController
              coords={fitCoords}
              fitKey={fitKey}
              defaultCenter={schoolCenter}
            />

            {/* Hiển thị các trạm dừng */}
            {displayedStops.map((s, index) => {
              const isNumbered = isLiveMode || Boolean(previewRouteId);
              const isSchool = isSchoolStop(s);
              let icon = libraryStopIcon;
              if (isNumbered) {
                const isFirst = index === 0;
                const isLast = displayedStops.length > 1 && index === displayedStops.length - 1;
                const bg = isFirst ? "#16a34a" : isLast ? "#dc2626" : "#2563eb";
                icon = getStopCircleIcon(index + 1, bg, 28);
              } else if (isSchool) {
                icon = schoolStopIcon;
              }

              return (
                <Marker key={s.id} position={[s.lat, s.lng]} icon={icon}>
                  <Popup>
                    <div className="text-xs space-y-1 min-w-[180px]">
                      <div className="font-bold text-sm text-[#174D2C]">
                        {isNumbered ? `#${index + 1} · ` : isSchool ? "🏫 " : ""}
                        {s.name}
                      </div>
                      {s.address && <div className="text-gray-600">{s.address}</div>}
                      <div className="text-gray-400">
                        {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                      </div>
                      {isLiveMode && (
                        <div className="font-medium text-blue-700 pt-0.5">
                          Trạng thái:{" "}
                          {index < busStatus.currentStopIndex
                            ? "Đã qua"
                            : index === busStatus.currentStopIndex
                              ? "Hiện tại"
                              : "Chưa tới"}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Vẽ đường đi thực tế (OSRM) khi có chuyến đang chạy hoặc đang xem trước 1 tuyến */}
            {routeWaypoints.length > 1 && (
              <BusRouteLayer
                waypoints={routeWaypoints}
                isVisible={
                  isLiveMode
                    ? isTripActiveOnMap(busStatus.driverStatus)
                    : Boolean(previewRouteId)
                }
                showBusMarker={isLiveMode}
                currentPosition={isLiveMode ? busStatus.currentPosition : null}
              />
            )}

            {/* Marker tĩnh khi tài xế chưa bấm bắt đầu chuyến */}
            {isLiveMode &&
              routeWaypoints.length > 0 &&
              isPreTripOnMap(busStatus.driverStatus) && (
                <Marker position={routeWaypoints[0]}>
                  <Popup>Xe buýt chưa bắt đầu</Popup>
                </Marker>
              )}
          </MapContainer>
        </div>
      </div>
    </MapErrorBoundary>
  );
}

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("MapErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[88vh] flex items-center justify-center bg-white text-gray-700">
          Không thể hiển thị bản đồ do dữ liệu không hợp lệ.
        </div>
      );
    }
    return this.props.children;
  }
}

MapErrorBoundary.propTypes = {
  children: PropTypes.node,
};
