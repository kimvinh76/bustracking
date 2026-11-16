import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Save,
  MapPin,
  GripVertical,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Plus,
  Edit3,
  Search,
  Navigation,
  Clock,
  Maximize2,
  X,
} from 'lucide-react';

import apiClient from '../../services/api';
import routesService from '../../services/routesService';
import stopsService from '../../services/stopsService';
import {
  MAP_DEFAULT_CENTER,
  MAP_TILE_URL,
  MAP_TILE_ATTRIBUTION,
  applyLeafletDefaultIcon,
} from '../../utils/mapDefaults.js';
import {
  normalizeStop,
  isValidLatLng,
  isSchoolStop,
  applySchoolLockOrder,
  optimizeStopOrder,
  buildStopsSavePayload,
} from '../../utils/routeStopHelpers.js';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import boxDialog from '../../components/UI/BoxDialog';

applyLeafletDefaultIcon();

const markerIconCache = new Map();
function getNumberedMarkerIcon(label, bgColor, size = 30) {
  const key = `${label}-${bgColor}-${size}`;
  if (markerIconCache.has(key)) return markerIconCache.get(key);
  const icon = L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${bgColor};color:#ffffff;border:2px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:${size >= 30 ? 12 : 10}px;font-weight:700;">${label}</div>`,
  });
  markerIconCache.set(key, icon);
  return icon;
}

const unselectedStopIcon = getNumberedMarkerIcon('+', '#64748b', 24);
const draftPinIcon = getNumberedMarkerIcon('📍', '#f97316', 32);

