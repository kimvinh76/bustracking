// services/routeService.js
// Business logic layer cho Route

import RouteModel from '../models/Route.js';
import StopModel from '../models/Stop.js';
import axios from 'axios';

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';
const URBAN_BUS_SPEED_KMH = 28;

function extractValidCoords(stops = []) {
  return (Array.isArray(stops) ? stops : [])
    .map((s) => ({
      lat: Number(s?.latitude ?? s?.lat),
      lng: Number(s?.longitude ?? s?.lng),
    }))
    .filter(
      (p) =>
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lng) &&
        p.lat >= -90 &&
        p.lat <= 90 &&
        p.lng >= -180 &&
        p.lng <= 180
    );
}

export function normalizeRouteStopsPayload(stopsArray) {
  if (!Array.isArray(stopsArray)) {
    throw new Error('Danh sách trạm không hợp lệ');
  }
  if (stopsArray.length > 99) {
    throw new Error('Một tuyến đường không được vượt quá 99 trạm dừng');
  }

  const hasExplicitOrders =
    stopsArray.length > 1 &&
    stopsArray.every((s) => s && Number.isFinite(Number(s.stop_order)));

  const orderedInput = hasExplicitOrders
    ? [...stopsArray].sort((a, b) => Number(a.stop_order) - Number(b.stop_order))
    : [...stopsArray];

  const seenIds = new Set();
  const normalized = [];

  for (let i = 0; i < orderedInput.length; i += 1) {
    const item = orderedInput[i] || {};
    const stopId = Number(item.stop_id ?? item.id);
    if (!Number.isInteger(stopId) || stopId <= 0) {
      throw new Error('Mã điểm dừng (stop_id) không hợp lệ');
    }
    if (seenIds.has(stopId)) {
      throw new Error('Không được chọn trùng điểm dừng trên cùng một tuyến');
    }
    seenIds.add(stopId);

    let stopOrder;
    if (orderedInput.length === 1 || i === 0) {
      stopOrder = 0;
    } else if (i === orderedInput.length - 1) {
      stopOrder = 99;
    } else {
      stopOrder = i;
    }

    normalized.push({ stop_id: stopId, stop_order: stopOrder });
  }

  return normalized;
}

async function queryOsrmRoute(coords, { timeoutMs = 6000, overview = false } = {}) {
  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(';');
  const overviewParam = overview ? 'full&geometries=geojson' : 'false';
  const url = `${OSRM_BASE_URL}/${coordStr}?overview=${overviewParam}`;

  const response = await axios.get(url, { timeout: timeoutMs });
  const route = response?.data?.routes?.[0];
  if (!route) {
    throw new Error('Không có dữ liệu lộ trình từ OSRM');
  }

  const geometry =
    overview && Array.isArray(route?.geometry?.coordinates)
      ? route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      : coords.map((c) => [c.lat, c.lng]);

  const legs = Array.isArray(route.legs)
    ? route.legs.map((leg) => ({
        distanceKm: Number(((leg.distance || 0) / 1000).toFixed(3)),
        durationSeconds: Math.round(leg.duration || 0),
      }))
    : [];

  return {
    distanceMeters: Number(route.distance || 0),
    durationSeconds: Number(route.duration || 0),
    legs,
    geometry,
  };
}

export function calculateHaversineMetrics(coords) {
  let totalKm = 0;
  let totalSeconds = 0;
  const legs = [];

  for (let i = 1; i < coords.length; i += 1) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const segKm = calculateDistanceKm(prev.lat, prev.lng, curr.lat, curr.lng);
    const segSeconds = Math.round((segKm / URBAN_BUS_SPEED_KMH) * 3600);
    totalKm += segKm;
    totalSeconds += segSeconds;
    legs.push({
      distanceKm: Number(segKm.toFixed(3)),
      durationSeconds: segSeconds,
    });
  }

  return {
    distanceKm: Number(totalKm.toFixed(2)),
    durationMinutes: coords.length >= 2 ? Math.max(1, Math.round(totalSeconds / 60)) : 0,
    source: 'haversine',
    geometry: coords.map((c) => [c.lat, c.lng]),
    legs,
  };
}

class RouteService {
  /**
   * Lấy tất cả tuyến đường
   */
  static async getAllRoutes() {
    console.log(' SERVICE: Lấy tất cả tuyến đường');
    const routes = await RouteModel.findAll();
    return routes;
  }

