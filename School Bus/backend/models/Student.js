// ===================================
// MODEL: STUDENT
// ===================================
// Xử lý truy vấn database phức tạp với JOIN và bảng trung gian (RESTful)
// ===================================

import pool from '../config/db.js';

class StudentModel {
  /**
   * Query cơ bản để lấy thông tin học sinh đầy đủ (với JOIN)
   * Không còn JOIN bảng routes/stops trực tiếp, sẽ dùng hàm riêng để gán subscriptions
   */
  static getBaseStudentQuery() {
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
        p.relationship
      FROM students s
      LEFT JOIN parents p ON s.parent_id = p.id
      LEFT JOIN classes c ON s.class_id = c.id
    `;
  }

  /**
   * Hàm helper để lấy danh sách tuyến đường đã đăng ký của học sinh
   */
  static async getStudentSubscriptions(studentIds) {
    if (!studentIds || studentIds.length === 0) return [];
    
    // Tạo chuỗi ?, ?, ? để truyền vào query IN (...)
    const placeholders = studentIds.map(() => '?').join(',');
    
    const query = `
      SELECT 
        sub.student_id,
        sub.shift_type,
        sub.route_id,
        sub.stop_id,
        r.route_name,
        s.name AS stop_name,
        s.address AS stop_address
      FROM student_route_subscriptions sub
      LEFT JOIN routes r ON sub.route_id = r.id
      LEFT JOIN stops s ON sub.stop_id = s.id
      WHERE sub.student_id IN (${placeholders}) AND sub.status = 'active'
    `;
    
    const [rows] = await pool.execute(query, studentIds);
    return rows;
  }

  /**
   * Đính kèm subscriptions vào mảng học sinh
   */
  static attachSubscriptionsToStudents(students, subscriptions) {
    return students.map(student => {
      // Tìm các sub của student này
      const subs = subscriptions.filter(sub => sub.student_id === student.id);
      return {
        ...student,
        subscriptions: subs.map(s => ({
          shift_type: s.shift_type,
          route_id: s.route_id,
          stop_id: s.stop_id,
          route_name: s.route_name,
          stop_name: s.stop_name,
          stop_address: s.stop_address
        }))
      };
    });
  }

  /**
   * Lấy tất cả học sinh (active)
   */
  static async findAll() {
    const query = this.getBaseStudentQuery() + `
      WHERE s.status = 'active'
      ORDER BY s.id DESC
    `;
    
    const [students] = await pool.execute(query);
    if (students.length === 0) return [];
    
    const studentIds = students.map(s => s.id);
    const subscriptions = await this.getStudentSubscriptions(studentIds);
    
    return this.attachSubscriptionsToStudents(students, subscriptions);
  }

  /**
   * Lấy học sinh theo ID
   */
  static async findById(id) {
    const query = this.getBaseStudentQuery() + `
      WHERE s.id = ? AND s.status = 'active'
      LIMIT 1
    `;
    
    const [students] = await pool.execute(query, [id]);
    if (students.length === 0) return null;
    
    const subscriptions = await this.getStudentSubscriptions([id]);
    const studentsWithSubs = this.attachSubscriptionsToStudents(students, subscriptions);
    
    return studentsWithSubs[0];
  }

  /**
   * Lấy học sinh theo lớp
   */
  static async findByClass(className) {
    const query = this.getBaseStudentQuery() + `
      WHERE s.class = ? AND s.status = 'active'
      ORDER BY s.name
    `;
    
    const [students] = await pool.execute(query, [className]);
    if (students.length === 0) return [];
    
    const studentIds = students.map(s => s.id);
    const subscriptions = await this.getStudentSubscriptions(studentIds);
    
    return this.attachSubscriptionsToStudents(students, subscriptions);
  }

  /**
   * Lấy học sinh theo tuyến đường
   */
  static async findByRoute(routeId, timeOfDay = 'morning') {
    // JOIN trực tiếp với bảng subscriptions để tìm
    const query = this.getBaseStudentQuery() + `
      INNER JOIN student_route_subscriptions sub ON s.id = sub.student_id
      WHERE sub.route_id = ? AND sub.shift_type = ? AND sub.status = 'active' AND s.status = 'active'
      ORDER BY s.name
    `;
    
    const [students] = await pool.execute(query, [routeId, timeOfDay]);
    if (students.length === 0) return [];
    
    const studentIds = students.map(s => s.id);
    const subscriptions = await this.getStudentSubscriptions(studentIds);
    
    return this.attachSubscriptionsToStudents(students, subscriptions);
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
      subscriptions = [] // Mảng [{shift_type, route_id, stop_id}]
    } = studentData;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Tạo student
      const [result] = await connection.execute(
        `INSERT INTO students (
          name, grade, class_id, class, parent_id, phone, address, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          name,
          grade,
          class_id,
          class_name,
          parent_id || null,
          phone || null,
          address || null
        ]
      );
      
      const studentId = result.insertId;

      // 2. Tạo subscriptions
      if (subscriptions && subscriptions.length > 0) {
        for (const sub of subscriptions) {
          if (sub.route_id && sub.stop_id && sub.shift_type) {
            await connection.execute(
              `INSERT INTO student_route_subscriptions (student_id, route_id, stop_id, shift_type)
               VALUES (?, ?, ?, ?)`,
              [studentId, sub.route_id, sub.stop_id, sub.shift_type]
            );
          }
        }
      }

      await connection.commit();
      return await this.findById(studentId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
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
      subscriptions
    } = studentData;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Cập nhật student
      const [result] = await connection.execute(
        `UPDATE students SET
          name = ?, grade = ?, class_id = ?, class = ?,
          parent_id = ?, phone = ?, address = ?
        WHERE id = ?`,
        [
          name, grade, class_id, class_name,
          parent_id || null, phone || null, address || null,
          id
        ]
      );

      // 2. Cập nhật subscriptions (Chỉ cập nhật nếu client gửi array subscriptions lên)
      if (Array.isArray(subscriptions)) {
        // Xóa toàn bộ sub cũ
        await connection.execute(
          'DELETE FROM student_route_subscriptions WHERE student_id = ?',
          [id]
        );
        
        // Thêm sub mới
        for (const sub of subscriptions) {
          if (sub.route_id && sub.stop_id && sub.shift_type) {
            await connection.execute(
              `INSERT INTO student_route_subscriptions (student_id, route_id, stop_id, shift_type)
               VALUES (?, ?, ?, ?)`,
              [id, sub.route_id, sub.stop_id, sub.shift_type]
            );
          }
        }
      }

      await connection.commit();
      return await this.findById(id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Xóa học sinh (soft delete)
   */
  static async delete(id) {
    const [result] = await pool.execute(
      'UPDATE students SET status = ? WHERE id = ?',
      ['inactive', id]
    );
    
    // Optional: Có thể inactive cả subscriptions
    await pool.execute(
      'UPDATE student_route_subscriptions SET status = ? WHERE student_id = ?',
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
    const query = this.getBaseStudentQuery() + `
      WHERE s.name LIKE ? AND s.status = 'active'
      ORDER BY s.name
    `;
    
    const [students] = await pool.execute(query, [`%${searchTerm}%`]);
    if (students.length === 0) return [];
    
    const studentIds = students.map(s => s.id);
    const subscriptions = await this.getStudentSubscriptions(studentIds);
    
    return this.attachSubscriptionsToStudents(students, subscriptions);
  }
}

export default StudentModel;
