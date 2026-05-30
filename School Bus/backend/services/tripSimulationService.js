// services/tripSimulationService.js
// Mô phỏng vị trí xe trên backend — một nguồn phát cho mọi client qua WebSocket

import axios from 'axios';
import RouteService from './routeService.js';
import ScheduleService from './scheduleService.js';
import TripSimulationModel from '../models/TripSimulation.js';
import BusLocation from '../models/BusLocation.js';

class TripSimulationService {
  constructor({ emitStatus }) {
    this.emitStatus = emitStatus;
    this.trips = new Map();
    this.persistIntervalMs = 5000;
    // Optional: enable writing history points into `bus_locations` to keep
    // a replayable trail. Controlled by env ENABLE_BUS_LOCATION_HISTORY=1
    // and BUS_LOCATION_HISTORY_INTERVAL_MS (ms)
    this.historyEnabled = process.env.ENABLE_BUS_LOCATION_HISTORY === '1';
    this.historyIntervalMs = Number(process.env.BUS_LOCATION_HISTORY_INTERVAL_MS) || 30_000;
  }

  async restoreActiveTrips() {
    // Khôi phục các checkpoint từ DB khi server khởi động lại.
    // Nếu một row không thể khôi phục (ví dụ route bị xóa), sẽ xóa row đó
    // để tránh retry vô hạn và tiếp tục restore các trip khác.
    const rows = await TripSimulationModel.findActive();
    for (const row of rows) {
      try {
        const tripState = await this._createTripState({
          tripId: String(row.trip_id),
          routeId: row.route_id,
          speedMetersPerSec: Number(row.speed_mps) || 15,
          restore: row
        });
        this.trips.set(tripState.tripId, tripState);

        if (tripState.currentPosition) {
          this.emitStatus(tripState.tripId, this._statusPayload(tripState));
        }
        if (!tripState.paused) {
          this._startTimer(tripState);
        }
      } catch (error) {
        console.warn(`Failed to restore trip ${row.trip_id}:`, error?.message || error);
        try {
          await TripSimulationModel.deleteByTripId(row.trip_id);
        } catch (cleanupError) {
          console.warn(`Failed to delete invalid trip checkpoint ${row.trip_id}:`, cleanupError?.message || cleanupError);
        }
      }
    }
  }

  async startTrip({ tripId, routeId, speedMetersPerSec = 15 }) {
    if (!tripId || !routeId) throw new Error('Thiếu tripId hoặc routeId');

    // Bắt đầu mô phỏng mới cho trip; nếu đã có in-memory simulation thì dừng nó.
    const existing = this.trips.get(String(tripId));
    if (existing) this._stopTimer(existing);

    const tripState = await this._createTripState({
      tripId: String(tripId),
      routeId,
      speedMetersPerSec,
      restore: null
    });
    this.trips.set(tripState.tripId, tripState);

    this.emitStatus(tripState.tripId, {
      ...this._statusPayload(tripState),
      isRunning: true,
      driverStatus: 'in_progress'
    });

    // Ghi checkpoint ngay khi start (force=true) để có thể resume nếu crash ngay.
    this._persistState(tripState, 'in_progress', true).catch(() => {});
    this._startTimer(tripState);
  }

  pauseTrip(tripId) {
    const trip = this.trips.get(String(tripId));
    if (!trip || trip.completed || trip.paused) return;

    // Đánh dấu tạm dừng và persist checkpoint ngay lập tức.
    trip.paused = true;
    this._stopTimer(trip);
    this.emitStatus(tripId, { isRunning: false, driverStatus: 'paused', currentStopIndex: trip.currentStopIndex });
    this._persistState(trip, 'paused', true).catch(() => {});
  }

  resumeTrip(tripId) {
    const trip = this.trips.get(String(tripId));
    if (!trip || trip.completed || !trip.paused) return;

    // Resume mô phỏng từ checkpoint in-memory; persist để cập nhật status.
    trip.paused = false;
    trip.lastTickAt = Date.now();
    this.emitStatus(tripId, { isRunning: true, driverStatus: 'in_progress', currentStopIndex: trip.currentStopIndex });
    this._persistState(trip, 'in_progress', true).catch(() => {});
    this._startTimer(trip);
  }

