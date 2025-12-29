// models/Route.js
// Database access layer cho Route (Tuyến đường)

import pool from '../config/db.js';

class RouteModel {
  /**
   * Lấy tất cả tuyến đường
   * @returns {Promise<Array>} Danh sách tuyến đường
   */
  static async findAll() {
    console.log('🔷 MODEL: Lấy tất cả tuyến đường từ database');
    const [rows] = await pool.query('SELECT * FROM routes ORDER BY id ASC');
    console.log(`✅ MODEL: Tìm thấy ${rows.length} tuyến đường`);
    return rows;
  }

  /**
   * Lấy tuyến đường theo ID
   * @param {number} id - ID của tuyến đường
   * @returns {Promise<Object|null>} Thông tin tuyến đường hoặc null
   */
  static async findById(id) {
    console.log('🔷 MODEL: Tìm tuyến đường theo ID:', id);
    const [rows] = await pool.query('SELECT * FROM routes WHERE id = ?', [id]);
    
    const route = rows[0] || null;
    console.log(route ? '✅ MODEL: Tìm thấy tuyến đường' : '❌ MODEL: Không tìm thấy tuyến đường');
    return route;
  }

  /**
   * Lấy tuyến đường theo tên
   * @param {string} routeName - Tên tuyến đường
   * @returns {Promise<Object|null>} Thông tin tuyến đường hoặc null
   */
  static async findByName(routeName) {
    console.log('🔷 MODEL: Tìm tuyến đường theo tên:', routeName);
    const [rows] = await pool.query('SELECT * FROM routes WHERE route_name = ?', [routeName]);
    return rows[0] || null;
  }

  /**
   * Lấy tuyến đường với danh sách điểm dừng
   * @param {number} id - ID của tuyến đường
   * @returns {Promise<Object|null>} Thông tin tuyến đường kèm điểm dừng
   */
  static async findWithStops(id) {
    console.log('🔷 MODEL: Lấy tuyến đường kèm điểm dừng, ID:', id);
    
    // Lấy thông tin tuyến
    const route = await this.findById(id);
    if (!route) {
      console.log('❌ MODEL: Không tìm thấy tuyến đường');
      return null;
    }

    // Lấy danh sách điểm dừng
    const [stops] = await pool.execute(`
      SELECT 
        rs.id,
        rs.stop_id,
        s.name,
        s.address,
        s.latitude,
        s.longitude,
        rs.stop_order,
        rs.student_pickup_count
      FROM route_stops rs
      INNER JOIN stops s ON rs.stop_id = s.id  
      WHERE rs.route_id = ?
      ORDER BY rs.stop_order ASC
    `, [id]);

    console.log(`✅ MODEL: Tìm thấy ${stops.length} điểm dừng`);
    
    return {
      ...route,
      stops
    };
  }

  /**
   * Lấy điểm đón/trả mặc định của tuyến
   * @param {number} id - ID của tuyến đường
   * @returns {Promise<Object>} Thông tin điểm đón và điểm trả
   */
  static async getPickupDropInfo(id) {
    console.log('🔷 MODEL: Lấy điểm đón/trả của tuyến ID:', id);
    
    // Điểm đầu (stop_order = 1)
    const [pickupStop] = await pool.execute(`
      SELECT s.id, s.name, s.address, rs.stop_order
      FROM route_stops rs
      INNER JOIN stops s ON rs.stop_id = s.id  
      WHERE rs.route_id = ? AND rs.stop_order = 1
      LIMIT 1
    `, [id]);
    
    // Điểm cuối (stop_order = 99)
    const [dropoffStop] = await pool.execute(`
      SELECT s.id, s.name, s.address, rs.stop_order
      FROM route_stops rs
      INNER JOIN stops s ON rs.stop_id = s.id  
      WHERE rs.route_id = ? AND rs.stop_order = 99
      LIMIT 1
    `, [id]);

    console.log('✅ MODEL: Lấy điểm đón/trả thành công');
    
    return {
      pickupStop: pickupStop[0] || null,
      dropoffStop: dropoffStop[0] || null
    };
  }

