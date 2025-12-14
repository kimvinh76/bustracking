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
                time: null
            };
        }).sort((a, b) => a.stop_order - b.stop_order);
    },

    // Tính thời gian dự kiến cho các điểm dừng
    calculateStopTimes: (stops, startTime = '06:00', avgSpeedKmH = 25) => {
        if (!stops || stops.length === 0) return stops;

        const [startHour, startMinute] = startTime.split(':').map(Number);
        let currentMinutes = startHour * 60 + startMinute;

        return stops.map((stop, index) => {
            if (index === 0) {
                return { ...stop, time: startTime };
            }

            const prevStop = stops[index - 1];
            const distance = calculateDistance(
                prevStop.lat, prevStop.lng,
                stop.lat, stop.lng
            );

            // Thời gian di chuyển (phút)
            const travelTimeMinutes = Math.ceil((distance / avgSpeedKmH) * 60);
            
            // Thêm thời gian dừng đón (trừ điểm đầu và cuối)
            const stopTimeMinutes = stop.isStartOrEnd ? 0 : 3;
            
            currentMinutes += travelTimeMinutes + stopTimeMinutes;
            
            const hour = Math.floor(currentMinutes / 60);
            const minute = currentMinutes % 60;
            const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

            return { ...stop, time };
        });
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

// Helper: Tính khoảng cách giữa 2 điểm (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

export default routesService;
