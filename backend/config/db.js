// /backend/config/db.js
// 1. Import thư viện (ES6 modules)
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import process from 'process';
// Tải các biến từ tệp .env
dotenv.config();
// 2. Cấu hình SSL cho Cloud Database (TiDB)
const isProduction = process.env.NODE_ENV === 'production';
const sslConfig = isProduction ? { rejectUnauthorized: true } : undefined;
// 3. Tạo Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_bus_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000,
    timezone: '+07:00',
    dateStrings: true,
    ssl: sslConfig, // Bật SSL khi chạy trên Cloud (production)
});
// 4. (Tùy chọn) Hàm kiểm tra kết nối nhanh
async function checkConnection() {
    try {
        const connection = await pool.getConnection();
        console.log(" Kết nối CSDL MySQL thành công!");
        connection.release();
    } catch (err) {
        console.error(" Kết nối CSDL MySQL thất bại:", err.message);
    }
}
// 5. Chạy hàm kiểm tra khi khởi động
checkConnection();
// 6. Xuất (export) pool để các tệp khác có thể dùng
export default pool;