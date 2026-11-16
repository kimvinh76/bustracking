import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  MapPin,
  Bus,
  Clock,
  Calendar,
  User,
  Maximize2,
  Info,
} from "lucide-react";

import Header from "../../components/admin/Header";
import schedulesService from "../../services/schedulesService";
import trackingService from "../../services/trackingService";
import routesService from "../../services/routesService";
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_TILE_URL,
  MAP_TILE_ATTRIBUTION,
  applyLeafletDefaultIcon,
} from "../../utils/mapDefaults";

applyLeafletDefaultIcon();

const SPEED_OPTIONS = [
  { label: "0.5x", ms: 1000 },
  { label: "1x", ms: 500 },
  { label: "2x", ms: 250 },
  { label: "4x", ms: 120 },
];

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "completed", label: "Hoàn thành" },
  { key: "in_progress", label: "Đang chạy" },
  { key: "scheduled", label: "Chưa chạy" },
];

const STATUS_BADGE = {
  completed: { label: "Hoàn thành", cls: "bg-emerald-100 text-emerald-800" },
  in_progress: { label: "Đang chạy", cls: "bg-amber-100 text-amber-800" },
  ongoing: { label: "Đang chạy", cls: "bg-amber-100 text-amber-800" },
  running: { label: "Đang chạy", cls: "bg-amber-100 text-amber-800" },
  scheduled: { label: "Chưa chạy", cls: "bg-slate-100 text-slate-700" },
  pending: { label: "Chưa chạy", cls: "bg-slate-100 text-slate-700" },
  cancelled: { label: "Đã hủy", cls: "bg-red-100 text-red-700" },
};

const MAX_PREVIEW_POINTS = 96;

const stopIconCache = new Map();
const getStopIcon = (order) => {
  if (stopIconCache.has(order)) return stopIconCache.get(order);
  const icon = L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:#174D2C;color:#ffffff;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">${order}</div>`,
  });
  stopIconCache.set(order, icon);
  return icon;
};

const normalizeStatusGroup = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "completed") return "completed";
  if (s === "in_progress" || s === "ongoing" || s === "running") return "in_progress";
  if (s === "scheduled" || s === "pending") return "scheduled";
  return "other";
};

const formatTimeShort = (value) => {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
};

const formatDateVi = (value) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString("vi-VN");
};

const formatTimestampVi = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const isValidCoordinate = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180 &&
  !(lat === 0 && lng === 0);

const downsamplePoints = (pts, maxCount) => {
  if (pts.length <= maxCount) return pts;
  const result = [];
  const step = (pts.length - 1) / (maxCount - 1);
  for (let i = 0; i < maxCount; i += 1) {
    const idx = Math.min(Math.round(i * step), pts.length - 1);
    result.push(pts[idx]);
  }
  return result;
};

const interpolateStraightStops = (stops) => {
  if (!stops.length) return [];
  if (stops.length === 1) {
    return [{ lat: stops[0].lat, lng: stops[0].lng, label: stops[0].name }];
  }

  const pts = [];
  const stepsPerSegment = Math.max(8, Math.floor(64 / (stops.length - 1)));
  for (let i = 0; i < stops.length - 1; i += 1) {
    const start = stops[i];
    const end = stops[i + 1];
    for (let s = 0; s < stepsPerSegment; s += 1) {
      const t = s / stepsPerSegment;
      pts.push({
        lat: start.lat + (end.lat - start.lat) * t,
        lng: start.lng + (end.lng - start.lng) * t,
        label: s === 0 ? start.name : `${start.name} -> ${end.name}`,
      });
    }
  }
  const last = stops[stops.length - 1];
  pts.push({ lat: last.lat, lng: last.lng, label: last.name });
  return pts;
};

