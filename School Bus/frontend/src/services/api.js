// src/services/api.js

import axios from 'axios';

// Base API URL - có thể config từ environment
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor để thêm auth token (nếu cần)
apiClient.interceptors.request.use(
    (config) => {
        // Có thể thêm auth token ở đây
        // const token = localStorage.getItem('authToken');
        // if (token) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor để handle errors
apiClient.interceptors.response.use(
    (response) => {
        // Chuẩn hóa response - luôn trả về payload trực tiếp
        const responseBody = response.data;
        
        // Đối với incidents API, giữ nguyên response để có success field
        if (response.config.url?.includes('/incidents')) {
            return responseBody;
        }
        
        // Nếu backend trả về format { success: true, data: [...] }
        if (responseBody && typeof responseBody === 'object' && 'success' in responseBody && responseBody.data) {
            return responseBody.data;
        }
        
        // Nếu backend có nested data, unwrap nó
        if (responseBody?.data && !('success' in responseBody)) {
            return responseBody.data;
        }
        
        // Trả về payload trực tiếp
        return responseBody;
    },
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.error('Unauthorized access');
        } else if (error.response?.status === 404) {
            console.error('Resource not found');
        } else if (error.response?.status >= 500) {
            console.error('Server error');
        }
        
        // Trả về error response thay vì reject để service có thể xử lý
        return Promise.reject(error.response?.data || { 
            success: false, 
            message: error.message || 'Network error'
        });
    }
);

export default apiClient;