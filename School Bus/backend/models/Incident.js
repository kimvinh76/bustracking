// models/Incident.js
// Database access layer cho Incident (Sự cố)

import pool from '../config/db.js';

class IncidentModel {
  /**
   * Lấy tất cả sự cố
   * @returns {Promise<Array>} Danh sách sự cố
   */
  static async findAll() {
    console.log('🔷 MODEL: Lấy tất cả sự cố từ database');
    const [rows] = await pool.execute(`
      SELECT i.*, 
             d.name AS driver_name,
             b.bus_number, b.license_plate,
             r.route_name
      FROM incidents i
      LEFT JOIN drivers d ON i.driver_id = d.id
      LEFT JOIN buses b ON i.bus_id = b.id
      LEFT JOIN routes r ON i.route_id = r.id
      ORDER BY i.created_at DESC
    `);
    
    console.log(`✅ MODEL: Tìm thấy ${rows.length} sự cố`);
    return rows;
  }

  /**
   * Lấy sự cố theo ID
   * @param {number} id - ID của sự cố
   * @returns {Promise<Object|null>} Thông tin sự cố hoặc null
   */
  static async findById(id) {
    console.log('🔷 MODEL: Tìm sự cố theo ID:', id);
    const [rows] = await pool.execute(`
      SELECT i.*, 
             d.name AS driver_name, d.phone AS driver_phone,
             b.bus_number, b.license_plate,
             r.route_name
      FROM incidents i
      LEFT JOIN drivers d ON i.driver_id = d.id
      LEFT JOIN buses b ON i.bus_id = b.id
      LEFT JOIN routes r ON i.route_id = r.id
      WHERE i.id = ?
    `, [id]);
    
    const incident = rows[0] || null;
    console.log(incident ? '✅ MODEL: Tìm thấy sự cố' : '❌ MODEL: Không tìm thấy sự cố');
    return incident;
  }

  /**
   * Lấy sự cố theo driver
   * @param {number} driverId - ID của tài xế
   * @returns {Promise<Array>} Danh sách sự cố
   */
  static async findByDriver(driverId) {
    console.log('🔷 MODEL: Lấy sự cố theo driver ID:', driverId);
    const [rows] = await pool.execute(`
      SELECT i.*, 
             b.bus_number, b.license_plate,
             r.route_name
      FROM incidents i
      LEFT JOIN buses b ON i.bus_id = b.id
      LEFT JOIN routes r ON i.route_id = r.id
      WHERE i.driver_id = ?
      ORDER BY i.created_at DESC
    `, [driverId]);
    
    console.log(`✅ MODEL: Tìm thấy ${rows.length} sự cố`);
    return rows;
  }

  /**
   * Lấy sự cố theo bus
   * @param {number} busId - ID của xe bus
   * @returns {Promise<Array>} Danh sách sự cố
   */
  static async findByBus(busId) {
    console.log('🔷 MODEL: Lấy sự cố theo bus ID:', busId);
    const [rows] = await pool.execute(`
      SELECT i.*, 
             d.name AS driver_name,
             r.route_name
      FROM incidents i
      LEFT JOIN drivers d ON i.driver_id = d.id
      LEFT JOIN routes r ON i.route_id = r.id
      WHERE i.bus_id = ?
      ORDER BY i.created_at DESC
    `, [busId]);
    
    console.log(`✅ MODEL: Tìm thấy ${rows.length} sự cố`);
    return rows;
  }

  /**
   * Lấy sự cố theo route
   * @param {number} routeId - ID của tuyến đường
   * @returns {Promise<Array>} Danh sách sự cố
   */
  static async findByRoute(routeId) {
    console.log('🔷 MODEL: Lấy sự cố theo route ID:', routeId);
    const [rows] = await pool.execute(`
      SELECT i.*, 
             d.name AS driver_name,
             b.bus_number, b.license_plate
      FROM incidents i
      LEFT JOIN drivers d ON i.driver_id = d.id
      LEFT JOIN buses b ON i.bus_id = b.id
      WHERE i.route_id = ?
      ORDER BY i.created_at DESC
    `, [routeId]);
    
    console.log(`✅ MODEL: Tìm thấy ${rows.length} sự cố`);
    return rows;
  }

  /**
   * Lấy sự cố theo severity
   * @param {string} severity - Mức độ nghiêm trọng (low, medium, high, critical)
   * @returns {Promise<Array>} Danh sách sự cố
   */
  static async findBySeverity(severity) {
    console.log('🔷 MODEL: Lấy sự cố theo severity:', severity);
    const [rows] = await pool.execute(`
      SELECT i.*, 
             d.name AS driver_name,
             b.bus_number, b.license_plate,
             r.route_name
      FROM incidents i
      LEFT JOIN drivers d ON i.driver_id = d.id
      LEFT JOIN buses b ON i.bus_id = b.id
      LEFT JOIN routes r ON i.route_id = r.id
      WHERE i.severity = ?
      ORDER BY i.created_at DESC
    `, [severity]);
    
    console.log(`✅ MODEL: Tìm thấy ${rows.length} sự cố`);
    return rows;
  }

