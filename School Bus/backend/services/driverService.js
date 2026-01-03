// services/driverService.js
// Business logic layer cho Driver

import DriverModel from '../models/Driver.js';
import UserModel from '../models/User.js';

class DriverService {
  /**
   * Lấy tất cả tài xế
   */
  static async getAllDrivers() {
    console.log('🔸 SERVICE: Lấy tất cả tài xế');
    const drivers = await DriverModel.findAll();
    return drivers;
  }

  /**
   * Lấy tài xế theo ID
   */
  static async getDriverById(id) {
    console.log('🔸 SERVICE: Lấy tài xế theo ID:', id);
    
    const driver = await DriverModel.findById(id);
    if (!driver) {
      throw new Error('Không tìm thấy tài xế');
    }
    
    return driver;
  }

  /**
   * Lấy tài xế theo user_id
   */
  static async getDriverByUserId(userId) {
    console.log('🔸 SERVICE: Lấy tài xế theo user_id:', userId);
    
    const driver = await DriverModel.findByUserId(userId);
    if (!driver) {
      throw new Error('Không tìm thấy tài xế với user_id này');
    }
    
    return driver;
  }

  /**
   * Lấy chi tiết tài xế kèm lịch trình
   */
  static async getDriverDetails(id) {
    console.log('🔸 SERVICE: Lấy chi tiết tài xế kèm lịch trình');
    
    const driver = await this.getDriverById(id);
    const schedules = await DriverModel.getSchedules(id);
    
    return {
      ...driver,
      schedules
    };
  }

  /**
   * Tạo tài xế mới
   */
  static async createDriver(driverData) {
    console.log('🔸 SERVICE: Bắt đầu tạo tài xế mới');
    console.log('📦 SERVICE: Dữ liệu nhận được:', driverData);
    
    // 1. Validation
    const { name, phone, license_number, address, status = 'active' } = driverData;
    
    if (!name || !phone || !license_number) {
      console.log(' SERVICE: Thiếu thông tin bắt buộc');
      throw new Error('Thiếu thông tin bắt buộc: tên, số điện thoại, số bằng lái');
    }

    // 2. Validate phone format (10 số)
    if (!/^[0-9]{10}$/.test(phone)) {
      console.log(' SERVICE: Số điện thoại không hợp lệ');
      throw new Error('Số điện thoại không hợp lệ (phải 10 số)');
    }

    console.log(' SERVICE: Validation passed');

    // 3. Kiểm tra trùng số bằng lái
    const existingDriver = await DriverModel.findByLicenseNumber(license_number);
    if (existingDriver) {
      console.log(' SERVICE: Số bằng lái đã tồn tại');
      throw new Error('Số bằng lái đã tồn tại');
    }
    
    console.log(' SERVICE: Không trùng số bằng lái');

    // 4. Tạo user account
    console.log('🔸 SERVICE: Tạo user account cho tài xế');
    const username = `driver_${license_number}`;
    const email = `${username}@schoolbus.com`;
    const defaultPassword = "driver123"; // TODO: Hash password
    
    let user_id = null;
    try {
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        throw new Error('Tài khoản với số bằng lái này đã tồn tại');
      }
      
      const newUser = await UserModel.create({
        username,
        email,
        password: defaultPassword,
        role: 'driver'
      });
      user_id = newUser.id;
      console.log(' SERVICE: Tạo user account thành công, user_id:', user_id);
    } catch (err) {
      console.log(' SERVICE: Lỗi tạo user account:', err.message);
      throw new Error(`Lỗi tạo tài khoản: ${err.message}`);
    }

    // 5. Format dữ liệu
    const formattedData = {
      name,
      phone,
      license_number: license_number.toUpperCase(), // Uppercase
      address: address || null,
      status,
      user_id
    };
    
    console.log('🔸 SERVICE: Dữ liệu sau khi format:', formattedData);

    // 6. Tạo driver
    const newDriver = await DriverModel.create(formattedData);
    
    console.log(' SERVICE: Tạo tài xế thành công');
    return newDriver;
  }

  /**
   * Cập nhật tài xế
   */
  static async updateDriver(id, driverData) {
    console.log('🔸 SERVICE: Cập nhật tài xế ID:', id);
    
    // 1. Kiểm tra tồn tại
    await this.getDriverById(id);

    // 2. Validation
    const { name, phone, license_number, address, status } = driverData;
    
    if (!name || !phone || !license_number) {
      throw new Error('Thiếu thông tin bắt buộc');
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      throw new Error('Số điện thoại không hợp lệ (phải 10 số)');
    }

    // 3. Kiểm tra trùng số bằng lái (loại trừ chính nó)
    const existingDriver = await DriverModel.findByLicenseNumber(license_number);
    if (existingDriver && existingDriver.id !== parseInt(id)) {
      throw new Error('Số bằng lái đã tồn tại');
    }

    // 4. Format dữ liệu
    const formattedData = {
      name,
      phone,
      license_number: license_number.toUpperCase(),
      address: address || null,
      status,
      user_id: driverData.user_id
    };

    // 5. Cập nhật
    const updatedDriver = await DriverModel.update(id, formattedData);
    
    console.log(' SERVICE: Cập nhật tài xế thành công');
    return updatedDriver;
  }

  /**
   * Xóa tài xế
   */
  static async deleteDriver(id) {
    console.log('🔸 SERVICE: Xóa tài xế ID:', id);
    
    // 1. Kiểm tra tồn tại
    const driver = await this.getDriverById(id);

    // 2. TODO: Kiểm tra xem tài xế có đang phụ trách lịch trình không
    // const hasActiveSchedules = await ScheduleModel.findByDriver(id);
    // if (hasActiveSchedules.length > 0) {
    //   throw new Error('Không thể xóa tài xế đang có lịch trình');
    // }

    // 3. Xóa driver
    const deleted = await DriverModel.delete(id);
    if (!deleted) {
      throw new Error('Không thể xóa tài xế');
    }

    // 4. Xóa user account (nếu có)
    if (driver.user_id) {
      console.log('🔸 SERVICE: Xóa user account, user_id:', driver.user_id);
      await UserModel.delete(driver.user_id);
    }

    console.log(' SERVICE: Xóa tài xế thành công');
    return { message: 'Xóa tài xế thành công' };
  }
}

export default DriverService;
