// services/scheduleService.js
// Business logic layer cho Schedule
import ScheduleModel from '../models/Schedule.js';
import RouteModel from '../models/Route.js';
import BusModel from '../models/Bus.js';
import DriverModel from '../models/Driver.js';
import RouteService from './routeService.js';

// Helper: Add minutes to time string "HH:mm:ss"
const addMinutesToTime = (timeStr, minutesToAdd) => {
    if (!timeStr) return "00:00:00";
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    
    return date.toTimeString().split(' ')[0]; // Returns HH:mm:ss
};

class ScheduleService {

  static toMySqlDateTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  static async resetStaleInProgressIfNeeded() {
    // Default: 24h. Có thể override bằng env SCHEDULE_IN_PROGRESS_STALE_HOURS
    const staleHoursRaw = process.env.SCHEDULE_IN_PROGRESS_STALE_HOURS;
    const staleHours = Number(staleHoursRaw ?? 24);
    const hours = Number.isFinite(staleHours) && staleHours > 0 ? staleHours : 24;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const cutoffStr = this.toMySqlDateTime(cutoff);
    const affected = await ScheduleModel.resetStaleInProgress(cutoffStr);
    if (affected > 0) {
      console.log(` SERVICE: Reset ${affected} schedule stale in_progress -> scheduled`);
    }
  }

  /**
   * Lấy tất cả lịch trình
   */
  static async getAllSchedules() {
    console.log(' SERVICE: Lấy tất cả lịch trình');

    // Auto reset các schedule bị kẹt in_progress quá lâu (không dựa theo date)
    try {
      await this.resetStaleInProgressIfNeeded();
    } catch (e) {
      console.warn(' SERVICE: Không thể reset stale in_progress:', e?.message || e);
    }

    const schedules = await ScheduleModel.findAll();
    return schedules;
  }

  /**
   * Lấy schedule đang chạy (in_progress) theo các routeIds.
   * Dùng cho Parent để khỏi phải tải toàn bộ /admin-schedules.
   */
  static async getActiveSchedulesByRoutes(routeIds = [], limit = 1) {
    await this.resetStaleInProgressIfNeeded();
    return ScheduleModel.findActiveByRoutes(routeIds, limit);
  }

  /**
   * Lấy lịch trình theo ID
   */
  static async getScheduleById(id) {
    console.log(' SERVICE: Lấy lịch trình theo ID:', id);
    
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
    console.log(' SERVICE: Lấy lịch trình theo route');
    
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
    console.log(' SERVICE: Lấy lịch trình theo driver');
    
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
    console.log(' SERVICE: Lấy lịch trình theo bus');
    
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
    console.log(' SERVICE: Lấy lịch trình theo ngày:', date);
    
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
    console.log(' SERVICE: Bắt đầu tạo lịch trình mới', scheduleData);
    
    // Validate basic fields
    if (!scheduleData.route_id || !scheduleData.driver_id || !scheduleData.bus_id || !scheduleData.date) {
        throw new Error('Thiếu thông tin bắt buộc: route_id, driver_id, bus_id, date');
    }

    // Kiểm tra xem bus hoặc driver có bận không (tùy chọn)
    // await DriverModel.checkAvailability(scheduleData.driver_id, scheduleData.date, ...);

    const newSchedule = await ScheduleModel.create(scheduleData);
    return newSchedule;
  }

  /**
   * Lấy chi tiết lịch trình kèm danh sách các điểm dừng đã được tính toán thời gian dự kiến
   * @param {number} scheduleId 
   */
  static async getScheduleWithStopsAndTime(scheduleId) {
    console.log(' SERVICE: Lấy lịch trình kèm điểm dừng và thời gian cho ID:', scheduleId);
    
    // 1. Lấy thông tin lịch trình
    const schedule = await this.getScheduleById(scheduleId);
    
    // 2. Lấy thông tin route stops
    const route = await RouteModel.findWithStops(schedule.route_id);
    const stops = route.stops || [];

    if (stops.length === 0) {
        return { ...schedule, stops: [] };
    }

    // 3. Tính toán thời gian cho từng stop bằng OSRM
    const startTime = schedule.scheduled_start_time;
    let currentDistance = 0; // Tích lũy khoảng cách (nếu lấy được từ osrm) cho frontend hiển thị logic cũ? 
                             // OSRM trả về duration(s) và distance(m) nếu config, nhưng hàm getEtaOSRM hiện tại chỉ returns duration.
                             // Ta sẽ giữ logic distance 0 hoặc gọi thêm nếu cần, nhưng user chỉ yêu cầu dùng hàm ETA có sẵn.
    
    let accumulatedMinutes = 0;
    const stopsWithTime = [];

    // Duyệt tuần tự để tính thời gian cộng dồn (async/await trong loop)
    for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        let time = startTime;

        if (i === 0) {
           // Điểm đầu: distance = 0, time = start_time
           stopsWithTime.push({
             ...stop, 
             time, 
             distanceFromStart: 0,
             // Chuẩn hóa field cho frontend
             lat: parseFloat(stop.latitude),
             lng: parseFloat(stop.longitude),
             order: stop.stop_order
           });
        } else {
            const prevStop = stops[i - 1];
            
            // Gọi OSRM từ RouteService để lấy thời gian di chuyển thực tế (giây)
            // Lưu ý: Hàm này có thể throw hoặc return 0 nếu lỗi
            const durationSeconds = await RouteService.getEtaOSRM(
                parseFloat(prevStop.latitude), 
                parseFloat(prevStop.longitude),
                parseFloat(stop.latitude), 
                parseFloat(stop.longitude)
            );

            // Thời gian dừng đón trả khách (ví dụ 2 phút)
            const stopDurationMinutes = 2;
            const travelMinutes = durationSeconds / 60;

            accumulatedMinutes += travelMinutes + stopDurationMinutes;
            const roundedMinutes = Math.ceil(accumulatedMinutes);
            
            time = addMinutesToTime(startTime, roundedMinutes);

            stopsWithTime.push({
                ...stop,
                time,
                distanceFromStart: 0, // Hiện tại getEtaOSRM chưa trả distance, để tạm 0 hoặc sửa getEtaOSRM sau
                lat: parseFloat(stop.latitude),
                lng: parseFloat(stop.longitude),
                order: stop.stop_order
            });
        }
    }

