// /backend/routes/incidentsRoutes.js
import express from 'express';
import IncidentService from '../services/incidentService.js';

const router = express.Router();

// Tạo sự cố mới
router.post('/create', async (req, res) => {
    console.log('🔹 POST /api/incidents/create - Tạo sự cố mới');
    try {
        const incidentData = req.body;
        const incident = await IncidentService.createIncident(incidentData);
        
        console.log(`✅ Báo cáo sự cố đã được tạo thành công: ${incident.incident_type}`);
        res.status(201).json({
            success: true,
            message: 'Báo cáo sự cố đã được tạo thành công',
            incident: incident
        });
    } catch (error) {
        console.error('❌ Lỗi tạo sự cố:', error.message);
        const statusCode = error.message.includes('Thiếu thông tin') || error.message.includes('không tồn tại') ? 400 : 500;
        res.status(statusCode).json({ 
            success: false, 
            message: error.message
        });
    }
});

// Lấy danh sách sự cố (cho admin)
router.get('/', async (req, res) => {
    console.log('🔹 GET /api/incidents - Lấy danh sách sự cố');
    try {
        const { status, severity, route_id, limit = 50, offset = 0 } = req.query;
        
        // Lấy theo filter
        let incidents;
        if (status) {
            incidents = await IncidentService.getIncidentsByStatus(status);
        } else if (severity) {
            incidents = await IncidentService.getIncidentsBySeverity(severity);
        } else if (route_id) {
            incidents = await IncidentService.getIncidentsByRoute(route_id);
        } else {
            incidents = await IncidentService.getAllIncidents();
        }

        // Pagination
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedIncidents = incidents.slice(startIndex, endIndex);

        console.log(`✅ Lấy ${paginatedIncidents.length}/${incidents.length} sự cố`);
        res.json({
            success: true,
            incidents: paginatedIncidents,
            pagination: {
                total: incidents.length,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: incidents.length > endIndex
            }
        });
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách sự cố:', error.message);
        res.status(500).json({ 
            success: false, 
            message: error.message
        });
    }
});

// Lấy sự cố theo route_id (cho parent)
router.get('/route/:routeId', async (req, res) => {
    console.log(`🔹 GET /api/incidents/route/${req.params.routeId} - Lấy sự cố theo tuyến`);
    try {
        const { routeId } = req.params;
        const { status = 'reported,in_progress' } = req.query;
        
        // Lấy sự cố theo route
        const allIncidents = await IncidentService.getIncidentsByRoute(routeId);
        
        // Filter theo status
        const statusList = status.split(',').map(s => s.trim());
        const filteredIncidents = allIncidents
            .filter(incident => statusList.includes(incident.status))
            .slice(0, 10); // Limit 10

        console.log(`✅ Lấy ${filteredIncidents.length} sự cố của tuyến`);
        res.json({
            success: true,
            incidents: filteredIncidents
        });
    } catch (error) {
        console.error('❌ Lỗi lấy sự cố theo route:', error.message);
        res.status(500).json({ 
            success: false, 
            message: error.message
        });
    }
});

// Cập nhật trạng thái sự cố (cho admin)
router.put('/:id/status', async (req, res) => {
    console.log(`🔹 PUT /api/incidents/${req.params.id}/status - Cập nhật trạng thái sự cố`);
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;

        if (!status) {
            console.log('❌ Thiếu trạng thái cần cập nhật');
            return res.status(400).json({
                success: false,
                message: 'Thiếu trạng thái cần cập nhật'
            });
        }

        const validStatuses = ['reported', 'in_progress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
            console.log('❌ Trạng thái không hợp lệ');
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        await IncidentService.updateIncidentStatus(id, status, admin_notes);
        console.log(`✅ Đã cập nhật trạng thái sự cố thành ${status}`);
        
        res.json({
            success: true,
            message: 'Đã cập nhật trạng thái sự cố'
        });
    } catch (error) {
        console.error('❌ Lỗi cập nhật sự cố:', error.message);
        const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
        res.status(statusCode).json({ 
            success: false, 
            message: error.message
        });
    }
}); 
        });
    }
});

export default router;