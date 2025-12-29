// /backend/routes/adminSchedulesRoutes.js
import express from 'express';
import ScheduleService from '../services/scheduleService.js';

const router = express.Router();

// GET /api/admin-schedules - Lấy danh sách tất cả lịch trình
router.get('/', async (req, res) => {
    console.log('🔹 GET /api/admin-schedules - Lấy danh sách lịch trình');
    try {
        const schedules = await ScheduleService.getAllSchedules();

        const formattedRows = schedules.map(row => ({
            ...row,
            id: `CH${String(row.id).padStart(3, '0')}`,
            schedule_id: row.id,
            shift_display: row.shift_type === 'morning' ? 'Ca Sáng' : 'Ca Chiều',
            start_time: row.scheduled_start_time,
            end_time: row.scheduled_end_time
        }));

        console.log(`✅ Lấy ${formattedRows.length} lịch trình`);
        res.json({
            success: true,
            data: formattedRows,
            count: formattedRows.length
        });
    } catch (error) {
        console.error('❌ Error fetching schedules:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/admin-schedules/:id - Lấy thông tin một lịch trình
router.get('/:id', async (req, res) => {
    console.log(`🔹 GET /api/admin-schedules/${req.params.id} - Lấy chi tiết lịch trình`);
    try {
        let { id } = req.params;
        
        // Xử lý ID format - nếu là "CH001" thì lấy số 1
        if (typeof id === 'string' && id.startsWith('CH')) {
            id = parseInt(id.substring(2));
        }
        
        const schedule = await ScheduleService.getScheduleById(id);

        if (!schedule) {
            console.log('❌ Không tìm thấy lịch trình');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch trình'
            });
        }

        const formattedSchedule = {
            ...schedule,
            id: `CH${String(schedule.id).padStart(3, '0')}`,
            schedule_id: schedule.id,
            shift_display: schedule.shift_type === 'morning' ? 'Ca Sáng' : 'Ca Chiều',
            start_time: schedule.scheduled_start_time,
            end_time: schedule.scheduled_end_time
        };

        console.log(`✅ Lấy lịch trình ${formattedSchedule.id}`);
        res.json({
            success: true,
            data: formattedSchedule
        });
    } catch (error) {
        console.error('❌ Error fetching schedule:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST /api/admin-schedules - Thêm lịch trình mới
router.post('/', async (req, res) => {
    console.log('🔹 POST /api/admin-schedules - Thêm lịch trình mới');
    try {
        const scheduleData = {
            driver_id: req.body.driver_id,
            bus_id: req.body.bus_id,
            route_id: req.body.route_id,
            date: req.body.date,
            shift_type: req.body.shift_type,
            scheduled_start_time: req.body.start_time,
            scheduled_end_time: req.body.end_time,
            student_count: req.body.student_count,
            notes: req.body.notes
        };

        // Validate required fields
        if (!scheduleData.driver_id || !scheduleData.bus_id || !scheduleData.route_id || 
            !scheduleData.date || !scheduleData.shift_type || 
            !scheduleData.scheduled_start_time || !scheduleData.scheduled_end_time) {
            console.log('❌ Thiếu thông tin bắt buộc');
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        // ScheduleService.createSchedule sẽ tự động check duplicate (conflict)
        const newSchedule = await ScheduleService.createSchedule(scheduleData);

        console.log(`✅ Thêm lịch trình thành công`);
        res.status(201).json({
            success: true,
            message: 'Thêm lịch trình thành công',
            data: newSchedule
        });
    } catch (error) {
        console.error('❌ Error creating schedule:', error.message);
        // Check if it's a conflict error (duplicate)
        const statusCode = error.message.includes('đã tồn tại') || error.message.includes('Trùng lịch') ? 409 :
                           error.message.includes('Thiếu thông tin') || error.message.includes('không tồn tại') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
});

// PUT /api/admin-schedules/:id - Cập nhật lịch trình
router.put('/:id', async (req, res) => {
    console.log(`🔹 PUT /api/admin-schedules/${req.params.id} - Cập nhật lịch trình`);
    try {
        let { id } = req.params;
        
        // Xử lý ID format
        if (typeof id === 'string' && id.startsWith('CH')) {
            id = parseInt(id.substring(2));
        }
        
        const scheduleData = {
            driver_id: req.body.driver_id,
            bus_id: req.body.bus_id,
            route_id: req.body.route_id,
            date: req.body.date,
            shift_type: req.body.shift_type,
            scheduled_start_time: req.body.start_time,
            scheduled_end_time: req.body.end_time,
            student_count: req.body.student_count,
            status: req.body.status,
            notes: req.body.notes
        };

        const updatedSchedule = await ScheduleService.updateSchedule(id, scheduleData);

        console.log(`✅ Cập nhật lịch trình thành công`);
        res.json({
            success: true,
            message: 'Cập nhật lịch trình thành công',
            data: updatedSchedule
        });
    } catch (error) {
        console.error('❌ Error updating schedule:', error.message);
        const statusCode = error.message.includes('Không tìm thấy') ? 404 :
                           error.message.includes('đã tồn tại') || error.message.includes('Trùng lịch') ? 409 :
                           error.message.includes('không tồn tại') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE /api/admin-schedules/:id - Xóa lịch trình
router.delete('/:id', async (req, res) => {
    console.log(`🔹 DELETE /api/admin-schedules/${req.params.id} - Xóa lịch trình`);
    try {
        let { id } = req.params;

        // Xử lý ID format
        if (typeof id === 'string' && id.startsWith('CH')) {
            id = parseInt(id.substring(2));
        }

        await ScheduleService.deleteSchedule(id);

        console.log(`✅ Xóa lịch trình thành công`);
        res.json({
            success: true,
            message: 'Xóa lịch trình thành công'
        });
    } catch (error) {
        console.error('❌ Error deleting schedule:', error.message);
        const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
});
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

    // Check for conflicts before inserting
    const conflicts = await checkScheduleConflicts(driver_id, bus_id, route_id, date, shift_type, null);
        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: conflicts[0].type,
                details: conflicts[0].message
            });
        }

        const [result] = await pool.execute(`
            INSERT INTO schedules (
                driver_id, bus_id, route_id, date, shift_type,
                scheduled_start_time, scheduled_end_time, student_count, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
        `, [
            driver_id, bus_id, route_id, date, shift_type,
            start_time, end_time, student_count || 0, notes || null
        ]);

        const [newSchedule] = await pool.execute('SELECT * FROM schedules WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Thêm lịch trình thành công',
            data: newSchedule[0]
        });
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm lịch trình',
            error: error.message
        });
    }
});

// PUT /api/admin-schedules/:id - Cập nhật lịch trình
router.put('/:id', async (req, res) => {
    try {
        let { id } = req.params;
        
        // Xử lý ID format
        if (typeof id === 'string' && id.startsWith('CH')) {
            id = parseInt(id.substring(2));
        }
        
        const {
            driver_id,
            bus_id,
            route_id,
            date,
            shift_type,
            start_time,
            end_time,
            student_count,
            status,
            notes
        } = req.body;

        // Check if schedule exists
        const [existing] = await pool.execute('SELECT id FROM schedules WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch trình'
            });
        }

    // Check for conflicts before updating
    const conflicts = await checkScheduleConflicts(driver_id, bus_id, route_id, date, shift_type, id);
        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: conflicts[0].type,
                details: conflicts[0].message
            });
        }

        await pool.execute(`
            UPDATE schedules SET
                driver_id = ?, bus_id = ?, route_id = ?, date = ?, shift_type = ?,
                scheduled_start_time = ?, scheduled_end_time = ?, student_count = ?, status = ?, notes = ?
            WHERE id = ?
        `, [
            driver_id, bus_id, route_id, date, shift_type,
            start_time, end_time, student_count || 0, status || 'scheduled', notes || null,
            id
        ]);

        const [updatedSchedule] = await pool.execute('SELECT * FROM schedules WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Cập nhật lịch trình thành công',
            data: updatedSchedule[0]
        });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật lịch trình',
            error: error.message
        });
    }
});

// DELETE /api/admin-schedules/:id - Xóa lịch trình
router.delete('/:id', async (req, res) => {
    try {
        let { id } = req.params;

        // Xử lý ID format
        if (typeof id === 'string' && id.startsWith('CH')) {
            id = parseInt(id.substring(2));
        }

        // Check if schedule exists
        const [existing] = await pool.execute('SELECT id FROM schedules WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch trình'
            });
        }

        await pool.execute('DELETE FROM schedules WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Xóa lịch trình thành công'
        });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa lịch trình',
            error: error.message
        });
    }
});

export default router;