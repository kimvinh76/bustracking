// services/incidentService.js
// Business logic layer cho Incident

import IncidentModel from '../models/Incident.js';
import DriverModel from '../models/Driver.js';
import BusModel from '../models/Bus.js';
import RouteModel from '../models/Route.js';

class IncidentService {
  /**
   * Lấy tất cả sự cố
   */
  static async getAllIncidents() {
    console.log('🔸 SERVICE: Lấy tất cả sự cố');
    const incidents = await IncidentModel.findAll();
    return incidents;
  }

  /**
   * Lấy sự cố theo ID
   */
  static async getIncidentById(id) {
    console.log('🔸 SERVICE: Lấy sự cố theo ID:', id);
    
    const incident = await IncidentModel.findById(id);
    if (!incident) {
      throw new Error('Không tìm thấy sự cố');
    }
    
    return incident;
  }

  /**
   * Lấy sự cố theo driver
   */
  static async getIncidentsByDriver(driverId) {
    console.log('🔸 SERVICE: Lấy sự cố theo driver');
    
    // Kiểm tra driver tồn tại
    const driverExists = await DriverModel.exists(driverId);
    if (!driverExists) {
      throw new Error('Không tìm thấy tài xế');
    }
    
    const incidents = await IncidentModel.findByDriver(driverId);
    return incidents;
  }

  /**
   * Lấy sự cố theo bus
   */
  static async getIncidentsByBus(busId) {
    console.log('🔸 SERVICE: Lấy sự cố theo bus');
    
    // Kiểm tra bus tồn tại
    const busExists = await BusModel.exists(busId);
    if (!busExists) {
      throw new Error('Không tìm thấy xe bus');
    }
    
    const incidents = await IncidentModel.findByBus(busId);
    return incidents;
  }

  /**
   * Lấy sự cố theo route
   */
  static async getIncidentsByRoute(routeId) {
    console.log('🔸 SERVICE: Lấy sự cố theo route');
    
    // Kiểm tra route tồn tại
    const routeExists = await RouteModel.exists(routeId);
    if (!routeExists) {
      throw new Error('Không tìm thấy tuyến đường');
    }
    
    const incidents = await IncidentModel.findByRoute(routeId);
    return incidents;
  }

  /**
   * Lấy sự cố theo severity
   */
  static async getIncidentsBySeverity(severity) {
    console.log('🔸 SERVICE: Lấy sự cố theo severity:', severity);
    
    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      throw new Error('Severity không hợp lệ (low/medium/high/critical)');
    }
    
