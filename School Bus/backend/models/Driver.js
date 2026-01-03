// models/Driver.js
// Database access layer cho Driver (Tài xế)

import pool from '../config/db.js';

class DriverModel {
  /**
   * Lấy tất cả tài xế
   * @returns {Promise<Array>} Danh sách tài xế với thông tin user
   */
  static async findAll() {
    console.log('🔷 MODEL: Lấy tất cả tài xế từ database');
    const [rows] = await pool.execute(`
      SELECT d.*, u.email, u.username 
      FROM drivers d 
      LEFT JOIN users u ON d.user_id = u.id 
      ORDER BY d.id ASC
    `);
    console.log(` MODEL: Tìm thấy ${rows.length} tài xế`);
    return rows;
  }

  /**
   * Lấy tài xế theo ID
   * @param {number} id - ID của tài xế
   * @returns {Promise<Object|null>} Thông tin tài xế hoặc null
   */
  static async findById(id) {
    console.log('🔷 MODEL: Tìm tài xế theo ID:', id);
    const [rows] = await pool.execute(`
      SELECT d.*, u.email, u.username 
      FROM drivers d 
      LEFT JOIN users u ON d.user_id = u.id 
      WHERE d.id = ?
    `, [id]);
    
    const driver = rows[0] || null;
    console.log(driver ? ' MODEL: Tìm thấy tài xế' : ' MODEL: Không tìm thấy tài xế');
    return driver;
  }

  /**
   * Lấy tài xế theo user_id
   * @param {number} userId - ID của user
   * @returns {Promise<Object|null>} Thông tin tài xế hoặc null
   */
  static async findByUserId(userId) {
    console.log('🔷 MODEL: Tìm tài xế theo user_id:', userId);
    const [rows] = await pool.execute(
      'SELECT * FROM drivers WHERE user_id = ? AND status = "active"',
      [userId]
    );
    
    const driver = rows[0] || null;
    console.log(driver ? ' MODEL: Tìm thấy tài xế' : ' MODEL: Không tìm thấy tài xế');
    return driver;
  }

  /**
   * Lấy tài xế theo số điện thoại
   * @param {string} phone - Số điện thoại
   * @returns {Promise<Object|null>} Thông tin tài xế hoặc null
   */
  static async findByPhone(phone) {
    console.log('🔷 MODEL: Tìm tài xế theo số điện thoại');
    const [rows] = await pool.execute(
      'SELECT * FROM drivers WHERE phone = ?',
      [phone]
    );
    return rows[0] || null;
  }

  /**
   * Lấy tài xế theo số bằng lái
   * @param {string} licenseNumber - Số bằng lái
   * @returns {Promise<Object|null>} Thông tin tài xế hoặc null
   */
  static async findByLicenseNumber(licenseNumber) {
    console.log('🔷 MODEL: Kiểm tra trùng số bằng lái:', licenseNumber);
    const [rows] = await pool.execute(
      'SELECT * FROM drivers WHERE license_number = ?',
      [licenseNumber]
    );
    
    const driver = rows[0] || null;
    console.log(driver ? '⚠️ MODEL: Số bằng lái đã tồn tại' : ' MODEL: Số bằng lái hợp lệ');
    return driver;
  }

  /**
   * Tạo tài xế mới
   * @param {Object} driverData - Dữ liệu tài xế
   * @returns {Promise<Object>} Tài xế vừa tạo
   */
  static async create(driverData) {
    const { name, phone, license_number, address, status = 'active', user_id } = driverData;
    
    console.log('🔷 MODEL: Tạo tài xế mới trong database');
    console.log('📦 MODEL: Dữ liệu:', { name, phone, license_number, status, user_id });
    
    const [result] = await pool.execute(
      'INSERT INTO drivers (name, phone, license_number, address, status, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, phone, license_number, address || null, status, user_id]
    );
    
    console.log(` MODEL: Insert thành công! insertId: ${result.insertId}`);
    
    // Lấy tài xế vừa tạo
    const newDriver = await this.findById(result.insertId);
    return newDriver;
  }

  /**
   * Cập nhật tài xế
   * @param {number} id - ID của tài xế
   * @param {Object} driverData - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Tài xế sau khi cập nhật
   */
  static async update(id, driverData) {
    const { name, phone, license_number, address, status, user_id } = driverData;
    
    console.log('🔷 MODEL: Cập nhật tài xế ID:', id);
    
    await pool.execute(
      'UPDATE drivers SET name = ?, phone = ?, license_number = ?, address = ?, status = ?, user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone, license_number, address || null, status, user_id, id]
    );
    
    console.log(' MODEL: Cập nhật thành công');
    
    // Lấy tài xế sau khi cập nhật
    const updatedDriver = await this.findById(id);
    return updatedDriver;
  }

  /**
   * Xóa tài xế
   * @param {number} id - ID của tài xế
   * @returns {Promise<boolean>} True nếu xóa thành công
   */
  static async delete(id) {
    console.log('🔷 MODEL: Xóa tài xế ID:', id);
    const [result] = await pool.execute('DELETE FROM drivers WHERE id = ?', [id]);
    
    const deleted = result.affectedRows > 0;
    console.log(deleted ? ' MODEL: Xóa thành công' : ' MODEL: Không tìm thấy để xóa');
    return deleted;
  }

  /**
   * Lấy lịch trình của tài xế
   * @param {number} id - ID của tài xế
   * @returns {Promise<Array>} Danh sách lịch trình
   */
  static async getSchedules(id) {
    console.log('🔷 MODEL: Lấy lịch trình của tài xế ID:', id);
    const [rows] = await pool.execute(`
      SELECT s.id, s.date, s.shift_type, 
             s.scheduled_start_time AS start_time, 
             s.scheduled_end_time AS end_time,
             r.route_name, r.distance, 
             b.bus_number, b.license_plate, b.status AS bus_status
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      JOIN buses b ON s.bus_id = b.id
      WHERE s.driver_id = ?
      ORDER BY s.date DESC, s.scheduled_start_time ASC
    `, [id]);
    
    console.log(` MODEL: Tìm thấy ${rows.length} lịch trình`);
    return rows;
  }

  /**
   * Kiểm tra tài xế có tồn tại không
   * @param {number} id - ID của tài xế
   * @returns {Promise<boolean>} True nếu tồn tại
   */
  static async exists(id) {
    const [rows] = await pool.execute('SELECT id FROM drivers WHERE id = ?', [id]);
    return rows.length > 0;
  }
}

export default DriverModel;
