// ===================================
// ROUTES/CONTROLLER: BUS (VERSION MỚI - CẢI TIẾN)
// ===================================
// Chức năng: XỬ LÝ HTTP REQUEST/RESPONSE
// - Nhận request từ client
// - Gọi service xử lý
// - Trả response cho client
// - KHÔNG chứa logic nghiệp vụ, KHÔNG truy vấn database trực tiếp
// ===================================

import express from 'express';
import BusService from '../services/busService.js';

const router = express.Router();

/**
 * Helper function: Xử lý lỗi thống nhất
 */
const handleError = (res, error, defaultStatus = 500) => {
  console.error(' Error:', error.message);
  
  // Xác định status code dựa trên loại lỗi
  let statusCode = defaultStatus;
  
  if (error.message.includes('không hợp lệ') || 
      error.message.includes('bắt buộc') ||
      error.message.includes('đã tồn tại')) {
    statusCode = 400; // Bad Request
  } else if (error.message.includes('Không tìm thấy')) {
    statusCode = 404; // Not Found
  }

  res.status(statusCode).json({
    success: false,
    message: error.message,
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

// ===================================
// GET /api/buses - Lấy danh sách tất cả xe bus
// ===================================
router.get('/', async (req, res) => {
  try {
    const buses = await BusService.getAllBuses();
    
    res.json({
      success: true,
      data: buses,
      count: buses.length
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ===================================
// GET /api/buses/active - Lấy xe bus đang hoạt động
// ===================================
router.get('/active', async (req, res) => {
  try {
    const buses = await BusService.getActiveBuses();
    
    res.json({
      success: true,
      data: buses,
      count: buses.length
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ===================================
// GET /api/buses/license/:license_plate - Tìm xe bus theo biển số
// ===================================
router.get('/license/:license_plate', async (req, res) => {
  try {
    const { license_plate } = req.params;
    const bus = await BusService.getBusByLicensePlate(license_plate);
    
    res.json({
      success: true,
      data: bus
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ===================================
// GET /api/buses/:id - Lấy thông tin xe bus theo ID
// ===================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bus = await BusService.getBusById(id);
    
    res.json({
      success: true,
      data: bus
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ===================================
// POST /api/buses - Tạo xe bus mới
// ===================================
router.post('/', async (req, res) => {
  try {
    console.log(' ROUTES: Nhận request POST /api/buses');
    console.log(' ROUTES: Body nhận được:', req.body);
    
    const busData = req.body;
    
    console.log(' ROUTES: Đang gọi BusService.createBus()...');
    const newBus = await BusService.createBus(busData);
    
    console.log(' ROUTES: Service trả về xe bus:', newBus);
    console.log(' ROUTES: Gửi response 201 cho client');
    
    res.status(201).json({
      success: true,
      message: 'Tạo xe bus thành công',
      data: newBus
    });
  } catch (error) {
    console.error(' ROUTES: Lỗi xảy ra:', error.message);
    handleError(res, error);
  }
});

// ===================================
// PUT /api/buses/:id - Cập nhật thông tin xe bus
// ===================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const busData = req.body;
    
    const updatedBus = await BusService.updateBus(id, busData);
    
    res.json({
      success: true,
      message: 'Cập nhật xe bus thành công',
      data: updatedBus
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ===================================
// DELETE /api/buses/:id - Xóa xe bus
// ===================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await BusService.deleteBus(id);
    
    res.json({
      success: true,
      message: 'Xóa xe bus thành công'
    });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