  /**
   * Lấy tuyến đường theo ID
   */
  static async getRouteById(id) {
    console.log(' SERVICE: Lấy tuyến đường theo ID:', id);
    
    const route = await RouteModel.findById(id);
    if (!route) {
      throw new Error('Không tìm thấy tuyến đường');
    }
    
    return route;
  }

  /**
   * Lấy tuyến đường kèm điểm dừng
   */
  static async getRouteWithStops(id) {
    console.log(' SERVICE: Lấy tuyến đường kèm điểm dừng');
    
    const route = await RouteModel.findWithStops(id);
    if (!route) {
      throw new Error('Không tìm thấy tuyến đường');
    }
    
    return route;
  }

  /**
   * Lấy thông tin điểm đón/trả
   */
  static async getPickupDropInfo(id) {
    console.log(' SERVICE: Lấy thông tin điểm đón/trả');
    
    // Kiểm tra tuyến tồn tại
    await this.getRouteById(id);
    
    const info = await RouteModel.getPickupDropInfo(id);
    return info;
  }

  /**
   * Tạo tuyến đường mới
   */
  static async createRoute(routeData) {
    console.log(' SERVICE: Bắt đầu tạo tuyến đường mới');
    console.log(' SERVICE: Dữ liệu nhận được:', routeData);
    
    // 1. Validation
    const { route_name, shift_type, status = 'active' } = routeData;
    
    if (!route_name || !route_name.trim()) {
      console.log(' SERVICE: Thiếu thông tin bắt buộc');
      throw new Error('Thiếu thông tin bắt buộc: tên tuyến đường');
    }
    if (!shift_type || !['morning', 'afternoon'].includes(shift_type)) {
      throw new Error('Thiếu hoặc sai thông tin phân ca (shift_type)');
    }
    const normalizedStatus = status || 'active';
    if (!['active', 'inactive'].includes(normalizedStatus)) {
      throw new Error('Trạng thái tuyến chỉ chấp nhận Đang hoạt động (active) hoặc Không hoạt động (inactive)');
    }

    console.log(' SERVICE: Validation passed');

    // 2. Kiểm tra trùng tên tuyến
    const existingRoute = await RouteModel.findByName(route_name);
    if (existingRoute) {
      console.log(' SERVICE: Tên tuyến đã tồn tại');
      throw new Error('Tên tuyến đường đã tồn tại');
    }
    
    console.log(' SERVICE: Không trùng tên tuyến');

    // 4. Format dữ liệu
    const formattedData = {
      route_name: route_name.trim(),
      shift_type: shift_type,
      distance: 0, // Luôn set 0, BE sẽ tự tính sau
      status: status || 'active'
    };
    
    console.log(' SERVICE: Dữ liệu sau khi format:', formattedData);

    // 5. Tạo route
    const newRoute = await RouteModel.create(formattedData);
    
    console.log(' SERVICE: Tạo tuyến đường thành công');
    return newRoute;
  }

  /**
   * Cập nhật tuyến đường
   */
  static async updateRoute(id, routeData) {
    console.log(' SERVICE: Cập nhật tuyến đường ID:', id);
    
    // 1. Kiểm tra tồn tại
    await this.getRouteById(id);

    // 2. Validation
    const { route_name, shift_type, status = 'active' } = routeData;
    
    if (!route_name || !route_name.trim()) {
      throw new Error('Thiếu thông tin bắt buộc: tên tuyến đường');
    }
    
    if (shift_type && !['morning', 'afternoon'].includes(shift_type)) {
      throw new Error('Sai thông tin phân ca (shift_type)');
    }

    const normalizedStatus = status || 'active';
    if (!['active', 'inactive'].includes(normalizedStatus)) {
      throw new Error('Trạng thái tuyến chỉ chấp nhận Đang hoạt động (active) hoặc Không hoạt động (inactive)');
    }

    // 3. Kiểm tra trùng tên (loại trừ chính nó)
    const existingRoute = await RouteModel.findByName(route_name);
    if (existingRoute && existingRoute.id !== parseInt(id)) {
      throw new Error('Tên tuyến đường đã tồn tại');
    }

    // 5. Format dữ liệu (dùng null thay undefined để mysql2 execute an toàn)
    const formattedData = {
      route_name: route_name.trim(),
      shift_type: shift_type || null,
      distance: null,
      status: normalizedStatus,
    };

    // 6. Cập nhật
    const updatedRoute = await RouteModel.update(id, formattedData);
    
    console.log(' SERVICE: Cập nhật tuyến đường thành công');
    return updatedRoute;
  }

