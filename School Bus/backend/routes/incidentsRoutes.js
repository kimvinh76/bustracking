import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Tạo sự cố mới
router.post('/create', async (req, res) => {
    try {
        const { driver_id, bus_id, route_id, incident_type, description, latitude, longitude, severity } = req.body;

        if (!driver_id || !incident_type || !description) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu thông tin bắt buộc: driver_id, incident_type, description' 
            });
        }

        // Chuyển undefined thành null để MySQL chấp nhận
        const [result] = await pool.execute(
            `INSERT INTO incidents (driver_id, bus_id, route_id, incident_type, description, 
             latitude, longitude, severity, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
            [
                driver_id, 
                bus_id || null, 
                route_id || null, 
                incident_type, 
                description, 
                latitude || null, 
                longitude || null, 
                severity || 'medium'
            ]
        );

        // Lấy sự cố vừa tạo để trả về với thông tin đầy đủ
        const [incident] = await pool.execute(
            `SELECT i.*, d.name as driver_name, b.bus_number, r.route_name 
             FROM incidents i
             LEFT JOIN drivers d ON i.driver_id = d.id
             LEFT JOIN buses b ON i.bus_id = b.id
             LEFT JOIN routes r ON i.route_id = r.id
             WHERE i.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Báo cáo sự cố đã được tạo thành công',
            incident: incident[0]
        });
    } catch (error) {
        console.error('Lỗi tạo sự cố:', error);
        console.error('Chi tiết lỗi:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi tạo sự cố: ' + error.message 
        });
    }
});

// Lấy danh sách sự cố (cho admin)
router.get('/', async (req, res) => {
    try {
        const { status, severity, route_id, limit = 50, offset = 0 } = req.query;
        
        let query = `
            SELECT i.*, d.name as driver_name, d.phone as driver_phone, 
                   b.bus_number, r.route_name
            FROM incidents i
            LEFT JOIN drivers d ON i.driver_id = d.id
            LEFT JOIN buses b ON i.bus_id = b.id
            LEFT JOIN routes r ON i.route_id = r.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND i.status = ?';
            params.push(status);
        }
        if (severity) {
            query += ' AND i.severity = ?';
            params.push(severity);
        }
        if (route_id) {
            query += ' AND i.route_id = ?';
            params.push(route_id);
        }

        query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [incidents] = await pool.execute(query, params);

        // Đếm tổng số sự cố để phân trang
        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM incidents i WHERE 1=1' + 
            (status ? ' AND i.status = ?' : '') +
            (severity ? ' AND i.severity = ?' : '') +
            (route_id ? ' AND i.route_id = ?' : ''),
            params.slice(0, -2) // Loại bỏ limit và offset
        );

        res.json({
            success: true,
            incidents,
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: countResult[0].total > parseInt(offset) + parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách sự cố:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi lấy danh sách sự cố' 
        });
    }
});

// Lấy sự cố theo route_id (cho parent)
router.get('/route/:routeId', async (req, res) => {
    try {
        const { routeId } = req.params;
        const { status = 'pending,investigating' } = req.query;
        
        const statusList = status.split(',').map(s => s.trim());
        const placeholders = statusList.map(() => '?').join(',');
        
        const [incidents] = await pool.execute(
            `SELECT i.*, d.name as driver_name, b.bus_number, r.route_name
             FROM incidents i
             LEFT JOIN drivers d ON i.driver_id = d.id
             LEFT JOIN buses b ON i.bus_id = b.id
             LEFT JOIN routes r ON i.route_id = r.id
             WHERE i.route_id = ? AND i.status IN (${placeholders})
             ORDER BY i.created_at DESC
             LIMIT 10`,
            [routeId, ...statusList]
        );

        res.json({
            success: true,
            incidents
        });
    } catch (error) {
        console.error('Lỗi lấy sự cố theo route:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi lấy sự cố theo tuyến' 
        });
    }
});

// Cập nhật trạng thái sự cố (cho admin)
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu trạng thái cần cập nhật'
            });
        }

        const validStatuses = ['pending', 'investigating', 'resolved', 'dismissed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        await pool.execute(
            `UPDATE incidents SET status = ?, admin_notes = ?, resolved_at = ${status === 'resolved' ? 'NOW()' : 'resolved_at'}
             WHERE id = ?`,
            [status, admin_notes, id]
        );

        res.json({
            success: true,
            message: 'Đã cập nhật trạng thái sự cố'
        });
    } catch (error) {
        console.error('Lỗi cập nhật sự cố:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi cập nhật sự cố' 
        });
    }
});

export default router;