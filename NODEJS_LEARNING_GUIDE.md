# 📚 HỌC NODE.JS TỪ ĐƠN GIẢN ĐẾN PHỨC TẠP
## Dựa trên dự án Bus Tracking System

---

## 📑 MỤC LỤC

1. [Kiến thức cơ bản](#1-kiến-thức-cơ-bản)
2. [Kiến trúc hiện tại (Có vấn đề)](#2-kiến-trúc-hiện-tại)
3. [Kiến trúc cải tiến (MVC/3-Layer)](#3-kiến-trúc-cải-tiến)
4. [So sánh Before/After](#4-so-sánh-beforeafter)
5. [Hướng dẫn áp dụng](#5-hướng-dẫn-áp-dụng)
6. [Best Practices](#6-best-practices)

---

## 1. KIẾN THỨC CƠ BẢN

### 1.1 Node.js là gì?

Node.js là **môi trường chạy JavaScript phía server** (backend), cho phép bạn:
- Xử lý HTTP requests
- Kết nối database
- Xử lý file system
- Tạo WebSocket, API, etc.

### 1.2 Module System

#### ES6 Modules (Dự án bạn đang dùng) ✅

```javascript
// Import
import express from 'express';
import pool from '../config/db.js';

// Export
export default router;
export { functionA, functionB };
```

**Yêu cầu**: Phải có `"type": "module"` trong `package.json`

#### CommonJS (Cũ hơn)

```javascript
// Import
const express = require('express');

// Export
module.exports = router;
```

---

### 1.3 Express.js Cơ Bản

Express là **framework web** cho Node.js.

```javascript
import express from 'express';

const app = express();
const router = express.Router();

// Middleware
app.use(express.json()); // Parse JSON body

// Routes
app.get('/api/buses', (req, res) => {
  res.json({ data: [] });
});

// Start server
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
```

---

### 1.4 Async/Await (XỬ LÝ BẤT ĐỒNG BỘ)

JavaScript xử lý database, file I/O bằng **async/await**:

```javascript
// ❌ SAI: Không dùng await
router.get('/', (req, res) => {
  const data = pool.execute('SELECT * FROM buses'); // ❌ Trả về Promise, chưa có data!
  res.json(data);
});

// ✅ ĐÚNG: Dùng async/await
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM buses'); // ✅ Chờ query hoàn thành
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Quy tắc**:
- Function có `await` phải khai báo `async`
- Luôn dùng `try/catch` để bắt lỗi

---

### 1.5 MySQL Connection Pool

```javascript
// config/db.js
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'school_bus_db',
  waitForConnections: true,
  connectionLimit: 10, // Tối đa 10 kết nối đồng thời
  queueLimit: 0
});

export default pool;
```

**Tại sao dùng Pool?**
- ✅ Tái sử dụng kết nối (nhanh hơn)
- ✅ Tự động quản lý kết nối
- ✅ Xử lý nhiều request đồng thời

---

### 1.6 REST API Methods

| Method | Mục đích | Ví dụ |
|--------|----------|-------|
| `GET` | Lấy dữ liệu | `GET /api/buses` |
| `POST` | Tạo mới | `POST /api/buses` |
| `PUT` | Cập nhật toàn bộ | `PUT /api/buses/1` |
| `PATCH` | Cập nhật một phần | `PATCH /api/buses/1` |
| `DELETE` | Xóa | `DELETE /api/buses/1` |

---

## 2. KIẾN TRÚC HIỆN TẠI (CÓ VẤN ĐỀ)

### 2.1 Cấu trúc hiện tại của bạn

```
backend/
├── server.js          (Khởi động server)
├── config/
│   └── db.js          (Kết nối database)
└── routes/
    ├── BusesRoutes.js     ❌ SQL trực tiếp trong routes
    ├── studentsRoutes.js  ❌ Logic rải rác
    └── ...
```

### 2.2 Ví dụ code hiện tại (BusesRoutes.js)

```javascript
// ❌ VẤN ĐỀ: SQL + Logic + HTTP Response tất cả trong 1 file
router.get("/", async (req, res) => {
  try {
    // SQL trực tiếp
    const [rows] = await pool.execute("SELECT * FROM buses");
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { bus_number, license_plate, status } = req.body;
    
    // Validation trong route
    if (!bus_number || !license_plate) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    // SQL trực tiếp
    const [result] = await pool.execute(
      "INSERT INTO buses (bus_number, license_plate, status) VALUES (?, ?, ?)",
      [bus_number, license_plate, status || "active"]
    );

    // Query lại để lấy data
    const [newBus] = await pool.execute("SELECT * FROM buses WHERE id = ?", [result.insertId]);
    
    res.status(201).json({ success: true, data: newBus[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2.3 Tại sao không tốt?

| Vấn đề | Hậu quả |
|--------|---------|
| ❌ SQL lộn xộn trong routes | Khó đọc, khó bảo trì |
| ❌ Không tái sử dụng được | Phải viết lại SQL nhiều lần |
| ❌ Khó test | Không test được logic riêng |
| ❌ Khó thay đổi database | Nếu đổi MySQL → PostgreSQL phải sửa khắp nơi |
| ❌ Validation rải rác | Không nhất quán |

---

## 3. KIẾN TRÚC CẢI TIẾN (MVC/3-LAYER)

### 3.1 Cấu trúc mới

```
backend/
├── server.js
├── config/
│   └── db.js
├── models/              ✅ THÊM: Truy vấn database
│   ├── Bus.js
│   ├── Student.js
│   └── Class.js
├── services/            ✅ THÊM: Logic nghiệp vụ
│   ├── busService.js
│   └── studentService.js
└── routes/              ✅ SỬA: Chỉ xử lý HTTP
    ├── BusesRoutes_NEW.js
    └── studentsRoutes_NEW.js
```

### 3.2 Phân tách trách nhiệm (Separation of Concerns)

```
┌─────────────────────────────────────────────┐
│  CLIENT (React/Browser)                     │
└─────────────────┬───────────────────────────┘
                  │ HTTP Request
                  ▼
┌─────────────────────────────────────────────┐
│  ROUTES (Controller)                        │
│  - Nhận request                             │
│  - Trả response                             │
│  - KHÔNG chứa logic, KHÔNG truy vấn DB      │
└─────────────────┬───────────────────────────┘
                  │ Gọi service
                  ▼
┌─────────────────────────────────────────────┐
│  SERVICES (Business Logic)                  │
│  - Validation (kiểm tra dữ liệu)            │
│  - Business rules (quy tắc nghiệp vụ)       │
│  - Kết hợp nhiều model                      │
│  - KHÔNG truy vấn DB trực tiếp              │
└─────────────────┬───────────────────────────┘
                  │ Gọi model
                  ▼
┌─────────────────────────────────────────────┐
│  MODELS (Data Access)                       │
│  - Truy vấn database (SQL)                  │
│  - CRUD operations                          │
│  - KHÔNG chứa logic nghiệp vụ               │
└─────────────────┬───────────────────────────┘
                  │ SQL Query
                  ▼
┌─────────────────────────────────────────────┐
│  DATABASE (MySQL)                           │
└─────────────────────────────────────────────┘
```

---

### 3.3 Ví dụ chi tiết: BUS Module

#### **LAYER 1: MODEL** (models/Bus.js)

```javascript
import pool from '../config/db.js';

class BusModel {
  // Lấy tất cả xe bus
  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM buses ORDER BY id DESC');
    return rows;
  }

  // Lấy xe bus theo ID
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM buses WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // Tạo xe bus mới
  static async create(busData) {
    const { bus_number, license_plate, status = 'active' } = busData;
    
    const [result] = await pool.execute(
      'INSERT INTO buses (bus_number, license_plate, status) VALUES (?, ?, ?)',
      [bus_number, license_plate, status]
    );

    return await this.findById(result.insertId);
  }

  // ... (xem file đầy đủ)
}

export default BusModel;
```

**Trách nhiệm**: CHỈ truy vấn database, KHÔNG có logic nghiệp vụ.

---

#### **LAYER 2: SERVICE** (services/busService.js)

```javascript
import BusModel from '../models/Bus.js';

class BusService {
  // Tạo xe bus mới với validation
  static async createBus(busData) {
    const { bus_number, license_plate } = busData;

    // ✅ VALIDATION
    if (!bus_number || !license_plate) {
      throw new Error('Mã xe và biển số xe là bắt buộc');
    }

    // ✅ BUSINESS RULE: Kiểm tra trùng biển số
    const existingBus = await BusModel.findByLicensePlate(license_plate);
    if (existingBus) {
      throw new Error(`Biển số xe ${license_plate} đã tồn tại`);
    }

    // ✅ FORMAT DỮ LIỆU
    busData.license_plate = license_plate.toUpperCase().trim();
    busData.bus_number = bus_number.trim();

    // Gọi model để lưu database
    return await BusModel.create(busData);
  }

  // ... (xem file đầy đủ)
}

export default BusService;
```

**Trách nhiệm**: Validation, business logic, format dữ liệu.

---

#### **LAYER 3: ROUTES** (routes/BusesRoutes_NEW.js)

```javascript
import express from 'express';
import BusService from '../services/busService.js';

const router = express.Router();

// POST /api/buses - Tạo xe bus mới
router.post('/', async (req, res) => {
  try {
    const busData = req.body;
    const newBus = await BusService.createBus(busData); // ✅ Gọi service
    
    res.status(201).json({
      success: true,
      message: 'Tạo xe bus thành công',
      data: newBus
    });
  } catch (error) {
    // ✅ Xử lý lỗi thống nhất
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
```

**Trách nhiệm**: CHỈ xử lý HTTP request/response.

---

## 4. SO SÁNH BEFORE/AFTER

### 4.1 Code cũ (BusesRoutes.js)

```javascript
// ❌ TẤT CẢ trong 1 file: SQL + Validation + HTTP
router.post("/", async (req, res) => {
  try {
    const { bus_number, license_plate, status } = req.body;
    
    if (!bus_number || !license_plate) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    const [result] = await pool.execute(
      "INSERT INTO buses (bus_number, license_plate, status) VALUES (?, ?, ?)",
      [bus_number, license_plate, status || "active"]
    );

    const [newBus] = await pool.execute("SELECT * FROM buses WHERE id = ?", [result.insertId]);
    
    res.status(201).json({ success: true, data: newBus[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**Vấn đề**:
- SQL lộn xộn trong route
- Validation đơn giản
- Không kiểm tra trùng biển số
- Khó test, khó tái sử dụng

---

### 4.2 Code mới (3-Layer Architecture)

```javascript
// ✅ ROUTE: Chỉ xử lý HTTP
router.post('/', async (req, res) => {
  try {
    const newBus = await BusService.createBus(req.body);
    res.status(201).json({ success: true, data: newBus });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ✅ SERVICE: Validation + Business logic
static async createBus(busData) {
  if (!busData.bus_number || !busData.license_plate) {
    throw new Error('Thiếu thông tin');
  }

  const existingBus = await BusModel.findByLicensePlate(busData.license_plate);
  if (existingBus) {
    throw new Error('Biển số đã tồn tại');
  }

  busData.license_plate = busData.license_plate.toUpperCase();
  return await BusModel.create(busData);
}

// ✅ MODEL: Chỉ truy vấn DB
static async create(busData) {
  const [result] = await pool.execute(
    'INSERT INTO buses (bus_number, license_plate, status) VALUES (?, ?, ?)',
    [busData.bus_number, busData.license_plate, busData.status || 'active']
  );
  return await this.findById(result.insertId);
}
```

**Ưu điểm**:
- ✅ Dễ đọc, dễ hiểu
- ✅ Validation đầy đủ
- ✅ Business logic rõ ràng
- ✅ Tái sử dụng được
- ✅ Dễ test từng layer

---

## 5. HƯỚNG DẪN ÁP DỤNG

### Bước 1: Tạo Model

```javascript
// models/Bus.js
class BusModel {
  static async findAll() { /* SQL */ }
  static async findById(id) { /* SQL */ }
  static async create(data) { /* SQL */ }
  static async update(id, data) { /* SQL */ }
  static async delete(id) { /* SQL */ }
}
```

### Bước 2: Tạo Service

```javascript
// services/busService.js
class BusService {
  static async getAllBuses() {
    return await BusModel.findAll();
  }

  static async createBus(busData) {
    // Validation
    if (!busData.bus_number) {
      throw new Error('Thiếu mã xe');
    }

    // Business logic
    const exists = await BusModel.findByLicensePlate(busData.license_plate);
    if (exists) {
      throw new Error('Biển số đã tồn tại');
    }

    // Gọi model
    return await BusModel.create(busData);
  }
}
```

### Bước 3: Sửa Route

```javascript
// routes/BusesRoutes_NEW.js
router.get('/', async (req, res) => {
  try {
    const buses = await BusService.getAllBuses();
    res.json({ success: true, data: buses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newBus = await BusService.createBus(req.body);
    res.status(201).json({ success: true, data: newBus });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
```

### Bước 4: Update server.js

```javascript
// Thay đổi import
import busRoutes from './routes/BusesRoutes_NEW.js'; // ✅ Dùng file mới
// import busRoutes from './routes/BusesRoutes.js'; // ❌ Bỏ file cũ

app.use('/api/buses', busRoutes);
```

---

## 6. BEST PRACTICES

### 6.1 Error Handling

```javascript
// ✅ ĐÚNG: Xử lý lỗi thống nhất
const handleError = (res, error, defaultStatus = 500) => {
  let statusCode = defaultStatus;
  
  if (error.message.includes('không hợp lệ') || error.message.includes('bắt buộc')) {
    statusCode = 400; // Bad Request
  } else if (error.message.includes('Không tìm thấy')) {
    statusCode = 404; // Not Found
  }

  res.status(statusCode).json({
    success: false,
    message: error.message
  });
};

router.get('/:id', async (req, res) => {
  try {
    const bus = await BusService.getBusById(req.params.id);
    res.json({ success: true, data: bus });
  } catch (error) {
    handleError(res, error); // ✅ Sử dụng helper
  }
});
```

---

### 6.2 Naming Conventions

| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| File | camelCase hoặc PascalCase | `busService.js` hoặc `Bus.js` |
| Class | PascalCase | `BusModel`, `BusService` |
| Function/Method | camelCase | `findById()`, `createBus()` |
| Variable | camelCase | `busData`, `newBus` |
| Constant | UPPER_SNAKE_CASE | `MAX_BUS_CAPACITY` |

---

### 6.3 HTTP Status Codes

| Code | Ý nghĩa | Khi nào dùng |
|------|---------|--------------|
| 200 | OK | GET/PUT/PATCH thành công |
| 201 | Created | POST tạo mới thành công |
| 400 | Bad Request | Validation failed, dữ liệu không hợp lệ |
| 404 | Not Found | Không tìm thấy resource |
| 500 | Internal Server Error | Lỗi server, lỗi database |

---

### 6.4 Database Query Best Practices

```javascript
// ✅ ĐÚNG: Dùng prepared statements (tránh SQL Injection)
const [rows] = await pool.execute(
  'SELECT * FROM buses WHERE id = ?',
  [id]
);

// ❌ SAI: SQL Injection vulnerability
const [rows] = await pool.execute(
  `SELECT * FROM buses WHERE id = ${id}` // ❌ NGUY HIỂM!
);
```

---

### 6.5 Async/Await Tips

```javascript
// ✅ ĐÚNG: Dùng try/catch
async function getBuses() {
  try {
    const buses = await BusModel.findAll();
    return buses;
  } catch (error) {
    console.error('Error:', error);
    throw error; // Throw lại để caller xử lý
  }
}

// ❌ SAI: Không bắt lỗi
async function getBuses() {
  const buses = await BusModel.findAll(); // Nếu lỗi sẽ crash app!
  return buses;
}
```

---

### 6.6 Environment Variables

```javascript
// .env file
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mypassword
DB_NAME=school_bus_db
DB_PORT=3307
BACKEND_PORT=5000

// Sử dụng
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
```

**Lợi ích**:
- ✅ Bảo mật (không commit password lên Git)
- ✅ Dễ đổi config giữa dev/production

---

## 7. TÓM TẮT

### Kiến trúc cũ (Hiện tại)
```
Routes ──► Database
  ↓
SQL + Logic + HTTP tất cả trong 1 file
```

### Kiến trúc mới (Cải tiến)
```
Routes ──► Services ──► Models ──► Database
  ↓           ↓           ↓
 HTTP      Business    Database
          Logic       Queries
```

### Lợi ích
| Cũ | Mới |
|----|-----|
| ❌ Khó đọc | ✅ Dễ đọc, dễ hiểu |
| ❌ Khó bảo trì | ✅ Dễ bảo trì |
| ❌ Không tái sử dụng | ✅ Tái sử dụng được |
| ❌ Khó test | ✅ Dễ test từng layer |
| ❌ SQL rải rác | ✅ SQL tập trung ở Model |

---

## 8. BƯỚC TIẾP THEO

1. ✅ **Đã tạo**: Model + Service + Routes mới cho Bus và Student
2. 🔄 **Nên làm tiếp**: Áp dụng cho các module khác (Driver, Parent, Routes, etc.)
3. 🧪 **Testing**: Viết unit test cho Service layer
4. 📝 **Middleware**: Tạo authentication/authorization middleware
5. 🔒 **Security**: Hash password, JWT tokens, input sanitization

---

## 9. CÂU HỎI THƯỜNG GẶP

**Q: Có nhất thiết phải dùng 3-layer không?**
A: Với dự án nhỏ (< 5 routes) có thể bỏ qua. Nhưng dự án bạn đã lớn (10+ routes) nên áp dụng.

**Q: Model và Service khác nhau như thế nào?**
A:
- **Model**: Chỉ truy vấn database, không có logic
- **Service**: Validation, business rules, kết hợp nhiều model

**Q: Tôi có cần dùng ORM (Sequelize, TypeORM) không?**
A: Không bắt buộc. Raw SQL với Model layer này đã tốt. ORM sẽ phức tạp hơn.

---

## 10. TÀI LIỆU THAM KHẢO

- [Node.js Official Docs](https://nodejs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)
- [JavaScript.info - Async/Await](https://javascript.info/async-await)

---

**📌 LƯU Ý**: Các file đã tạo:
- ✅ `models/Bus.js`
- ✅ `models/Student.js`
- ✅ `models/Class.js`
- ✅ `services/busService.js`
- ✅ `services/studentService.js`
- ✅ `routes/BusesRoutes_NEW.js`

Bạn có thể so sánh với file cũ để hiểu rõ hơn sự khác biệt!
