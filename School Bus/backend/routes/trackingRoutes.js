// /backend/routes/trackingRoutes.js
// Endpoints tạm thời để test tracking: ghi nhận GPS và cập nhật ETA điểm dừng

import express from 'express';
import BusLocation from '../models/BusLocation.js';
import StopArrival from '../models/StopArrival.js';

const router = express.Router();

// POST /api/tracking/locations  -> lưu điểm GPS mới
router.post('/locations', async (req, res) => {
  try {
    const { bus_id, driver_id, schedule_id = null, latitude, longitude, speed = null, heading = null, accuracy = null } = req.body;
    if (!bus_id || !driver_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu bus_id, driver_id, latitude, longitude' });
    }
    const location = await BusLocation.create({ bus_id, driver_id, schedule_id, latitude, longitude, speed, heading, accuracy });
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    console.error('❌ Tracking POST /locations error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tracking/locations/latest/:busId -> lấy điểm GPS mới nhất của bus
router.get('/locations/latest/:busId', async (req, res) => {
  try {
    const { busId } = req.params;
    const latest = await BusLocation.findLatest(busId);
    res.json({ success: true, data: latest });
  } catch (error) {
    console.error('❌ Tracking GET /locations/latest error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tracking/locations/bus/:busId -> lịch sử gần nhất của bus
router.get('/locations/bus/:busId', async (req, res) => {
  try {
    const { busId } = req.params;
    const { limit = 200 } = req.query;
    const rows = await BusLocation.findByBus(busId, Number(limit));
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Tracking GET /locations/bus error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/tracking/stop-arrivals/:scheduleId/:stopId -> cập nhật ETA hoặc status
router.put('/stop-arrivals/:scheduleId/:stopId', async (req, res) => {
  try {
    const { scheduleId, stopId } = req.params;
    const { estimated_arrival_time = null, distance_remaining = null, status = null } = req.body;

    if (estimated_arrival_time !== null) {
      await StopArrival.updateETA(scheduleId, stopId, estimated_arrival_time, distance_remaining);
    }
    if (status !== null) {
      await StopArrival.updateStatus(scheduleId, stopId, status);
    }

    const stops = await StopArrival.findBySchedule(scheduleId);
    res.json({ success: true, data: stops });
  } catch (error) {
    console.error('❌ Tracking PUT /stop-arrivals error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tracking/stop-arrivals/:scheduleId -> xem danh sách ETA/status các điểm dừng
router.get('/stop-arrivals/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const rows = await StopArrival.findBySchedule(scheduleId);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Tracking GET /stop-arrivals error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