    const incidents = await IncidentModel.findBySeverity(severity);
    return incidents;
  }

  /**
   * Lấy sự cố theo status
   */
  static async getIncidentsByStatus(status) {
    console.log('🔸 SERVICE: Lấy sự cố theo status:', status);
    
    // Validate status
    const validStatuses = ['reported', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Status không hợp lệ (reported/in_progress/resolved/closed)');
    }
    
    const incidents = await IncidentModel.findByStatus(status);
    return incidents;
  }

  /**
   * Tạo sự cố mới
   */
  static async createIncident(incidentData) {
    console.log('🔸 SERVICE: Bắt đầu tạo sự cố mới');
    console.log('📦 SERVICE: Dữ liệu nhận được:', incidentData);
    
    // 1. Validation
    const { 
      driver_id, bus_id, route_id, incident_type, description,
      severity = 'medium', status = 'reported', location, latitude, longitude
    } = incidentData;
    
    if (!driver_id || !bus_id || !incident_type || !description) {
      console.log(' SERVICE: Thiếu thông tin bắt buộc');
      throw new Error('Thiếu thông tin bắt buộc: driver_id, bus_id, incident_type, description');
    }

    console.log(' SERVICE: Validation passed');

    // 2. Kiểm tra driver, bus tồn tại
    const [driverExists, busExists] = await Promise.all([
      DriverModel.exists(driver_id),
      BusModel.exists(bus_id)
    ]);

    if (!driverExists) {
      throw new Error('Không tìm thấy tài xế');
    }
    if (!busExists) {
      throw new Error('Không tìm thấy xe bus');
    }

    console.log(' SERVICE: Driver và Bus đều tồn tại');

    // 3. Kiểm tra route (nếu có)
    if (route_id) {
      const routeExists = await RouteModel.exists(route_id);
      if (!routeExists) {
        throw new Error('Không tìm thấy tuyến đường');
      }
    }

    // 4. Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      throw new Error('Severity không hợp lệ (low/medium/high/critical)');
    }

    // 5. Validate status
    const validStatuses = ['reported', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Status không hợp lệ (reported/in_progress/resolved/closed)');
    }

    // 6. Validate coordinates (nếu có)
    if (latitude && (latitude < -90 || latitude > 90)) {
      throw new Error('Latitude phải từ -90 đến 90');
    }
    if (longitude && (longitude < -180 || longitude > 180)) {
      throw new Error('Longitude phải từ -180 đến 180');
    }

    // 7. Format dữ liệu
    const formattedData = {
      driver_id,
      bus_id,
      route_id: route_id || null,
      incident_type: incident_type.trim(),
      description: description.trim(),
      severity,
      status,
      location: location ? location.trim() : null,
      latitude: latitude || null,
      longitude: longitude || null
    };
    
    console.log('🔸 SERVICE: Dữ liệu sau khi format:', formattedData);

    // 8. Tạo incident
    const newIncident = await IncidentModel.create(formattedData);
    
    console.log(' SERVICE: Tạo sự cố thành công');
    
    // 9. TODO: Gửi thông báo đến admin/quản lý nếu severity cao
    if (severity === 'high' || severity === 'critical') {
      console.log('⚠️ SERVICE: Sự cố nghiêm trọng, cần gửi thông báo');
      // await sendNotification(newIncident);
    }
    
    return newIncident;
  }

  /**
   * Cập nhật sự cố
   */
  static async updateIncident(id, incidentData) {
    console.log('🔸 SERVICE: Cập nhật sự cố ID:', id);
    
    // 1. Kiểm tra tồn tại
    await this.getIncidentById(id);

    // 2. Validation
    const { 
      incident_type, description, severity, status,
      resolution_notes, resolved_at
    } = incidentData;
    
    if (!incident_type || !description || !severity || !status) {
      throw new Error('Thiếu thông tin bắt buộc');
    }

    // 3. Validate severity và status
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    const validStatuses = ['reported', 'in_progress', 'resolved', 'closed'];
    
    if (!validSeverities.includes(severity)) {
      throw new Error('Severity không hợp lệ');
    }
    if (!validStatuses.includes(status)) {
      throw new Error('Status không hợp lệ');
    }

    // 4. Format dữ liệu
    const formattedData = {
      incident_type: incident_type.trim(),
      description: description.trim(),
      severity,
      status,
      resolution_notes: resolution_notes ? resolution_notes.trim() : null,
      resolved_at: resolved_at || null
    };

    // 5. Cập nhật
    const updatedIncident = await IncidentModel.update(id, formattedData);
    
    console.log(' SERVICE: Cập nhật sự cố thành công');
    return updatedIncident;
  }

  /**
   * Cập nhật trạng thái sự cố
   */
  static async updateIncidentStatus(id, status, resolutionNotes = null) {
    console.log('🔸 SERVICE: Cập nhật trạng thái sự cố ID:', id);
    
    // 1. Kiểm tra tồn tại
    await this.getIncidentById(id);

    // 2. Validate status
    const validStatuses = ['reported', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Status không hợp lệ (reported/in_progress/resolved/closed)');
    }

    // 3. Cập nhật status
    const updatedIncident = await IncidentModel.updateStatus(id, status, resolutionNotes);
    
    console.log(' SERVICE: Cập nhật trạng thái thành công');
    return updatedIncident;
  }

  /**
   * Xóa sự cố
   */
  static async deleteIncident(id) {
    console.log('🔸 SERVICE: Xóa sự cố ID:', id);
    
    // 1. Kiểm tra tồn tại
    await this.getIncidentById(id);

    // 2. Xóa incident
    const deleted = await IncidentModel.delete(id);
    if (!deleted) {
      throw new Error('Không thể xóa sự cố');
    }

    console.log(' SERVICE: Xóa sự cố thành công');
    return { message: 'Xóa sự cố thành công' };
  }
}

export default IncidentService;
