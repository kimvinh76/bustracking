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

// POST /api/stops - Tạo trạm dừng mới
router.post("/", async (req, res) => {
  try {
    const created = await StopService.createStop(req.body);
    res.status(201).json({
      success: true,
      message: "Tạo trạm dừng thành công",
      data: created,
    });
  } catch (error) {
    const msg = String(error?.message || "");
    const statusCode = msg.includes("không hợp lệ") || msg.includes("ít nhất") ? 400 : 500;
    res.status(statusCode).json({ success: false, message: msg });
  }
});

// PUT /api/stops/:id - Cập nhật trạm dừng & tự tính lại khoảng cách các tuyến liên quan
router.put("/:id", async (req, res) => {
  try {
    const result = await StopService.updateStop(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message:
        result.updatedRouteIds.length > 0
          ? `Cập nhật trạm thành công và đã tính lại khoảng cách cho ${result.updatedRouteIds.length} tuyến đường`
          : "Cập nhật trạm dừng thành công",
      data: result.stop,
      updatedRouteIds: result.updatedRouteIds,
    });
  } catch (error) {
    const msg = String(error?.message || "");
    const statusCode = msg.includes("Không tìm thấy")
      ? 404
      : msg.includes("không hợp lệ") || msg.includes("ít nhất")
        ? 400
        : 500;
    res.status(statusCode).json({ success: false, message: msg });
  }
});

// DELETE /api/stops/:id - Xóa trạm dừng (chặn nếu đang gắn với tuyến/học sinh)
router.delete("/:id", async (req, res) => {
  try {
    const result = await StopService.deleteStop(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const msg = String(error?.message || "");
    const statusCode = msg.includes("Không tìm thấy")
      ? 404
      : msg.includes("Không thể xóa trạm")
        ? 409
        : 500;
    res.status(statusCode).json({ success: false, message: msg });
  }
});

export default router;