    return {
        ...schedule,
        stops: stopsWithTime
    };
  }



  /**
   * Cập nhật lịch trình
   */
  static async updateSchedule(id, scheduleData) {
    console.log(' SERVICE: Cập nhật lịch trình ID:', id);
    console.log(' SERVICE: Dữ liệu nhận được:', JSON.stringify(scheduleData, null, 2));
    
    // 1. Kiểm tra tồn tại
    await this.getScheduleById(id);

    // 2. Validation
    const { 
      route_id, bus_id, driver_id, date, shift_type,
      scheduled_start_time, scheduled_end_time,
      student_count = 0, notes = null,
      actual_end_time = null, status = 'scheduled'
    } = scheduleData;
    
    console.log(' SERVICE: Validation fields:', { route_id, bus_id, driver_id, date, shift_type });
    
    if (!route_id || !bus_id || !driver_id || !date || !shift_type) {
      throw new Error('Thiếu thông tin bắt buộc: route_id, bus_id, driver_id, date, shift_type');
    }

    if (!scheduled_start_time || !scheduled_end_time) {
      throw new Error('Thiếu thông tin: scheduled_start_time, scheduled_end_time');
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
      student_count,
      status,
      actual_end_time,
      notes
    };

    // 6. Cập nhật
    const updatedSchedule = await ScheduleModel.update(id, formattedData);
    
    console.log(' SERVICE: Cập nhật lịch trình thành công');
    return updatedSchedule;
  }

  /**
   * Cập nhật trạng thái lịch trình + actual_end_time (khi hoàn thành)
   */
  static async updateScheduleStatus(id, status, notes = null, actualEndTime = null) {
    console.log(' SERVICE: Cập nhật trạng thái lịch trình ID:', id, 'status =', status);

    if (!status) {
      throw new Error('Thiếu trạng thái lịch trình');
    }

    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Trạng thái lịch trình không hợp lệ');
    }

    // Đảm bảo lịch tồn tại
    const schedule = await this.getScheduleById(id);

    // (Optional) Chặn start chuyến cho lịch không phải hôm nay.
    // Mặc định ALLOW_START_PAST_SCHEDULE=true (để demo có thể chạy lịch ngày cũ).
    // Set env ALLOW_START_PAST_SCHEDULE=false để bật chặn.
    if (status === 'in_progress') {
      const allowPast = String(process.env.ALLOW_START_PAST_SCHEDULE ?? 'false').toLowerCase() !== 'false';
      if (!allowPast) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        if (String(schedule?.date || '') !== todayStr) {
          throw new Error('Không thể bắt đầu chuyến cho lịch không thuộc ngày hiện tại');
        }
      }
    }

    // Nếu hoàn thành nhưng FE không gửi actualEndTime thì dùng thời gian hiện tại (theo giờ local của server)
    let finalActualEnd = null;
    if (status === 'completed') {
      if (actualEndTime) {
        finalActualEnd = actualEndTime;
      } else {
        // MySQL sẽ parse chuỗi theo định dạng YYYY-MM-DD HH:MM:SS (giờ local)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        finalActualEnd = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
    }

    const updated = await ScheduleModel.updateStatus(id, status, notes, finalActualEnd);
    console.log(' SERVICE: Cập nhật trạng thái lịch trình thành công');
    return updated;
  }

  /**
   * Xóa lịch trình
   */
  static async deleteSchedule(id) {
    console.log(' SERVICE: Xóa lịch trình ID:', id);
    
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

    console.log(' SERVICE: Xóa lịch trình thành công');
    return { message: 'Xóa lịch trình thành công' };
  }
}

export default ScheduleService;
