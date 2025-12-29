// /backend/routes/routeRoutes.js
import express from "express";
import RouteService from "../services/routeService.js";

const router = express.Router();

// GET /api/routes - danh sách tuyến đường
router.get("/", async (req, res) => {
  console.log('🔹 GET /api/routes - Lấy danh sách tuyến đường');
  try {
    const routes = await RouteService.getAllRoutes();
    console.log(`✅ Lấy thành công ${routes.length} tuyến đường`);
    res.status(200).json({
      success: true,
      data: routes,
      message: "Lấy danh sách tuyến đường thành công",
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách tuyến đường:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/routes/:id - lấy thông tin một tuyến
router.get("/:id", async (req, res) => {
  console.log(`🔹 GET /api/routes/${req.params.id} - Lấy thông tin tuyến đường`);
  try {
    const { id } = req.params;
    const route = await RouteService.getRouteById(id);
    
    if (!route) {
      console.log('❌ Không tìm thấy tuyến đường');
      return res.status(404).json({ success: false, message: "Không tìm thấy tuyến đường" });
    }

    console.log(`✅ Lấy thông tin tuyến ${route.route_name}`);
    res.status(200).json({
      success: true,
      data: route,
      message: "Lấy thông tin tuyến đường thành công",
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy 1 tuyến đường:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/routes/:id/stops - Lấy điểm dừng của tuyến
router.get('/:id/stops', async (req, res) => {
  console.log(`🔹 GET /api/routes/${req.params.id}/stops - Lấy điểm dừng của tuyến`);
  try {
    const { id } = req.params;
    const route = await RouteService.getRouteWithStops(id);
    
    if (!route) {
      console.log('❌ Không tìm thấy tuyến đường');
      return res.status(404).json({ success: false, message: "Không tìm thấy tuyến đường" });
    }

    console.log(`✅ Lấy ${route.stops.length} điểm dừng của tuyến ${route.route_name}`);
    res.json({
      success: true,
      data: route.stops,
      count: route.stops.length,
      message: `Lấy ${route.stops.length} điểm dừng của tuyến thành công`
    });
  } catch (error) {
    console.error('❌ Error fetching route stops:', error.message);
    res.status(500).json({
      success: false, 
      message: error.message
    });
  }
});

// GET /api/routes/:id/pickup-drop-info - Lấy thông tin điểm đón/trả mặc định
router.get('/:id/pickup-drop-info', async (req, res) => {
  console.log(`🔹 GET /api/routes/${req.params.id}/pickup-drop-info - Lấy thông tin điểm đón/trả`);
  try {
    const { id } = req.params;
    const info = await RouteService.getPickupDropInfo(id);
    
    console.log(`✅ Lấy thông tin điểm đón/trả thành công`);
    res.json({
      success: true,
      data: info,
      message: 'Lấy thông tin điểm đón/trả thành công'
    });
  } catch (error) {
    console.error('❌ Error fetching route pickup-drop info:', error.message);
    res.status(500).json({
      success: false, 
      message: error.message
    });
  }
});

// POST /api/routes - Thêm tuyến mới
router.post("/", async (req, res) => {
  console.log('🔹 POST /api/routes - Thêm tuyến đường mới');
  try {
    const routeData = req.body;
    const newRoute = await RouteService.createRoute(routeData);
    
    console.log(`✅ Tạo tuyến đường thành công: ${newRoute.route_name}`);
    res.status(201).json({
      success: true,
      message: "Tạo tuyến đường thành công",
      data: newRoute,
    });
  } catch (error) {
    console.error('❌ Lỗi khi tạo tuyến đường:', error.message);
    const statusCode = error.message.includes('Thiếu thông tin') || error.message.includes('đã tồn tại') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

// PUT /api/routes/:id - Cập nhật tuyến
router.put("/:id", async (req, res) => {
  console.log(`🔹 PUT /api/routes/${req.params.id} - Cập nhật tuyến đường`);
  try {
    const { id } = req.params;
    const routeData = req.body;
    const updatedRoute = await RouteService.updateRoute(id, routeData);

    console.log(`✅ Cập nhật tuyến đường thành công: ${updatedRoute.route_name}`);
    res.status(200).json({
      success: true,
      message: "Cập nhật tuyến đường thành công",
      data: updatedRoute,
    });
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật tuyến đường:', error.message);
    const statusCode = error.message.includes('Không tìm thấy') ? 404 :
                       error.message.includes('Thiếu thông tin') || error.message.includes('đã tồn tại') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

// DELETE /api/routes/:id - Xóa tuyến
router.delete("/:id", async (req, res) => {
  console.log(`🔹 DELETE /api/routes/${req.params.id} - Xóa tuyến đường`);
  try {
    const { id } = req.params;
    await RouteService.deleteRoute(id);

    console.log(`✅ Xóa tuyến đường thành công`);
    res.status(200).json({
      success: true,
      message: "Xóa tuyến đường thành công",
    });
  } catch (error) {
    console.error('❌ Lỗi khi xóa tuyến đường:', error.message);
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

export default router;
