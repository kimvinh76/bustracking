// models/Schedule.js
// Database access layer cho Schedule (Lịch trình)

import pool from '../config/db.js';

class ScheduleModel {
  /**
   * Lấy tất cả lịch trình
   * @returns {Promise<Array>} Danh sách lịch trình
   */
  static async findAll() {
    console.log('🔷 MODEL: Lấy tất cả lịch trình từ database');
    const [rows] = await pool.execute(`
      SELECT s.*, 
             r.route_name, 
              b.bus_number, b.license_plate,
              d.name AS driver_name
      FROM schedules s
      LEFT JOIN routes r ON s.route_id = r.id
      LEFT JOIN buses b ON s.bus_id = b.id
      LEFT JOIN drivers d ON s.driver_id = d.id
      ORDER BY s.date DESC, s.scheduled_start_time ASC
    `);
    
    console.log(` MODEL: Tìm thấy ${rows.length} lịch trình`);
    return rows;
  }

  /**
   * Lấy lịch trình theo ID
   * @param {number} id - ID của lịch trình
   * @returns {Promise<Object|null>} Thông tin lịch trình hoặc null
   */
  static async findById(id) {
    console.log('🔷 MODEL: Tìm lịch trình theo ID:', id);
    const [rows] = await pool.execute(`
      SELECT s.*, 
              r.route_name,
             b.bus_number, b.license_plate, b.capacity,
             d.name AS driver_name, d.phone AS driver_phone
      FROM schedules s
      LEFT JOIN routes r ON s.route_id = r.id
      LEFT JOIN buses b ON s.bus_id = b.id
      LEFT JOIN drivers d ON s.driver_id = d.id
      WHERE s.id = ?
    `, [id]);
    
    const schedule = rows[0] || null;
    console.log(schedule ? ' MODEL: Tìm thấy lịch trình' : ' MODEL: Không tìm thấy lịch trình');
    return schedule;
  }

  /**
   * Lấy lịch trình theo route
   * @param {number} routeId - ID của tuyến đường
   * @returns {Promise<Array>} Danh sách lịch trình
   */
  static async findByRoute(routeId) {
    console.log('🔷 MODEL: Lấy lịch trình theo route ID:', routeId);
    const [rows] = await pool.execute(`
      SELECT s.*, 
             b.bus_number, b.license_plate,
             d.name AS driver_name
      FROM schedules s
      LEFT JOIN buses b ON s.bus_id = b.id
      LEFT JOIN drivers d ON s.driver_id = d.id
      WHERE s.route_id = ?
      ORDER BY s.date DESC, s.scheduled_start_time ASC
    `, [routeId]);
    
    console.log(` MODEL: Tìm thấy ${rows.length} lịch trình`);
    return rows;
  }

  /**
   * Lấy lịch trình theo driver
   * @param {number} driverId - ID của tài xế
   * @returns {Promise<Array>} Danh sách lịch trình
   */
  static async findByDriver(driverId) {
    console.log('🔷 MODEL: Lấy lịch trình theo driver ID:', driverId);
    const [rows] = await pool.execute(`
      SELECT s.*, 
             r.route_name,
             b.bus_number, b.license_plate
      FROM schedules s
      LEFT JOIN routes r ON s.route_id = r.id
      LEFT JOIN buses b ON s.bus_id = b.id
      WHERE s.driver_id = ?
      ORDER BY s.date DESC, s.scheduled_start_time ASC
    `, [driverId]);
    
    console.log(` MODEL: Tìm thấy ${rows.length} lịch trình`);
    return rows;
  }

  /**
   * Lấy lịch trình theo bus
   * @param {number} busId - ID của xe bus
   * @returns {Promise<Array>} Danh sách lịch trình
   */
  static async findByBus(busId) {
    console.log('🔷 MODEL: Lấy lịch trình theo bus ID:', busId);
    const [rows] = await pool.execute(`
      SELECT s.*, 
             r.route_name,
             d.name AS driver_name
      FROM schedules s
      LEFT JOIN routes r ON s.route_id = r.id
      LEFT JOIN drivers d ON s.driver_id = d.id
      WHERE s.bus_id = ?
      ORDER BY s.date DESC, s.scheduled_start_time ASC
    `, [busId]);
    
    console.log(` MODEL: Tìm thấy ${rows.length} lịch trình`);
    return rows;
  }

  /**
   * Lấy lịch trình theo ngày
   * @param {string} date - Ngày (YYYY-MM-DD)
   * @returns {Promise<Array>} Danh sách lịch trình
   */
  static async findByDate(date) {
    console.log('🔷 MODEL: Lấy lịch trình theo ngày:', date);
    const [rows] = await pool.execute(`
      SELECT s.*, 
             r.route_name,
             b.bus_number, b.license_plate,
             d.name AS driver_name
      FROM schedules s
      LEFT JOIN routes r ON s.route_id = r.id
      LEFT JOIN buses b ON s.bus_id = b.id
      LEFT JOIN drivers d ON s.driver_id = d.id
      WHERE s.date = ?
      ORDER BY s.scheduled_start_time ASC
    `, [date]);
    
    console.log(` MODEL: Tìm thấy ${rows.length} lịch trình`);
    return rows;
  }

