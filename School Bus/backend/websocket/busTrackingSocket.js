
import { Server } from 'socket.io';
import TripSimulationService from '../services/tripSimulationService.js';
import TripSimulationModel from '../models/TripSimulation.js';

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
    this.tripSimulator = new TripSimulationService({
      emitStatus: (tripId, status) => this.updateBusStatus(tripId, status)
    });
  }
 
  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`New client connected: ${socket.id}`);

      // Client tham gia room để nhận updates cho trip cụ thể
      socket.on('join_trip', ({ tripId }) => {
        if (!tripId) return;
        const roomId = String(tripId);
        socket.join(roomId);
        console.log(`Client ${socket.id} joined trip room: ${roomId}`);

        const currentStatus = this.tripStatuses.get(roomId) || this.getInitialStatus(roomId);
        socket.emit('bus_status_update', currentStatus);
      });

      // Client rời room
      socket.on('leave_trip', ({ tripId }) => {
        if (!tripId) return;
        socket.leave(String(tripId));
      });

      // Cảnh báo / pickup — không phải nguồn vị trí (vị trí do tripSimulator phát)
      // Chỉ merge cảnh báo (sự cố, đón HS) — vị trí xe do tripSimulator phát
      // Driver gửi các bản tin cảnh báo/alert (không phải vị trí). Merge và
      // broadcast để các client khác nhận cảnh báo kèm vị trí hiện tại.
      socket.on('driver_status_update', ({ tripId, status }) => {
        if (!tripId || !status) return;
        this._mergeAndBroadcast(String(tripId), status);
      });

      // Driver điều khiển trip: start/pause/resume/stop. Các hành động này
      // được chuyển sang TripSimulationService để xử lý và persist checkpoint.
      socket.on('driver_trip_control', async ({ tripId, action, routeId, speedMetersPerSec }) => {
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
    // Khi khởi tạo socket server thì cố gắng restore các trip đang active
    // từ DB (nếu có checkpoint). Nếu restore thất bại sẽ log và tiếp tục.
    this.tripSimulator.restoreActiveTrips().catch((err) => {
      console.warn('Trip restore failed:', err?.message || err);
    });
  }

  _mergeAndBroadcast(roomId, patch) {
    // Hợp nhất patch (ví dụ alert) với trạng thái hiện tại rồi broadcast
    const current = this.tripStatuses.get(roomId) || this.getInitialStatus(roomId);
    const newStatus = { ...current, ...patch, lastUpdate: new Date() };
    this.tripStatuses.set(roomId, newStatus);
    this.io?.to(roomId).emit('bus_status_update', newStatus);
    return newStatus;
  }

  updateBusStatus(tripId, status) {
    // Cập nhật trạng thái in-memory và broadcast đến các client đang nghe
    if (!tripId || !status) return;
    const roomId = String(tripId);
    this._mergeAndBroadcast(roomId, status);
    if (status.driverStatus === 'completed') {
      setTimeout(() => this.tripStatuses.delete(roomId), 60_000);
    }
  }

  /** Gọi khi reset schedule stale — tránh simulation mồ côi. */
  async cleanupOrphanSimulations(cutoff) {
    // Dọn các checkpoint quá cũ và xóa timers trong RAM để tránh orphaned simulations
    const affected = await TripSimulationModel.cleanupStaleActive(cutoff);
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
