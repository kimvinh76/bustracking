// /backend/routes/schedulesRoutes.js
import express from 'express';
import ScheduleService from '../services/scheduleService.js';
import RouteService from '../services/routeService.js';
import StudentService from '../services/studentService.js';

const router = express.Router();

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

        // Lấy thông tin schedule
        const schedule = await ScheduleService.getScheduleById(scheduleId);

        if (!schedule || schedule.driver_id != driverId) {
            console.log(' Không tìm thấy lịch làm việc');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch làm việc'
            });
        }

        // Lấy route với stops
        const route = await RouteService.getRouteWithStops(schedule.route_id);
        const stops = route ? route.stops : [];

        // Tính estimated time cho mỗi stop
        const startTime = schedule.scheduled_start_time;
        const endTime = schedule.scheduled_end_time;
        const processedStops = stops.map((stop, index) => {
            let estimatedTime;
            
            if (stops.length === 1) {
                estimatedTime = startTime?.substring(0, 5);
            } else if (index === 0) {
                estimatedTime = startTime?.substring(0, 5);
            } else if (index === stops.length - 1) {
                estimatedTime = endTime?.substring(0, 5);
            } else {
                if (startTime && endTime) {
                    const [sH, sM] = startTime.split(':').map(Number);
                    const [eH, eM] = endTime.split(':').map(Number);
                    const startMinutes = sH * 60 + sM;
                    const endMinutes = eH * 60 + eM;
                    const totalDiff = endMinutes - startMinutes;
                    const stepSize = totalDiff / (stops.length - 1);
                    const currentMinutes = startMinutes + Math.round(stepSize * index);
                    const h = Math.floor(currentMinutes / 60) % 24;
                    const m = currentMinutes % 60;
                    estimatedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                } else {
                    estimatedTime = startTime?.substring(0, 5) || '00:00';
                }
            }
            
            // Xác định loại điểm
            let displayOrder = stop.stop_order;
            let type = 'Điểm dừng';
            
            if (stop.stop_order === 0) {
                displayOrder = 'Bắt đầu';
                type = 'Xuất phát';
            } else if (stop.stop_order === 99) {
                displayOrder = 'Kết thúc';
                type = 'Kết thúc';
            }

            return {
                id: stop.id,
                order: stop.stop_order,
                displayOrder: displayOrder,
                name: stop.name,
                address: stop.address,
                type: type,
                estimatedTime: estimatedTime,
                latitude: stop.latitude,
                longitude: stop.longitude,
                status: 'scheduled',
                note: ''
            };
        });

        console.log(` Lấy ${processedStops.length} điểm dừng`);
        res.json({
            success: true,
            data: {
                scheduleId: schedule.id,
                routeId: schedule.route_id,
                routeName: route.route_name,
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


export default router;