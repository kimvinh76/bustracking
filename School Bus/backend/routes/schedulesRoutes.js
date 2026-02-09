// /backend/routes/schedulesRoutes.js
import express from 'express';
import ScheduleService from '../services/scheduleService.js';
import RouteService from '../services/routeService.js';
import StudentService from '../services/studentService.js';

const router = express.Router();

/**
 * Helper: Gán học sinh vào từng điểm dừng
 * @param {Array} stops - Danh sách stops từ service 
 * @param {Array} allStudents - Danh sách tất cả students của route
 * @param {string} timeOfDay - 'morning' hoặc 'afternoon'
 * @returns {Array} Stops đã được gán students và format cho frontend
 */
const assignStudentsToStops = (stops, allStudents, timeOfDay) => {
    return stops.map((stop, index) => {
        // Xác định loại điểm
        let displayOrder = stop.order;
        let type = 'Điểm dừng';
        
        if (stop.order === 0 || index === 0) {
            displayOrder = 'Bắt đầu';
            type = 'Xuất phát';
        } else if (index === stops.length - 1) {
            displayOrder = 'Kết thúc';
            type = 'Kết thúc';
        }

        // Backend gán học sinh vào từng stop (chỉ áp dụng cho điểm dừng thường)
        const stopId = stop.stop_id ?? stop.id;
        const studentsAtStop = type === 'Xuất phát' || type === 'Kết thúc' ? [] : allStudents.filter(student => {
            const targetId = timeOfDay === 'morning' 
                ? student.morning_pickup_stop_id 
                : student.afternoon_dropoff_stop_id;
            return Number(targetId) === Number(stopId);
        }).map(s => ({
            id: s.id,
            name: s.name,
            class: s.class || s.class_name,
            phone: s.phone,
            status: 'waiting'
        }));

        return {
            id: stopId,
            order: stop.order,
            displayOrder: displayOrder,
            name: stop.name,
            address: stop.address,
            type: type,
            latitude: stop.lat,
            longitude: stop.lng,
            time: stop.time,
            distanceFromStart: stop.distanceFromStart,
            status: 'scheduled',
            note: '',
            students: studentsAtStop
        };
    });
};