  /**
   * Xóa tuyến đường
   */
  static async deleteRoute(id) {
    console.log(' SERVICE: Xóa tuyến đường ID:', id);
    
    // 1. Kiểm tra tồn tại
    await this.getRouteById(id);

    // 2. TODO: Kiểm tra xem tuyến có đang được sử dụng không
    // const hasActiveSchedules = await ScheduleModel.findByRoute(id);
    // if (hasActiveSchedules.length > 0) {
    //   throw new Error('Không thể xóa tuyến đang có lịch trình');
    // }

    // 3. Xóa route
    const deleted = await RouteModel.delete(id);
    if (!deleted) {
      throw new Error('Không thể xóa tuyến đường');
    }

    console.log(' SERVICE: Xóa tuyến đường thành công');
    return { message: 'Xóa tuyến đường thành công' };
  }

  /**
   * Thêm điểm dừng vào tuyến
   */
  static async addStopToRoute(routeId, stopData) {
    console.log(' SERVICE: Thêm điểm dừng vào tuyến');
    
    // 1. Kiểm tra tuyến tồn tại
    await this.getRouteById(routeId);

    // 2. Validation
    const { stop_id, stop_order } = stopData;
    
    if (!stop_id || stop_order === undefined) {
      throw new Error('Thiếu thông tin: stop_id, stop_order');
    }

    if (stop_order < 0 || stop_order > 99) {
      throw new Error('Thứ tự điểm dừng phải từ 0-99');
    }

    // 3. Thêm điểm dừng
    await RouteModel.addStop(routeId, stop_id, stop_order);
    
    // Tự động tính lại khoảng cách ở background
    this.recalculateRouteDistance(routeId).catch(err => console.error("Lỗi tự tính lại khoảng cách:", err));

    console.log(' SERVICE: Thêm điểm dừng thành công');
    return { message: 'Thêm điểm dừng thành công' };
  }

  static async removeStopFromRoute(routeStopId, routeId) {
    console.log(' SERVICE: Xóa điểm dừng khỏi tuyến');
    
    const deleted = await RouteModel.removeStop(routeStopId);
    if (!deleted) {
      throw new Error('Không tìm thấy điểm dừng để xóa');
    }

    if (routeId) {
      // Tự động tính lại distance ở background
      this.recalculateRouteDistance(routeId).catch(err => console.error("Lỗi tự tính lại khoảng cách:", err));
    }

    console.log(' SERVICE: Xóa điểm dừng thành công');
    return { message: 'Xóa điểm dừng thành công' };
  }

  /**
   * Cập nhật hàng loạt trạm cho tuyến (Bulk Update)
   */
  static async updateRouteStops(routeId, stopsArray) {
    console.log(' SERVICE: Cập nhật hàng loạt trạm cho tuyến', routeId);
    
    // 1. Kiểm tra tồn tại
    const route = await this.getRouteById(routeId);

    // 2. Chuẩn hóa & validate danh sách trạm (đầu = 0, giữa = 1..n-2, cuối = 99)
    const normalizedStops = normalizeRouteStopsPayload(stopsArray);
    const keepStopIds = normalizedStops.map((s) => s.stop_id);
    const affectedStudentsCount = await RouteModel.countSubscribersOutsideStops(routeId, keepStopIds);

    // 3. Lưu vào DB
    await RouteModel.updateStopsBulk(routeId, normalizedStops);

    // 4. Tính lại quãng đường đồng bộ để FE nhận ngay giá trị mới
    const updatedRoute = await this.recalculateRouteDistance(routeId);

    return {
      message: `Cập nhật ${normalizedStops.length} trạm và tính khoảng cách (${updatedRoute.calculated_distance} km) thành công`,
      route: updatedRoute,
      distance: updatedRoute.calculated_distance,
      affectedStudentsCount,
    };
  }

