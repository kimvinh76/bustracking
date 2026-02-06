// services/routeService.js
// Business logic layer cho Route

import RouteModel from '../models/Route.js';
import axios from 'axios';

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
    const { route_name, distance, status = 'active' } = routeData;
    
    if (!route_name || !route_name.trim()) {
      console.log(' SERVICE: Thiếu thông tin bắt buộc');
      throw new Error('Thiếu thông tin bắt buộc: tên tuyến đường');
    }

    console.log(' SERVICE: Validation passed');

    // 2. Kiểm tra trùng tên tuyến
    const existingRoute = await RouteModel.findByName(route_name);
    if (existingRoute) {
      console.log(' SERVICE: Tên tuyến đã tồn tại');
      throw new Error('Tên tuyến đường đã tồn tại');
    }
    
    console.log(' SERVICE: Không trùng tên tuyến');

    // 3. Validate distance và duration (nếu có)
    if (distance && distance < 0) {
      throw new Error('Khoảng cách phải là số dương');
    }

    // 4. Format dữ liệu
    const formattedData = {
      route_name: route_name.trim(),
      distance: distance || null,
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
    const { route_name, distance, status = 'active' } = routeData;
    
    if (!route_name || !route_name.trim()) {
      throw new Error('Thiếu thông tin bắt buộc: tên tuyến đường');
    }

    // 3. Kiểm tra trùng tên (loại trừ chính nó)
    const existingRoute = await RouteModel.findByName(route_name);
    if (existingRoute && existingRoute.id !== parseInt(id)) {
      throw new Error('Tên tuyến đường đã tồn tại');
    }

    // 4. Validate distance và duration
    if (distance && distance < 0) {
      throw new Error('Khoảng cách phải là số dương');
    }

    // 5. Format dữ liệu
    const formattedData = {
      route_name: route_name.trim(),
      distance: distance || null,
      status: status || 'active'
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
    
    console.log(' SERVICE: Thêm điểm dừng thành công');
    return { message: 'Thêm điểm dừng thành công' };
  }

  /**
   * Xóa điểm dừng khỏi tuyến
   */
  static async removeStopFromRoute(routeStopId) {
    console.log(' SERVICE: Xóa điểm dừng khỏi tuyến');
    
    const deleted = await RouteModel.removeStop(routeStopId);
    if (!deleted) {
      throw new Error('Không tìm thấy điểm dừng để xóa');
    }

    console.log(' SERVICE: Xóa điểm dừng thành công');
    return { message: 'Xóa điểm dừng thành công' };
  }

  /**
   * Tính thời gian thực tế từ A đến B bằng OSRM
   */
  static async getEtaOSRM(fromLat, fromLng, toLat, toLng) {
    try {
      // Format tọa độ cho OSRM: longitude,latitude
      const coordinates = `${fromLng},${fromLat};${toLng},${toLat}`;
      const url = `http://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false`;
      
      const response = await axios.get(url);
      if (response.data.routes && response.data.routes.length > 0) {
        // duration tính bằng giây (seconds)
        return response.data.routes[0].duration;
      }
      return 0;
    } catch (error) {
      console.error('Lỗi gọi OSRM:', error.message);
      return 0; // Fallback nếu lỗi
    }
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
    if (stops.length < 2) {
      throw new Error('Cần ít nhất 2 điểm dừng để tính quãng đường');
    }

    let totalKm = 0;
    for (let i = 1; i < stops.length; i++) {
      const prev = stops[i - 1];
      const curr = stops[i];
      totalKm += calculateDistanceKm(
        parseFloat(prev.latitude),
        parseFloat(prev.longitude),
        parseFloat(curr.latitude),
        parseFloat(curr.longitude)
      );
    }

    const roundedDistance = Number(totalKm.toFixed(2));
    const updatedRoute = await RouteModel.updateDistance(id, roundedDistance);
    console.log(` SERVICE: Đã cập nhật khoảng cách tuyến = ${roundedDistance} km`);
    return { ...updatedRoute, calculated_distance: roundedDistance };
  }
}

export default RouteService;

const EARTH_RADIUS_KM = 6371;

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
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
