// src/services/routesService.js

import apiClient from './api.js';

const ENDPOINT = '/routes';

export const routesService = {
    // Lấy tất cả tuyến
    getAllRoutes: async () => {
        try {
            console.log(' Calling GET /routes...');
            const response = await apiClient.get(ENDPOINT);
            console.log(' Response from interceptor:', response);
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error(' Error fetching routes:', error);
            throw error;
        }
    },

    // Lấy một tuyến theo ID
    getRouteById: async (id) => {
        try {
            const response = await apiClient.get(`${ENDPOINT}/${id}`);
            return response;
        } catch (error) {
            console.error(' Error fetching route:', error);
            throw error;
        }
    },

    // Tạo tuyến mới
    createRoute: async (routeData) => {
        try {
            const response = await apiClient.post(ENDPOINT, routeData);
            return response;
        } catch (error) {
            console.error(' Error creating route:', error);
            throw error;
        }
    },

    // Cập nhật tuyến
    updateRoute: async (id, routeData) => {
        try {
            const response = await apiClient.put(`${ENDPOINT}/${id}`, routeData);
            return response;
        } catch (error) {
            console.error(' Error updating route:', error);
            throw error;
        }
    },

    // Xóa tuyến
    deleteRoute: async (id) => {
        try {
            const response = await apiClient.delete(`${ENDPOINT}/${id}`);
            return response;
        } catch (error) {
            console.error(' Error deleting route:', error);
            throw error;
        }
    },

    // Lấy điểm dừng của tuyến
    getRouteStops: async (routeId) => {
        try {
            console.log(' Calling GET /routes/' + routeId + '/stops...');
            const response = await apiClient.get(`${ENDPOINT}/${routeId}/stops`);
            console.log(' Route stops response:', response);
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error(' Error fetching route stops:', error);
            throw error;
        }
    },

    // Tính lại quãng đường tuyến dựa trên route_stops và lưu vào DB
    recalculateRouteDistance: async (routeId) => {
        try {
            const response = await apiClient.put(`${ENDPOINT}/${routeId}/recalculate-distance`);
            return response;
        } catch (error) {
            console.error(' Error recalculating route distance:', error);
            throw error;
        }
    },

    // Transform stops từ DB sang format cho map
    transformStopsForMap: (stops) => {
        if (!Array.isArray(stops)) return [];
        
        return stops.map((stop) => {
            const isStart = stop.stop_order === 0;
            const isEnd = stop.stop_order === 99;
            
            return {
                id: stop.stop_id,
                name: stop.name,
                address: stop.address,
                lat: parseFloat(stop.latitude),
                lng: parseFloat(stop.longitude),
                stop_order: stop.stop_order,
                student_pickup_count: stop.student_pickup_count || 0,
                students: [],
                isStartOrEnd: isStart || isEnd,
                time: null // Thời gian sẽ được lấy từ Backend nếu có
            };
        }).sort((a, b) => a.stop_order - b.stop_order);
    },

    // Validate dữ liệu tuyến trước khi gửi lên API
    validateRouteData: (data) => {
        const errors = {};

        if (!data.route_name?.trim()) {
            errors.route_name = 'Tên tuyến là bắt buộc';
        }

        if (data.distance !== undefined && (isNaN(data.distance) || data.distance < 0)) {
            errors.distance = 'Khoảng cách phải là số dương';
        }

        const validStatuses = ['active', 'inactive'];
        if (data.status && !validStatuses.includes(data.status)) {
            errors.status = `Trạng thái không hợp lệ. Chỉ có thể là: ${validStatuses.join(', ')}`;
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// Helper: Validate
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

export default routesService;