  stopTrip(tripId) {
    const trip = this.trips.get(String(tripId));
    if (!trip) return;

    // Kết thúc chuyến: dừng timer, phát sự kiện completed và final cleanup.
    trip.completed = true;
    trip.paused = false;
    this._stopTimer(trip);

    const lastPos = trip.coords[trip.coords.length - 1];
    this.emitStatus(tripId, {
      isRunning: false,
      driverStatus: 'completed',
      currentStopIndex: trip.stops.length - 1,
      currentPosition: lastPos
    });
    this._finalizeTrip(trip).catch(() => {});
  }

  /** Dừng mọi simulation trong RAM (khi reset schedule stale). */
  stopAllInMemory() {
    for (const tripId of [...this.trips.keys()]) {
      const trip = this.trips.get(tripId);
      if (trip) this._stopTimer(trip);
      this.trips.delete(tripId);
    }
  }

  async _createTripState({ tripId, routeId, speedMetersPerSec, restore }) {
    // Tải geometri tuyến (có thể sử dụng OSRM) — đây là nơi COSTy có thể xảy ra.
    // Sau này nên cache geometry theo `route_id` để tránh gọi OSRM mỗi lần.
    const { stops, coords, segments, speed } = await this._loadRouteGeometry(routeId, speedMetersPerSec);

    const pendingStopIndices = this._parsePendingIndices(restore?.pending_stop_indices, stops.length);
    const segmentIndex = restore ? Number(restore.segment_index) || 0 : 0;
    const segmentElapsedMs = restore ? Number(restore.segment_elapsed_ms) || 0 : 0;
    const currentStopIndex = restore ? Number(restore.current_stop_index) || 0 : 0;
    const paused = restore ? restore.status === 'paused' : false;

    let currentPosition = coords[0];
    if (restore?.current_lat != null && restore?.current_lng != null) {
      currentPosition = { lat: Number(restore.current_lat), lng: Number(restore.current_lng) };
    }

    let busId = null;
    let driverId = null;
    const scheduleIdNum = Number(tripId);
    if (Number.isFinite(scheduleIdNum)) {
      try {
        const schedule = await ScheduleService.getScheduleById(scheduleIdNum);
        busId = schedule?.bus_id ?? null;
        driverId = schedule?.driver_id ?? null;
      } catch (error) {
        console.warn('TripSimulationService: failed to load schedule for history:', error?.message || error);
      }
    }

    return {
      tripId: String(tripId),
      // store schedule id for history association
      scheduleId: Number(tripId),
      busId,
      driverId,
      routeId,
      stops,
      coords,
      segments,
      speedMetersPerSec: speed,
      segmentIndex,
      segmentElapsedMs,
      currentStopIndex,
      pendingStopIndices,
      paused,
      completed: false,
      lastTickAt: Date.now(),
      lastPersistAt: restore ? Date.now() : 0,
      lastHistoryAt: 0,
      currentPosition,
      timer: null
    };
  }

  async _loadRouteGeometry(routeId, speedMetersPerSec) {
    // Lấy thông tin tuyến kèm danh sách stop từ DB (RouteService)
    const route = await RouteService.getRouteWithStops(routeId);
    const stops = (route?.stops || []).map((s) => ({
      id: s.id,
      lat: Number(s.latitude),
      lng: Number(s.longitude)
    }));

    if (stops.length < 2) throw new Error('Cần ít nhất 2 điểm dừng để mô phỏng');

    const waypoints = stops.map((s) => ({ lat: s.lat, lng: s.lng }));
    // Dò đường chi tiết theo waypoints (gọi OSRM nếu cần). Kết quả nên được cache.
    const coords = await this._resolveRouteCoords(waypoints);
    const speed = Number.isFinite(speedMetersPerSec) && speedMetersPerSec > 0 ? speedMetersPerSec : 15;

    return { stops, coords, segments: this._buildSegments(coords, speed), speed };
  }