// GET /api/schedules/active?routeIds=1,2&limit=1 - Lấy chuyến đang chạy theo các tuyến (Parent)
router.get('/active', async (req, res) => {
    console.log(' GET /api/schedules/active - Lấy chuyến đang chạy cho Parent');
    try {
        const { routeIds, limit } = req.query;
        const ids = String(routeIds || '')
            .split(',')
            .map((v) => Number(String(v).trim()))
            .filter((v) => Number.isFinite(v));

        const rows = await ScheduleService.getActiveSchedulesByRoutes(ids, Number(limit) || 1);
        const schedule = (rows && rows.length > 0) ? rows[0] : null;

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        console.error(' Lỗi khi lấy chuyến đang chạy:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/schedules/driver/:driverId - Lấy danh sách lịch làm việc của tài xế
router.get('/driver/:driverId', async (req, res) => {
    console.log(` GET /api/schedules/driver/${req.params.driverId} - Lấy lịch làm việc tài xế`);
    try {
        const { driverId } = req.params;
        const { date } = req.query;
        
        // Lấy schedules theo driver hoặc theo driver + date
        let schedules;
        if (date) {
            schedules = await ScheduleService.getSchedulesByDate(date);
            schedules = schedules.filter(s => s.driver_id == driverId);
        } else {
            schedules = await ScheduleService.getSchedulesByDriver(driverId);
        }

        // Format dữ liệu cho frontend
        const data = schedules.map(row => ({
            id: row.id,
            date: row.date,
            ca: row.shift_type === 'morning' ? 'Sáng' : 'Chiều',
            time: `${row.scheduled_start_time?.substring(0, 5)} - ${row.scheduled_end_time?.substring(0, 5)}`,
            route: row.route_name || 'Tuyến chưa xác định',
            busNumber: row.license_plate || row.bus_number || 'N/A',
            status: row.status || 'scheduled',
            statusText: row.status === 'scheduled' ? 'Chưa bắt đầu' : 
                       row.status === 'in_progress' ? 'Đang chạy' : 
                       row.status === 'completed' ? 'Hoàn thành' : 'Chưa bắt đầu',
            statusColor: row.status === 'scheduled' ? 'bg-gray-100 text-gray-700' : 
                        row.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                        row.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700',
            route_id: row.route_id
        }));
        
        console.log(` Lấy ${data.length} lịch làm việc`);
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error(' Lỗi khi lấy lịch làm việc:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/schedules/:driverId/:id - Lấy chi tiết một lịch làm việc
router.get('/:driverId/:id', async (req, res) => {
    console.log(` GET /api/schedules/${req.params.driverId}/${req.params.id} - Lấy chi tiết lịch`);
    try {
        const { driverId, id } = req.params;
        
        // Lấy schedule detail
        const schedule = await ScheduleService.getScheduleById(id);
        
        if (!schedule) {
            console.log(' Không tìm thấy lịch làm việc');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch làm việc'
            });
        }

        // Kiểm tra driver_id có khớp không
        if (schedule.driver_id != driverId) {
            console.log(' Lịch không thuộc về tài xế này');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch làm việc'
            });
        }

        // Lấy danh sách học sinh theo tuyến và ca
        let students = [];
        let studentCount = 0;
        try {
            const timeOfDay = schedule.shift_type === 'morning' ? 'morning' : 'afternoon';
            students = await StudentService.getStudentsByRoute(schedule.route_id, timeOfDay);
            studentCount = students.length;
            console.log(` Lấy ${studentCount} học sinh cho tuyến ${schedule.route_id} (${timeOfDay})`);
        } catch (error) {
            console.error(' Không thể lấy danh sách học sinh:', error.message);
            // Không throw error, chỉ log warning và để students = []
        }

        const detailData = {
            ...schedule,
            start_time: schedule.scheduled_start_time,
            end_time: schedule.scheduled_end_time,
            statusText: schedule.status === 'scheduled' ? 'Chưa bắt đầu' : 
                       schedule.status === 'in_progress' ? 'Đang chạy' : 
                       schedule.status === 'completed' ? 'Hoàn thành' : 'Chưa bắt đầu',
            statusColor: schedule.status === 'scheduled' ? 'bg-gray-100 text-gray-700' : 
                        schedule.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                        schedule.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700',
            students: students,
            studentCount: studentCount,
            stop_count: 0
        };

        console.log(` Lấy chi tiết lịch ${schedule.id}`);
        res.json({
            success: true,
            data: detailData
        });
    } catch (error) {
        console.error(' Lỗi khi lấy chi tiết lịch làm việc:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/schedules/driver/:driverId/stops/:scheduleId - Lấy danh sách điểm dừng cho driver
router.get('/driver/:driverId/stops/:scheduleId', async (req, res) => {
    console.log(` GET /api/schedules/driver/${req.params.driverId}/stops/${req.params.scheduleId}`);
    try {
        const { driverId, scheduleId } = req.params;

        // Lấy thông tin schedule để validate driver
        let schedule;
        try {
            schedule = await ScheduleService.getScheduleById(scheduleId);
        } catch (err) {
            if (String(err?.message || '').includes('Không tìm thấy lịch trình')) {
                console.log(' Không tìm thấy lịch làm việc');
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lịch làm việc'
                });
            }
            throw err;
        }

        if (!schedule || schedule.driver_id != driverId) {
            console.log(' Không tìm thấy lịch làm việc');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch làm việc'
            });
        }

        // Gọi service để lấy stops kèm thời gian tính toán
        const scheduleWithTime = await ScheduleService.getScheduleWithStopsAndTime(scheduleId);
        const stopsWithTime = scheduleWithTime.stops || [];

        // Lấy danh sách học sinh theo tuyến và ca
        const timeOfDay = schedule.shift_type === 'morning' ? 'morning' : 'afternoon';
        let allStudents = [];
        try {
            allStudents = await StudentService.getStudentsByRoute(schedule.route_id, timeOfDay);
            console.log(` Lấy ${allStudents.length} học sinh cho tuyến ${schedule.route_id} (${timeOfDay})`);
        } catch (error) {
            console.warn(' Không thể lấy danh sách học sinh:', error.message);
        }

        // Sử dụng helper function để gán học sinh vào stops
        const processedStops = assignStudentsToStops(stopsWithTime, allStudents, timeOfDay);

        console.log(` Lấy ${processedStops.length} điểm dừng`);
        res.json({
            success: true,
            data: {
                scheduleId: schedule.id,
                routeId: schedule.route_id,
                routeName: schedule.route_name || 'Tuyến xe',
                totalStops: processedStops.length,
                stops: processedStops
            }
        });
    } catch (error) {
        console.error(' Lỗi khi lấy danh sách điểm dừng:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PUT /api/schedules/:id/status - Cập nhật trạng thái lịch trình (Driver)
router.put('/:id/status', async (req, res) => {
    console.log(` PUT /api/schedules/${req.params.id}/status - Cập nhật trạng thái lịch trình`);
    try {
        const { id } = req.params;
        const { status, notes = null, actualEndTime = null, actual_end_time = null } = req.body || {};

        const updated = await ScheduleService.updateScheduleStatus(
            id,
            status,
            notes,
            actualEndTime || actual_end_time || null
        );

        res.json({
            success: true,
            message: 'Cập nhật trạng thái lịch trình thành công',
            data: updated
        });
    } catch (error) {
        console.error(' Lỗi khi cập nhật trạng thái lịch trình:', error.message);
        const msg = String(error?.message || '');
        const statusCode =
            msg.includes('Không thể bắt đầu chuyến') ? 403 :
            msg.includes('Không tìm thấy') ? 404 :
            msg.includes('không hợp lệ') || msg.includes('Thiếu') ? 400 :
            500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
});


export default router;