  /**
   * Tạo lịch trình mới
   * @param {Object} scheduleData - Dữ liệu lịch trình
   * @returns {Promise<Object>} Lịch trình vừa tạo
   */
  static async create(scheduleData) {
    const { 
      route_id, bus_id, driver_id, date, shift_type,
      scheduled_start_time, scheduled_end_time,
      student_count = 0, notes = null, status = 'scheduled'
    } = scheduleData;
    
    console.log('🔷 MODEL: Tạo lịch trình mới trong database');
    console.log(' MODEL: Dữ liệu:', { route_id, bus_id, driver_id, date, shift_type });
    
    const [result] = await pool.execute(
      `INSERT INTO schedules 
       (route_id, bus_id, driver_id, date, shift_type, scheduled_start_time, scheduled_end_time, student_count, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      [route_id, bus_id, driver_id, date, shift_type, scheduled_start_time, scheduled_end_time, student_count, notes, status]
    );
    
    console.log(` MODEL: Insert thành công! insertId: ${result.insertId}`);
    
    // Lấy lịch trình vừa tạo
    const newSchedule = await this.findById(result.insertId);
    return newSchedule;
  }

  /**
   * Cập nhật lịch trình
   * @param {number} id - ID của lịch trình
   * @param {Object} scheduleData - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Lịch trình sau khi cập nhật
   */
  static async update(id, scheduleData) {
    const { 
      route_id, bus_id, driver_id, date, shift_type,
      scheduled_start_time, scheduled_end_time, 
      actual_start_time, actual_end_time, student_count = 0, notes = null, status
    } = scheduleData;
    
    console.log('🔷 MODEL: Cập nhật lịch trình ID:', id);
    
    await pool.execute(
      `UPDATE schedules SET 
       route_id = ?, bus_id = ?, driver_id = ?, date = ?, shift_type = ?,
       scheduled_start_time = ?, scheduled_end_time = ?,
       actual_start_time = ?, actual_end_time = ?, student_count = ?, notes = ?, status = ?
       WHERE id = ?`,
      [route_id, bus_id, driver_id, date, shift_type, 
       scheduled_start_time, scheduled_end_time,
       actual_start_time || null, actual_end_time || null, student_count, notes, status, id]
    );
    
    console.log(' MODEL: Cập nhật thành công');
    
    // Lấy lịch trình sau khi cập nhật
    const updatedSchedule = await this.findById(id);
    return updatedSchedule;
  }

  /**
   * Xóa lịch trình
   * @param {number} id - ID của lịch trình
   * @returns {Promise<boolean>} True nếu xóa thành công
   */
  static async delete(id) {
    console.log('🔷 MODEL: Xóa lịch trình ID:', id);
    const [result] = await pool.execute('DELETE FROM schedules WHERE id = ?', [id]);
    
    const deleted = result.affectedRows > 0;
    console.log(deleted ? ' MODEL: Xóa thành công' : ' MODEL: Không tìm thấy để xóa');
    return deleted;
  }

  /**
   * Kiểm tra trùng lịch trình (cùng bus, driver, route, date, shift)
   * @param {Object} scheduleData - Dữ liệu cần kiểm tra
   * @returns {Promise<Object|null>} Lịch trình trùng hoặc null
   */
  static async findDuplicate(scheduleData) {
    const { route_id, bus_id, driver_id, date, shift_type, excludeId } = scheduleData;
    
    console.log('🔷 MODEL: Kiểm tra trùng lịch trình');
    
    let query = `
      SELECT * FROM schedules 
      WHERE route_id = ? AND bus_id = ? AND driver_id = ? AND date = ? AND shift_type = ?
    `;
    const params = [route_id, bus_id, driver_id, date, shift_type];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.execute(query, params);
    
    const duplicate = rows[0] || null;
    console.log(duplicate ? '⚠️ MODEL: Lịch trình đã tồn tại' : ' MODEL: Lịch trình hợp lệ');
    return duplicate;
  }

  /**
   * Kiểm tra lịch trình có tồn tại không
   * @param {number} id - ID của lịch trình
   * @returns {Promise<boolean>} True nếu tồn tại
   */
  static async exists(id) {
    const [rows] = await pool.execute('SELECT id FROM schedules WHERE id = ?', [id]);
    return rows.length > 0;
  }

  /**
   * Cập nhật trạng thái + actual_end_time (nếu có)
   * Dùng khi tài xế kết thúc chuyến hoặc admin đổi trạng thái.
   */
  static async updateStatus(id, status, notes = null, actual_end_time = null) {
    console.log('🔷 MODEL: Cập nhật trạng thái lịch trình ID:', id, 'status =', status);

    await pool.execute(
      `UPDATE schedules 
       SET status = ?, notes = ?, 
           actual_end_time = COALESCE(?, actual_end_time)
       WHERE id = ?`,
      [status, notes, actual_end_time, id]
    );

    const updated = await this.findById(id);
    return updated;
  }
}

export default ScheduleModel;
