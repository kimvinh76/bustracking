// /backend/server.js

import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import http from 'http';
import process from 'process';
import pool from './config/db.js';
import redisClient from './config/redis.js';
import { corsOriginValidator } from './config/cors.js';
import busRoutes from './routes/BusesRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import stopsRoutes from './routes/stopsRoutes.js';
import studentsRoutes from './routes/studentsRoutes.js';
import driversRoutes from './routes/driversRoutes.js';
import parentsRoutes from './routes/parentsRoutes.js';
import classesRoutes from './routes/classesRoutes.js';
import schedulesRoutes from './routes/schedulesRoutes.js';
import adminschedulesRoutes from './routes/adminschedulesRoutes.js';
import userRoutes  from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import incidentsRoutes from './routes/incidentsRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import busTrackingSocket from './websocket/busTrackingSocket.js';

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;

const healthLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many health check requests, please try again later.' }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau.' }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: corsOriginValidator,
    credentials: true
}));


// check health
app.get('/api/health', healthLimiter, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        connection.release();

        let redisStatus = 'disconnected';
        try {
            if (redisClient.isReady) {
                const pong = await redisClient.ping();
                if (pong === 'PONG') redisStatus = 'connected';
            }
        } catch {
            redisStatus = 'disconnected';
        }

        res.json({
            success: true,
            message: 'Server and database are healthy',
            database: 'connected',
            redis: redisStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
    }
});

// Import authMiddleware & requireRole
import authMiddleware, { requireRole } from './middlewares/authMiddleware.js';

// Rate limit API endpoints
app.use('/api', apiLimiter);

// API Routes
app.use("/api/auth", authLimiter, authRoutes); // Auth route must be public

// Apply authMiddleware to all routes below
app.use(authMiddleware);

app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stops', stopsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/parents', parentsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/admin-schedules', requireRole('admin'), adminschedulesRoutes);
app.use("/api/users", requireRole('admin'), userRoutes);
app.use("/api/incidents", incidentsRoutes);
app.use('/api/tracking', trackingRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Global JSON error handler (malformed JSON, CORS rejection, etc.)
app.use((err, req, res, _next) => {
    const status = err?.status || err?.statusCode || 500;
    console.error('Unhandled Express Error:', err?.message || err);
    res.status(status).json({
        success: false,
        message: err?.message || 'Lỗi hệ thống không xác định',
    });
});

// Initialize WebSocket
busTrackingSocket.init(server);

// Start server
server.on('error', (error) => {
    console.error('Server failed to start:', error?.message || error);
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});