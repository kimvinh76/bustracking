# 🔄 SO SÁNH TRỰC QUAN: CŨ vs MỚI

## 📂 CẤU TRÚC THƯ MỤC

### ❌ CŨ (Hiện tại)
```
backend/
├── server.js
├── config/
│   └── db.js
└── routes/
    ├── BusesRoutes.js      ⚠️ SQL + Logic + HTTP tất cả ở đây
    ├── studentsRoutes.js   ⚠️ SQL + Logic + HTTP tất cả ở đây
    ├── driversRoutes.js
    └── parentsRoutes.js
```

###  MỚI (Cải tiến)
```
backend/
├── server.js
├── config/
│   └── db.js
├── models/              ✨ MỚI: Database queries
│   ├── Bus.js
│   ├── Student.js
│   ├── Driver.js
│   └── Parent.js
├── services/            ✨ MỚI: Business logic
│   ├── busService.js
│   ├── studentService.js
│   ├── driverService.js
│   └── parentService.js
└── routes/              🔄 SỬA: Chỉ xử lý HTTP
    ├── BusesRoutes.js
    ├── studentsRoutes.js
    ├── driversRoutes.js
    └── parentsRoutes.js
```

---

## 📝 CODE SO SÁNH: TẠO XE BUS MỚI

### ❌ CODE CŨ (BusesRoutes.js - 1 file duy nhất)

```javascript
import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// POST /api/buses - Tạo xe bus mới
router.post("/", async (req, res) => {
  try {
    const { bus_number, license_plate, status } = req.body;

    // ⚠️ Validation đơn giản
    if (!bus_number || !license_plate) {
      return res.status(400).json({
        success: false,
        message: "Mã xe và biển số xe là bắt buộc",
      });
    }

    // ⚠️ SQL trực tiếp trong route
    const [result] = await pool.execute(
      "INSERT INTO buses (bus_number, license_plate, status) VALUES (?, ?, ?)",
      [bus_number, license_plate, status || "active"]
    );

    // ⚠️ Query lại để lấy data
    const [newBus] = await pool.execute("SELECT * FROM buses WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      message: "Tạo xe bus thành công",
      data: newBus[0],
    });
  } catch (error) {
    console.error("Error creating bus:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo xe bus",
      error: error.message,
    });
  }
});

export default router;
```

**VẤN ĐỀ**:
- ❌ SQL query dài lộn xộn trong route
- ❌ Validation đơn giản, không kiểm tra trùng biển số
- ❌ Không format dữ liệu (VD: chữ hoa biển số)
- ❌ Khó tái sử dụng logic
- ❌ Khó test
- ❌ Code > 30 dòng trong 1 function

---

###  CODE MỚI (3 files riêng biệt)

#### FILE 1: models/Bus.js (Database Layer)
```javascript
import pool from '../config/db.js';

class BusModel {
  /**
   * Lấy xe bus theo ID
   */
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM buses WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /**
   * Lấy xe bus theo biển số
   */
  static async findByLicensePlate(licensePlate) {
    const [rows] = await pool.execute(
      'SELECT * FROM buses WHERE license_plate = ?',
      [licensePlate]
    );
    return rows[0] || null;
  }

  /**
   * Tạo xe bus mới
   */
  static async create(busData) {
    const { bus_number, license_plate, status = 'active' } = busData;
    
    const [result] = await pool.execute(
      'INSERT INTO buses (bus_number, license_plate, status) VALUES (?, ?, ?)',
      [bus_number, license_plate, status]
    );

    return await this.findById(result.insertId);
  }
}

export default BusModel;
```

**TRÁCH NHIỆM**: CHỉ truy vấn database, không có logic nghiệp vụ

---

#### FILE 2: services/busService.js (Business Logic Layer)
```javascript
import BusModel from '../models/Bus.js';

class BusService {
  /**
   * Tạo xe bus mới với validation đầy đủ
   */
  static async createBus(busData) {
    const { bus_number, license_plate } = busData;

    //  VALIDATION chi tiết
    if (!bus_number || !license_plate) {
      throw new Error('Mã xe và biển số xe là bắt buộc');
    }

    //  BUSINESS RULE: Kiểm tra biển số trùng
    const existingBus = await BusModel.findByLicensePlate(license_plate);
    if (existingBus) {
      throw new Error(`Biển số xe ${license_plate} đã tồn tại`);
    }

    //  FORMAT dữ liệu
    busData.license_plate = license_plate.toUpperCase().trim();
    busData.bus_number = bus_number.trim();

    // Gọi model để lưu database
    return await BusModel.create(busData);
  }
}

export default BusService;
```