  /**
   * Tính quãng đường, thời gian dự kiến và tọa độ đường đi thực tế cho danh sách trạm
   */
  static async calculateRouteMetrics(stops = [], { includeGeometry = false, timeoutMs = 6000 } = {}) {
    const coords = extractValidCoords(stops);
    if (coords.length < 2) {
      return {
        distanceKm: 0,
        durationMinutes: 0,
        source: 'none',
        geometry: coords.map((c) => [c.lat, c.lng]),
        legs: [],
      };
    }

    try {
      const osrm = await queryOsrmRoute(coords, { timeoutMs, overview: includeGeometry });
      return {
        distanceKm: Number((osrm.distanceMeters / 1000).toFixed(2)),
        durationMinutes: Math.max(1, Math.round(osrm.durationSeconds / 60)),
        source: 'osrm',
        geometry: osrm.geometry,
        legs: osrm.legs,
      };
    } catch (error) {
      console.warn('OSRM fallback sang Haversine:', error?.message || error);
      return calculateHaversineMetrics(coords);
    }
  }

  /**
   * Tính thử lộ trình OSRM/Haversine cho giao diện Xếp Trạm trước khi lưu
   */
  static async previewRouteMetrics(stops = []) {
    if (!Array.isArray(stops) || stops.length < 2) {
      return {
        distanceKm: 0,
        durationMinutes: 0,
        source: 'none',
        geometry: extractValidCoords(stops).map((c) => [c.lat, c.lng]),
      };
    }

    // Nếu FE chỉ gửi stop_id thì tự tra tọa độ từ DB
    const hydratedStops = [];
    for (const item of stops) {
      const hasCoords =
        Number.isFinite(Number(item?.latitude ?? item?.lat)) &&
        Number.isFinite(Number(item?.longitude ?? item?.lng));
      if (hasCoords) {
        hydratedStops.push(item);
      } else if (item?.stop_id || item?.id) {
        const dbStop = await StopModel.findById(Number(item.stop_id ?? item.id));
        if (dbStop) hydratedStops.push(dbStop);
      }
    }

    const metrics = await this.calculateRouteMetrics(hydratedStops, {
      includeGeometry: true,
      timeoutMs: 6000,
    });

    return {
      distanceKm: metrics.distanceKm,
      durationMinutes: metrics.durationMinutes,
      source: metrics.source,
      geometry: metrics.geometry,
    };
  }

  /**
   * Trả về khoảng cách & thời gian từng chặng giữa các trạm liên tiếp
   */
  static async getSegmentMetrics(stops = []) {
    const metrics = await this.calculateRouteMetrics(stops, {
      includeGeometry: false,
      timeoutMs: 5000,
    });
    return metrics.legs || [];
  }

  /**
   * Tính thời gian thực tế từ A đến B bằng OSRM (fallback Haversine nếu OSRM lỗi)
   */
  static async getEtaOSRM(fromLat, fromLng, toLat, toLng) {
    const metrics = await this.calculateRouteMetrics(
      [
        { latitude: fromLat, longitude: fromLng },
        { latitude: toLat, longitude: toLng },
      ],
      { includeGeometry: false, timeoutMs: 4000 }
    );
    if (metrics.legs?.[0]) {
      return metrics.legs[0].durationSeconds;
    }
    return 0;
  }

  /**
   * Tính lại quãng đường của tuyến dựa trên danh sách điểm dừng hiện tại
   */
  static async recalculateRouteDistance(id) {
    console.log(' SERVICE: Recalculate route distance ID:', id);

    const route = await RouteModel.findWithStops(id);
    if (!route) {
      throw new Error('Không tìm thấy tuyến đường');
    }

    const stops = route.stops || [];
    const metrics = await this.calculateRouteMetrics(stops, {
      includeGeometry: false,
      timeoutMs: 6000,
    });

    const updatedRoute = await RouteModel.updateDistance(id, metrics.distanceKm);
    console.log(` SERVICE: Đã cập nhật khoảng cách tuyến = ${metrics.distanceKm} km (${metrics.source})`);
    return {
      ...updatedRoute,
      calculated_distance: metrics.distanceKm,
      estimated_duration_minutes: metrics.durationMinutes,
      distance_source: metrics.source,
    };
  }
}

export default RouteService;

const EARTH_RADIUS_KM = 6371;

export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(v => Number.isNaN(v) || v === undefined || v === null)) {
    return 0;
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}
