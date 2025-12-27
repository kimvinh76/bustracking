# 🔄 LUỒNG XỬ LÝ HOÀN CHỈNH: TẠO XE BUS MỚI

## 📚 MỤC LỤC
1. [Tổng quan luồng xử lý](#1-tổng-quan-luồng-xử-lý)
2. [Chi tiết từng bước](#2-chi-tiết-từng-bước)
3. [Code thực tế trong dự án](#3-code-thực-tế-trong-dự-án)
4. [HTTP Request/Response](#4-http-requestresponse)
5. [Debugging và hiểu lỗi](#5-debugging-và-hiểu-lỗi)

---

## 1. TỔNG QUAN LUỒNG XỬ LÝ

### Sơ đồ tổng quát

```
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 1: FRONTEND (React)                                             │
│  User nhấn nút "Tạo xe bus"                                           │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              │ HTTP POST Request
              │ URL: http://localhost:5000/api/buses
              │ Body: { "bus_number": "B01", "license_plate": "30A-12345" }
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 2: SERVER KHỞI ĐỘNG (server.js)                                │
│  Express.js lắng nghe port 5000                                       │
│  Nhận HTTP request                                                    │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              │ Router matching: /api/buses → busRoutes
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 3: ROUTES (BusesRoutes.js)                                     │
│  router.post('/', ...)                                                │
│  - Parse request body                                                 │
│  - Gọi BusService.createBus()                                         │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              │ Service call
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 4: SERVICES (busService.js)                                    │
│  BusService.createBus(busData)                                        │
│  - Validation (kiểm tra dữ liệu)                                      │
│  - Business rules (kiểm tra trùng biển số)                            │
│  - Format data (viết hoa biển số)                                     │
│  - Gọi BusModel.create()                                              │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              │ Model call
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 5: MODELS (Bus.js)                                             │
│  BusModel.create(busData)                                             │
│  - Tạo SQL query                                                      │
│  - Execute query qua connection pool                                  │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              │ SQL Query
              │ INSERT INTO buses (bus_number, license_plate, status) 
              │ VALUES ('B01', '30A-12345', 'active')
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 6: DATABASE (MySQL)                                            │
│  - Nhận query                                                         │
│  - Insert record vào table buses                                      │
│  - Trả về ID của record vừa tạo                                       │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              │ Result: insertId = 10
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 7: MODELS (Bus.js) - Tiếp                                      │
│  BusModel.findById(10)                                                │
│  - SELECT * FROM buses WHERE id = 10                                  │
│  - Lấy thông tin xe bus vừa tạo                                       │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              │ Return bus object
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 8: SERVICES (busService.js) - Tiếp                             │
│  - Nhận bus object từ Model                                           │
│  - Return về Routes                                                   │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              │ Return newBus
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 9: ROUTES (BusesRoutes.js) - Tiếp                              │
│  - Nhận newBus từ Service                                             │
│  - Tạo HTTP Response                                                  │
│  - res.status(201).json({ success: true, data: newBus })             │
└─────────────┬────────────────────────────────────────────────────────┘
              │
              │ HTTP Response
              │ Status: 201 Created
              │ Body: { "success": true, "data": {...} }
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 10: FRONTEND (React) - Tiếp                                    │
│  - Nhận response                                                      │
│  - Cập nhật UI (hiển thị xe bus mới)                                 │
│  - Hiển thị thông báo "Tạo xe bus thành công"                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. CHI TIẾT TỪNG BƯỚC

### BƯỚC 1: FRONTEND GỬI REQUEST

#### Code Frontend (React)

```jsx
// File: School Bus/src/pages/admin/BusesPage.jsx (giả định)

const handleCreateBus = async (busData) => {
  try {
    // 🔥 ĐÂY LÀ LÚC USER NHẤN NÚT "TẠO XE BUS"
    const response = await fetch('http://localhost:5000/api/buses', {
      method: 'POST',                           // HTTP Method
      headers: {
        'Content-Type': 'application/json',     // Kiểu dữ liệu gửi
      },
      body: JSON.stringify({                    // Dữ liệu gửi đi
        bus_number: 'B01',
        license_plate: '30A-12345',
        status: 'active'
      })
    });

    const data = await response.json();         // Parse response
    
    if (data.success) {
      alert('Tạo xe bus thành công!');
      // Cập nhật danh sách xe bus trên UI
    }
  } catch (error) {
    console.error('Lỗi:', error);
  }
};
```

#### HTTP Request được tạo ra

```http
POST /api/buses HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Content-Length: 78

{
  "bus_number": "B01",
  "license_plate": "30A-12345",
  "status": "active"
}
```

**Giải thích:**
- **POST**: Method để tạo mới
- **/api/buses**: Endpoint (đường dẫn)
- **Host**: Server nhận request
- **Body**: Dữ liệu JSON

---

### BƯỚC 2: SERVER NHẬN REQUEST

#### File: server.js

```javascript
// School Bus/backend/server.js

import express from 'express';
import busRoutes from './routes/BusesRoutes.js';

const app = express();
const PORT = 5000;

// ✅ MIDDLEWARE 1: Parse JSON body
app.use(express.json());  // ← Chuyển body thành req.body object

// ✅ MIDDLEWARE 2: CORS (cho phép frontend gọi API)
app.use(cors({
  origin: 'http://localhost:5173'  // Frontend URL
}));

// ✅ MIDDLEWARE 3: Mount routes
app.use('/api/buses', busRoutes);  
// ↑ Nghĩa là: Tất cả request bắt đầu với /api/buses 
//            sẽ được xử lý bởi busRoutes

// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

**Luồng xử lý trong server.js:**

```
Request: POST /api/buses
    ↓
1. express.json() → Parse body thành req.body
    ↓
2. cors() → Kiểm tra origin có hợp lệ không
    ↓
3. Route matching:
   - URL: /api/buses
   - Khớp với: app.use('/api/buses', busRoutes)
   - → Chuyển request cho busRoutes xử lý
```

---

### BƯỚC 3: ROUTES NHẬN REQUEST

#### File: routes/BusesRoutes.js

```javascript
// School Bus/backend/routes/BusesRoutes.js

import express from 'express';
import BusService from '../services/busService.js';

const router = express.Router();

// ✅ ROUTE HANDLER cho POST /api/buses
router.post('/', async (req, res) => {
  //         ↑ '/' tương đương '/api/buses' vì đã mount ở server.js
  
  try {
    console.log('📥 Nhận request tạo xe bus');
    console.log('📦 Body:', req.body);  
    // req.body = { bus_number: 'B01', license_plate: '30A-12345' }

    // 🔥 GỌI SERVICE XỬ LÝ
    const newBus = await BusService.createBus(req.body);
    
    console.log('✅ Tạo xe bus thành công:', newBus);

    // 🔥 TRẢ RESPONSE CHO FRONTEND
    res.status(201).json({
      success: true,
      message: 'Tạo xe bus thành công',
      data: newBus
    });

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    
    // Xác định status code
    let statusCode = 500;
    if (error.message.includes('bắt buộc') || error.message.includes('đã tồn tại')) {
      statusCode = 400;
    }

    // Trả lỗi cho frontend
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
```

**Luồng trong Routes:**

```
1. Nhận request:
   - Method: POST
   - URL: /api/buses (đã strip /api/buses prefix)
   - Body: req.body = { bus_number: 'B01', ... }

2. Try-catch để bắt lỗi

3. Gọi Service:
   const newBus = await BusService.createBus(req.body);
   
4. Nếu thành công:
   → res.status(201).json({ success: true, data: newBus })
   
5. Nếu lỗi:
   → res.status(400).json({ success: false, message: '...' })
```

---

### BƯỚC 4: SERVICE XỬ LÝ LOGIC

#### File: services/busService.js

```javascript
// School Bus/backend/services/busService.js

import BusModel from '../models/Bus.js';

class BusService {
  static async createBus(busData) {
    console.log('🔧 Service: Bắt đầu xử lý tạo xe bus');
    
    // ✅ BƯỚC 1: VALIDATION (Kiểm tra dữ liệu)
    const { bus_number, license_plate } = busData;
    
    if (!bus_number || !license_plate) {
      throw new Error('Mã xe và biển số xe là bắt buộc');
    }
    
    console.log('✅ Validation passed');

    // ✅ BƯỚC 2: BUSINESS RULE (Kiểm tra trùng biển số)
    const existingBus = await BusModel.findByLicensePlate(license_plate);
    
    if (existingBus) {
      throw new Error(`Biển số xe ${license_plate} đã tồn tại`);
    }
    
    console.log('✅ Không trùng biển số');

    // ✅ BƯỚC 3: FORMAT DATA (Chuẩn hóa dữ liệu)
    busData.license_plate = license_plate.toUpperCase().trim();
    busData.bus_number = bus_number.trim();
    
    console.log('✅ Dữ liệu đã format:', busData);

    // ✅ BƯỚC 4: GỌI MODEL ĐỂ LƯU DATABASE
    const newBus = await BusModel.create(busData);
    
    console.log('✅ Model trả về xe bus mới:', newBus);

    // ✅ BƯỚC 5: RETURN VỀ ROUTES
    return newBus;
  }
}

export default BusService;
```

**Luồng trong Service:**

```
Input: busData = { bus_number: 'B01', license_plate: '30a-12345' }
    ↓
1. VALIDATION
   - Kiểm tra bus_number có rỗng không? → OK
   - Kiểm tra license_plate có rỗng không? → OK
    ↓
2. BUSINESS RULE
   - Gọi BusModel.findByLicensePlate('30a-12345')
   - Kiểm tra có xe nào dùng biển số này chưa? → Chưa có
    ↓
3. FORMAT DATA
   - '30a-12345' → '30A-12345' (viết hoa)
   - 'B01' → 'B01' (trim khoảng trắng)
    ↓
4. GỌI MODEL
   - BusModel.create({ bus_number: 'B01', license_plate: '30A-12345' })
    ↓
5. RETURN
   - Trả về object xe bus vừa tạo
```

---

### BƯỚC 5: MODEL TRUY VẤN DATABASE

#### File: models/Bus.js

```javascript
// School Bus/backend/models/Bus.js

import pool from '../config/db.js';

class BusModel {
  /**
   * Kiểm tra xe bus có trùng biển số không
   */
  static async findByLicensePlate(licensePlate) {
    console.log('🔍 Model: Tìm xe bus với biển số:', licensePlate);
    
    const [rows] = await pool.execute(
      'SELECT * FROM buses WHERE license_plate = ?',
      [licensePlate]
    );
    
    console.log('📊 Kết quả query:', rows.length, 'rows');
    
    return rows[0] || null;  // Trả về xe bus hoặc null
  }

  /**
   * Tạo xe bus mới
   */
  static async create(busData) {
    console.log('💾 Model: Tạo xe bus mới trong database');
    console.log('📦 Data:', busData);
    
    const { bus_number, license_plate, status = 'active' } = busData;
    
    // ✅ BƯỚC 1: INSERT vào database
    const [result] = await pool.execute(
      'INSERT INTO buses (bus_number, license_plate, status) VALUES (?, ?, ?)',
      [bus_number, license_plate, status]
    );
    
    console.log('✅ Insert thành công, ID:', result.insertId);

    // ✅ BƯỚC 2: SELECT để lấy xe bus vừa tạo (có đầy đủ thông tin)
    const newBus = await this.findById(result.insertId);
    
    console.log('✅ Xe bus vừa tạo:', newBus);

    return newBus;
  }

  /**
   * Lấy xe bus theo ID
   */
  static async findById(id) {
    console.log('🔍 Model: Lấy xe bus với ID:', id);
    
    const [rows] = await pool.execute(
      'SELECT * FROM buses WHERE id = ?',
      [id]
    );
    
    return rows[0] || null;
  }
}

export default BusModel;
```

**Luồng trong Model:**

```
1. BusService gọi: BusModel.findByLicensePlate('30A-12345')
   ↓
   SQL: SELECT * FROM buses WHERE license_plate = '30A-12345'
   ↓
   Database trả về: [] (mảng rỗng - không trùng)
   ↓
   return null

2. BusService gọi: BusModel.create({ bus_number: 'B01', ... })
   ↓
   SQL 1: INSERT INTO buses (bus_number, license_plate, status) 
          VALUES ('B01', '30A-12345', 'active')
   ↓
   Database trả về: { insertId: 10, affectedRows: 1 }
   ↓
   SQL 2: SELECT * FROM buses WHERE id = 10
   ↓
   Database trả về: { id: 10, bus_number: 'B01', license_plate: '30A-12345', ... }
   ↓
   return bus object
```

---

### BƯỚC 6: DATABASE XỬ LÝ QUERY

#### Trong MySQL

```sql
-- Query 1: Kiểm tra trùng biển số
SELECT * FROM buses WHERE license_plate = '30A-12345';
-- Kết quả: Empty set (0 rows) → Không trùng

-- Query 2: Insert xe bus mới
INSERT INTO buses (bus_number, license_plate, status, created_at) 
VALUES ('B01', '30A-12345', 'active', NOW());
-- Kết quả: Query OK, 1 row affected, insertId = 10

-- Query 3: Lấy xe bus vừa tạo
SELECT * FROM buses WHERE id = 10;
-- Kết quả: 1 row
-- +----+------------+----------------+----------+--------+---------------------+
-- | id | bus_number | license_plate  | capacity | status | created_at          |
-- +----+------------+----------------+----------+--------+---------------------+
-- | 10 | B01        | 30A-12345      | NULL     | active | 2025-12-27 15:30:45 |
-- +----+------------+----------------+----------+--------+---------------------+
```

---

### BƯỚC 7-9: RETURN VỀ FRONTEND

#### Response được trả về

```
Model.create() returns:
{ id: 10, bus_number: 'B01', license_plate: '30A-12345', status: 'active' }
    ↓
Service.createBus() returns:
{ id: 10, bus_number: 'B01', license_plate: '30A-12345', status: 'active' }
    ↓
Routes sends HTTP Response:
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "message": "Tạo xe bus thành công",
  "data": {
    "id": 10,
    "bus_number": "B01",
    "license_plate": "30A-12345",
    "status": "active",
    "created_at": "2025-12-27T15:30:45.000Z"
  }
}
```

---

### BƯỚC 10: FRONTEND NHẬN RESPONSE

#### React xử lý response

```jsx
const response = await fetch('http://localhost:5000/api/buses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bus_number: 'B01', license_plate: '30A-12345' })
});

const data = await response.json();
// data = {
//   success: true,
//   message: "Tạo xe bus thành công",
//   data: { id: 10, bus_number: "B01", ... }
// }

if (data.success) {
  // ✅ Cập nhật UI
  setBuses([...buses, data.data]);  // Thêm xe bus vào danh sách
  
  // ✅ Hiển thị thông báo
  toast.success('Tạo xe bus thành công!');
  
  // ✅ Đóng modal
  setShowModal(false);
}
```

---

## 3. CODE THỰC TẾ TRONG DỰ ÁN

### File nhận request ĐẦU TIÊN: server.js

```javascript
// School Bus/backend/server.js

import express from 'express';
import busRoutes from './routes/BusesRoutes.js';  // ← Import routes

const app = express();

// Middleware
app.use(express.json());  // ← QUAN TRỌNG: Parse JSON body

// Mount routes
app.use('/api/buses', busRoutes);  // ← KHI REQUEST ĐẾN /api/buses
                                   //   → CHUYỂN CHO busRoutes XỬ LÝ

app.listen(5000, () => {
  console.log('🚀 Server running on port 5000');
});
```

**Giải thích:**

```
Request: POST http://localhost:5000/api/buses
                  └─┬──┘ └─┬─┘└─┬──┘└──┬───┘
                 Protocol Port Host  Path

1. Express nhận request ở port 5000
2. Middleware express.json() parse body
3. Route matching:
   - Path: /api/buses
   - Khớp với: app.use('/api/buses', busRoutes)
   - Express gọi: busRoutes(req, res, next)
```

---

### Chuỗi xử lý đầy đủ

```
server.js
  ↓ (app.use('/api/buses', busRoutes))
  ↓
BusesRoutes.js
  ↓ (router.post('/', async (req, res) => { ... }))
  ↓ (await BusService.createBus(req.body))
  ↓
busService.js
  ↓ (validation, business rules)
  ↓ (await BusModel.create(busData))
  ↓
Bus.js (Model)
  ↓ (await pool.execute('INSERT INTO buses ...'))
  ↓
db.js (Connection Pool)
  ↓ (Execute SQL query)
  ↓
MySQL Database
  ↓ (INSERT data, return insertId)
  ↓
Bus.js (Model) ← Database returns result
  ↓ (findById to get full data)
  ↓
busService.js ← Model returns bus object
  ↓ (return newBus)
  ↓
BusesRoutes.js ← Service returns bus object
  ↓ (res.status(201).json({ success: true, data: newBus }))
  ↓
Frontend ← HTTP Response
```

---

## 4. HTTP REQUEST/RESPONSE

### Request từ Frontend

```
POST /api/buses HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Content-Length: 78

{
  "bus_number": "B01",
  "license_plate": "30A-12345",
  "status": "active"
}
```

**Các thành phần:**

| Phần | Giá trị | Giải thích |
|------|---------|-----------|
| **Method** | POST | Tạo mới resource |
| **Path** | /api/buses | Endpoint |
| **Host** | localhost:5000 | Server address |
| **Content-Type** | application/json | Kiểu dữ liệu gửi |
| **Body** | JSON object | Dữ liệu xe bus |

---

### Response từ Backend

```
HTTP/1.1 201 Created
Content-Type: application/json
Content-Length: 156

{
  "success": true,
  "message": "Tạo xe bus thành công",
  "data": {
    "id": 10,
    "bus_number": "B01",
    "license_plate": "30A-12345",
    "status": "active",
    "created_at": "2025-12-27T15:30:45.000Z"
  }
}
```

**Các thành phần:**

| Phần | Giá trị | Giải thích |
|------|---------|-----------|
| **Status Code** | 201 Created | Tạo mới thành công |
| **Content-Type** | application/json | Response là JSON |
| **Body** | JSON object | Dữ liệu xe bus vừa tạo |

---

## 5. DEBUGGING VÀ HIỂU LỖI

### Cách debug từng layer

#### 1. Debug Routes

```javascript
// routes/BusesRoutes.js

router.post('/', async (req, res) => {
  console.log('🔹 ROUTES: Nhận request');
  console.log('📦 Body:', req.body);
  console.log('📝 Headers:', req.headers);
  
  try {
    const newBus = await BusService.createBus(req.body);
    console.log('✅ ROUTES: Service trả về:', newBus);
    
    res.status(201).json({ success: true, data: newBus });
  } catch (error) {
    console.error('❌ ROUTES: Lỗi:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});
```

#### 2. Debug Service

```javascript
// services/busService.js

static async createBus(busData) {
  console.log('🔹 SERVICE: Bắt đầu xử lý');
  console.log('📦 Input:', busData);
  
  // Validation
  if (!busData.bus_number) {
    console.error('❌ SERVICE: Thiếu bus_number');
    throw new Error('Mã xe là bắt buộc');
  }
  
  console.log('✅ SERVICE: Validation OK');
  
  // Check duplicate
  const existing = await BusModel.findByLicensePlate(busData.license_plate);
  if (existing) {
    console.error('❌ SERVICE: Biển số đã tồn tại');
    throw new Error('Biển số đã tồn tại');
  }
  
  console.log('✅ SERVICE: Không trùng biển số');
  
  // Create
  const newBus = await BusModel.create(busData);
  console.log('✅ SERVICE: Model trả về:', newBus);
  
  return newBus;
}
```

#### 3. Debug Model

```javascript
// models/Bus.js

static async create(busData) {
  console.log('🔹 MODEL: Tạo xe bus');
  console.log('📦 Data:', busData);
  
  try {
    const [result] = await pool.execute(
      'INSERT INTO buses (bus_number, license_plate, status) VALUES (?, ?, ?)',
      [busData.bus_number, busData.license_plate, busData.status || 'active']
    );
    
    console.log('✅ MODEL: Insert OK, ID:', result.insertId);
    
    const newBus = await this.findById(result.insertId);
    console.log('✅ MODEL: Xe bus vừa tạo:', newBus);
    
    return newBus;
  } catch (error) {
    console.error('❌ MODEL: Lỗi database:', error.message);
    throw error;
  }
}
```

---

### Console logs khi chạy thành công

```
🔹 ROUTES: Nhận request
📦 Body: { bus_number: 'B01', license_plate: '30a-12345' }
📝 Headers: { content-type: 'application/json', ... }

🔹 SERVICE: Bắt đầu xử lý
📦 Input: { bus_number: 'B01', license_plate: '30a-12345' }
✅ SERVICE: Validation OK

🔍 MODEL: Tìm xe bus với biển số: 30a-12345
📊 Kết quả query: 0 rows
✅ SERVICE: Không trùng biển số

🔹 MODEL: Tạo xe bus
📦 Data: { bus_number: 'B01', license_plate: '30A-12345', status: 'active' }
✅ MODEL: Insert OK, ID: 10

🔍 MODEL: Lấy xe bus với ID: 10
✅ MODEL: Xe bus vừa tạo: { id: 10, bus_number: 'B01', ... }

✅ SERVICE: Model trả về: { id: 10, bus_number: 'B01', ... }
✅ ROUTES: Service trả về: { id: 10, bus_number: 'B01', ... }
```

---

### Các lỗi thường gặp

#### Lỗi 1: Cannot read property 'bus_number' of undefined

```
❌ ROUTES: Nhận request
📦 Body: undefined

Nguyên nhân: Thiếu middleware express.json() trong server.js
Giải pháp: Thêm app.use(express.json()) trước app.use('/api/buses', ...)
```

#### Lỗi 2: Duplicate entry '30A-12345' for key 'license_plate'

```
❌ MODEL: Lỗi database: Duplicate entry '30A-12345' for key 'license_plate'

Nguyên nhân: Database đã có biển số này, nhưng Service không check
Giải pháp: Service phải check trước khi insert (đã có trong code mới)
```

#### Lỗi 3: connect ECONNREFUSED

```
❌ MODEL: Lỗi database: connect ECONNREFUSED 127.0.0.1:3307

Nguyên nhân: MySQL không chạy hoặc port sai
Giải pháp: Kiểm tra MySQL đang chạy, kiểm tra port trong .env
```

---

## 6. TÓM TẮT

### File nhận request ĐẦU TIÊN

```
✅ server.js
   ↓
   app.use('/api/buses', busRoutes)
```

**Khi request đến `/api/buses`, Express chuyển cho `busRoutes` xử lý.**

---

### Thứ tự xử lý

```
1. Frontend gửi HTTP POST request
2. server.js nhận request (port 5000)
3. Middleware express.json() parse body
4. Route matching: /api/buses → busRoutes
5. BusesRoutes.js: router.post('/', ...)
6. BusService.createBus(req.body)
7. BusModel.create(busData)
8. MySQL execute INSERT query
9. MySQL return insertId
10. Model return bus object
11. Service return bus object
12. Routes send HTTP response
13. Frontend nhận response
```

---

### Kiến trúc 3-Layer

| Layer | File | Trách nhiệm |
|-------|------|-------------|
| **Routes** | BusesRoutes.js | Xử lý HTTP request/response |
| **Service** | busService.js | Validation, business logic |
| **Model** | Bus.js | Database queries (SQL) |

---

## 🎯 BÀI TẬP THỰC HÀNH

### Bài 1: Thêm console.log

Thêm console.log vào từng layer như ví dụ trên, sau đó:
1. Restart server
2. Gửi POST request tạo xe bus
3. Xem console logs
4. Hiểu luồng xử lý

### Bài 2: Tạo endpoint mới

Tạo endpoint GET `/api/buses/:id` theo pattern:
1. Routes: router.get('/:id', ...)
2. Service: getBusById(id)
3. Model: findById(id)

### Bài 3: Debug lỗi

Cố tình tạo lỗi:
1. Bỏ express.json() → Xem lỗi gì
2. Gửi body rỗng → Xem validation
3. Gửi biển số trùng → Xem business rule

---

**🎉 Bây giờ bạn đã hiểu TOÀN BỘ luồng xử lý từ Frontend → Backend → Database!**
