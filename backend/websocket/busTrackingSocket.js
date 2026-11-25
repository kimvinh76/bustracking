
import { Server } from 'socket.io';
import TripSimulationService from '../services/tripSimulationService.js';
import { corsOriginValidator } from '../config/cors.js';

/**
 * BusTrackingSocket
 * - Điều phối kết nối Socket.IO cho realtime bus_status_update.
 * - Nhận các control từ driver (start/pause/resume/stop) và ủy quyền cho
 *   TripSimulationService thực hiện mô phỏng.
 * - Lưu trạng thái hiện tại trong `tripStatuses` để khi client join có thể
 *   nhận ngay trạng thái hiện tại.
 */
class BusTrackingSocket {
  constructor() {
    this.io = null;
    this.tripStatuses = new Map();
    this.cleanupTimers = new Map();
    this.tripSimulator = new TripSimulationService({
      emitStatus: (tripId, status) => this.updateBusStatus(tripId, status)
    });
  }
 
  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: corsOriginValidator,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`New client connected: ${socket.id}`);

      // Client tham gia room để nhận updates cho trip cụ thể
      socket.on('join_trip', (payload = {}) => {
        const { tripId } = payload || {};
        if (!tripId) return;
        const roomId = String(tripId);
        socket.join(roomId);
        console.log(`Client ${socket.id} joined trip room: ${roomId}`);

        const currentStatus = this.tripStatuses.get(roomId) || this.getInitialStatus(roomId);
        socket.emit('bus_status_update', currentStatus);
      });

      // Client rời room
      socket.on('leave_trip', (payload = {}) => {
        const { tripId } = payload || {};
        if (!tripId) return;
        socket.leave(String(tripId));
      });

      // Chỉ merge cảnh báo (sự cố, đón HS) — vị trí xe do tripSimulator phát
      socket.on('driver_status_update', (payload = {}) => {
        const { tripId, status } = payload || {};
        if (!tripId || !status) return;
        this._mergeAndBroadcast(String(tripId), status);
      });

      // Driver điều khiển trip: start/pause/resume/stop
      socket.on('driver_trip_control', async (payload = {}) => {
        const { tripId, action, routeId, speedMetersPerSec } = payload || {};
        if (!tripId || !action) return;
        const roomId = String(tripId);

        try {
          const actions = {
            start: () => this.tripSimulator.startTrip({ tripId: roomId, routeId, speedMetersPerSec }),
            pause: () => this.tripSimulator.pauseTrip(roomId),
            resume: () => this.tripSimulator.resumeTrip(roomId),
            stop: () => this.tripSimulator.stopTrip(roomId)
          };
          const handler = actions[action];
          if (!handler) return;
          if (action === 'start' && !routeId) return;
          await handler();
        } catch (error) {
          console.error(`Trip control error (${action}) for ${roomId}:`, error);
        }
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    console.log('Socket.IO server initialized');
    this.tripSimulator.restoreActiveTrips().catch((err) => {
      console.warn('Trip restore failed:', err?.message || err);
    });
  }

  _clearCleanupTimer(roomId) {
    const timer = this.cleanupTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(roomId);
    }
  }

  _mergeAndBroadcast(roomId, patch) {
    // Tách các cảnh báo tức thời (one-shot) để chỉ phát 1 lần, không lưu dính vào tripStatuses
    const current = this.tripStatuses.get(roomId) || this.getInitialStatus(roomId);
    const { incidentAlert, studentPickupAlert, ...persistentPatch } = patch || {};
    const persistentState = { ...current, ...persistentPatch, lastUpdate: new Date() };
    this.tripStatuses.set(roomId, persistentState);

    const payload = {
      ...persistentState,
      ...(incidentAlert ? { incidentAlert } : {}),
      ...(studentPickupAlert ? { studentPickupAlert } : {}),
    };
    this.io?.to(roomId).emit('bus_status_update', payload);
    return payload;
  }

  updateBusStatus(tripId, status) {
    if (!tripId || !status) return;
    const roomId = String(tripId);
    // Hủy timer dọn cũ nếu chuyến được khởi động lại trong vòng 60s
    this._clearCleanupTimer(roomId);
    this._mergeAndBroadcast(roomId, status);
    if (status.driverStatus === 'completed') {
      const timer = setTimeout(() => {
        this.tripStatuses.delete(roomId);
        this.cleanupTimers.delete(roomId);
      }, 60_000);
      this.cleanupTimers.set(roomId, timer);
    }
  }

  /** Gọi khi reset schedule stale — tránh simulation mồ côi trong Redis & RAM. */
  async cleanupOrphanSimulations(cutoff) {
    const affected = await this.tripSimulator.cleanupStaleRedisTrips(cutoff);
    if (affected > 0) {
      this.tripSimulator.stopAllInMemory();
    }
    return affected;
  }

  getInitialStatus(tripId) {
    return {
      tripId,
      isRunning: false,
      currentPosition: null,
      driverStatus: 'not_started',
      lastUpdate: null
    };
  }
}

export default new BusTrackingSocket();
