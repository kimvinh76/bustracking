// ===================================
// ROUTES: STUDENT (VERSION MỚI - CẢI TIẾN)
// ===================================
// Chỉ xử lý HTTP request/response
// Gọi StudentService để xử lý logic
// ===================================

import express from 'express';
import StudentService from '../services/studentService.js';

const router = express.Router();

/**
 * Helper function: Xử lý lỗi thống nhất
 */
const handleError = (res, error, defaultStatus = 500) => {
  console.error('❌ Error:', error.message);
  
  let statusCode = defaultStatus;
  
  if (error.message.includes('không hợp lệ') || 
      error.message.includes('bắt buộc') ||
      error.message.includes('phải có ít nhất')) {
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
// GET /api/students - Lấy tất cả học sinh
// ===================================
router.get('/', async (req, res) => {
  try {
    const students = await StudentService.getAllStudents();
    
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ===================================
// GET /api/students/search?q=keyword - Tìm kiếm học sinh
// ===================================
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    const students = await StudentService.searchStudents(q);
    
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// ===================================
// GET /api/students/class/:className - Lấy học sinh theo lớp
// ===================================
router.get('/class/:className', async (req, res) => {
  try {
    const { className } = req.params;
    
    const students = await StudentService.getStudentsByClass(className);
    
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ===================================
// GET /api/students/route/:routeId - Lấy học sinh theo tuyến đường
// Query params: ?timeOfDay=morning|afternoon
// ===================================
router.get('/route/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;
    const { timeOfDay = 'morning' } = req.query;
    
    const students = await StudentService.getStudentsByRoute(routeId, timeOfDay);
    
    res.json({
      success: true,
      data: students,
      count: students.length,
      metadata: {
        routeId,
        timeOfDay
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ===================================
// GET /api/students/:id - Lấy học sinh theo ID
// ===================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await StudentService.getStudentById(id);
    
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ===================================
// POST /api/students - Tạo học sinh mới
// ===================================
router.post('/', async (req, res) => {
  try {
    const studentData = req.body;
    
    const newStudent = await StudentService.createStudent(studentData);
    
    res.status(201).json({
      success: true,
      message: 'Thêm học sinh thành công',
      data: newStudent
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// ===================================
// PUT /api/students/:id - Cập nhật học sinh
// ===================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const studentData = req.body;
    
    const updatedStudent = await StudentService.updateStudent(id, studentData);
    
    res.json({
      success: true,
      message: 'Cập nhật học sinh thành công',
      data: updatedStudent
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ===================================
// PUT /api/students/:id/assign-route - Gán học sinh vào tuyến đường
// Body: { routeId, timeOfDay, stopId }
// ===================================
router.put('/:id/assign-route', async (req, res) => {
  try {
    const { id } = req.params;
    const routeData = req.body;
    
    const updatedStudent = await StudentService.assignStudentToRoute(id, routeData);
    
    res.json({
      success: true,
      message: 'Gán tuyến đường thành công',
      data: updatedStudent
    });
  } catch (error) {
    handleError(res, error, 400);
  }
});

// ===================================
// DELETE /api/students/:id - Xóa học sinh (soft delete)
// ===================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await StudentService.deleteStudent(id);
    
    res.json({
      success: true,
      message: 'Xóa học sinh thành công'
    });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
