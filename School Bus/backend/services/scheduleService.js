// services/scheduleService.js
// Business logic layer cho Schedule

import ScheduleModel from '../models/Schedule.js';
import RouteModel from '../models/Route.js';
import BusModel from '../models/Bus.js';
import DriverModel from '../models/Driver.js';

class ScheduleService {
  /**
   * Lấy tất cả lịch trình
   */
  static async getAllSchedules() {
    console.log('🔸 SERVICE: Lấy tất cả lịch trình');
    const schedules = await ScheduleModel.findAll();
    return schedules;
  }

  /**
   * Lấy lịch trình theo ID
   */
  static async getScheduleById(id) {
    console.log('🔸 SERVICE: Lấy lịch trình theo ID:', id);
    
    const schedule = await ScheduleModel.findById(id);
    if (!schedule) {
      throw new Error('Không tìm thấy lịch trình');
    }
    
    return schedule;
  }

  /**
   * Lấy lịch trình theo route
   */
  static async getSchedulesByRoute(routeId) {
    console.log('🔸 SERVICE: Lấy lịch trình theo route');
    
    // Kiểm tra route tồn tại
    const routeExists = await RouteModel.exists(routeId);
    if (!routeExists) {
      throw new Error('Không tìm thấy tuyến đường');
    }
    
    const schedules = await ScheduleModel.findByRoute(routeId);
    return schedules;
  }

  /**
   * Lấy lịch trình theo driver
   */
  static async getSchedulesByDriver(driverId) {
    console.log('🔸 SERVICE: Lấy lịch trình theo driver');
    
    // Kiểm tra driver tồn tại
    const driverExists = await DriverModel.exists(driverId);
    if (!driverExists) {
      throw new Error('Không tìm thấy tài xế');
    }
    
    const schedules = await ScheduleModel.findByDriver(driverId);
    return schedules;
  }

  /**
   * Lấy lịch trình theo bus
   */
  static async getSchedulesByBus(busId) {
    console.log('🔸 SERVICE: Lấy lịch trình theo bus');
    
    // Kiểm tra bus tồn tại
    const busExists = await BusModel.exists(busId);
    if (!busExists) {
      throw new Error('Không tìm thấy xe bus');
    }
    
    const schedules = await ScheduleModel.findByBus(busId);
    return schedules;
  }

  /**
   * Lấy lịch trình theo ngày
   */
  static async getSchedulesByDate(date) {
    console.log('🔸 SERVICE: Lấy lịch trình theo ngày:', date);
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Định dạng ngày không hợp lệ (phải là YYYY-MM-DD)');
    }
    