  /**
   * Lấy sự cố theo status
   * @param {string} status - Trạng thái (reported, in_progress, resolved, closed)
   * @returns {Promise<Array>} Danh sách sự cố
   */
  static async findByStatus(status) {
    console.log('🔷 MODEL: Lấy sự cố theo status:', status);
    const [rows] = await pool.execute(`
      SELECT i.*, 
             d.name AS driver_name,
             b.bus_number, b.license_plate,
             r.route_name
      FROM incidents i
      LEFT JOIN drivers d ON i.driver_id = d.id
      LEFT JOIN buses b ON i.bus_id = b.id
      LEFT JOIN routes r ON i.route_id = r.id
      WHERE i.status = ?
      ORDER BY i.created_at DESC
    `, [status]);
    
    console.log(`✅ MODEL: Tìm thấy ${rows.length} sự cố`);
    return rows;
  }

  /**
   * Tạo sự cố mới
   * @param {Object} incidentData - Dữ liệu sự cố
   * @returns {Promise<Object>} Sự cố vừa tạo
   */
  static async create(incidentData) {
    const { 
      driver_id, bus_id, route_id, incident_type, description, 
      severity = 'medium', status = 'reported', location, latitude, longitude
    } = incidentData;
    
    console.log('🔷 MODEL: Tạo sự cố mới trong database');
    console.log('📦 MODEL: Dữ liệu:', { driver_id, bus_id, incident_type, severity });
    
    const [result] = await pool.execute(
      `INSERT INTO incidents 
       (driver_id, bus_id, route_id, incident_type, description, severity, status, location, latitude, longitude) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [driver_id, bus_id, route_id || null, incident_type, description, severity, status, location || null, latitude || null, longitude || null]
    );
    
    console.log(`✅ MODEL: Insert thành công! insertId: ${result.insertId}`);
    
    // Lấy sự cố vừa tạo
    const newIncident = await this.findById(result.insertId);
    return newIncident;
  }

  /**
   * Cập nhật sự cố
   * @param {number} id - ID của sự cố
   * @param {Object} incidentData - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Sự cố sau khi cập nhật
   */
  static async update(id, incidentData) {
    const { 
      incident_type, description, severity, status, 
      resolution_notes, resolved_at
    } = incidentData;
    
    console.log('🔷 MODEL: Cập nhật sự cố ID:', id);
    
    await pool.execute(
      `UPDATE incidents SET 
       incident_type = ?, description = ?, severity = ?, status = ?,
       resolution_notes = ?, resolved_at = ?
       WHERE id = ?`,
      [incident_type, description, severity, status, resolution_notes || null, resolved_at || null, id]
    );
    
    console.log('✅ MODEL: Cập nhật thành công');
    
    // Lấy sự cố sau khi cập nhật
    const updatedIncident = await this.findById(id);
    return updatedIncident;
  }

  /**
   * Cập nhật trạng thái sự cố
   * @param {number} id - ID của sự cố
   * @param {string} status - Trạng thái mới
   * @param {string} resolutionNotes - Ghi chú giải quyết (optional)
   * @returns {Promise<Object>} Sự cố sau khi cập nhật
   */
  static async updateStatus(id, status, resolutionNotes = null) {
    console.log('🔷 MODEL: Cập nhật trạng thái sự cố ID:', id, '→', status);
    
    const resolvedAt = (status === 'resolved' || status === 'closed') ? new Date() : null;
    
    await pool.execute(
      `UPDATE incidents SET status = ?, resolution_notes = ?, resolved_at = ? WHERE id = ?`,
      [status, resolutionNotes, resolvedAt, id]
    );
    
    console.log('✅ MODEL: Cập nhật trạng thái thành công');
    
    // Lấy sự cố sau khi cập nhật
    const updatedIncident = await this.findById(id);
    return updatedIncident;
  }

  /**
   * Xóa sự cố
   * @param {number} id - ID của sự cố
   * @returns {Promise<boolean>} True nếu xóa thành công
   */
  static async delete(id) {
    console.log('🔷 MODEL: Xóa sự cố ID:', id);
    const [result] = await pool.execute('DELETE FROM incidents WHERE id = ?', [id]);
    
    const deleted = result.affectedRows > 0;
    console.log(deleted ? '✅ MODEL: Xóa thành công' : '❌ MODEL: Không tìm thấy để xóa');
    return deleted;
  }

  /**
   * Kiểm tra sự cố có tồn tại không
   * @param {number} id - ID của sự cố
   * @returns {Promise<boolean>} True nếu tồn tại
   */
  static async exists(id) {
    const [rows] = await pool.execute('SELECT id FROM incidents WHERE id = ?', [id]);
    return rows.length > 0;
  }
}

export default IncidentModel;
