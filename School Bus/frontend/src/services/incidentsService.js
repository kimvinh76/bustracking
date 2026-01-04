import api from './api.js';

export const incidentsService = {
  // Tạo báo cáo sự cố mới
  async createIncident(incidentData) {
    try {
      const response = await api.post('/incidents/create', incidentData);
      console.log('API success response:', response);
      return response;
    } catch (error) {
      console.error('Service error:', error);
      // Trả về error response với cấu trúc nhất quán
      return {
        success: false,
        message: error.message || 'Lỗi kết nối server'
      };
    }
  },

  // Lấy danh sách sự cố (admin)
  async getIncidents(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      
      console.log('Getting incidents with URL:', `/incidents?${params}`);
      const response = await api.get(`/incidents?${params}`);
      console.log('Get incidents response:', response);
      return response;
    } catch (error) {
      console.error('Get incidents error:', error);
      return {
        success: false,
        message: error.message || 'Lỗi kết nối server',
        incidents: []
      };
    }
  },

  // Lấy sự cố theo tuyến (parent)
  async getIncidentsByRoute(routeId, status = '') {
    try {
      console.log('Getting incidents for route:', routeId);
      const response = await api.get(`/incidents/route/${routeId}?status=${status}`);
      console.log('Route incidents response:', response);
      return response;
    } catch (error) {
      console.error('Get route incidents error:', error);
      return {
        success: false,
        message: error.message || 'Lỗi kết nối server',
        incidents: []
      };
    }
  },

  // Cập nhật trạng thái sự cố
  async updateIncidentStatus(incidentId, status, adminNotes = '') {
    const response = await api.put(`/incidents/${incidentId}/status`, {
      status,
      admin_notes: adminNotes
    });
    return response.data;
  }
};