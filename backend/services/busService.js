// ===================================
// SERVICE LAYER: BUS
// ===================================
// Chức năng: Xử lý LOGIC NGHIỆP VỤ
// - Validation (kiểm tra dữ liệu)
// - Business rules (quy tắc nghiệp vụ)
// - Kết hợp nhiều model nếu cần
// ===================================

import BusModel from '../models/Bus.js';

class BusService {
  /**
   * Lấy tất cả xe bus
   */
  static async getAllBuses() {
    return await BusModel.findAll();
  }

  /**
   * Lấy xe bus theo ID
   */
  static async getBusById(id) {
    // Validation
    if (!id || isNaN(id)) {
      throw new Error('ID không hợp lệ');
    }

    const bus = await BusModel.findById(id);
    
    if (!bus) {
      throw new Error('Không tìm thấy xe bus');
    }

    return bus;
  }

  /**
   * Tạo xe bus mới
   */
  static async createBus(busData) {
    console.log(' SERVICE: Bắt đầu xử lý tạo xe bus');
    console.log(' SERVICE: Dữ liệu nhận từ Routes:', busData);

    // Validation chi tiết
    const { bus_number, license_plate } = busData;

    console.log(' SERVICE: Kiểm tra validation...');
    if (!bus_number || !license_plate) {
      console.error(' SERVICE: Validation failed - Thiếu thông tin');
      throw new Error('Mã xe và biển số xe là bắt buộc');
    }
    console.log(' SERVICE: Validation passed');

    // Business rule: Kiểm tra biển số có trùng không
    console.log(' SERVICE: Kiểm tra biển số trùng...');
    const existingBus = await BusModel.findByLicensePlate(license_plate);
    if (existingBus) {
      console.error(' SERVICE: Biển số đã tồn tại:', license_plate);
      throw new Error(`Biển số xe ${license_plate} đã tồn tại`);
    }
    console.log(' SERVICE: Không trùng biển số');

    // Business rule: Format biển số (VD: chuyển thành chữ hoa)
    console.log(' SERVICE: Format dữ liệu...');
    busData.license_plate = license_plate.toUpperCase().trim();
    busData.bus_number = bus_number.trim();
    console.log(' SERVICE: Dữ liệu đã format:', busData);

    // Tạo xe bus
    console.log(' SERVICE: Gọi BusModel.create()...');
    const newBus = await BusModel.create(busData);
    console.log(' SERVICE: Model trả về xe bus:', newBus);
    
    return newBus;
  }

  /**
   * Cập nhật xe bus
   */
  static async updateBus(id, busData) {
    // Validation
    if (!id || isNaN(id)) {
      throw new Error('ID không hợp lệ');
    }

    const { bus_number, license_plate } = busData;

    if (!bus_number || !license_plate) {
      throw new Error('Mã xe và biển số xe là bắt buộc');
    }

    // Kiểm tra xe bus có tồn tại
    const exists = await BusModel.exists(id);
    if (!exists) {
      throw new Error('Không tìm thấy xe bus để cập nhật');
    }

    // Business rule: Kiểm tra biển số trùng (ngoại trừ chính nó)
    const existingBus = await BusModel.findByLicensePlate(license_plate);
    if (existingBus && existingBus.id !== parseInt(id)) {
      throw new Error(`Biển số xe ${license_plate} đã được sử dụng`);
    }

    // Format dữ liệu
    busData.license_plate = license_plate.toUpperCase().trim();
    busData.bus_number = bus_number.trim();

    return await BusModel.update(id, busData);
  }

  /**
   * Xóa xe bus
   */
  static async deleteBus(id) {
    // Validation
    if (!id || isNaN(id)) {
      throw new Error('ID không hợp lệ');
    }

    // Kiểm tra xe bus có tồn tại
    const exists = await BusModel.exists(id);
    if (!exists) {
      throw new Error('Không tìm thấy xe bus để xóa');
    }

    // Business rule: Có thể thêm kiểm tra
    // VD: Không cho xóa nếu xe đang có lịch trình

    const deleted = await BusModel.delete(id);
    
    if (!deleted) {
      throw new Error('Xóa xe bus thất bại');
    }

    return true;
  }

  /**
   * Lấy xe bus đang hoạt động
   */
  static async getActiveBuses() {
    return await BusModel.findByStatus('active');
  }

  /**
   * Lấy xe bus theo biển số
   */
  static async getBusByLicensePlate(licensePlate) {
    // Validation
    if (!licensePlate || licensePlate.trim() === '') {
      throw new Error('Biển số xe không hợp lệ');
    }

    const bus = await BusModel.findByLicensePlate(licensePlate.trim());
    
    if (!bus) {
      throw new Error(`Không tìm thấy xe bus với biển số ${licensePlate}`);
    }

    return bus;
  }
}

export default BusService;
