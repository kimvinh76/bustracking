# 🚀 HƯỚNG DẪN CHI TIẾT - TUẦN 3.5 (5 NGÀY)

## 📅 **KẾ HOẠCH THỰC HIỆN**

### **NGÀY 1-2 (Thứ 6-7): Testing & CORS Setup**

---

##  **BƯỚC 1: Setup Testing Environment**

### **1.1 Kiểm tra cài đặt**
```bash
cd "School Bus/backend"
npm list jest supertest cors
```

 **Kết quả mong đợi:**
```
school-bus-backend@1.0.0
├── jest@30.2.0
├── supertest@7.1.4
└── cors@2.8.5
```

### **1.2 Chạy test đầu tiên**
```bash
npm test
```

 **Kết quả mong đợi:** Tests chạy thành công (có thể fail vì database)

### **1.3 Fix database connection cho testing**

**Tạo file `.env.test`:**
```bash
# School Bus/backend/.env.test
BACKEND_PORT=5001
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=school_bus_db_test  # Database riêng cho testing

FRONTEND_URL=http://localhost:5173
JWT_SECRET=test_secret_key_123456
```

**Tạo database test:**
```bash
mysql -u root -p
```

Trong MySQL:
```sql
CREATE DATABASE IF NOT EXISTS school_bus_db_test;
USE school_bus_db_test;
SOURCE d:/congnghephanmem/github/CNPM_Nhom04/school_bus_db.sql;
```

---

##  **BƯỚC 2: CORS Configuration**

### **2.1 Kiểm tra CORS hiện tại**

File `server.js` đã có CORS:
```javascript
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
    ]
}));
```

 **ĐÃ ĐÚNG!** CORS cho phép frontend (port 5173) gọi backend (port 5000)

### **2.2 Test CORS**

**Cách 1: Dùng curl**
```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:5000/api/buses
```

**Cách 2: Dùng browser console**
```javascript
fetch('http://localhost:5000/api/buses')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('CORS Error:', err));
```

 **Kết quả mong đợi:** Không có lỗi CORS

---

##  **BƯỚC 3: Test với Postman**

### **3.1 Import Postman Collection**

1. Mở Postman
2. Click **Import**
3. Chọn file: `School Bus/backend/postman/School_Bus_API_Collection.json`
4. Click **Import**

### **3.2 Setup Environment**

Trong Postman:
1. Click **Environments** (bên trái)
2. Click **+** để tạo environment mới
3. Đặt tên: **School Bus Local**
4. Thêm variable:
   - `base_url` = `http://localhost:5000/api`
5. Click **Save**
6. Chọn environment này trong dropdown (góc phải trên)

### **3.3 Test từng module**

#### **A. Test Buses API**
```
1. GET All Buses        → Kiểm tra list buses
2. GET Active Buses     → Kiểm tra filter
3. POST Create Bus      → Thêm bus mới
4. PUT Update Bus       → Cập nhật bus
5. DELETE Bus           → Xóa bus test
```

#### **B. Test Drivers API**
```
1. GET All Drivers      → Kiểm tra list drivers
2. POST Create Driver   → Tạo driver + user account
3. GET Driver Details   → Xem driver với schedules
```

#### **C. Test Routes API**
```
1. GET All Routes       → List routes
2. GET Route Stops      → Xem stops của route
3. GET Pickup-Drop Info → Xem điểm đầu/cuối
```

#### **D. Test Schedules API**
```
1. GET All Schedules    → Admin xem tất cả
2. POST Create Schedule → Tạo lịch mới
3. GET Driver Schedules → Driver xem lịch của mình
4. GET Schedule Stops   → Xem stops của lịch
```

### **3.4 Ghi chú kết quả**

Tạo file `TESTING_RESULTS.md`:
```markdown
# Testing Results - Week 3.5

##  Passed Tests
- Buses API: 5/5 endpoints working
- Drivers API: 4/4 endpoints working
- Routes API: 5/5 endpoints working
- Schedules API: 6/6 endpoints working

## ❌ Failed Tests
- None

## 🐛 Bugs Found
- None

## 📝 Notes
- All APIs respond correctly
- CORS working properly
- Validation working as expected
```

---

## 📅 **NGÀY 3-4 (Chủ nhật-Thứ 2): Tracking Infrastructure**

### **BƯỚC 4: Tạo Tracking Tables**

```bash
# Chạy migration SQL
mysql -u root -p school_bus_db < "School Bus/backend/database/tracking_tables.sql"
```

### **BƯỚC 5: Tạo Models cho Tracking**

Tạo file `models/BusLocation.js`:
```javascript
import pool from '../config/db.js';

class BusLocation {
  
  static async create(data) {
    const { bus_id, driver_id, schedule_id, latitude, longitude, speed, heading, accuracy } = data;
    
    const [result] = await pool.execute(
      `INSERT INTO bus_locations (bus_id, driver_id, schedule_id, latitude, longitude, speed, heading, accuracy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [bus_id, driver_id, schedule_id, latitude, longitude, speed, heading, accuracy]
    );
    
    return { id: result.insertId, ...data };
  }
  
  static async findByBus(bus_id, limit = 100) {
    const [rows] = await pool.execute(
      `SELECT * FROM bus_locations WHERE bus_id = ? ORDER BY timestamp DESC LIMIT ?`,
      [bus_id, limit]
    );
    return rows;
  }
  
  static async findLatest(bus_id) {
    const [rows] = await pool.execute(
      `SELECT * FROM bus_locations WHERE bus_id = ? ORDER BY timestamp DESC LIMIT 1`,
      [bus_id]
    );
    return rows[0] || null;
  }
}

