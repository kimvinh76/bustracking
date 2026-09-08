import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Thiết lập đường dẫn
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.join(__dirname, '..');
const rootDir = path.join(backendDir, '..');

// Đọc cấu hình từ .env của backend
dotenv.config({ path: path.join(backendDir, '.env') });

async function runMigration() {
    // 1. Lấy tên file từ command line (ví dụ: node scripts/runMigration.js test.sql)
    const fileName = process.argv[2];

    if (!fileName) {
        console.error('LỖI: Vui lòng cung cấp tên file SQL. Ví dụ: node scripts/runMigration.js test.sql');
        process.exit(1);
    }

    // 2. Tìm đường dẫn file SQL trong thư mục database/migrations/
    const sqlFilePath = path.join(rootDir, 'database', 'migrations', fileName);
    
    if (!fs.existsSync(sqlFilePath)) {
        console.error(`LỖI: Không tìm thấy file "${fileName}" tại ${sqlFilePath}`);
        process.exit(1);
    }

    console.log(`Đang đọc file: ${sqlFilePath}`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    // 3. Khởi tạo kết nối đặc biệt với multipleStatements: true
    console.log('Đang kết nối Database...');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'school_bus_db',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true // Quan trọng: Cho phép chạy nhiều lệnh SQL cùng lúc
        });

        console.log('Kết nối thành công. Đang chạy Script...');
        
        // 4. Chạy script SQL
        await connection.query(sqlContent);
        
        console.log(`\n==============================================`);
        console.log(` THÀNH CÔNG: Đã chạy xong file ${fileName}!`);
        console.log(`==============================================\n`);

    } catch (error) {
        console.error(`\n==============================================`);
        console.log(` THẤT BẠI: Lỗi khi chạy file ${fileName}`);
        console.error(` Chi tiết lỗi:`, error.message);
        console.error(`==============================================\n`);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Đã đóng kết nối Database.');
        }
        process.exit(0);
    }
}

runMigration();
