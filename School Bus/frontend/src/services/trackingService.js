import apiClient from './api.js';

const trackingService = {
  // Lưu một mẫu vị trí GPS vào backend
  logLocation: async ({ busId, driverId, scheduleId = null, latitude, longitude }) => {
    if (!busId || !driverId || latitude === undefined || longitude === undefined) {
      console.warn('trackingService.logLocation: missing required fields');
      return null;
    }
    const payload = {
      bus_id: busId,
      driver_id: driverId,
      schedule_id: scheduleId,
      latitude,
      longitude
    };
    return apiClient.post('/tracking/locations', payload);
  },

  // Lấy lịch sử theo schedule_id (dành cho admin playback)
  getHistoryBySchedule: async (scheduleId, limit = 500) => {
    if (!scheduleId) return [];
    const lim = Number.isFinite(Number(limit)) ? Number(limit) : 500;
    const response = await apiClient.get(`/tracking/locations?schedule_id=${scheduleId}&limit=${lim}`);
    return Array.isArray(response) ? response : [];
  },

  // Lấy lịch sử theo bus_id
  getHistoryByBus: async (busId, limit = 500) => {
    if (!busId) return [];
    const lim = Number.isFinite(Number(limit)) ? Number(limit) : 500;
    const response = await apiClient.get(`/tracking/locations?bus_id=${busId}&limit=${lim}`);
    return Array.isArray(response) ? response : [];
  }
};

export default trackingService;
