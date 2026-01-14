// /backend/routes/adminschedulesRoutes.js
import express from 'express';
import ScheduleService from '../services/scheduleService.js';

const router = express.Router();

// GET /api/admin-schedules - Lấy tất cả lịch trình (Admin)
router.get('/', async (req, res) => {
    console.log(' GET /api/admin-schedules - Lấy tất cả lịch trình');
    try {
        const schedules = await ScheduleService.getAllSchedules();
        
        console.log(` Lấy ${schedules.length} lịch trình`);
        res.json({
            success: true,
            data: schedules
        });
    } catch (error) {
        console.error(' Lỗi khi lấy lịch trình:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/admin-schedules/:id - Lấy chi tiết lịch trình (Admin)
router.get('/:id', async (req, res) => {
    console.log(` GET /api/admin-schedules/${req.params.id} - Lấy chi tiết lịch`);
    try {
        const schedule = await ScheduleService.getScheduleById(req.params.id);
        
        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        console.error(' Lỗi:', error.message);
        const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
});

// POST /api/admin-schedules - Tạo lịch trình mới (Admin)
router.post('/', async (req, res) => {
    console.log(' POST /api/admin-schedules - Tạo lịch trình mới');
    try {
        const schedule = await ScheduleService.createSchedule(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Tạo lịch trình thành công',
            data: schedule
        });
    } catch (error) {
        console.error(' Lỗi:', error.message);
        const statusCode = error.message.includes('Không tìm thấy') || 
                           error.message.includes('đã tồn tại') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
});

// PUT /api/admin-schedules/:id - Cập nhật lịch trình (Admin)
router.put('/:id', async (req, res) => {
    console.log(` PUT /api/admin-schedules/${req.params.id} - Cập nhật lịch trình`);
    try {
        const schedule = await ScheduleService.updateSchedule(req.params.id, req.body);
        
        res.json({
            success: true,
            message: 'Cập nhật lịch trình thành công',
            data: schedule
        });
    } catch (error) {
        console.error(' Lỗi:', error.message);
        const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE /api/admin-schedules/:id - Xóa lịch trình (Admin)
router.delete('/:id', async (req, res) => {
    console.log(` DELETE /api/admin-schedules/${req.params.id} - Xóa lịch trình`);
    try {
        await ScheduleService.deleteSchedule(req.params.id);
        
        res.json({
            success: true,
            message: 'Xóa lịch trình thành công'
        });
    } catch (error) {
        console.error(' Lỗi:', error.message);
        const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