**TRÁCH NHIỆM**: Validation, business rules, format dữ liệu

---

#### FILE 3: routes/BusesRoutes_NEW.js (HTTP Layer)
```javascript
import express from 'express';
import BusService from '../services/busService.js';

const router = express.Router();

// POST /api/buses - Tạo xe bus mới
router.post('/', async (req, res) => {
  try {
    const busData = req.body;
    
    //  Chỉ gọi service, không có logic phức tạp
    const newBus = await BusService.createBus(busData);
    
    res.status(201).json({
      success: true,
      message: 'Tạo xe bus thành công',
      data: newBus
    });
  } catch (error) {
    //  Xử lý lỗi thống nhất
    let statusCode = 500;
    
    if (error.message.includes('bắt buộc') || error.message.includes('đã tồn tại')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
```

**TRÁCH NHIỆM**: CHỈ xử lý HTTP request/response

---

## 📊 SO SÁNH TÍNH NĂNG

| Tính năng | ❌ Cũ |  Mới |
|-----------|------|-------|
| **Validation** | Chỉ kiểm tra rỗng | Kiểm tra đầy đủ + trùng biển số |
| **Format dữ liệu** | Không | Chữ hoa biển số, trim khoảng trắng |
| **Tái sử dụng** | Không | Có thể dùng Service ở nhiều nơi |
| **Test** | Khó (phải mock HTTP) | Dễ (test Service độc lập) |
| **Đọc code** | Khó (30+ dòng) | Dễ (mỗi function < 15 dòng) |
| **Bảo trì** | Khó (SQL rải rác) | Dễ (SQL tập trung ở Model) |
| **Thay đổi DB** | Phải sửa khắp nơi | Chỉ sửa Model |

---

## 🔄 LUỒNG XỬ LÝ

### ❌ CŨ: 1 LAYER

```
┌──────────────────────────────────────────┐
│  CLIENT                                  │
│  POST /api/buses                         │
│  { bus_number: "B01", license_plate: "30A-12345" } │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│  ROUTES (BusesRoutes.js)                           │
│  ┌──────────────────────────────────────────────┐  │
│  │ • Validation                                 │  │
│  │ • SQL: INSERT INTO buses...                  │  │
│  │ • SQL: SELECT * FROM buses WHERE id = ?      │  │
│  │ • Response                                   │  │
│  └──────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  DATABASE                                  │
└────────────────────────────────────────────┘
```

---

###  MỚI: 3 LAYERS

```
┌──────────────────────────────────────────┐
│  CLIENT                                  │
│  POST /api/buses                         │
│  { bus_number: "B01", license_plate: "30a-12345" } │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│  ROUTES (BusesRoutes_NEW.js)                       │
│  ┌──────────────────────────────────────────────┐  │
│  │ • Nhận request                               │  │
│  │ • Gọi BusService.createBus()                 │  │
│  │ • Trả response                               │  │
│  └──────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│  SERVICES (busService.js)                          │
│  ┌──────────────────────────────────────────────┐  │
│  │ • Validation: Kiểm tra rỗng                  │  │
│  │ • Business rule: Kiểm tra trùng biển số      │  │
│  │ • Format: "30a-12345" → "30A-12345"          │  │
│  │ • Gọi BusModel.create()                      │  │
│  └──────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│  MODELS (Bus.js)                                   │
│  ┌──────────────────────────────────────────────┐  │
│  │ • SQL: INSERT INTO buses...                  │  │
│  │ • SQL: SELECT * FROM buses WHERE id = ?      │  │
│  └──────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│  DATABASE                                  │
└────────────────────────────────────────────┘
```

---

## 🧪 KHẢ NĂNG TEST

### ❌ CŨ: KHÓ TEST

```javascript
// Phải test toàn bộ HTTP request
const request = require('supertest');

it('should create a bus', async () => {
  const response = await request(app)
    .post('/api/buses')
    .send({ bus_number: 'B01', license_plate: '30A-12345' });
  
  expect(response.status).toBe(201);
});

// ⚠️ Không test được logic riêng
// ⚠️ Phải khởi động server
// ⚠️ Phải có database thật
```

---

###  MỚI: DỄ TEST

