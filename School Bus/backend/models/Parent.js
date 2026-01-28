// models/Parent.js
// Database access layer cho Parent (Phụ huynh)

import pool from '../config/db.js';

class ParentModel {
  /**
   * Lấy tất cả phụ huynh với thông tin con cái
   * @returns {Promise<Array>} Danh sách phụ huynh
   */
  static async findAll() {
    console.log(' MODEL: Lấy tất cả phụ huynh từ database');
    const [rows] = await pool.execute(`
      SELECT p.id, p.name, 
             COALESCE(u.email, 'Chưa có') AS email, 
             COALESCE(u.username, '') AS username, 
             p.phone, p.address, p.relationship, 
             'active' AS status,
             COUNT(s.id) AS children_count, 
             GROUP_CONCAT(s.name SEPARATOR ', ') AS children_names
      FROM parents p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN students s ON p.id = s.parent_id
      GROUP BY p.id, p.name, u.email, u.username, p.phone, p.address, p.relationship
      ORDER BY p.id DESC
    `);
    
    console.log(` MODEL: Tìm thấy ${rows.length} phụ huynh`);
    return rows;
  }

  /**
   * Lấy phụ huynh theo ID
   * @param {number} id - ID của phụ huynh
   * @returns {Promise<Object|null>} Thông tin phụ huynh hoặc null
   */
  static async findById(id) {
    console.log(' MODEL: Tìm phụ huynh theo ID:', id);
    const [rows] = await pool.execute(`
      SELECT p.id, p.name, 
             COALESCE(u.email, 'Chưa có') AS email, 
             COALESCE(u.username, '') AS username, 
             p.phone, p.address, p.relationship, 
             'active' AS status, p.user_id
      FROM parents p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE p.id = ?
    `, [id]);
    
    const parent = rows[0] || null;
    console.log(parent ? ' MODEL: Tìm thấy phụ huynh' : ' MODEL: Không tìm thấy phụ huynh');
    return parent;
  }

  /**
   * Lấy phụ huynh theo user_id
   * @param {number} userId - ID của user
   * @returns {Promise<Object|null>} Thông tin phụ huynh hoặc null
   */
  // static async findByUserId(userId) {
  
  //   const [rows] = await pool.execute(
  //     'SELECT * FROM parents WHERE user_id = ?',
  //     [userId]
  //   );
    
  //   const parent = rows[0] || null;
  //   console.log(parent ? ' MODEL: Tìm thấy phụ huynh' : ' MODEL: Không tìm thấy phụ huynh');
  //   return parent;
  // }

  /**
   * Lấy student đầu tiên của parent theo user_id (dùng cho login)
   * @param {number} userId - ID của user
   * @returns {Promise<Object|null>} Thông tin student đầu tiên hoặc null
   */
  static async findStudentByUserId(userId) {
    console.log('MODEL: Tìm student của parent với user_id:', userId);
    const [rows] = await pool.execute(`
      SELECT s.id AS student_id, s.name AS student_name, 
             s.morning_route_id, s.afternoon_route_id,
             p.id AS parent_id, p.name AS parent_name
      FROM parents p
      JOIN students s ON s.parent_id = p.id
      WHERE p.user_id = ?
      ORDER BY s.id ASC
      LIMIT 1
    `, [userId]);
    
    const result = rows[0] || null;
    console.log(result ? `MODEL: Tìm thấy student ${result.student_name}` : 'MODEL: Không tìm thấy student');
    return result;
  }

  /**
   * Lấy phụ huynh theo số điện thoại
   * @param {string} phone - Số điện thoại
   * @returns {Promise<Object|null>} Thông tin phụ huynh hoặc null
   */
  static async findByPhone(phone) {
    console.log(' MODEL: Tìm phụ huynh theo số điện thoại');
    const [rows] = await pool.execute(
      'SELECT * FROM parents WHERE phone = ?',
      [phone]
    );
    return rows[0] || null;
  }

