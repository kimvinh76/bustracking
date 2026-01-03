// models/BusLocation.js
// Lưu lịch sử vị trí bus (tracking)

import pool from '../config/db.js';

class BusLocation {
  static async create(data) {
    const { bus_id, driver_id, schedule_id = null, latitude, longitude, speed = null, heading = null, accuracy = null } = data;
    const [result] = await pool.execute(
      `INSERT INTO bus_locations (bus_id, driver_id, schedule_id, latitude, longitude, speed, heading, accuracy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [bus_id, driver_id, schedule_id, latitude, longitude, speed, heading, accuracy]
    );
    return { id: result.insertId, ...data };
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