```javascript
import BusService from '../services/busService.js';
import BusModel from '../models/Bus.js';

// Mock Model
jest.mock('../models/Bus.js');

describe('BusService', () => {
  it('should throw error if license_plate is missing', async () => {
    await expect(
      BusService.createBus({ bus_number: 'B01' })
    ).rejects.toThrow('Mã xe và biển số xe là bắt buộc');
  });

  it('should throw error if license_plate already exists', async () => {
    BusModel.findByLicensePlate.mockResolvedValue({ id: 1 });
    
    await expect(
      BusService.createBus({ bus_number: 'B01', license_plate: '30A-12345' })
    ).rejects.toThrow('Biển số xe 30A-12345 đã tồn tại');
  });

  it('should format license_plate to uppercase', async () => {
    BusModel.findByLicensePlate.mockResolvedValue(null);
    BusModel.create.mockResolvedValue({ id: 1, license_plate: '30A-12345' });
    
    await BusService.createBus({ bus_number: 'B01', license_plate: '30a-12345' });
    
    expect(BusModel.create).toHaveBeenCalledWith({
      bus_number: 'B01',
      license_plate: '30A-12345' //  Đã chuyển thành chữ hoa
    });
  });
});

//  Test logic riêng biệt
//  Không cần server
//  Không cần database thật
```

---

## 🔧 KHẢ NĂNG BẢO TRÌ

### Scenario: Thêm tính năng "Kiểm tra số chỗ ngồi hợp lệ"

#### ❌ CŨ: Phải sửa khắp nơi

```javascript
// ⚠️ BusesRoutes.js
router.post("/", async (req, res) => {
  const { bus_number, license_plate, status, capacity } = req.body;
  
  // ⚠️ Phải thêm validation ở đây
  if (capacity && capacity < 10) {
    return res.status(400).json({ message: "Capacity phải >= 10" });
  }
  
  // ... SQL ...
});

// ⚠️ Nếu có nhiều route khác cũng tạo bus, phải sửa hết
```

---

####  MỚI: Chỉ sửa 1 chỗ

```javascript
//  busService.js - CHỈ SỬA Ở ĐÂY
class BusService {
  static async createBus(busData) {
    const { bus_number, license_plate, capacity } = busData;

    // Validation cũ
    if (!bus_number || !license_plate) {
      throw new Error('Mã xe và biển số xe là bắt buộc');
    }

    //  THÊM validation mới
    if (capacity && capacity < 10) {
      throw new Error('Số chỗ ngồi phải từ 10 trở lên');
    }

    // ... logic khác không đổi
  }
}

//  Routes không cần sửa gì
//  Tất cả nơi gọi BusService.createBus() đều được áp dụng rule mới
```

---

## 📈 KẾT LUẬN

| Khía cạnh | ❌ Cũ |  Mới |
|-----------|------|-------|
| **Số dòng code/function** | 30-50 dòng | 10-20 dòng |
| **Độ phức tạp** | Cao | Thấp |
| **Khả năng tái sử dụng** | 0% | 100% |
| **Thời gian bảo trì** | Lâu | Nhanh |
| **Thời gian test** | Lâu | Nhanh |
| **Risk khi sửa code** | Cao (ảnh hưởng nhiều nơi) | Thấp (chỉ ảnh hưởng 1 layer) |

---

## 🚀 BƯỚC TIẾP THEO

1. **Áp dụng cho Students module** (đã có sẵn code mẫu)
2. **Áp dụng cho Drivers, Parents, Routes**
3. **Viết unit tests**
4. **Thêm middleware (authentication)**
5. **Deploy lên production**

---

## 💡 LỜI KHUYÊN

> **"Don't Repeat Yourself (DRY)"**  
> Nếu bạn thấy mình copy-paste code > 2 lần, hãy tách nó thành function/service!

> **"Separation of Concerns"**  
> Mỗi layer chỉ làm 1 việc và làm thật tốt việc đó!

> **"KISS - Keep It Simple, Stupid"**  
> Code đơn giản > Code phức tạp. Người khác (và chính bạn sau 6 tháng) sẽ cảm ơn!

---

**📌 Files đã tạo sẵn cho bạn**:
-  `models/Bus.js` - Model layer
-  `models/Student.js` - Model phức tạp hơn (nhiều JOIN)
-  `models/Class.js` - Helper model
-  `services/busService.js` - Service layer
-  `services/studentService.js` - Service phức tạp hơn
-  `routes/BusesRoutes_NEW.js` - Routes cải tiến

Bây giờ bạn có thể:
1. So sánh file cũ vs mới
2. Test thử routes mới
3. Áp dụng pattern này cho các module khác!
