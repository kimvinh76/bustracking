import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
    url: redisUrl
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected to', redisUrl));

// Kết nối ngay lập tức
(async () => {
    try {
        await redisClient.connect();
    } catch (e) {
        console.error('Redis connection failed:', e);
    }
})();

export default redisClient;