const fetchRoutePreviewPoints = async (stops, parentSignal) => {
  if (stops.length < 2) return interpolateStraightStops(stops);

  const timeoutController = new AbortController();
  const onParentAbort = () => timeoutController.abort();
  if (parentSignal?.aborted) {
    timeoutController.abort();
  } else {
    parentSignal?.addEventListener("abort", onParentAbort, { once: true });
  }
  const timeoutId = setTimeout(() => timeoutController.abort(), 5000);

  try {
    const coordStr = stops.map((s) => `${s.lng},${s.lat}`).join(";");
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`,
      { signal: timeoutController.signal }
    );
    if (!res.ok) throw new Error(`OSRM status ${res.status}`);
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) {
      throw new Error("Empty OSRM geometry");
    }

    const mapped = coords
      .map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }))
      .filter((p) => isValidCoordinate(p.lat, p.lng));

    if (mapped.length < 2) throw new Error("Invalid OSRM points");
    return downsamplePoints(mapped, MAX_PREVIEW_POINTS);
  } catch {
    return interpolateStraightStops(stops);
  } finally {
    clearTimeout(timeoutId);
    parentSignal?.removeEventListener("abort", onParentAbort);
  }
};

function HistoryMapController({
  allCoordinates,
  fitTrigger,
  focusLat,
  focusLng,
  followBus,
  isPlaying,
  currentIndex,
}) {
  const map = useMap();
  const lastFittedTriggerRef = useRef(-1);

  useEffect(() => {
    if (!allCoordinates.length) return;
    if (lastFittedTriggerRef.current === fitTrigger) return;
    lastFittedTriggerRef.current = fitTrigger;

    if (allCoordinates.length === 1) {
      map.setView(allCoordinates[0], MAP_DEFAULT_ZOOM, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(allCoordinates);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [44, 44], maxZoom: 16, animate: true });
    }
  }, [map, allCoordinates, fitTrigger]);

  useEffect(() => {
    if (!followBus || focusLat == null || focusLng == null) return;
    // Giữ nguyên khung nhìn toàn tuyến khi mới tải lịch trình hoặc bấm Về đầu
    if (!isPlaying && currentIndex === 0) return;
    map.panTo([focusLat, focusLng], { animate: true, duration: 0.35 });
  }, [map, focusLat, focusLng, followBus, isPlaying, currentIndex]);

  return null;
}

export default function HistoryPage() {
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");

  const [loadingTrack, setLoadingTrack] = useState(false);
  const [playbackMode, setPlaybackMode] = useState("empty"); // 'gps' | 'route_preview' | 'empty'
  const [gpsCount, setGpsCount] = useState(0);
  const [playbackPoints, setPlaybackPoints] = useState([]);
  const [routeStops, setRouteStops] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(SPEED_OPTIONS[1].ms);
  const [followBus, setFollowBus] = useState(true);
  const [fitTrigger, setFitTrigger] = useState(0);

  const busIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        html: '<div style="width:38px;height:38px;border-radius:9999px;background:#FC791A;border:3px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:20px;">🚍</div>',
      }),
    []
  );

  // Tải danh sách lịch trình ban đầu
  useEffect(() => {
    let active = true;
    setLoadingSchedules(true);

    schedulesService
      .getAllSchedules()
      .then((list) => {
        if (!active) return;
        const rows = Array.isArray(list) ? list : [];
        setSchedules(rows);
        if (rows.length > 0) {
          const preferred =
            rows.find((s) => normalizeStatusGroup(s.status) === "completed") || rows[0];
          setSelectedId(String(preferred.id));
        }
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách lịch trình:", err);
      })
      .finally(() => {
        if (active) setLoadingSchedules(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredSchedules = useMemo(() => {
    if (statusFilter === "all") return schedules;
    return schedules.filter((s) => normalizeStatusGroup(s.status) === statusFilter);
  }, [schedules, statusFilter]);

  // Đồng bộ selectedId nếu bộ lọc làm ẩn lịch trình đang chọn
  useEffect(() => {
    if (!filteredSchedules.length) return;
    const stillVisible = filteredSchedules.some((s) => String(s.id) === String(selectedId));
    if (!stillVisible) {
      setSelectedId(String(filteredSchedules[0].id));
    }
  }, [filteredSchedules, selectedId]);

  const selectedSchedule = useMemo(
    () => schedules.find((s) => String(s.id) === String(selectedId)) || null,
    [schedules, selectedId]
  );

  // Tải lịch sử GPS và danh sách trạm của lịch trình được chọn
  useEffect(() => {
    if (!selectedSchedule) return;

    const controller = new AbortController();
    let active = true;

    setLoadingTrack(true);
    setIsPlaying(false);
    setCurrentIndex(0);

    const loadTrackData = async () => {
      try {
        const [rawHistory, rawStops] = await Promise.all([
          trackingService.getHistoryBySchedule(selectedSchedule.id, 1000).catch(() => []),
          selectedSchedule.route_id
            ? routesService.getRouteStops(selectedSchedule.route_id).catch(() => [])
            : Promise.resolve([]),
        ]);

        if (!active) return;

        const transformedStops = routesService
          .transformStopsForMap(Array.isArray(rawStops) ? rawStops : [])
          .filter((st) => isValidCoordinate(Number(st.lat), Number(st.lng)))
          .map((st) => ({
            ...st,
            lat: Number(st.lat),
            lng: Number(st.lng),
          }));

        setRouteStops(transformedStops);

        const normalizedGps = (Array.isArray(rawHistory) ? [...rawHistory].reverse() : [])
          .map((p) => ({
            lat: Number(p.latitude ?? p.lat),
            lng: Number(p.longitude ?? p.lng),
            timestamp: p.timestamp || p.created_at || null,
          }))
          .filter((p) => isValidCoordinate(p.lat, p.lng));

        setGpsCount(normalizedGps.length);

        if (normalizedGps.length >= 2) {
          setPlaybackPoints(normalizedGps);
          setPlaybackMode("gps");
        } else if (transformedStops.length >= 2) {
          const previewPts = await fetchRoutePreviewPoints(transformedStops, controller.signal);
          if (!active) return;
          setPlaybackPoints(previewPts);
          setPlaybackMode("route_preview");
        } else if (normalizedGps.length === 1) {
          setPlaybackPoints(normalizedGps);
          setPlaybackMode("gps");
        } else if (transformedStops.length === 1) {
          setPlaybackPoints([
            {
              lat: transformedStops[0].lat,
              lng: transformedStops[0].lng,
              label: transformedStops[0].name,
            },
          ]);
          setPlaybackMode("route_preview");
        } else {
          setPlaybackPoints([]);
          setPlaybackMode("empty");
        }

        setFitTrigger((v) => v + 1);
      } finally {
        if (active) setLoadingTrack(false);
      }
    };

    loadTrackData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedSchedule]);

  // Vòng lặp phát lại từng bước theo tốc độ chọn
  useEffect(() => {
    if (!isPlaying || playbackPoints.length <= 1) return;

    if (currentIndex >= playbackPoints.length - 1) {
      const stopTimer = setTimeout(() => setIsPlaying(false), 0);
      return () => clearTimeout(stopTimer);
    }

    const stepTimer = setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, playbackPoints.length - 1));
    }, speedMs);

    return () => clearTimeout(stepTimer);
  }, [isPlaying, currentIndex, playbackPoints.length, speedMs]);

  const safeIndex = Math.min(currentIndex, Math.max(playbackPoints.length - 1, 0));
  const currentPoint = playbackPoints[safeIndex] || null;
  const canAnimate = playbackPoints.length > 1;
  const progressPercent = canAnimate
    ? Math.round((safeIndex / (playbackPoints.length - 1)) * 100)
    : playbackPoints.length === 1
      ? 100
      : 0;

  const fullPathCoords = useMemo(
    () => playbackPoints.map((p) => [p.lat, p.lng]),
    [playbackPoints]
  );

  const traveledCoords = useMemo(
    () => playbackPoints.slice(0, safeIndex + 1).map((p) => [p.lat, p.lng]),
    [playbackPoints, safeIndex]
  );

  const plannedStopsCoords = useMemo(
    () => routeStops.map((s) => [s.lat, s.lng]),
    [routeStops]
  );

  const mapFitCoords = useMemo(() => {
    const merged = [...fullPathCoords, ...plannedStopsCoords];
    return merged.length > 0 ? merged : [];
  }, [fullPathCoords, plannedStopsCoords]);

  const handleTogglePlay = () => {
    if (!canAnimate) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (safeIndex >= playbackPoints.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const handleStep = (delta) => {
    if (!playbackPoints.length) return;
    setIsPlaying(false);
    setCurrentIndex((prev) =>
      Math.max(0, Math.min(playbackPoints.length - 1, prev + delta))
    );
  };

  const handleScrub = (e) => {
    const nextIdx = Number(e.target.value);
    setIsPlaying(false);
    setCurrentIndex(Number.isFinite(nextIdx) ? nextIdx : 0);
  };

  const statusMeta =
    STATUS_BADGE[String(selectedSchedule?.status || "").toLowerCase()] || {
      label: selectedSchedule?.status || "Không rõ",
      cls: "bg-gray-100 text-gray-700",
    };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen flex flex-col">
      <Header title="Lịch sử tuyến xe" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Bảng điều khiển bên trái */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl shadow-md p-4 sm:p-5 flex flex-col gap-4 h-fit">
          {/* Lọc trạng thái */}
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Lọc theo trạng thái
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    statusFilter === f.key
                      ? "bg-[#174D2C] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chọn lịch trình */}
          <div>
            <label
              htmlFor="history-schedule-select"
              className="block text-sm font-semibold text-[#174D2C] mb-1.5"
            >
              Chọn lịch trình ({filteredSchedules.length})
            </label>
            <select
              id="history-schedule-select"
              value={selectedId}
              disabled={loadingSchedules || filteredSchedules.length === 0}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#174D2C]/40"
            >
              {loadingSchedules && <option value="">Đang tải lịch trình...</option>}
              {!loadingSchedules && filteredSchedules.length === 0 && (
                <option value="">Không có lịch trình phù hợp</option>
              )}
              {filteredSchedules.map((s) => {
                const badge = STATUS_BADGE[String(s.status || "").toLowerCase()]?.label || s.status;
                return (
                  <option key={s.id} value={s.id}>
                    #{s.id} - {s.route_name || `Tuyến ${s.route_id}`} ({badge})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Thông tin tóm tắt chuyến */}
          {selectedSchedule && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#174D2C] text-sm truncate">
                  {selectedSchedule.route_name || `Tuyến #${selectedSchedule.route_id}`}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-semibold shrink-0 ${statusMeta.cls}`}>
                  {statusMeta.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-3.5 h-3.5 shrink-0 text-[#174D2C]" />
                <span>{formatDateVi(selectedSchedule.date)}</span>
                <Clock className="w-3.5 h-3.5 ml-1 shrink-0 text-[#174D2C]" />
                <span>
                  {formatTimeShort(selectedSchedule.start_time)} -{" "}
                  {formatTimeShort(selectedSchedule.end_time)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Bus className="w-3.5 h-3.5 shrink-0 text-[#FC791A]" />
                <span>
                  {selectedSchedule.bus_number || "Chưa gán xe"}
                  {selectedSchedule.license_plate ? ` (${selectedSchedule.license_plate})` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-3.5 h-3.5 shrink-0 text-[#174D2C]" />
                <span>{selectedSchedule.driver_name || "Chưa phân tài xế"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-[#174D2C]" />
                <span>
                  {routeStops.length} điểm dừng · {gpsCount} điểm GPS thực tế
                </span>
              </div>
            </div>
          )}

          {/* Banner giải thích chế độ hiển thị */}
          {!loadingTrack && playbackMode === "route_preview" && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                {gpsCount === 1
                  ? "Chuyến mới ghi nhận 1 điểm GPS thực tế. Đang phát mô phỏng dọc theo lộ trình dự kiến để bạn xem trực quan."
                  : "Chuyến này chưa có dữ liệu GPS thực tế lưu trong lịch sử. Đang phát mô phỏng dọc theo tuyến đường dự kiến."}
              </span>
            </div>
          )}

          {!loadingTrack && playbackMode === "gps" && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 text-xs leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>
                Đang phát lại từ <b>{gpsCount} điểm GPS thực tế</b> của chuyến xe.
              </span>
            </div>
          )}

          {!loadingTrack && playbackMode === "empty" && selectedSchedule && (
            <div className="flex items-start gap-2 bg-gray-100 border border-gray-200 text-gray-600 rounded-xl p-3 text-xs leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
              <span>Chuyến này chưa có điểm GPS và chưa có dữ liệu trạm dừng để hiển thị.</span>
            </div>
          )}

          {/* Thanh tua tiến trình */}
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                Điểm{" "}
                <strong className="text-[#174D2C]">
                  {playbackPoints.length ? safeIndex + 1 : 0}/{playbackPoints.length}
                </strong>
              </span>
              <span className="font-semibold text-[#FC791A]">{progressPercent}%</span>
            </div>

            <input
              type="range"
              aria-label="Thanh tua lịch sử di chuyển"
              min={0}
              max={Math.max(playbackPoints.length - 1, 0)}
              value={safeIndex}
              disabled={!canAnimate || loadingTrack}
              onChange={handleScrub}
              className="w-full accent-[#174D2C] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            />

            {currentPoint && (
              <div className="text-[11px] text-gray-500 flex items-center justify-between gap-2">
                <span className="truncate">
                  {currentPoint.label
                    ? currentPoint.label
                    : `${currentPoint.lat.toFixed(5)}, ${currentPoint.lng.toFixed(5)}`}
                </span>
                {currentPoint.timestamp && (
                  <span className="shrink-0 font-medium text-gray-700">
                    {formatTimestampVi(currentPoint.timestamp)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Nút điều khiển phát lại */}
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={!playbackPoints.length || loadingTrack}
              title="Về điểm đầu"
              className="flex items-center justify-center py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleStep(-1)}
              disabled={!canAnimate || safeIndex <= 0 || loadingTrack}
              title="Lùi 1 bước"
              className="flex items-center justify-center py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleTogglePlay}
              disabled={!canAnimate || loadingTrack}
              title={isPlaying ? "Tạm dừng" : "Phát lại"}
              className={`flex items-center justify-center gap-1 py-2.5 rounded-xl font-semibold text-white shadow-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isPlaying
                  ? "bg-[#FC791A] hover:bg-[#e56a12]"
                  : "bg-[#174D2C] hover:bg-[#1f6239]"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleStep(1)}
              disabled={!canAnimate || safeIndex >= playbackPoints.length - 1 || loadingTrack}
              title="Tiến 1 bước"
              className="flex items-center justify-center py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Tốc độ phát */}
          <div>
            <span className="block text-xs font-semibold text-gray-600 mb-1.5">
              Tốc độ phát
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setSpeedMs(opt.ms)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    speedMs === opt.ms
                      ? "bg-[#FC791A] text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tùy chọn camera */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={followBus}
                onChange={(e) => setFollowBus(e.target.checked)}
                className="accent-[#174D2C] rounded cursor-pointer"
              />
              Bám theo vị trí xe
            </label>
            <button
              type="button"
              onClick={() => setFitTrigger((v) => v + 1)}
              disabled={!mapFitCoords.length}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-[#174D2C] disabled:opacity-40 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Toàn tuyến
            </button>
          </div>
        </div>

        {/* Bản đồ phát lại */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl shadow-md p-3 relative min-h-[540px] lg:min-h-[650px]">
          {loadingTrack && (
            <div className="absolute inset-3 z-[500] bg-white/75 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
              <div className="px-4 py-2 bg-white rounded-xl shadow text-sm font-medium text-[#174D2C]">
                Đang tải dữ liệu lộ trình...
              </div>
            </div>
          )}

          <div className="w-full h-[520px] lg:h-[630px] rounded-xl overflow-hidden border border-gray-200">
            <MapContainer
              center={MAP_DEFAULT_CENTER}
              zoom={MAP_DEFAULT_ZOOM}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url={MAP_TILE_URL} attribution={MAP_TILE_ATTRIBUTION} />

              <HistoryMapController
                allCoordinates={mapFitCoords}
                fitTrigger={fitTrigger}
                focusLat={currentPoint ? currentPoint.lat : null}
                focusLng={currentPoint ? currentPoint.lng : null}
                followBus={followBus}
                isPlaying={isPlaying}
                currentIndex={safeIndex}
              />

              {/* Lộ trình trạm dừng dự kiến (nét đứt) */}
              {plannedStopsCoords.length > 1 && playbackMode === "gps" && (
                <Polyline
                  positions={plannedStopsCoords}
                  pathOptions={{
                    color: "#64748b",
                    weight: 3,
                    dashArray: "6 8",
                    opacity: 0.7,
                  }}
                />
              )}

              {/* Toàn bộ quãng đường có thể phát */}
              {fullPathCoords.length > 1 && (
                <Polyline
                  positions={fullPathCoords}
                  pathOptions={{
                    color: playbackMode === "gps" ? "#86efac" : "#cbd5e1",
                    weight: 5,
                    opacity: 0.75,
                  }}
                />
              )}

              {/* Đoạn đã đi qua tới điểm hiện tại */}
              {traveledCoords.length > 1 && (
                <Polyline
                  positions={traveledCoords}
                  pathOptions={{
                    color: playbackMode === "gps" ? "#174D2C" : "#FC791A",
                    weight: 5,
                    opacity: 0.95,
                  }}
                />
              )}

              {/* Các điểm dừng trên tuyến */}
              {routeStops.map((stop, idx) => (
                <Marker
                  key={stop.id ?? `stop-${idx}`}
                  position={[stop.lat, stop.lng]}
                  icon={getStopIcon(idx + 1)}
                >
                  <Popup>
                    <div className="text-xs">
                      <div className="font-bold text-[#174D2C]">
                        Trạm {idx + 1}: {stop.name}
                      </div>
                      {stop.address && (
                        <div className="text-gray-600 mt-0.5">{stop.address}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Marker xe buýt tại vị trí đang phát */}
              {currentPoint && (
                <Marker position={[currentPoint.lat, currentPoint.lng]} icon={busIcon}>
                  <Popup>
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-[#FC791A]">
                        {selectedSchedule?.bus_number || "Xe buýt"}
                      </div>
                      <div>
                        Điểm {safeIndex + 1}/{playbackPoints.length} ({progressPercent}%)
                      </div>
                      {currentPoint.label && <div>{currentPoint.label}</div>}
                      {currentPoint.timestamp && (
                        <div>Thời gian: {formatTimestampVi(currentPoint.timestamp)}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
