// ===================================
// MODEL/REPOSITORY: BUS
// ===================================
// Chức năng: Xử lý TẤT CẢ truy vấn database liên quan đến buses
// Tách biệt logic database khỏi routes
// ===================================

import pool from '../config/db.js';

class BusModel {
  /**
   * Lấy tất cả xe bus
   * @returns {Promise<Array>} Danh sách xe bus
   */
  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM buses ORDER BY id DESC');
    return rows;
  }

  /**
   * Lấy xe bus theo ID
   * @param {number} id - ID của xe bus
   * @returns {Promise<Object|null>} Thông tin xe bus hoặc null
   */
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM buses WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /**
   * Lấy xe bus theo biển số
   * @param {string} licensePlate - Biển số xe
   * @returns {Promise<Object|null>}
   */
  static async findByLicensePlate(licensePlate) {
    console.log(' MODEL: Tìm xe bus với biển số:', licensePlate);
    
    const [rows] = await pool.execute(
      'SELECT * FROM buses WHERE license_plate = ?',
      [licensePlate]
    );
    
    console.log('📊 MODEL: Kết quả query:', rows.length, 'rows');
    
    return rows[0] || null;
  }

  static async findByBusNumber(busNumber) {
    const [rows] = await pool.execute(
      'SELECT * FROM buses WHERE bus_number = ?',
      [busNumber]
    );
    return rows[0] || null;
  }

  /**
   * Tạo xe bus mới
   * @param {Object} busData - Dữ liệu xe bus
   * @returns {Promise<Object>} Xe bus vừa tạo
   */
  static async create(busData) {
    console.log(' MODEL: Tạo xe bus mới trong database');
    console.log(' MODEL: Dữ liệu:', busData);
    
    const { bus_number, license_plate, status = 'active' } = busData;
    
    console.log(' MODEL: Execute SQL INSERT...');
    const [result] = await pool.execute(
      'INSERT INTO buses (bus_number, license_plate, status) VALUES (?, ?, ?)',
      [bus_number, license_plate, status]
    );

    console.log(' MODEL: Insert thành công! insertId:', result.insertId);
    
    // Lấy xe bus vừa tạo
    console.log(' MODEL: Lấy thông tin xe bus vừa tạo...');
    const newBus = await this.findById(result.insertId);
    console.log(' MODEL: Xe bus vừa tạo:', newBus);
    
    return newBus;
  }

  /**
   * Cập nhật xe bus
   * @param {number} id - ID xe bus
   * @param {Object} busData - Dữ liệu cập nhật
   * @returns {Promise<Object|null>} Xe bus đã cập nhật
   */
  static async update(id, busData) {
    const { bus_number, license_plate, status = null } = busData;
    
    const [result] = await pool.execute(
      'UPDATE buses SET bus_number = ?, license_plate = ?, status = COALESCE(?, status) WHERE id = ?',
      [bus_number ?? null, license_plate ?? null, status ?? null, id]
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return await this.findById(id);
  }

  /**
   * Xóa xe bus (soft delete hoặc hard delete)
   * @param {number} id - ID xe bus
   * @returns {Promise<boolean>} True nếu xóa thành công
   */
  static async delete(id) {
    // Option 1: Soft delete (chỉ thay đổi status)
    // const [result] = await pool.execute(
    //   'UPDATE buses SET status = ? WHERE id = ?',
    //   ['inactive', id]
    // );

    // Option 2: Hard delete (xóa hẳn)
    const [result] = await pool.execute('DELETE FROM buses WHERE id = ?', [id]);
    
    return result.affectedRows > 0;
  }

  /**
   * Lấy xe bus theo trạng thái
   * @param {string} status - Trạng thái (active/inactive)
   * @returns {Promise<Array>}
   */
  static async findByStatus(status) {
    const [rows] = await pool.execute(
      'SELECT * FROM buses WHERE status = ?',
      [status]
    );
    return rows;
  }

  /**
   * Kiểm tra xe bus có tồn tại không
   * @param {number} id - ID xe bus
   * @returns {Promise<boolean>}
   */
  static async exists(id) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM buses WHERE id = ?',
      [id]
    );
    return rows[0].count > 0;
  }
}

export default BusModel;
