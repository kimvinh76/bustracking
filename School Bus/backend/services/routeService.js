// services/routeService.js
// Business logic layer cho Route

import RouteModel from '../models/Route.js';

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
    const { route_name, start_location, end_location, distance, duration } = routeData;
    
    if (!route_name || !start_location || !end_location) {
      console.log(' SERVICE: Thiếu thông tin bắt buộc');
      throw new Error('Thiếu thông tin bắt buộc: tên tuyến, điểm đầu, điểm cuối');
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
    if (duration && duration < 0) {
      throw new Error('Thời gian phải là số dương');
    }

    // 4. Format dữ liệu
    const formattedData = {
      route_name: route_name.trim(),
      start_location: start_location.trim(),
      end_location: end_location.trim(),
      distance: distance || null,
      duration: duration || null,
      polyline: routeData.polyline || null,
      waypoints: routeData.waypoints || null
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
    const { route_name, start_location, end_location, distance, duration } = routeData;
    
    if (!route_name || !start_location || !end_location) {
      throw new Error('Thiếu thông tin bắt buộc');
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
    if (duration && duration < 0) {
      throw new Error('Thời gian phải là số dương');
    }

    // 5. Format dữ liệu
    const formattedData = {
      route_name: route_name.trim(),
      start_location: start_location.trim(),
      end_location: end_location.trim(),
      distance: distance || null,
      duration: duration || null,
      polyline: routeData.polyline || null,
      waypoints: routeData.waypoints || null
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
    const { stop_id, stop_order, student_pickup_count = 0 } = stopData;
    
    if (!stop_id || stop_order === undefined) {
      throw new Error('Thiếu thông tin: stop_id, stop_order');
    }

    if (stop_order < 0 || stop_order > 99) {
      throw new Error('Thứ tự điểm dừng phải từ 0-99');
    }

    // 3. Thêm điểm dừng
    await RouteModel.addStop(routeId, stop_id, stop_order, student_pickup_count);
    
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
}

export default RouteService;
