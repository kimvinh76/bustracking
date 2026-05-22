// services/tripSimulationService.js
// Mô phỏng vị trí xe trên backend — một nguồn phát cho mọi client qua WebSocket

import axios from 'axios';
import RouteService from './routeService.js';
import ScheduleService from './scheduleService.js';
import TripSimulationModel from '../models/TripSimulation.js';

class TripSimulationService {
  constructor({ emitStatus }) {
    this.emitStatus = emitStatus;
    this.trips = new Map();
    this.persistIntervalMs = 5000;
  }

  async restoreActiveTrips() {
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
      }
    }
  }

  async startTrip({ tripId, routeId, speedMetersPerSec = 15 }) {
    if (!tripId || !routeId) throw new Error('Thiếu tripId hoặc routeId');

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

    this._persistState(tripState, 'in_progress', true).catch(() => {});
    this._startTimer(tripState);
  }

  pauseTrip(tripId) {
    const trip = this.trips.get(String(tripId));
    if (!trip || trip.completed || trip.paused) return;

    trip.paused = true;
    this._stopTimer(trip);
    this.emitStatus(tripId, { isRunning: false, driverStatus: 'paused', currentStopIndex: trip.currentStopIndex });
    this._persistState(trip, 'paused', true).catch(() => {});
  }

  resumeTrip(tripId) {
    const trip = this.trips.get(String(tripId));
    if (!trip || trip.completed || !trip.paused) return;

    trip.paused = false;
    trip.lastTickAt = Date.now();
    this.emitStatus(tripId, { isRunning: true, driverStatus: 'in_progress', currentStopIndex: trip.currentStopIndex });
    this._persistState(trip, 'in_progress', true).catch(() => {});
    this._startTimer(trip);
  }

  stopTrip(tripId) {
    const trip = this.trips.get(String(tripId));
    if (!trip) return;

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

    return {
      tripId: String(tripId),
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
      currentPosition,
      timer: null
    };
  }

  async _loadRouteGeometry(routeId, speedMetersPerSec) {
    const route = await RouteService.getRouteWithStops(routeId);
    const stops = (route?.stops || []).map((s) => ({
      id: s.id,
      lat: Number(s.latitude),
      lng: Number(s.longitude)
    }));

    if (stops.length < 2) throw new Error('Cần ít nhất 2 điểm dừng để mô phỏng');

    const waypoints = stops.map((s) => ({ lat: s.lat, lng: s.lng }));
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
      const coordsStr = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join(';');
      const url = `http://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
      const response = await axios.get(url);
      const coordinates = response?.data?.routes?.[0]?.geometry?.coordinates;
      if (!coordinates?.length) throw new Error('No routes found');
      return coordinates.map((c) => ({ lat: c[1], lng: c[0] }));
    } catch {
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
    } catch (error) {
      console.warn('Trip persist failed:', error?.message || error);
    }
  }
}

export default TripSimulationService;
