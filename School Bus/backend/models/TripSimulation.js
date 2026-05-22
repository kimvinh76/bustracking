// models/TripSimulation.js
// Lưu trạng thái mô phỏng để khôi phục sau khi server restart

import pool from '../config/db.js';

class TripSimulationModel {
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

  static async deleteAllActive() {
    const [result] = await pool.execute(
      `DELETE FROM trip_simulations WHERE status IN ('in_progress', 'paused')`
    );
    return result.affectedRows || 0;
  }
}

export default TripSimulationModel;
