// models/User.js
// Database access layer cho User (Người dùng)

import pool from '../config/db.js';

class UserModel {
  /**
   * Lấy tất cả người dùng
   * @returns {Promise<Array>} Danh sách người dùng
   */
  static async findAll() {
    console.log('🔷 MODEL: Lấy tất cả người dùng từ database');
    const [rows] = await pool.execute(
      'SELECT id, username, email, role, created_at FROM users ORDER BY id DESC'
    );
    
    console.log(` MODEL: Tìm thấy ${rows.length} người dùng`);
    return rows;
  }

  /**
   * Lấy người dùng theo ID
   * @param {number} id - ID của người dùng
   * @returns {Promise<Object|null>} Thông tin người dùng hoặc null
   */
  static async findById(id) {
    console.log('🔷 MODEL: Tìm người dùng theo ID:', id);
    const [rows] = await pool.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [id]
    );
    
    const user = rows[0] || null;
    console.log(user ? ' MODEL: Tìm thấy người dùng' : ' MODEL: Không tìm thấy người dùng');
    return user;
  }

  /**
   * Lấy người dùng theo email (bao gồm password để authentication)
   * @param {string} email - Email
   * @returns {Promise<Object|null>} Thông tin người dùng hoặc null
   */
  static async findByEmail(email) {
    console.log('🔷 MODEL: Tìm người dùng theo email:', email);
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    const user = rows[0] || null;
    console.log(user ? ' MODEL: Tìm thấy người dùng' : ' MODEL: Không tìm thấy người dùng');
    return user;
  }

  /**
   * Lấy người dùng theo username (bao gồm password để authentication)
   * @param {string} username - Username
   * @returns {Promise<Object|null>} Thông tin người dùng hoặc null
   */
  static async findByUsername(username) {
    console.log('🔷 MODEL: Tìm người dùng theo username:', username);
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    const user = rows[0] || null;
    console.log(user ? ' MODEL: Tìm thấy người dùng' : ' MODEL: Không tìm thấy người dùng');
    return user;
  }

  /**
   * Lấy người dùng theo email hoặc username
   * @param {string} identifier - Email hoặc username
   * @returns {Promise<Object|null>} Thông tin người dùng hoặc null
   */
  static async findByEmailOrUsername(identifier) {
    console.log('🔷 MODEL: Tìm người dùng theo email/username:', identifier);
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [identifier, identifier]
    );
    
    const user = rows[0] || null;
    console.log(user ? ' MODEL: Tìm thấy người dùng' : ' MODEL: Không tìm thấy người dùng');
    return user;
  }

  /**
   * Lấy người dùng theo role
   * @param {string} role - Role (admin, driver, parent)
   * @returns {Promise<Array>} Danh sách người dùng
   */
  static async findByRole(role) {
    console.log('🔷 MODEL: Lấy người dùng theo role:', role);
    const [rows] = await pool.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE role = ? ORDER BY id DESC',
      [role]
    );
    
    console.log(` MODEL: Tìm thấy ${rows.length} người dùng`);
    return rows;
  }

  /**
   * Tạo người dùng mới
   * @param {Object} userData - Dữ liệu người dùng
   * @returns {Promise<Object>} Người dùng vừa tạo
   */
  static async create(userData) {
    const { username, email, password, role = 'parent' } = userData;
    
    console.log('🔷 MODEL: Tạo người dùng mới trong database');
    console.log(' MODEL: Dữ liệu:', { username, email, role });
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, password, role]
    );
    
    console.log(` MODEL: Insert thành công! insertId: ${result.insertId}`);
    
    // Lấy người dùng vừa tạo (không có password)
    const newUser = await this.findById(result.insertId);
    return newUser;
  }

  /**
   * Cập nhật người dùng
   * @param {number} id - ID của người dùng
   * @param {Object} userData - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Người dùng sau khi cập nhật
   */
  static async update(id, userData) {
    const { username, email, role } = userData;
    
    console.log('🔷 MODEL: Cập nhật người dùng ID:', id);
    
    await pool.execute(
      'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
      [username, email, role, id]
    );
    
    console.log(' MODEL: Cập nhật thành công');
    
    // Lấy người dùng sau khi cập nhật
    const updatedUser = await this.findById(id);
    return updatedUser;
  }

  /**
   * Cập nhật mật khẩu
   * @param {number} id - ID của người dùng
   * @param {string} newPassword - Mật khẩu mới (đã hash)
   * @returns {Promise<boolean>} True nếu cập nhật thành công
   */
  static async updatePassword(id, newPassword) {
    console.log('🔷 MODEL: Cập nhật mật khẩu người dùng ID:', id);
    
    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPassword, id]
    );
    
    const updated = result.affectedRows > 0;
    console.log(updated ? ' MODEL: Cập nhật mật khẩu thành công' : ' MODEL: Không tìm thấy người dùng');
    return updated;
  }

  /**
   * Xóa người dùng
   * @param {number} id - ID của người dùng
   * @returns {Promise<boolean>} True nếu xóa thành công
   */
  static async delete(id) {
    console.log('🔷 MODEL: Xóa người dùng ID:', id);
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    
    const deleted = result.affectedRows > 0;
    console.log(deleted ? ' MODEL: Xóa thành công' : ' MODEL: Không tìm thấy để xóa');
    return deleted;
  }

  /**
   * Kiểm tra người dùng có tồn tại không
   * @param {number} id - ID của người dùng
   * @returns {Promise<boolean>} True nếu tồn tại
   */
  static async exists(id) {
    const [rows] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    return rows.length > 0;
  }

  /**
   * Kiểm tra email đã tồn tại chưa
   * @param {string} email - Email cần kiểm tra
   * @param {number} excludeId - ID cần loại trừ (khi update)
   * @returns {Promise<boolean>} True nếu đã tồn tại
   */
  static async emailExists(email, excludeId = null) {
    console.log('🔷 MODEL: Kiểm tra email đã tồn tại:', email);
    
    let query = 'SELECT id FROM users WHERE email = ?';
    const params = [email];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.execute(query, params);
    const exists = rows.length > 0;
    
    console.log(exists ? '⚠️ MODEL: Email đã tồn tại' : ' MODEL: Email hợp lệ');
    return exists;
  }

  /**
   * Kiểm tra username đã tồn tại chưa
   * @param {string} username - Username cần kiểm tra
   * @param {number} excludeId - ID cần loại trừ (khi update)
   * @returns {Promise<boolean>} True nếu đã tồn tại
   */
  static async usernameExists(username, excludeId = null) {
    console.log('🔷 MODEL: Kiểm tra username đã tồn tại:', username);
    
    let query = 'SELECT id FROM users WHERE username = ?';
    const params = [username];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const [rows] = await pool.execute(query, params);
    const exists = rows.length > 0;
    
    console.log(exists ? '⚠️ MODEL: Username đã tồn tại' : ' MODEL: Username hợp lệ');
    return exists;
  }
}

export default UserModel;
