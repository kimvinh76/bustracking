// /backend/routes/driversRoutes.js
import express from 'express';
import DriverService from '../services/driverService.js';

const router = express.Router();

// GET /api/drivers - danh sách tài xế
router.get('/', async (req, res) => {
  console.log(' GET /api/drivers - Lấy danh sách tài xế');
  try {
    const drivers = await DriverService.getAllDrivers();
    console.log(` Lấy thành công ${drivers.length} tài xế`);
    res.json({ success: true, data: drivers, count: drivers.length });
  } catch (err) {
    console.error(' Lỗi khi lấy danh sách tài xế:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/drivers/by-user/:userId - lấy driver_id từ user_id (ĐẶT TRƯỚC /:id để tránh conflict)
router.get('/by-user/:userId', async (req, res) => {
  console.log(` GET /api/drivers/by-user/${req.params.userId} - Lấy driver_id từ user_id`);
  try {
    const { userId } = req.params;
    const driver = await DriverService.getDriverByUserId(userId);
    if (!driver) {
      console.log(' Không tìm thấy tài xế với user_id này');
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế với user_id này' });
    }
    console.log(` Tìm thấy driver_id: ${driver.id}`);
    res.json({ success: true, driver_id: driver.id });
  } catch (err) {
    console.error(' Lỗi khi lấy driver_id từ user_id:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/drivers/:id
router.get('/:id', async (req, res) => {
  console.log(` GET /api/drivers/${req.params.id} - Lấy thông tin tài xế`);
  try {
    const driver = await DriverService.getDriverById(req.params.id);
    if (!driver) {
      console.log(' Không tìm thấy tài xế');
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }
    console.log(` Lấy thông tin tài xế ${driver.name}`);
    res.json({ success: true, data: driver });
  } catch (err) {
    console.error(' Lỗi khi lấy thông tin tài xế:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/drivers - thêm tài xế
router.post('/', async (req, res) => {
  console.log(' POST /api/drivers - Thêm tài xế mới');
  try {
    const driverData = req.body;
    const driver = await DriverService.createDriver(driverData);
    console.log(` Thêm tài xế thành công: ${driver.name}`);
    res.status(201).json({ success: true, message: 'Thêm tài xế thành công', data: driver });
  } catch (err) {
    console.error(' Lỗi khi thêm tài xế:', err.message);
    const statusCode = err.message.includes('Thiếu thông tin') || err.message.includes('đã tồn tại') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: err.message });
  }
});

// PUT /api/drivers/:id - cập nhật tài xế
router.put('/:id', async (req, res) => {
  console.log(` PUT /api/drivers/${req.params.id} - Cập nhật tài xế`);
  try {
    const { id } = req.params;
    const driverData = req.body;
    const driver = await DriverService.updateDriver(id, driverData);
    console.log(` Cập nhật tài xế thành công: ${driver.name}`);
    res.json({ success: true, message: 'Cập nhật tài xế thành công', data: driver });
  } catch (err) {
    console.error(' Lỗi khi cập nhật tài xế:', err.message);
    const statusCode = err.message.includes('Không tìm thấy') ? 404 : 
                       err.message.includes('đã tồn tại') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: err.message });
  }
});

// DELETE /api/drivers/:id
router.delete('/:id', async (req, res) => {
  console.log(` DELETE /api/drivers/${req.params.id} - Xóa tài xế`);
  try {
    const { id } = req.params;
    await DriverService.deleteDriver(id);
    console.log(` Xóa tài xế thành công`);
    res.json({ success: true, message: 'Xóa tài xế thành công' });
  } catch (err) {
    console.error(' Lỗi khi xóa tài xế:', err.message);
    const statusCode = err.message.includes('Không tìm thấy') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: err.message });
  }
});

// GET /api/drivers/:id/details - thông tin tài xế và lịch trình
router.get('/:id/details', async (req, res) => {
  console.log(` GET /api/drivers/${req.params.id}/details - Lấy chi tiết tài xế và lịch trình`);
  try {
    const { id } = req.params;
    const details = await DriverService.getDriverDetails(id);
    console.log(` Lấy chi tiết tài xế với ${details.schedules.length} lịch trình`);
    res.json({ success: true, data: details });
  } catch (err) {
    console.error(' Lỗi khi lấy thông tin chi tiết tài xế:', err.message);
    const statusCode = err.message.includes('Không tìm thấy') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: err.message });
  }
});

export default router;