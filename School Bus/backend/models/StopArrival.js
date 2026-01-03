// models/StopArrival.js
// Quản lý ETA và trạng thái tại từng điểm dừng của schedule

import pool from '../config/db.js';

class StopArrival {
  static async create(data) {
    const { schedule_id, stop_id, stop_order, scheduled_time } = data;
    const [result] = await pool.execute(
      `INSERT INTO stop_arrivals (schedule_id, stop_id, stop_order, scheduled_time, arrival_status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [schedule_id, stop_id, stop_order, scheduled_time]
    );
    return { id: result.insertId, ...data, arrival_status: 'pending' };
  }

  static async findBySchedule(schedule_id) {
    const [rows] = await pool.execute(
      `SELECT sa.*, s.name AS stop_name, s.latitude, s.longitude
       FROM stop_arrivals sa
       JOIN stops s ON sa.stop_id = s.id
       WHERE sa.schedule_id = ?
       ORDER BY sa.stop_order ASC`,
      [schedule_id]
    );
    return rows;
  }

  static async updateETA(schedule_id, stop_id, estimated_arrival_time, distance_remaining = null) {
    await pool.execute(
      `UPDATE stop_arrivals
       SET estimated_arrival_time = ?, distance_remaining = ?, updated_at = CURRENT_TIMESTAMP
       WHERE schedule_id = ? AND stop_id = ?`,
      [estimated_arrival_time, distance_remaining, schedule_id, stop_id]
    );
  }

  static async updateStatus(schedule_id, stop_id, status) {
    await pool.execute(
      `UPDATE stop_arrivals
       SET arrival_status = ?,
           actual_arrival_time = IF(? = 'arrived', NOW(), actual_arrival_time),
           actual_departure_time = IF(? = 'departed', NOW(), actual_departure_time),
           updated_at = CURRENT_TIMESTAMP
       WHERE schedule_id = ? AND stop_id = ?`,
      [status, status, status, schedule_id, stop_id]
    );
  }
}

export default StopArrival;
