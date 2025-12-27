// ===================================
// MODEL: STUDENT
// ===================================
// Xử lý truy vấn database phức tạp với JOIN
// ===================================

import pool from '../config/db.js';

class StudentModel {
  /**
   * Query cơ bản để lấy thông tin học sinh đầy đủ (với JOIN)
   */
  static getFullStudentQuery() {
    return `
      SELECT 
        s.id, s.name, s.grade, s.class_id, s.class, s.address, s.phone, s.status,
        
        -- Thông tin lớp học
        c.class_name,
        
        -- Thông tin phụ huynh
        s.parent_id,
        p.name AS parent_name, 
        p.phone AS parent_phone, 
        p.address AS parent_address, 
        p.relationship,
        
        -- Thông tin tuyến đường sáng
        s.morning_route_id,
        mr.route_name AS morning_route_name,
        
        -- Thông tin trạm đón sáng
        s.morning_pickup_stop_id,
        mps.name AS morning_pickup_stop_name,
        mps.address AS morning_pickup_stop_address,
        
        -- Thông tin tuyến đường chiều
        s.afternoon_route_id,
        ar.route_name AS afternoon_route_name,
        
        -- Thông tin trạm trả chiều
        s.afternoon_dropoff_stop_id,
        ads.name AS afternoon_dropoff_stop_name,
        ads.address AS afternoon_dropoff_stop_address
        
      FROM students s
      LEFT JOIN parents p ON s.parent_id = p.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN routes mr ON s.morning_route_id = mr.id
      LEFT JOIN routes ar ON s.afternoon_route_id = ar.id
      LEFT JOIN stops mps ON s.morning_pickup_stop_id = mps.id
      LEFT JOIN stops ads ON s.afternoon_dropoff_stop_id = ads.id
    `;
  }

  /**
   * Lấy tất cả học sinh (active)
   */
  static async findAll() {
    const query = this.getFullStudentQuery() + `
      WHERE s.status = 'active'
      ORDER BY s.id DESC
    `;
    
    const [rows] = await pool.execute(query);
    return rows;
  }

  /**
   * Lấy học sinh theo ID
   */
  static async findById(id) {
    const query = this.getFullStudentQuery() + `
      WHERE s.id = ? AND s.status = 'active'
      LIMIT 1
    `;
    
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Lấy học sinh theo lớp
   */
  static async findByClass(className) {
    const query = this.getFullStudentQuery() + `
      WHERE s.class = ? AND s.status = 'active'
      ORDER BY s.name
    `;
    
    const [rows] = await pool.execute(query, [className]);
    return rows;
  }

  /**
   * Lấy học sinh theo tuyến đường
   */
  static async findByRoute(routeId, timeOfDay = 'morning') {
    const routeField = timeOfDay === 'morning' 
      ? 's.morning_route_id' 
      : 's.afternoon_route_id';
    
    const query = this.getFullStudentQuery() + `
      WHERE ${routeField} = ? AND s.status = 'active'
      ORDER BY s.name
    `;
    
    const [rows] = await pool.execute(query, [routeId]);
    return rows;
  }

  /**
   * Tạo học sinh mới
   */
  static async create(studentData) {
    const {
      name,
      grade,
      class_id,
      class: class_name,
      parent_id,
      phone,
      address,
      morning_route_id,
      morning_pickup_stop_id,
      afternoon_route_id,
      afternoon_dropoff_stop_id
    } = studentData;

    const [result] = await pool.execute(
      `INSERT INTO students (
        name, grade, class_id, class, parent_id, phone, address,
        morning_route_id, morning_pickup_stop_id,
        afternoon_route_id, afternoon_dropoff_stop_id,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        name,
        grade,
        class_id,
        class_name,
        parent_id || null,
        phone || null,
        address || null,
        morning_route_id || null,
        morning_pickup_stop_id || null,
        afternoon_route_id || null,
        afternoon_dropoff_stop_id || null
      ]
    );

    return await this.findById(result.insertId);
  }

  /**
   * Cập nhật học sinh
   */
  static async update(id, studentData) {
    const {
      name,
      grade,
      class_id,
      class: class_name,
      parent_id,
      phone,
      address,
      morning_route_id,
      morning_pickup_stop_id,
      afternoon_route_id,
      afternoon_dropoff_stop_id
    } = studentData;

    const [result] = await pool.execute(
      `UPDATE students SET
        name = ?, grade = ?, class_id = ?, class = ?,
        parent_id = ?, phone = ?, address = ?,
        morning_route_id = ?, morning_pickup_stop_id = ?,
        afternoon_route_id = ?, afternoon_dropoff_stop_id = ?
      WHERE id = ?`,
      [
        name, grade, class_id, class_name,
        parent_id || null, phone || null, address || null,
        morning_route_id || null, morning_pickup_stop_id || null,
        afternoon_route_id || null, afternoon_dropoff_stop_id || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return await this.findById(id);
  }

  /**
   * Xóa học sinh (soft delete)
   */
  static async delete(id) {
    const [result] = await pool.execute(
      'UPDATE students SET status = ? WHERE id = ?',
      ['inactive', id]
    );
    
    return result.affectedRows > 0;
  }

  /**
   * Kiểm tra học sinh có tồn tại
   */
  static async exists(id) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM students WHERE id = ? AND status = "active"',
      [id]
    );
    return rows[0].count > 0;
  }

  /**
   * Tìm kiếm học sinh theo tên
   */
  static async searchByName(searchTerm) {
    const query = this.getFullStudentQuery() + `
      WHERE s.name LIKE ? AND s.status = 'active'
      ORDER BY s.name
    `;
    
    const [rows] = await pool.execute(query, [`%${searchTerm}%`]);
    return rows;
  }
}

export default StudentModel;
