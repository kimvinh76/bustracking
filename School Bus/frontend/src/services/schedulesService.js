// src/services/schedulesService.js
import apiClient from './api.js';

const ENDPOINT = '/schedules';

export const schedulesService = {
    // Lấy tất cả lịch trình (Admin)
    getAllSchedules: async () => {
        try {
            const response = await apiClient.get('/admin-schedules');
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error('Error fetching schedules:', error);
            throw error;
        }
    },

    // Lấy lịch làm việc của driver
    getDriverSchedules: async (driverId, params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${ENDPOINT}/driver/${driverId}` + (queryString ? `?${queryString}` : '');
            const response = await apiClient.get(url);
            
            // Response đã được interceptor chuẩn hóa
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error('Error fetching driver schedules:', error);
            throw error;
        }
    },

    // Lấy chi tiết một lịch làm việc (cho driver)
    getScheduleById: async (id, driverId = 1) => {
        try {
            const raw = await apiClient.get(`${ENDPOINT}/${driverId}/${id}`);
            // Chuẩn hóa key từ snake_case -> camelCase cho frontend
            const normalized = {
                id: raw.id,
                driverId: raw.driver_id,
                busId: raw.bus_id,
                busNumber: raw.bus_number || raw.license_plate,
                routeId: raw.route_id,
                routeName: raw.route_name,
                startTime: raw.start_time,
                endTime: raw.end_time,
                shiftType: raw.shift_type,
                status: raw.status,
                notes: raw.notes,
                studentCount: raw.studentCount,
                students: raw.students || []
            };
            return normalized;
        } catch (error) {
            console.error('Error fetching schedule detail:', error);
            throw error;
        }
    },

    // Lấy chi tiết một lịch trình (cho admin)
    getAdminScheduleById: async (id) => {
        try {
            const response = await apiClient.get(`/admin-schedules/${id}`);
            return response;
        } catch (error) {
            console.error('Error fetching admin schedule detail:', error);
            throw error;
        }
    },

    // Tạo lịch trình mới
    createSchedule: async (data) => {
        try {
            const response = await apiClient.post('/admin-schedules', data);
            return response;
        } catch (error) {
            console.error('Error creating schedule:', error);
            throw error;
        }
    },

    // Cập nhật lịch trình
    updateSchedule: async (id, data) => {
        try {
            const response = await apiClient.put(`/admin-schedules/${id}`, data);
            return response;
        } catch (error) {
            console.error('Error updating schedule:', error);
            throw error;
        }
    },

    // Xóa lịch trình
    deleteSchedule: async (id) => {
        try {
            const response = await apiClient.delete(`/admin-schedules/${id}`);
            return response;
        } catch (error) {
            console.error('Error deleting schedule:', error);
            throw error;
        }
    },

    // Cập nhật trạng thái lịch làm việc (và actualEndTime nếu có)
    updateScheduleStatus: async (id, status, notes = null, extra = {}) => {
        try {
            const payload = {
                status,
                notes,
                ...extra
            };
            const response = await apiClient.put(`${ENDPOINT}/${id}/status`, payload);
            return response;
        } catch (error) {
            console.error('Error updating schedule status:', error);
            throw error;
        }
    },

 

    // Lấy danh sách điểm dừng thực tế cho một lịch trình
    getScheduleStops: async (driverId, scheduleId) => {
        try {
            const response = await apiClient.get(`${ENDPOINT}/driver/${driverId}/stops/${scheduleId}`);
            // Response đã được interceptor chuẩn hóa
            if (response && Array.isArray(response.stops)) {
                return response;
            }
            return { stops: [] };
        } catch (error) {
            console.error('Error fetching schedule stops:', error);
            throw error;
        }
    },


};

export default schedulesService;