    const schedules = await ScheduleModel.findByDate(date);
    return schedules;
  }

  /**
   * Tạo lịch trình mới
   */
  static async createSchedule(scheduleData) {
    console.log('🔸 SERVICE: Bắt đầu tạo lịch trình mới');
    console.log('📦 SERVICE: Dữ liệu nhận được:', scheduleData);
    
    // 1. Validation
    const { 
      route_id, bus_id, driver_id, date, shift_type,
      scheduled_start_time, scheduled_end_time, status = 'scheduled'
    } = scheduleData;
    
    if (!route_id || !bus_id || !driver_id || !date || !shift_type) {
      console.log('❌ SERVICE: Thiếu thông tin bắt buộc');
      throw new Error('Thiếu thông tin bắt buộc: route_id, bus_id, driver_id, date, shift_type');
    }

    if (!scheduled_start_time || !scheduled_end_time) {
      throw new Error('Thiếu thông tin: scheduled_start_time, scheduled_end_time');
    }

    console.log('✅ SERVICE: Validation passed');

    // 2. Kiểm tra route, bus, driver tồn tại
    const [routeExists, busExists, driverExists] = await Promise.all([
      RouteModel.exists(route_id),
      BusModel.exists(bus_id),
      DriverModel.exists(driver_id)
    ]);

    if (!routeExists) {
      throw new Error('Không tìm thấy tuyến đường');
    }
    if (!busExists) {
      throw new Error('Không tìm thấy xe bus');
    }
    if (!driverExists) {
      throw new Error('Không tìm thấy tài xế');
    }

    console.log('✅ SERVICE: Route, Bus, Driver đều tồn tại');

    // 3. Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Định dạng ngày không hợp lệ (phải là YYYY-MM-DD)');
    }

    // 4. Validate shift_type
    const validShifts = ['morning', 'afternoon', 'evening'];
    if (!validShifts.includes(shift_type)) {
      throw new Error('Shift type không hợp lệ (morning/afternoon/evening)');
    }

    // 5. Kiểm tra trùng lịch trình
    const duplicate = await ScheduleModel.findDuplicate({
      route_id,
      bus_id,
      driver_id,
      date,
      shift_type
    });

    if (duplicate) {
      console.log('❌ SERVICE: Lịch trình đã tồn tại');
      throw new Error('Lịch trình này đã tồn tại (trùng tuyến, xe, tài xế, ngày, ca)');
    }

    console.log('✅ SERVICE: Không trùng lịch trình');

    // 6. Format dữ liệu
    const formattedData = {
      route_id,
      bus_id,
      driver_id,
      date,
      shift_type,
      scheduled_start_time,
      scheduled_end_time,
      status
    };
    
    console.log('🔸 SERVICE: Dữ liệu sau khi format:', formattedData);

    // 7. Tạo schedule
    const newSchedule = await ScheduleModel.create(formattedData);
    
    console.log('✅ SERVICE: Tạo lịch trình thành công');
    return newSchedule;
  }

  /**
   * Cập nhật lịch trình
   */
  static async updateSchedule(id, scheduleData) {
    console.log('🔸 SERVICE: Cập nhật lịch trình ID:', id);
    
    // 1. Kiểm tra tồn tại
    await this.getScheduleById(id);

    // 2. Validation
    const { 
      route_id, bus_id, driver_id, date, shift_type,
      scheduled_start_time, scheduled_end_time, 
      actual_start_time, actual_end_time, status
    } = scheduleData;
    
    if (!route_id || !bus_id || !driver_id || !date || !shift_type) {
      throw new Error('Thiếu thông tin bắt buộc');
    }

    // 3. Kiểm tra route, bus, driver tồn tại
    const [routeExists, busExists, driverExists] = await Promise.all([
      RouteModel.exists(route_id),
      BusModel.exists(bus_id),
      DriverModel.exists(driver_id)
    ]);

    if (!routeExists) throw new Error('Không tìm thấy tuyến đường');
    if (!busExists) throw new Error('Không tìm thấy xe bus');
    if (!driverExists) throw new Error('Không tìm thấy tài xế');

    // 4. Kiểm tra trùng lịch trình (loại trừ chính nó)
    const duplicate = await ScheduleModel.findDuplicate({
      route_id,
      bus_id,
      driver_id,
      date,
      shift_type,
      excludeId: id
    });

    if (duplicate) {
      throw new Error('Lịch trình này đã tồn tại');
    }

    // 5. Format dữ liệu
    const formattedData = {
      route_id,
      bus_id,
      driver_id,
      date,
      shift_type,
      scheduled_start_time,
      scheduled_end_time,
      actual_start_time: actual_start_time || null,
      actual_end_time: actual_end_time || null,
      status
    };

    // 6. Cập nhật
    const updatedSchedule = await ScheduleModel.update(id, formattedData);
    
    console.log('✅ SERVICE: Cập nhật lịch trình thành công');
    return updatedSchedule;
  }

  /**
   * Xóa lịch trình
   */
  static async deleteSchedule(id) {
    console.log('🔸 SERVICE: Xóa lịch trình ID:', id);
    
    // 1. Kiểm tra tồn tại
    await this.getScheduleById(id);

    // 2. TODO: Kiểm tra xem lịch trình có đang chạy không
    // const schedule = await this.getScheduleById(id);
    // if (schedule.status === 'in_progress') {
    //   throw new Error('Không thể xóa lịch trình đang chạy');
    // }

    // 3. Xóa schedule
    const deleted = await ScheduleModel.delete(id);
    if (!deleted) {
      throw new Error('Không thể xóa lịch trình');
    }

    console.log('✅ SERVICE: Xóa lịch trình thành công');
    return { message: 'Xóa lịch trình thành công' };
  }
}

export default ScheduleService;