  _parsePendingIndices(raw, stopCount) {
    let pending = [];
    if (raw) {
      try {
        pending = JSON.parse(raw);
      } catch {
        pending = [];
      }
    }
    if (pending.length === 0 && stopCount > 2) {
      pending = Array.from({ length: stopCount - 2 }, (_, i) => i + 1);
    }
    return pending;
  }

  _statusPayload(trip) {
    return {
      isRunning: !trip.paused && !trip.completed,
      driverStatus: trip.completed ? 'completed' : (trip.paused ? 'paused' : 'in_progress'),
      currentStopIndex: trip.currentStopIndex,
      currentPosition: trip.currentPosition
    };
  }

  _startTimer(trip) {
    if (trip.timer) return;
    trip.timer = setInterval(() => this._tick(trip), 1000);
  }

  _stopTimer(trip) {
    if (trip.timer) {
      clearInterval(trip.timer);
      trip.timer = null;
    }
  }

  _tick(trip) {
    if (trip.paused || trip.completed) return;

    const now = Date.now();
    let deltaMs = now - trip.lastTickAt;
    trip.lastTickAt = now;

    while (deltaMs > 0 && trip.segmentIndex < trip.segments.length) {
      const segment = trip.segments[trip.segmentIndex];
      const remaining = segment.durationMs - trip.segmentElapsedMs;

      if (deltaMs < remaining) {
        trip.segmentElapsedMs += deltaMs;
        deltaMs = 0;
      } else {
        deltaMs -= remaining;
        trip.segmentIndex += 1;
        trip.segmentElapsedMs = 0;
      }
    }

    if (trip.segmentIndex >= trip.segments.length) {
      trip.completed = true;
      this._stopTimer(trip);
      const finalPos = trip.coords[trip.coords.length - 1];
      this.emitStatus(trip.tripId, {
        isRunning: false,
        driverStatus: 'completed',
        currentStopIndex: trip.stops.length - 1,
        currentPosition: finalPos
      });
      this._finalizeTrip(trip).catch(() => {});
      return;
    }

    const segment = trip.segments[trip.segmentIndex];
    const progress = segment.durationMs > 0
      ? Math.min(trip.segmentElapsedMs / segment.durationMs, 1)
      : 1;

    const currentPos = {
      lat: segment.from.lat + (segment.to.lat - segment.from.lat) * progress,
      lng: segment.from.lng + (segment.to.lng - segment.from.lng) * progress
    };
    trip.currentPosition = currentPos;

    const pending = trip.pendingStopIndices;
    if (pending.length > 0) {
      const nextStopIdx = pending[0];
      const stop = trip.stops[nextStopIdx];
      if (stop && this._distanceMeters(currentPos, stop) < 50) {
        trip.paused = true;
        trip.currentStopIndex = nextStopIdx;
        trip.pendingStopIndices = pending.slice(1);
        this._stopTimer(trip);
        this.emitStatus(trip.tripId, {
          isRunning: false,
          driverStatus: 'paused',
          currentStopIndex: nextStopIdx,
          currentPosition: currentPos
        });
        this._persistState(trip, 'paused', true).catch(() => {});
        return;
      }
    }

    this.emitStatus(trip.tripId, {
      isRunning: true,
      driverStatus: 'in_progress',
      currentStopIndex: trip.currentStopIndex,
      currentPosition: currentPos
    });
    this._persistState(trip, 'in_progress', false).catch(() => {});
  }

  _buildSegments(coords, speedMetersPerSec) {
    const segments = [];
    for (let i = 0; i < coords.length - 1; i++) {
      const from = coords[i];
      const to = coords[i + 1];
      const distance = this._distanceMeters(from, to);
      const durationMs = distance > 0 ? (distance / speedMetersPerSec) * 1000 : 1;
      segments.push({ from, to, distance, durationMs });
    }
    return segments;
  }

