// /backend/routes/trackingRoutes.js
// Lưu lịch sử GPS (tùy chọn). Realtime map dùng WebSocket, không đọc bảng này.
 

import express from 'express';
import BusLocation from '../models/BusLocation.js';

const router = express.Router();

// POST /api/tracking/locations  -> lưu điểm GPS mới
// Note: Đây là API để lưu lịch sử GPS (optional). Realtime vị trí hiện được
// truyền qua WebSocket (`bus_status_update`). Nếu hệ thống passive driver
// không gửi frequent updates thì endpoint này sẽ ít được ghi.
router.post('/locations', async (req, res) => {
  try {
    const { bus_id, driver_id, schedule_id = null, latitude, longitude } = req.body;
    if (!bus_id || !driver_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu bus_id, driver_id, latitude, longitude' });
    }
    const location = await BusLocation.create({ bus_id, driver_id, schedule_id, latitude, longitude });
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    console.error(' Tracking POST /locations error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tracking/locations?bus_id=... or ?schedule_id=...&limit=...
router.get('/locations', async (req, res) => {
  try {
    const { bus_id, schedule_id, limit = 200 } = req.query;
    if (bus_id) {
      const rows = await BusLocation.findByBus(Number(bus_id), Number(limit));
      return res.json({ success: true, data: rows });
    }
    if (schedule_id) {
      const rows = await BusLocation.findBySchedule(Number(schedule_id), Number(limit));
      return res.json({ success: true, data: rows });
    }
    return res.status(400).json({ success: false, message: 'Provide bus_id or schedule_id' });
  } catch (error) {
    console.error(' Tracking GET /locations error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
