// /backend/routes/authRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import AuthService from '../services/authService.js';
import DriverModel from '../models/Driver.js';

const router = express.Router();

// Endpoint: POST /api/auth/login
router.post('/login', async (req, res) => {
    console.log(' POST /api/auth/login - Đăng nhập');
    const { username, password } = req.body;

    // 1. Kiểm tra đầu vào
    if (!username || !password) {
        console.log(' Thiếu username hoặc password');
        return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    }

    try {
        // 2. Sử dụng AuthService để xác thực
        const result = await AuthService.login({ identifier: username, password });
        
        // 3. Nếu là driver, lấy thêm driver_id từ bảng drivers
        let driverId = null;
        if (result.user.role === 'driver') {
            const driver = await DriverModel.findByUserId(result.user.id);
            if (driver) {
                driverId = driver.id;
            }
        }

        // 4. Tạo JWT Token
        const token = jwt.sign(
            { id: result.user.id, username: result.user.username, role: result.user.role },
            process.env.JWT_SECRET || 'YOUR_SECRET_KEY',
            { expiresIn: '1h' }
        );

        console.log(` Đăng nhập thành công: ${result.user.username} (${result.user.role})`);
        
        // 5. Trả về token và thông tin người dùng
        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: result.user.id,
                username: result.user.username,
                email: result.user.email,
                role: result.user.role,
                driverId: driverId
            }
        });

    } catch (error) {
        console.error(' Lỗi đăng nhập:', error.message);
        const statusCode = error.message.includes('không tồn tại') || error.message.includes('không chính xác') ? 401 : 500;
        res.status(statusCode).json({ message: error.message });
    }
});

export default router;