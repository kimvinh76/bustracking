// ===================================
// TEST FILE: API Routes Testing
// ===================================
// Mục đích: Test tất cả endpoints để đảm bảo hoạt động đúng
// ===================================

import request from 'supertest';
import express from 'express';
import busesRoutes from '../routes/BusesRoutes.js';
import driversRoutes from '../routes/driversRoutes.js';
import routeRoutes from '../routes/routeRoutes.js';

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/buses', busesRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/routes', routeRoutes);

// ===================================
// TEST SUITE: Buses API
// ===================================
describe('Buses API', () => {
  
  test('GET /api/buses - Should return all buses', async () => {
    const response = await request(app)
      .get('/api/buses')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('count');
  });
  
  test('GET /api/buses/active - Should return active buses only', async () => {
    const response = await request(app)
      .get('/api/buses/active')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    
    // Kiểm tra tất cả buses đều có status = 'active'
    response.body.data.forEach(bus => {
      expect(bus.status).toBe('active');
    });
  });
  
  test('POST /api/buses - Should create new bus', async () => {
    const newBus = {
      bus_number: 'BUS-TEST-001',
      license_plate: '51K-TEST-001',
      capacity: 30,
      status: 'active'
    };
    
    const response = await request(app)
      .post('/api/buses')
      .send(newBus)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.bus_number).toBe(newBus.bus_number);
  });
  
  test('POST /api/buses - Should fail with missing fields', async () => {
    const invalidBus = {
      bus_number: 'BUS-TEST-002'
      // Missing license_plate and capacity
    };
    
    const response = await request(app)
      .post('/api/buses')
      .send(invalidBus)
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Thiếu thông tin');
  });
});

// ===================================
// TEST SUITE: Drivers API
// ===================================
describe('Drivers API', () => {
  
  test('GET /api/drivers - Should return all drivers', async () => {
    const response = await request(app)
      .get('/api/drivers')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
  
  test('POST /api/drivers - Should create new driver with user account', async () => {
    const newDriver = {
      name: 'Test Driver',
      phone: '0999999999',
      license_number: 'TEST-LICENSE-001',
      address: 'Test Address',
      status: 'active'
    };
    
    const response = await request(app)
      .post('/api/drivers')
      .send(newDriver)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('user_id');
    expect(response.body.data.name).toBe(newDriver.name);
  });
});

// ===================================
// TEST SUITE: Routes API
// ===================================
describe('Routes API', () => {
  
  test('GET /api/routes - Should return all routes', async () => {
    const response = await request(app)
      .get('/api/routes')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
  
  test('GET /api/routes/:id/stops - Should return stops for a route', async () => {
    // Giả sử route ID=1 tồn tại trong database
    const response = await request(app)
      .get('/api/routes/1/stops')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('count');
  });
});

// ===================================
// NOTE: Để chạy test:
// 1. npm test
// 2. npm test -- --coverage (để xem code coverage)
// 3. npm test -- routes.test.js (chạy file này)
// ===================================