export default BusLocation;
```

Tạo file `models/StopArrival.js`:
```javascript
import pool from '../config/db.js';

class StopArrival {
  
  static async create(data) {
    const { schedule_id, stop_id, stop_order, scheduled_time } = data;
    
    const [result] = await pool.execute(
      `INSERT INTO stop_arrivals (schedule_id, stop_id, stop_order, scheduled_time, arrival_status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [schedule_id, stop_id, stop_order, scheduled_time]
    );
    
    return { id: result.insertId, ...data };
  }
  
  static async findBySchedule(schedule_id) {
    const [rows] = await pool.execute(
      `SELECT sa.*, s.name as stop_name, s.latitude, s.longitude
       FROM stop_arrivals sa
       JOIN stops s ON sa.stop_id = s.id
       WHERE sa.schedule_id = ?
       ORDER BY sa.stop_order ASC`,
      [schedule_id]
    );
    return rows;
  }
  
  static async updateETA(schedule_id, stop_id, data) {
    const { estimated_arrival_time, distance_remaining } = data;
    
    await pool.execute(
      `UPDATE stop_arrivals 
       SET estimated_arrival_time = ?, distance_remaining = ?, updated_at = CURRENT_TIMESTAMP
       WHERE schedule_id = ? AND stop_id = ?`,
      [estimated_arrival_time, distance_remaining, schedule_id, stop_id]
    );
  }
  
  static async updateStatus(schedule_id, stop_id, status) {
    const actualTime = status === 'arrived' ? 'NOW()' : 'NULL';
    
    await pool.execute(
      `UPDATE stop_arrivals 
       SET arrival_status = ?, 
           actual_arrival_time = IF(? = 'arrived', NOW(), actual_arrival_time),
           updated_at = CURRENT_TIMESTAMP
       WHERE schedule_id = ? AND stop_id = ?`,
      [status, status, schedule_id, stop_id]
    );
  }
}

export default StopArrival;
```

---

## 📅 **NGÀY 5 (Thứ 3): Documentation**

### **BƯỚC 6: Tạo API Documentation**

Tạo file `API_DOCUMENTATION.md`:
```markdown
# School Bus API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently using plain text passwords (will implement JWT in Week 5)

---

## Buses API

### GET /buses
Get all buses

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

### POST /buses
Create new bus

**Request Body:**
```json
{
  "bus_number": "BUS-001",
  "license_plate": "51K-123.45",
  "capacity": 30,
  "status": "active"
}
```

[... tiếp tục document tất cả endpoints ...]
```

---

## 🎯 **CHECKLIST HOÀN THÀNH**

### **Testing:**
- [x] Jest & Supertest installed
- [ ] Tests running successfully
- [ ] All endpoints tested with Postman
- [ ] Test results documented

### **CORS:**
- [x] CORS configured in server.js
- [ ] Tested from frontend
- [ ] No CORS errors

### **Tracking Infrastructure:**
- [ ] tracking_tables.sql created
- [ ] Tables created in database
- [ ] BusLocation model created
- [ ] StopArrival model created

### **Documentation:**
- [ ] API_DOCUMENTATION.md created
- [ ] Postman collection complete
- [ ] Testing results documented

---

## ❓ **TRẢ LỜI CÂU HỎI**

### **1. Lịch trình có nên để giờ kết thúc sẵn không?**
 **CÓ** - Database bạn đã đúng:
- `scheduled_start_time`: 06:00:00
- `scheduled_end_time`: 07:00:00

**Lý do:**
- Parents cần biết xe về lúc mấy giờ
- Tính ETA cho các stops dựa trên start→end time
- So sánh actual vs scheduled để đánh giá

### **2. Thông tin bus có cần vận tốc không?**
❌ **KHÔNG** - Vận tốc là real-time data:
- Lưu trong `bus_locations` table (mỗi 5-10s)
- Không phải thuộc tính cố định của bus
- Bus không có vận tốc mặc định

### **3. Thông tin tuyến có cần chứa điểm dừng không?**
 **CÓ** - Database bạn ĐÃ ĐÚNG:
```
routes (1) ←→ (N) route_stops ←→ (1) stops
```

### **4. Đang làm đúng hướng chưa?**
 **ĐÚNG 95%!**

**Đúng:**
- 3-layer architecture (Routes→Services→Models)
- Database schema chuẩn
- API endpoints đầy đủ
- CORS configured

**Cần bổ sung:**
- 2 tables tracking (đã tạo SQL sẵn)
- Testing coverage
- API documentation

---

## 📞 **LIÊN HỆ KHI GẶP VẤN ĐỀ**

Nếu gặp lỗi:
1. Check server đang chạy: `npm run dev`
2. Check database connection
3. Check console.log output
4. Xem error message trong Postman

**Bạn đang làm RẤT TỐT! Tiếp tục theo plan này là xong Tuần 3!** 🎉
