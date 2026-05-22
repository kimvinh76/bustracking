
import { Server } from 'socket.io';
import TripSimulationService from '../services/tripSimulationService.js';
import TripSimulationModel from '../models/TripSimulation.js';

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

      socket.on('join_trip', ({ tripId }) => {
        if (!tripId) return;
        const roomId = String(tripId);
        socket.join(roomId);
        console.log(`Client ${socket.id} joined trip room: ${roomId}`);

        const currentStatus = this.tripStatuses.get(roomId) || this.getInitialStatus(roomId);
        socket.emit('bus_status_update', currentStatus);
      });

      socket.on('leave_trip', ({ tripId }) => {
        if (!tripId) return;
        socket.leave(String(tripId));
      });

      // Cảnh báo / pickup — không phải nguồn vị trí (vị trí do tripSimulator phát)
      // Chỉ merge cảnh báo (sự cố, đón HS) — vị trí xe do tripSimulator phát
      socket.on('driver_status_update', ({ tripId, status }) => {
        if (!tripId || !status) return;
        this._mergeAndBroadcast(String(tripId), status);
      });

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
    this.tripSimulator.restoreActiveTrips().catch((err) => {
      console.warn('Trip restore failed:', err?.message || err);
    });
  }

  _mergeAndBroadcast(roomId, patch) {
    const current = this.tripStatuses.get(roomId) || this.getInitialStatus(roomId);
    const newStatus = { ...current, ...patch, lastUpdate: new Date() };
    this.tripStatuses.set(roomId, newStatus);
    this.io?.to(roomId).emit('bus_status_update', newStatus);
    return newStatus;
  }

  updateBusStatus(tripId, status) {
    if (!tripId || !status) return;
    const roomId = String(tripId);
    this._mergeAndBroadcast(roomId, status);
    if (status.driverStatus === 'completed') {
      setTimeout(() => this.tripStatuses.delete(roomId), 60_000);
    }
  }

  /** Gọi khi reset schedule stale — tránh simulation mồ côi. */
  async cleanupOrphanSimulations() {
    await TripSimulationModel.deleteAllActive();
    this.tripSimulator.stopAllInMemory();
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
