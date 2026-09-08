// models/TripSimulation.js
// Lưu trạng thái mô phỏng để khôi phục sau khi server restart

import pool from '../config/db.js';

/**
 * TripSimulationModel
 * - Lưu/xóa/đọc checkpoint mô phỏng (`trip_simulations`) để backend có thể
 *   khôi phục các chuyến đang tạm dừng hoặc đang chạy sau khi restart.
 * - KHÔNG phải là lịch sử vị trí chi tiết; chỉ dùng cho resume/restore.
 */
class TripSimulationModel {
  /**
   * Normalize cutoff input (Date or MySQL datetime string). Trả về Date.
   */
  static _normalizeCutoff(cutoff) {
    if (cutoff instanceof Date && !Number.isNaN(cutoff.getTime())) {
      return cutoff;
    }

    if (typeof cutoff === 'string' && cutoff.trim()) {
      const parsed = new Date(cutoff);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  static async upsert(state) {
    const {
      trip_id,
      route_id,
      status,
      current_stop_index,
      current_lat,
      current_lng,
      segment_index,
      segment_elapsed_ms,
      pending_stop_indices,
      speed_mps
    } = state;

    await pool.execute(
      `INSERT INTO trip_simulations
        (trip_id, route_id, status, current_stop_index, current_lat, current_lng,
         segment_index, segment_elapsed_ms, pending_stop_indices, speed_mps, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         route_id = VALUES(route_id),
         status = VALUES(status),
         current_stop_index = VALUES(current_stop_index),
         current_lat = VALUES(current_lat),
         current_lng = VALUES(current_lng),
         segment_index = VALUES(segment_index),
         segment_elapsed_ms = VALUES(segment_elapsed_ms),
         pending_stop_indices = VALUES(pending_stop_indices),
         speed_mps = VALUES(speed_mps),
         updated_at = NOW()`
      , [
        trip_id,
        route_id,
        status,
        current_stop_index,
        current_lat,
        current_lng,
        segment_index,
        segment_elapsed_ms,
        pending_stop_indices,
        speed_mps
      ]
    );
  }

  static async findActive() {
    // Lấy các checkpoint đang active để restore khi server khởi động lại
    const [rows] = await pool.execute(
      `SELECT * FROM trip_simulations WHERE status IN ('in_progress', 'paused')`
    );
    return rows;
  }

  static async findByTripId(trip_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM trip_simulations WHERE trip_id = ? LIMIT 1`,
      [trip_id]
    );
    return rows[0] || null;
  }

  static async deleteByTripId(trip_id) {
    const [result] = await pool.execute(
      `DELETE FROM trip_simulations WHERE trip_id = ?`,
      [trip_id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Xóa các checkpoint 'in_progress' hoặc 'paused' cũ hơn `cutoff`.
   * Mục đích: tránh xóa toàn bộ active rows; chỉ dọn simulation mồ côi.
   */
  static async cleanupStaleActive(cutoff) {
    const normalizedCutoff = this._normalizeCutoff(cutoff);
    const [result] = await pool.execute(
      `DELETE FROM trip_simulations
       WHERE status IN ('in_progress', 'paused')
         AND updated_at < ?`,
      [normalizedCutoff]
    );
    return result.affectedRows || 0;
  }

  static async deleteAllActive() {
    return this.cleanupStaleActive();
  }
}

export default TripSimulationModel;
