import pool from '../config/db.js';

class StopModel {
  static async findAll() {
    console.log(' MODEL: Lấy tất cả trạm (stops) từ database');
    const [rows] = await pool.query('SELECT * FROM stops ORDER BY id ASC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM stops WHERE id = ?', [id]);
    return rows[0] || null;
  }
}

export default StopModel;
