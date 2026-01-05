import apiClient from './api.js';

const trackingService = {
  // Lưu một mẫu vị trí GPS vào backend
  logLocation: async ({ busId, driverId, scheduleId = null, latitude, longitude, speed = null, heading = null, accuracy = null }) => {
    if (!busId || !driverId || latitude === undefined || longitude === undefined) {
      console.warn('trackingService.logLocation: missing required fields');
      return null;
    }
    const payload = {
      bus_id: busId,
      driver_id: driverId,
      schedule_id: scheduleId,
      latitude,
      longitude,
      speed,
      heading,
      accuracy
    };
    return apiClient.post('/tracking/locations', payload);
  }
};

export default trackingService;