  /**
   * Lấy phụ huynh kèm danh sách con
   * @param {number} id - ID của phụ huynh
   * @returns {Promise<Object|null>} Thông tin phụ huynh kèm danh sách con
   */
  static async findWithChildren(id) {
    console.log(' MODEL: Lấy phụ huynh kèm danh sách con, ID:', id);
    
    // Lấy thông tin phụ huynh
    const parent = await this.findById(id);
    if (!parent) {
      console.log(' MODEL: Không tìm thấy phụ huynh');
      return null;
    }

    // Lấy danh sách con
    const [children] = await pool.execute(`
      SELECT s.id,
             s.name,
             s.grade,
             s.class_id,
             c.class_name,
             s.morning_route_id,
             mr.route_name AS morning_route_name,
             s.afternoon_route_id,
             ar.route_name AS afternoon_route_name,
             s.morning_pickup_stop_id,
             s.afternoon_dropoff_stop_id,
             s.status
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN routes mr ON s.morning_route_id = mr.id
      LEFT JOIN routes ar ON s.afternoon_route_id = ar.id
      WHERE s.parent_id = ?
      ORDER BY s.name ASC
    `, [id]);

    console.log(` MODEL: Tìm thấy ${children.length} học sinh`);
    
    return {
      ...parent,
      children
    };
  }

  /**
   * Tạo phụ huynh mới
   * @param {Object} parentData - Dữ liệu phụ huynh
   * @returns {Promise<Object>} Phụ huynh vừa tạo
   */
  static async create(parentData) {
    const { name, phone, address, relationship = 'Cha/Mẹ', user_id } = parentData;
    
    console.log(' MODEL: Tạo phụ huynh mới trong database');
    console.log(' MODEL: Dữ liệu:', { name, phone, relationship });
    
    const [result] = await pool.execute(
      'INSERT INTO parents (name, phone, address, relationship, user_id) VALUES (?, ?, ?, ?, ?)',
      [name, phone, address || null, relationship, user_id || null]
    );
    
    console.log(` MODEL: Insert thành công! insertId: ${result.insertId}`);
    
    // Lấy phụ huynh vừa tạo
    const newParent = await this.findById(result.insertId);
    return newParent;
  }

  /**
   * Cập nhật phụ huynh
   * @param {number} id - ID của phụ huynh
   * @param {Object} parentData - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Phụ huynh sau khi cập nhật
   */
  static async update(id, parentData) {
    const { name, phone, address, relationship, user_id } = parentData;
    
    console.log(' MODEL: Cập nhật phụ huynh ID:', id);
    
    await pool.execute(
      'UPDATE parents SET name = ?, phone = ?, address = ?, relationship = ?, user_id = ? WHERE id = ?',
      [name, phone, address || null, relationship, user_id || null, id]
    );
    
    console.log(' MODEL: Cập nhật thành công');
    
    // Lấy phụ huynh sau khi cập nhật
    const updatedParent = await this.findById(id);
    return updatedParent;
  }

  /**
   * Xóa phụ huynh
   * @param {number} id - ID của phụ huynh
   * @returns {Promise<boolean>} True nếu xóa thành công
   */
  static async delete(id) {
    console.log(' MODEL: Xóa phụ huynh ID:', id);
    const [result] = await pool.execute('DELETE FROM parents WHERE id = ?', [id]);
    
    const deleted = result.affectedRows > 0;
    console.log(deleted ? ' MODEL: Xóa thành công' : ' MODEL: Không tìm thấy để xóa');
    return deleted;
  }

  /**
   * Kiểm tra phụ huynh có tồn tại không
   * @param {number} id - ID của phụ huynh
   * @returns {Promise<boolean>} True nếu tồn tại
   */
  static async exists(id) {
    const [rows] = await pool.execute('SELECT id FROM parents WHERE id = ?', [id]);
    return rows.length > 0;
  }

  /**
   * Lấy thông báo của phụ huynh (từ con)
   * @param {number} parentId - ID của phụ huynh
   * @returns {Promise<Array>} Danh sách thông báo
   */
  static async getNotifications(parentId) {
    console.log(' MODEL: Lấy thông báo của phụ huynh ID:', parentId);
    
    const [rows] = await pool.execute(`
      SELECT n.*, s.name AS student_name
      FROM notifications n
      JOIN students s ON n.student_id = s.id
      WHERE s.parent_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [parentId]);
    
    console.log(` MODEL: Tìm thấy ${rows.length} thông báo`);
    return rows;
  }
}

export default ParentModel;