function SortableStopItem({
  stop,
  index,
  total,
  isLockedEnd,
  onMoveUp,
  onMoveDown,
  onEditCoords,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: String(stop.stop_id), disabled: isLockedEnd });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isStart = index === 0;
  const isEnd = total > 1 && index === total - 1;
  const badgeClass = isStart
    ? 'bg-emerald-100 text-emerald-800'
    : isEnd
      ? 'bg-red-100 text-red-700'
      : 'bg-blue-100 text-blue-800';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2.5 mb-2 rounded-xl border transition ${
        isLockedEnd
          ? 'bg-red-50/70 border-red-200'
          : 'bg-white border-gray-200 shadow-sm'
      }`}
    >
      <div
        {...(isLockedEnd ? {} : listeners)}
        {...(isLockedEnd ? {} : attributes)}
        title={isLockedEnd ? 'Đang khóa vị trí trường' : 'Kéo thả để đổi thứ tự'}
        className={`shrink-0 ${
          isLockedEnd
            ? 'text-gray-300 cursor-not-allowed'
            : 'cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-700'
        }`}
      >
        <GripVertical size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${badgeClass}`}>
            {index + 1}
          </span>
          <p className="font-semibold text-gray-800 text-sm truncate" title={stop.name}>
            {stop.name}
          </p>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5" title={stop.address}>
          {stop.address || `${stop.latitude.toFixed(5)}, ${stop.longitude.toFixed(5)}`}
        </p>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        {!isLockedEnd && (
          <>
            <button
              type="button"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              title="Đưa lên trước"
              className="p-1 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowUp size={15} />
            </button>
            <button
              type="button"
              onClick={() => onMoveDown(index)}
              disabled={index >= total - 1}
              title="Đưa xuống sau"
              className="p-1 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ArrowDown size={15} />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onEditCoords(stop)}
          title="Sửa tên / tọa độ trạm"
          className="p-1 rounded hover:bg-amber-50 text-amber-600 cursor-pointer"
        >
          <Edit3 size={15} />
        </button>
        {!isLockedEnd && (
          <button
            type="button"
            onClick={() => onRemove(stop)}
            title="Bỏ khỏi tuyến"
            className="p-1 rounded hover:bg-red-50 text-red-500 cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function BuilderMapController({ routePositions, fitTrigger, pickerActive, onPickLocation }) {
  const map = useMap();
  const lastTriggerRef = useRef(-1);

  useEffect(() => {
    map.invalidateSize();
    if (!routePositions.length) return;
    if (lastTriggerRef.current === fitTrigger) return;
    lastTriggerRef.current = fitTrigger;

    if (routePositions.length === 1) {
      map.setView(routePositions[0], 15, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(routePositions);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16, animate: true });
    }
  }, [map, routePositions, fitTrigger]);

  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = pickerActive ? 'crosshair' : '';
    if (!pickerActive) return;

    const handleClick = (e) => {
      onPickLocation(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    };
    map.on('click', handleClick);
    return () => {
      container.style.cursor = '';
      map.off('click', handleClick);
    };
  }, [map, pickerActive, onPickLocation]);

  return null;
}

const INITIAL_STOP_FORM = {
  id: null,
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  addToRoute: true,
};

export default function RouteBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [route, setRoute] = useState(null);
  const [allStops, setAllStops] = useState([]);
  const [selectedStops, setSelectedStops] = useState([]);
  const [lockSchool, setLockSchool] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);
  const [fitTrigger, setFitTrigger] = useState(0);

  const [activeTab, setActiveTab] = useState('route'); // 'route' | 'library'
  const [stopSearch, setStopSearch] = useState('');

  // Preview OSRM
  const [previewMetrics, setPreviewMetrics] = useState({
    distanceKm: 0,
    durationMinutes: 0,
    source: 'none',
    geometry: [],
  });
  const [calculatingPreview, setCalculatingPreview] = useState(false);

  // Stop editor (tạo mới hoặc chỉnh tọa độ trực tiếp trên map)
  const [stopForm, setStopForm] = useState(null);
  const [savingStop, setSavingStop] = useState(false);
  const [stopToDelete, setStopToDelete] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [routeRes, stopsRes, routeStopsRes] = await Promise.all([
          apiClient.get(`/routes/${id}`),
          stopsService.getAllStops(),
          apiClient.get(`/routes/${id}/stops`),
        ]);
        if (!active) return;

        const routeData = routeRes?.data || routeRes;
        setRoute(routeData);

        const normalizedAll = (Array.isArray(stopsRes) ? stopsRes : [])
          .map(normalizeStop)
          .filter((s) => s && isValidLatLng(s.latitude, s.longitude));
        setAllStops(normalizedAll);

        const normalizedRouteStops = (Array.isArray(routeStopsRes) ? routeStopsRes : [])
          .map(normalizeStop)
          .filter((s) => s && isValidLatLng(s.latitude, s.longitude))
          .sort((a, b) => (a.stop_order ?? 0) - (b.stop_order ?? 0));

        setSelectedStops(normalizedRouteStops);
        setFitTrigger((v) => v + 1);
      } catch (error) {
        console.error('Error loading route builder:', error);
        if (active) {
          setStatusBanner({ type: 'error', text: error?.message || 'Không thể tải dữ liệu tuyến đường.' });
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [id]);

  const safeSelectedStops = useMemo(
    () => applySchoolLockOrder(selectedStops, route?.shift_type || 'morning', lockSchool),
    [selectedStops, route?.shift_type, lockSchool]
  );

  const previewKey = useMemo(
    () =>
      safeSelectedStops
        .map((s) => `${s.stop_id}:${s.latitude.toFixed(6)},${s.longitude.toFixed(6)}`)
        .join('|'),
    [safeSelectedStops]
  );

  // Tự động đo lộ trình OSRM + tổng km mỗi khi danh sách/thứ tự trạm thay đổi
  useEffect(() => {
    if (safeSelectedStops.length < 2) {
      setPreviewMetrics({
        distanceKm: 0,
        durationMinutes: 0,
        source: 'none',
        geometry: safeSelectedStops.map((s) => [s.latitude, s.longitude]),
      });
      setCalculatingPreview(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setCalculatingPreview(true);

    const timer = setTimeout(async () => {
      try {
        const res = await routesService.previewRouteDistance(
          safeSelectedStops.map((s) => ({
            stop_id: s.stop_id,
            latitude: s.latitude,
            longitude: s.longitude,
          })),
          controller.signal
        );
        if (!active || controller.signal.aborted) return;
        setPreviewMetrics({
          distanceKm: Number(res?.distanceKm || 0),
          durationMinutes: Number(res?.durationMinutes || 0),
          source: res?.source || 'osrm',
          geometry: Array.isArray(res?.geometry) ? res.geometry : [],
        });
      } catch {
        if (!active || controller.signal.aborted) return;
        setPreviewMetrics({
          distanceKm: Number(route?.distance || 0),
          durationMinutes: 0,
          source: 'fallback',
          geometry: safeSelectedStops.map((s) => [s.latitude, s.longitude]),
        });
      } finally {
        if (active && !controller.signal.aborted) {
          setCalculatingPreview(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [previewKey, safeSelectedStops, route?.distance]);

  const selectedIdsSet = useMemo(
    () => new Set(safeSelectedStops.map((s) => s.stop_id)),
    [safeSelectedStops]
  );

  const isStopLockedAtTerminal = useCallback(
    (stop, index, total) => {
      if (!lockSchool || !isSchoolStop(stop)) return false;
      const shift = route?.shift_type || 'morning';
      if (shift === 'morning') return index === total - 1;
      return index === 0;
    },
    [lockSchool, route?.shift_type]
  );

  const markUpdatedStops = (nextList) => {
    setSelectedStops(nextList);
    setHasChanges(true);
    setStatusBanner(null);
  };

  const toggleStopSelection = (rawStop) => {
    const stop = normalizeStop(rawStop);
    if (!stop) return;

    const index = safeSelectedStops.findIndex((s) => s.stop_id === stop.stop_id);
    if (index !== -1) {
      if (isStopLockedAtTerminal(stop, index, safeSelectedStops.length)) {
        setStatusBanner({
          type: 'info',
          text: 'Trạm Trường đang được khóa cố định. Bỏ chọn mục "Khóa trạm trường" nếu muốn gỡ.',
        });
        return;
      }
      markUpdatedStops(safeSelectedStops.filter((s) => s.stop_id !== stop.stop_id));
    } else {
      markUpdatedStops([...safeSelectedStops, stop]);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = safeSelectedStops.findIndex((s) => String(s.stop_id) === String(active.id));
    const newIndex = safeSelectedStops.findIndex((s) => String(s.stop_id) === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    if (
      isStopLockedAtTerminal(safeSelectedStops[oldIndex], oldIndex, safeSelectedStops.length) ||
      isStopLockedAtTerminal(safeSelectedStops[newIndex], newIndex, safeSelectedStops.length)
    ) {
      return;
    }

    markUpdatedStops(arrayMove(safeSelectedStops, oldIndex, newIndex));
  };

  const handleMoveStep = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= safeSelectedStops.length) return;
    if (
      isStopLockedAtTerminal(safeSelectedStops[index], index, safeSelectedStops.length) ||
      isStopLockedAtTerminal(safeSelectedStops[target], target, safeSelectedStops.length)
    ) {
      return;
    }
    markUpdatedStops(arrayMove(safeSelectedStops, index, target));
  };

  const handleOptimizeOrder = () => {
    if (safeSelectedStops.length < 3) {
      setStatusBanner({
        type: 'info',
        text: 'Cần ít nhất 3 trạm để tối ưu thứ tự di chuyển.',
      });
      return;
    }
    const optimized = optimizeStopOrder(safeSelectedStops, {
      shiftType: route?.shift_type || 'morning',
      lockSchool,
    });
    const changed = optimized.some((s, i) => s.stop_id !== safeSelectedStops[i]?.stop_id);
    if (!changed) {
      setStatusBanner({
        type: 'info',
        text: 'Thứ tự các trạm hiện tại đã hợp lý theo khoảng cách ngắn nhất.',
      });
      return;
    }
    setSelectedStops(optimized);
    setHasChanges(true);
    setStatusBanner({
      type: 'success',
      text: 'Đã sắp xếp lại thứ tự trạm hạn chế đi vòng. Kiểm tra lộ trình rồi bấm Lưu thay đổi!',
    });
  };

  const handleSaveRouteStops = async () => {
    try {
      setSaving(true);
      const payload = { stops: buildStopsSavePayload(safeSelectedStops) };
      const saved = await apiClient.put(`/routes/${id}/stops`, payload);

      const newDistance = Number(saved?.distance ?? previewMetrics.distanceKm ?? 0);
      setRoute((prev) => (prev ? { ...prev, distance: newDistance } : prev));
      setHasChanges(false);
      boxDialog('success');
      setStatusBanner({
        type: 'success',
        text: `Đã lưu ${safeSelectedStops.length} trạm dừng · Quãng đường cập nhật: ${newDistance.toFixed(2)} km.`,
      });
    } catch (error) {
      console.error('Save route stops error:', error);
      boxDialog('error');
      setStatusBanner({
        type: 'error',
        text: error?.message || 'Không thể lưu danh sách trạm.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Mở form thêm/sửa trạm + kích hoạt chọn vị trí trực tiếp trên bản đồ
  const openCreateStopForm = () => {
    const centerLat = safeSelectedStops[0]?.latitude ?? MAP_DEFAULT_CENTER[0];
    const centerLng = safeSelectedStops[0]?.longitude ?? MAP_DEFAULT_CENTER[1];
    setStopForm({
      ...INITIAL_STOP_FORM,
      latitude: String(centerLat.toFixed(6)),
      longitude: String(centerLng.toFixed(6)),
      addToRoute: true,
    });
    setActiveTab('library');
  };

  const openEditStopForm = (stop) => {
    const norm = normalizeStop(stop);
    setStopForm({
      id: norm.stop_id,
      name: norm.name,
      address: norm.address,
      latitude: String(norm.latitude),
      longitude: String(norm.longitude),
      addToRoute: false,
    });
    setActiveTab('library');
  };

  const handleMapPickLocation = useCallback((lat, lng) => {
    setStopForm((prev) =>
      prev ? { ...prev, latitude: String(lat), longitude: String(lng) } : prev
    );
  }, []);

  const handleSaveStopForm = async (e) => {
    e.preventDefault();
    if (!stopForm) return;
    try {
      setSavingStop(true);
      const payload = {
        name: stopForm.name.trim(),
        address: stopForm.address.trim(),
        latitude: Number(stopForm.latitude),
        longitude: Number(stopForm.longitude),
      };

      if (stopForm.id) {
        const updated = normalizeStop(await stopsService.updateStop(stopForm.id, payload));
        setAllStops((prev) =>
          prev.map((s) => (s.stop_id === updated.stop_id ? { ...s, ...updated } : s))
        );
        setSelectedStops((prev) =>
          prev.map((s) => (s.stop_id === updated.stop_id ? { ...s, ...updated } : s))
        );
        setStatusBanner({
          type: 'success',
          text: `Đã cập nhật trạm "${updated.name}" và tự động tính lại quãng đường các tuyến liên quan.`,
        });
      } else {
        const created = normalizeStop(await stopsService.createStop(payload));
        setAllStops((prev) => [...prev, created]);
        if (stopForm.addToRoute) {
          markUpdatedStops([...safeSelectedStops, created]);
        }
        setStatusBanner({
          type: 'success',
          text: stopForm.addToRoute
            ? `Đã tạo trạm "${created.name}" và thêm vào lộ trình. Nhớ bấm Lưu thay đổi!`
            : `Đã tạo trạm "${created.name}" vào thư viện trạm.`,
        });
      }

      boxDialog('success');
      setStopForm(null);
    } catch (error) {
      boxDialog('error');
      setStatusBanner({
        type: 'error',
        text: error?.message || 'Không thể lưu thông tin trạm dừng.',
      });
    } finally {
      setSavingStop(false);
    }
  };

  const handleConfirmDeleteStop = async () => {
    if (!stopToDelete) return;
    try {
      await stopsService.deleteStop(stopToDelete.stop_id);
      setAllStops((prev) => prev.filter((s) => s.stop_id !== stopToDelete.stop_id));
      setSelectedStops((prev) => prev.filter((s) => s.stop_id !== stopToDelete.stop_id));
      boxDialog('success');
      setStatusBanner({
        type: 'success',
        text: `Đã xóa trạm "${stopToDelete.name}".`,
      });
    } catch (error) {
      boxDialog('error');
      setStatusBanner({
        type: 'error',
        text: error?.message || 'Không thể xóa trạm dừng này.',
      });
    } finally {
      setStopToDelete(null);
    }
  };

  const filteredLibraryStops = useMemo(() => {
    const q = stopSearch.trim().toLowerCase();
    if (!q) return allStops;
    return allStops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        String(s.stop_id).includes(q)
    );
  }, [allStops, stopSearch]);

  const routePositionsForFit = useMemo(() => {
    if (safeSelectedStops.length > 0) {
      return safeSelectedStops.map((s) => [s.latitude, s.longitude]);
    }
    return allStops.slice(0, 10).map((s) => [s.latitude, s.longitude]);
  }, [safeSelectedStops, allStops]);

  const polylinePositions = useMemo(() => {
    if (previewMetrics.geometry.length >= 2) return previewMetrics.geometry;
    return safeSelectedStops.map((s) => [s.latitude, s.longitude]);
  }, [previewMetrics.geometry, safeSelectedStops]);

  const draftCoords = useMemo(() => {
    if (!stopForm) return null;
    const lat = Number(stopForm.latitude);
    const lng = Number(stopForm.longitude);
    return isValidLatLng(lat, lng) ? [lat, lng] : null;
  }, [stopForm]);

  const selectedIndexMap = useMemo(() => {
    const map = new Map();
    safeSelectedStops.forEach((s, idx) => map.set(s.stop_id, idx));
    return map;
  }, [safeSelectedStops]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const displayedKm =
    safeSelectedStops.length < 2
      ? 0
      : previewMetrics.distanceKm || Number(route?.distance || 0);

  return (
    <div className="p-4 sm:p-5 bg-gray-100 min-h-screen flex flex-col gap-4">
      {/* Header tổng quan + số đo trực tiếp */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/admin/routes')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
            title="Quay lại danh sách tuyến"
          >
            <ArrowLeft size={22} className="text-gray-600" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-[#174D2C]">
                Xếp Trạm & Đo Khoảng Cách
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  route?.shift_type === 'afternoon'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                {route?.shift_type === 'afternoon' ? 'Ca Chiều' : 'Ca Sáng'}
              </span>
              {hasChanges && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  Chưa lưu thay đổi
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate mt-0.5">
              Tuyến: <span className="font-semibold text-blue-700">{route?.route_name}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric Pills */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs">
            <div className="flex items-center gap-1.5 text-[#174D2C]">
              <Navigation size={15} className="text-blue-600" />
              <span>
                Quãng đường:{' '}
                <strong className="text-sm">
                  {calculatingPreview ? 'Đang đo...' : `${displayedKm.toFixed(2)} km`}
                </strong>
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1.5 text-gray-700">
              <Clock size={15} className="text-[#FC791A]" />
              <span>
                Ước tính: <strong>~{previewMetrics.durationMinutes || 0} phút</strong>
              </span>
            </div>
            {previewMetrics.source === 'osrm' && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Theo đường thực tế
              </span>
            )}
            {previewMetrics.source === 'haversine' && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                Ước tính đường chim bay
              </span>
            )}
          </div>

          <Button
            variant="primary"
            onClick={handleSaveRouteStops}
            loading={saving}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save size={18} />
            Lưu lộ trình ({safeSelectedStops.length} trạm)
          </Button>
        </div>
      </div>

      {/* Thông báo thao tác */}
      {statusBanner && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm border ${
            statusBanner.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : statusBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="p-1 rounded hover:bg-black/5 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Khu vực Bản đồ + Bảng điều khiển */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Bản đồ bên trái */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative min-h-[520px] lg:min-h-[640px]">
          {stopForm && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-[#FC791A] text-white px-4 py-2 rounded-full shadow-lg text-xs sm:text-sm font-semibold flex items-center gap-2">
              <MapPin size={16} />
              <span>Click lên bản đồ để chọn vị trí cho trạm</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setFitTrigger((v) => v + 1)}
            className="absolute top-3 right-3 z-[500] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white shadow border border-gray-200 text-xs font-semibold text-[#174D2C] cursor-pointer"
          >
            <Maximize2 size={14} />
            Toàn tuyến
          </button>

          <MapContainer
            center={MAP_DEFAULT_CENTER}
            zoom={13}
            style={{ height: '100%', width: '100%', minHeight: '520px' }}
          >
            <TileLayer attribution={MAP_TILE_ATTRIBUTION} url={MAP_TILE_URL} />

            <BuilderMapController
              routePositions={routePositionsForFit}
              fitTrigger={fitTrigger}
              pickerActive={Boolean(stopForm)}
              onPickLocation={handleMapPickLocation}
            />

            {/* Lộ trình đường bộ thực tế (OSRM) hoặc fallback */}
            {polylinePositions.length >= 2 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: previewMetrics.source === 'osrm' ? '#2563eb' : '#64748b',
                  weight: 5,
                  opacity: 0.85,
                  dashArray: previewMetrics.source === 'osrm' ? undefined : '8 6',
                }}
              />
            )}

            {/* Pin xem trước vị trí đang chọn khi thêm/sửa trạm */}
            {draftCoords && <Marker position={draftCoords} icon={draftPinIcon} />}

            {/* Các trạm trong thư viện */}
            {allStops.map((stop) => {
              const selectedIdx = selectedIndexMap.get(stop.stop_id);
              const isSelected = selectedIdx !== undefined;
              let icon = unselectedStopIcon;

              if (isSelected) {
                const isFirst = selectedIdx === 0;
                const isLast =
                  safeSelectedStops.length > 1 && selectedIdx === safeSelectedStops.length - 1;
                const bgColor = isFirst ? '#16a34a' : isLast ? '#dc2626' : '#2563eb';
                icon = getNumberedMarkerIcon(selectedIdx + 1, bgColor, 30);
              } else if (isSchoolStop(stop)) {
                icon = getNumberedMarkerIcon('T', '#991b1b', 26);
              }

              return (
                <Marker
                  key={stop.stop_id}
                  position={[stop.latitude, stop.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <div className="space-y-1.5 min-w-[180px]">
                      <div className="font-bold text-sm text-gray-800">
                        {isSelected ? `#${selectedIdx + 1} · ` : ''}
                        {stop.name}
                      </div>
                      <div className="text-xs text-gray-500">{stop.address}</div>
                      <div className="flex gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => toggleStopSelection(stop)}
                          className={`flex-1 text-xs py-1 px-2 rounded font-semibold cursor-pointer ${
                            isSelected
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {isSelected ? 'Bỏ khỏi tuyến' : '+ Thêm vào tuyến'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditStopForm(stop)}
                          className="text-xs py-1 px-2 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 font-semibold cursor-pointer"
                        >
                          Sửa
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Bảng bên phải */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-h-[680px]">
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => setActiveTab('route')}
              className={`py-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'route'
                  ? 'border-[#174D2C] text-[#174D2C] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Lộ trình tuyến ({safeSelectedStops.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`py-3 text-sm font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'library'
                  ? 'border-[#174D2C] text-[#174D2C] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Thư viện trạm ({allStops.length})
            </button>
          </div>

          {/* Form Thêm / Sửa trạm trực tiếp */}
          {stopForm && (
            <form
              onSubmit={handleSaveStopForm}
              className="p-3.5 bg-amber-50/70 border-b border-amber-200 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-amber-900">
                  {stopForm.id ? `Chỉnh sửa trạm #${stopForm.id}` : 'Tạo trạm dừng mới'}
                </span>
                <button
                  type="button"
                  onClick={() => setStopForm(null)}
                  className="text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Tên trạm (VD: Ngã tư Thủ Đức)"
                value={stopForm.name}
                onChange={(e) => setStopForm({ ...stopForm, name: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
              />
              <input
                type="text"
                placeholder="Địa chỉ mô tả"
                value={stopForm.address}
                onChange={(e) => setStopForm({ ...stopForm, address: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Vĩ độ (Lat)"
                  value={stopForm.latitude}
                  onChange={(e) => setStopForm({ ...stopForm, latitude: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                />
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Kinh độ (Lng)"
                  value={stopForm.longitude}
                  onChange={(e) => setStopForm({ ...stopForm, longitude: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                />
              </div>
              {!stopForm.id && (
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stopForm.addToRoute}
                    onChange={(e) => setStopForm({ ...stopForm, addToRoute: e.target.checked })}
                    className="accent-[#174D2C]"
                  />
                  Thêm ngay trạm mới vào tuyến này
                </label>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStopForm(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingStop}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#174D2C] text-white hover:bg-[#1f6239] disabled:opacity-50 cursor-pointer"
                >
                  {savingStop ? 'Đang lưu...' : stopForm.id ? 'Lưu & Tính lại km' : 'Lưu trạm mới'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'route' ? (
            <>
              <div className="p-3.5 border-b border-gray-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleOptimizeOrder}
                    disabled={safeSelectedStops.length < 3}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Sparkles size={14} />
                    Tối ưu thứ tự ngắn nhất
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#174D2C] text-xs font-semibold cursor-pointer"
                  >
                    <Plus size={14} />
                    Thêm trạm
                  </button>
                </div>

                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lockSchool}
                    onChange={(e) => setLockSchool(e.target.checked)}
                    className="accent-[#174D2C]"
                  />
                  <span>
                    {route?.shift_type === 'afternoon'
                      ? 'Tự giữ Trạm Trường ở đầu tuyến (Ca Chiều)'
                      : 'Tự giữ Trạm Trường ở cuối tuyến (Ca Sáng)'}
                  </span>
                </label>

                <p className="text-[11px] text-gray-500">
                  Kéo thả <GripVertical size={12} className="inline" /> hoặc bấm ↑ / ↓ để đổi thứ tự đón trả; hệ thống tự đo lại đường đi thực tế.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 bg-gray-50">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={safeSelectedStops.map((s) => String(s.stop_id))}
                    strategy={verticalListSortingStrategy}
                  >
                    {safeSelectedStops.map((stop, idx) => (
                      <SortableStopItem
                        key={stop.stop_id}
                        stop={stop}
                        index={idx}
                        total={safeSelectedStops.length}
                        isLockedEnd={isStopLockedAtTerminal(stop, idx, safeSelectedStops.length)}
                        onMoveUp={(i) => handleMoveStep(i, -1)}
                        onMoveDown={(i) => handleMoveStep(i, 1)}
                        onEditCoords={openEditStopForm}
                        onRemove={toggleStopSelection}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {safeSelectedStops.length === 0 && (
                  <div className="text-center text-gray-500 py-10 text-sm space-y-2">
                    <p>Chưa có trạm nào trong tuyến này.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('library')}
                      className="px-3 py-1.5 rounded-lg bg-[#174D2C] text-white text-xs font-semibold cursor-pointer"
                    >
                      Chọn từ Thư viện trạm
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 border-b border-gray-200 space-y-2.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search
                      size={15}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Tìm tên, địa chỉ trạm..."
                      value={stopSearch}
                      onChange={(e) => setStopSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={openCreateStopForm}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#174D2C] hover:bg-[#1f6239] text-white text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    <Plus size={14} />
                    Tạo trạm mới
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 bg-gray-50 space-y-2">
                {filteredLibraryStops.map((stop) => {
                  const isAdded = selectedIdsSet.has(stop.stop_id);
                  return (
                    <div
                      key={stop.stop_id}
                      className={`p-2.5 rounded-xl border bg-white flex items-center justify-between gap-2 ${
                        isAdded ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-gray-800 truncate">
                          {stop.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {stop.address || `${stop.latitude.toFixed(5)}, ${stop.longitude.toFixed(5)}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleStopSelection(stop)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            isAdded
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {isAdded ? 'Bỏ chọn' : '+ Thêm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditStopForm(stop)}
                          title="Sửa tên / vị trí trạm"
                          className="p-1.5 rounded hover:bg-amber-50 text-amber-600 cursor-pointer"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setStopToDelete(stop)}
                          title="Xóa trạm khỏi hệ thống"
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredLibraryStops.length === 0 && (
                  <div className="text-center text-gray-500 py-8 text-sm">
                    Không tìm thấy trạm phù hợp. Bạn có thể bấm &quot;Tạo trạm mới&quot; rồi click lên bản đồ.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(stopToDelete)}
        onClose={() => setStopToDelete(null)}
        onConfirm={handleConfirmDeleteStop}
        title="Xác nhận xóa trạm dừng"
        message={`Bạn có chắc muốn xóa trạm "${stopToDelete?.name}"? Hệ thống sẽ chặn xóa nếu trạm đang thuộc tuyến đường hoặc học sinh đang đăng ký.`}
        confirmText="Xóa trạm"
        cancelText="Hủy"
      />
    </div>
  );
}
