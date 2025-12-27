// ===================================
// MODEL: CLASS (Helper model)
// ===================================

import pool from '../config/db.js';

class ClassModel {
  /**
   * Lấy thông tin lớp học theo tên
   */
  static async findByName(className) {
    const [rows] = await pool.execute(
      'SELECT id, class_name, grade FROM classes WHERE class_name = ?',
      [className]
    );
    return rows[0] || null;
  }

  /**
   * Lấy tất cả lớp học
   */
  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM classes ORDER BY grade, class_name');
    return rows;
  }

  /**
   * Kiểm tra lớp có tồn tại
   */
  static async exists(className) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM classes WHERE class_name = ?',
      [className]
    );
    return rows[0].count > 0;
  }
}

export default ClassModel;
