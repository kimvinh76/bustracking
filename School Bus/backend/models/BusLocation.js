// models/BusLocation.js
// Lưu lịch sử vị trí bus (tracking)

import pool from '../config/db.js';

/**
 * BusLocation
 * - Bảng `bus_locations` giữ lịch sử vị trí (audit/history) nếu cần phân tích
 *   sau này (playback, analytics, debugging). Không dùng cho realtime.
 * - Việc ghi vào bảng này là tùy chọn: nếu driver frontend passive không gửi
 *   dữ liệu thường xuyên thì bảng này sẽ ít/không có bản ghi.
 */
class BusLocation {
  static async create(data) {
    const { bus_id, driver_id, schedule_id = null, latitude, longitude } = data;
    const [result] = await pool.execute(
      `INSERT INTO bus_locations (bus_id, driver_id, schedule_id, latitude, longitude)
       VALUES (?, ?, ?, ?, ?)`,
      [bus_id, driver_id, schedule_id, latitude, longitude]
    );
    return { id: result.insertId, bus_id, driver_id, schedule_id, latitude, longitude };
  }

  static async findByBus(bus_id, limit = 200) {
    const [rows] = await pool.execute(
      `SELECT * FROM bus_locations WHERE bus_id = ? ORDER BY timestamp DESC LIMIT ?`,
      [bus_id, limit]
    );
    return rows;
  }

  static async findBySchedule(schedule_id, limit = 200) {
    const [rows] = await pool.execute(
      `SELECT * FROM bus_locations WHERE schedule_id = ? ORDER BY timestamp DESC LIMIT ?`,
      [schedule_id, limit]
    );
    return rows;
  }

  static async findLatest(bus_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM bus_locations WHERE bus_id = ? ORDER BY timestamp DESC LIMIT 1`,
      [bus_id]
    );
    return rows[0] || null;
  }

  static async deleteOlderThan(cutoffDate) {
    const [result] = await pool.execute(
      `DELETE FROM bus_locations WHERE timestamp < ?`,
      [cutoffDate]
    );
    return result.affectedRows;
  }
}

export default BusLocation;
