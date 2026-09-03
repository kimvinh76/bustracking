import express from "express";
import StopService from "../services/stopService.js";

const router = express.Router();

// GET /api/stops
router.get("/", async (req, res) => {
  console.log(' GET /api/stops - Lấy danh sách trạm');
  try {
    const stops = await StopService.getAllStops();
    res.status(200).json({
      success: true,
      data: stops,
    });
  } catch (error) {
    console.error(' Lỗi khi lấy danh sách trạm:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
