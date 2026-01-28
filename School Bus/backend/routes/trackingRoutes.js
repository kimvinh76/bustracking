// /backend/routes/trackingRoutes.js
// Endpoints cho GPS tracking: lưu vị trí bus realtime

import express from 'express';
import BusLocation from '../models/BusLocation.js';

const router = express.Router();

// POST /api/tracking/locations  -> lưu điểm GPS mới
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

export default router;