  async _resolveRouteCoords(waypoints) {
    try {
      // Gọi OSRM public để lấy đường đi. Nếu fail sẽ fallback về straight waypoints.
      const coordsStr = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join(';');
      const url = `http://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
      const response = await axios.get(url);
      const coordinates = response?.data?.routes?.[0]?.geometry?.coordinates;
      if (!coordinates?.length) throw new Error('No routes found');
      return coordinates.map((c) => ({ lat: c[1], lng: c[0] }));
    } catch {
      // OSRM lỗi -> dùng trực tiếp waypoints (thẳng giữa các stop)
      return waypoints;
    }
  }

  _distanceMeters(a, b) {
    const R = 6371000;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const dLat = lat2 - lat1;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  async _finalizeTrip(trip) {
    // Khi chuyến hoàn thành: cập nhật trạng thái schedule và xóa checkpoint.
    await this._markScheduleCompleted(trip.tripId);
    await this._clearSimulation(trip);
  }

  async _markScheduleCompleted(tripId) {
    const id = Number(tripId);
    if (!Number.isFinite(id)) return;
    try {
      await ScheduleService.updateScheduleStatus(id, 'completed', null, null);
    } catch (error) {
      console.warn(`Schedule ${id} complete sync failed:`, error?.message || error);
    }
  }

  async _clearSimulation(trip) {
    const tripIdNum = Number(trip.tripId);
    this._stopTimer(trip);
    this.trips.delete(trip.tripId);
    if (Number.isFinite(tripIdNum)) {
      try {
        await TripSimulationModel.deleteByTripId(tripIdNum);
      } catch (error) {
        console.warn('Trip simulation cleanup failed:', error?.message || error);
      }
    }
  }

  async _persistState(trip, status, force) {
    const now = Date.now();
    if (!force && now - trip.lastPersistAt < this.persistIntervalMs) return;
    trip.lastPersistAt = now;

    const tripIdNum = Number(trip.tripId);
    const routeIdNum = Number(trip.routeId);
    if (!Number.isFinite(tripIdNum) || !Number.isFinite(routeIdNum)) return;

    const currentPos = trip.currentPosition || trip.coords[trip.segmentIndex] || trip.coords[0];
    // Ghi checkpoint để có thể resume sau crash. Lưu ý: đây là nguyên nhân chính gây
    // write pressure nếu persistIntervalMs quá nhỏ hoặc có nhiều trip cùng lúc.
    try {
      await TripSimulationModel.upsert({
        trip_id: tripIdNum,
        route_id: routeIdNum,
        status,
        current_stop_index: trip.currentStopIndex,
        current_lat: currentPos?.lat ?? null,
        current_lng: currentPos?.lng ?? null,
        segment_index: trip.segmentIndex,
        segment_elapsed_ms: trip.segmentElapsedMs,
        pending_stop_indices: JSON.stringify(trip.pendingStopIndices || []),
        speed_mps: trip.speedMetersPerSec
      });
      // Optionally persist a history point to `bus_locations` (throttled)
      if (this.historyEnabled) {
        const now = Date.now();
        if (!trip.lastHistoryAt || now - trip.lastHistoryAt >= this.historyIntervalMs) {
          trip.lastHistoryAt = now;
          try {
            if (!trip.busId || !trip.driverId) {
              console.warn('BusLocation persist skipped: missing bus_id or driver_id');
            } else {
              await BusLocation.create({
                bus_id: trip.busId,
                driver_id: trip.driverId,
                schedule_id: trip.scheduleId || tripIdNum,
                latitude: currentPos?.lat ?? null,
                longitude: currentPos?.lng ?? null
              });
            }
          } catch (err) {
            console.warn('BusLocation persist failed:', err?.message || err);
          }
        }
      }
    } catch (error) {
      console.warn('Trip persist failed:', error?.message || error);
    }
  }
}

export default TripSimulationService;
