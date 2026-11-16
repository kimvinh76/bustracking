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

  static async create({ name, address = '', latitude, longitude, status = 'active' }) {
    const [result] = await pool.execute(
      'INSERT INTO stops (name, address, latitude, longitude, status) VALUES (?, ?, ?, ?, ?)',
      [name, address, latitude, longitude, status]
    );
    return this.findById(result.insertId);
  }

  static async update(id, { name, address, latitude, longitude, status }) {
    await pool.execute(
      `UPDATE stops
       SET name = COALESCE(?, name),
           address = COALESCE(?, address),
           latitude = COALESCE(?, latitude),
           longitude = COALESCE(?, longitude),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [name ?? null, address ?? null, latitude ?? null, longitude ?? null, status ?? null, id]
    );
    return this.findById(id);
  }

  static async findRouteIdsByStopId(stopId) {
    const [rows] = await pool.execute(
      'SELECT DISTINCT route_id FROM route_stops WHERE stop_id = ?',
      [stopId]
    );
    return rows.map((r) => r.route_id);
  }

  static async countReferences(stopId) {
    const [[routeRef]] = await pool.execute(
      'SELECT COUNT(DISTINCT route_id) AS cnt FROM route_stops WHERE stop_id = ?',
      [stopId]
    );
    const [[studentRef]] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM student_route_subscriptions WHERE stop_id = ?',
      [stopId]
    );
    return {
      routeCount: Number(routeRef?.cnt || 0),
      studentCount: Number(studentRef?.cnt || 0),
    };
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM stops WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export default StopModel;
