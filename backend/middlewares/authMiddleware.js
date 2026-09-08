import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const authMiddleware = (req, res, next) => {
    // Lấy token từ header 'Authorization'
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Không tìm thấy Token. Vui lòng đăng nhập!' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Xác thực token
        const secret = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';
        const decoded = jwt.verify(token, secret);
        
        // Gắn thông tin user vào request để các route khác có thể sử dụng
        req.user = decoded;
        next();
    } catch (error) {
        console.error(' JWT Verification Error:', error.message);
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

export default authMiddleware;
