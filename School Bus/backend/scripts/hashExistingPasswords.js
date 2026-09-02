import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

async function hashExistingPasswords() {
    console.log('--- STARTING PASSWORD HASHING MIGRATION ---');
    try {
        // Lấy tất cả user
        const [users] = await pool.execute('SELECT id, username, password FROM users');
        
        let count = 0;
        for (const user of users) {
            // Kiểm tra xem password đã được hash chưa (bcrypt hash thường bắt đầu bằng $2a$, $2b$, hoặc $2y$)
            if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$') && !user.password.startsWith('$2y$')) {
                console.log(`Hashing password for user: ${user.username} (ID: ${user.id})`);
                
                // Hash the plaintext password
                const hashedPassword = bcrypt.hashSync(user.password, 10);
                
                // Cập nhật lại vào database
                await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
                count++;
            }
        }
        
        console.log(`--- MIGRATION COMPLETE ---`);
        console.log(`Successfully hashed passwords for ${count} users.`);
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

hashExistingPasswords();