  /**
   * Tạo tuyến đường mới
   * @param {Object} routeData - Dữ liệu tuyến đường
   * @returns {Promise<Object>} Tuyến đường vừa tạo
   */
  static async create(routeData) {
    const { route_name, start_location, end_location, distance, duration, polyline, waypoints } = routeData;
    
    console.log('🔷 MODEL: Tạo tuyến đường mới trong database');
    console.log('📦 MODEL: Dữ liệu:', { route_name, start_location, end_location });
    
    const [result] = await pool.execute(
      'INSERT INTO routes (route_name, start_location, end_location, distance, duration, polyline, waypoints) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [route_name, start_location, end_location, distance || null, duration || null, polyline || null, waypoints || null]
    );
    
    console.log(`✅ MODEL: Insert thành công! insertId: ${result.insertId}`);
    
    // Lấy tuyến đường vừa tạo
    const newRoute = await this.findById(result.insertId);
    return newRoute;
  }

  /**
   * Cập nhật tuyến đường
   * @param {number} id - ID của tuyến đường
   * @param {Object} routeData - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Tuyến đường sau khi cập nhật
   */
  static async update(id, routeData) {
    const { route_name, start_location, end_location, distance, duration, polyline, waypoints } = routeData;
    
    console.log('🔷 MODEL: Cập nhật tuyến đường ID:', id);
    
    await pool.execute(
      'UPDATE routes SET route_name = ?, start_location = ?, end_location = ?, distance = ?, duration = ?, polyline = ?, waypoints = ? WHERE id = ?',
      [route_name, start_location, end_location, distance || null, duration || null, polyline || null, waypoints || null, id]
    );
    
    console.log('✅ MODEL: Cập nhật thành công');
    
    // Lấy tuyến đường sau khi cập nhật
    const updatedRoute = await this.findById(id);
    return updatedRoute;
  }

  /**
   * Xóa tuyến đường
   * @param {number} id - ID của tuyến đường
   * @returns {Promise<boolean>} True nếu xóa thành công
   */
  static async delete(id) {
    console.log('🔷 MODEL: Xóa tuyến đường ID:', id);
    const [result] = await pool.execute('DELETE FROM routes WHERE id = ?', [id]);
    
    const deleted = result.affectedRows > 0;
    console.log(deleted ? '✅ MODEL: Xóa thành công' : '❌ MODEL: Không tìm thấy để xóa');
    return deleted;
  }

  /**
   * Thêm điểm dừng vào tuyến
   * @param {number} routeId - ID của tuyến đường
   * @param {number} stopId - ID của điểm dừng
   * @param {number} stopOrder - Thứ tự điểm dừng
   * @param {number} studentPickupCount - Số học sinh đón tại điểm này
   * @returns {Promise<Object>} Kết quả insert
   */
  static async addStop(routeId, stopId, stopOrder, studentPickupCount = 0) {
    console.log('🔷 MODEL: Thêm điểm dừng vào tuyến');
    
    const [result] = await pool.execute(
      'INSERT INTO route_stops (route_id, stop_id, stop_order, student_pickup_count) VALUES (?, ?, ?, ?)',
      [routeId, stopId, stopOrder, studentPickupCount]
    );
    
    console.log('✅ MODEL: Thêm điểm dừng thành công');
    return result;
  }

  /**
   * Xóa điểm dừng khỏi tuyến
   * @param {number} routeStopId - ID của route_stop
   * @returns {Promise<boolean>} True nếu xóa thành công
   */
  static async removeStop(routeStopId) {
    console.log('🔷 MODEL: Xóa điểm dừng khỏi tuyến');
    
    const [result] = await pool.execute('DELETE FROM route_stops WHERE id = ?', [routeStopId]);
    
    const deleted = result.affectedRows > 0;
    console.log(deleted ? '✅ MODEL: Xóa điểm dừng thành công' : '❌ MODEL: Không tìm thấy để xóa');
    return deleted;
  }

  /**
   * Kiểm tra tuyến đường có tồn tại không
   * @param {number} id - ID của tuyến đường
   * @returns {Promise<boolean>} True nếu tồn tại
   */
  static async exists(id) {
    const [rows] = await pool.query('SELECT id FROM routes WHERE id = ?', [id]);
    return rows.length > 0;
  }
}

export default RouteModel;
