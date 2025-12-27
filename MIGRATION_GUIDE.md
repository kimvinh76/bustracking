# 🔄 HƯỚNG DẪN MIGRATION: CŨ → MỚI

## 📋 CHECKLIST TỔNG QUAN

- [ ] **Bước 1**: Backup code hiện tại
- [ ] **Bước 2**: Tạo cấu trúc thư mục mới
- [ ] **Bước 3**: Migration từng module (Bus, Student, Driver, ...)
- [ ] **Bước 4**: Test từng module
- [ ] **Bước 5**: Update server.js
- [ ] **Bước 6**: Test toàn bộ hệ thống

---

## BƯỚC 1: BACKUP CODE

```bash
# Commit tất cả thay đổi hiện tại
git add .
git commit -m "Before migration to 3-layer architecture"

# Hoặc tạo branch mới
git checkout -b feature/3-layer-architecture
```

---

## BƯỚC 2: TẠO CẤU TRÚC THƯ MỤC

### 2.1 Tạo thư mục

```bash
cd "School Bus/backend"

# Tạo thư mục models và services
mkdir models
mkdir services
```

### 2.2 Cấu trúc sau khi tạo

```
backend/
├── config/
│   └── db.js
├── models/          ✨ MỚI
├── services/        ✨ MỚI
├── routes/
└── server.js
```

---

## BƯỚC 3: MIGRATION TỪNG MODULE

### ✅ Module 1: BUS (Đã có sẵn)

#### Files đã tạo:
- ✅ `models/Bus.js`
- ✅ `services/busService.js`
- ✅ `routes/BusesRoutes_NEW.js`

#### Áp dụng:

**Option A: Thay thế hoàn toàn (Khuyên dùng)**

```bash
# Đổi tên file cũ để backup
mv routes/BusesRoutes.js routes/BusesRoutes_OLD.js

# Đổi tên file mới thành file chính
mv routes/BusesRoutes_NEW.js routes/BusesRoutes.js
```

**Option B: Test song song**

Giữ cả 2 files, dùng routes khác nhau:
```javascript
// server.js
app.use('/api/buses', busRoutes);        // Routes cũ
app.use('/api/buses-v2', busRoutesNew);  // Routes mới để test
```

---

### ✅ Module 2: STUDENT (Đã có sẵn)

#### Files đã tạo:
- ✅ `models/Student.js`
- ✅ `models/Class.js`
- ✅ `services/studentService.js`

#### Tạo Routes mới:

```javascript
// routes/studentsRoutes_NEW.js
import express from 'express';
import StudentService from '../services/studentService.js';

const router = express.Router();

// GET /api/students - Lấy tất cả học sinh
router.get('/', async (req, res) => {
  try {
    const students = await StudentService.getAllStudents();
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/students/:id - Lấy học sinh theo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await StudentService.getStudentById(id);
    
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/students/class/:className - Lấy học sinh theo lớp
router.get('/class/:className', async (req, res) => {
  try {
    const { className } = req.params;
    const students = await StudentService.getStudentsByClass(className);
    
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/students/route/:routeId - Lấy học sinh theo tuyến đường
router.get('/route/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;
    const { timeOfDay = 'morning' } = req.query; // morning hoặc afternoon
    
    const students = await StudentService.getStudentsByRoute(routeId, timeOfDay);
    
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/students/search?q=keyword - Tìm kiếm học sinh
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const students = await StudentService.searchStudents(q);
    
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/students - Tạo học sinh mới
router.post('/', async (req, res) => {
  try {
    const studentData = req.body;
    const newStudent = await StudentService.createStudent(studentData);
    
    res.status(201).json({
      success: true,
      message: 'Thêm học sinh thành công',
      data: newStudent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/students/:id - Cập nhật học sinh
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const studentData = req.body;
    
    const updatedStudent = await StudentService.updateStudent(id, studentData);
    
    res.json({
      success: true,
      message: 'Cập nhật học sinh thành công',
      data: updatedStudent
    });
  } catch (error) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/students/:id - Xóa học sinh (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await StudentService.deleteStudent(id);
    
    res.json({
      success: true,
      message: 'Xóa học sinh thành công'
    });
  } catch (error) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/students/:id/assign-route - Gán học sinh vào tuyến đường
router.put('/:id/assign-route', async (req, res) => {
  try {
    const { id } = req.params;
    const routeData = req.body; // { routeId, timeOfDay, stopId }
    
    const updatedStudent = await StudentService.assignStudentToRoute(id, routeData);
    
    res.json({
      success: true,
      message: 'Gán tuyến đường thành công',
      data: updatedStudent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
```

**Lưu file trên vào**: `routes/studentsRoutes_NEW.js`

---

### 🔄 Module 3: DRIVER (Cần làm)

#### Bước 1: Tạo Model

```javascript
// models/Driver.js
import pool from '../config/db.js';

class DriverModel {
  static async findAll() {
    const [rows] = await pool.execute(`
      SELECT d.*, b.bus_number, b.license_plate
      FROM drivers d
      LEFT JOIN buses b ON d.bus_id = b.id
      ORDER BY d.id DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(`
      SELECT d.*, b.bus_number, b.license_plate
      FROM drivers d
      LEFT JOIN buses b ON d.bus_id = b.id
      WHERE d.id = ?
    `, [id]);
    return rows[0] || null;
  }

  static async create(driverData) {
    const { name, phone, license_number, bus_id, status = 'active' } = driverData;
    
    const [result] = await pool.execute(
      'INSERT INTO drivers (name, phone, license_number, bus_id, status) VALUES (?, ?, ?, ?, ?)',
      [name, phone, license_number, bus_id || null, status]
    );

    return await this.findById(result.insertId);
  }

  static async update(id, driverData) {
    const { name, phone, license_number, bus_id, status } = driverData;
    
    const [result] = await pool.execute(
      'UPDATE drivers SET name = ?, phone = ?, license_number = ?, bus_id = ?, status = ? WHERE id = ?',
      [name, phone, license_number, bus_id || null, status, id]
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return await this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM drivers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async exists(id) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM drivers WHERE id = ?',
      [id]
    );
    return rows[0].count > 0;
  }

  static async findByLicenseNumber(licenseNumber) {
    const [rows] = await pool.execute(
      'SELECT * FROM drivers WHERE license_number = ?',
      [licenseNumber]
    );
    return rows[0] || null;
  }
}

export default DriverModel;
```

#### Bước 2: Tạo Service

```javascript
// services/driverService.js
import DriverModel from '../models/Driver.js';

class DriverService {
  static async getAllDrivers() {
    return await DriverModel.findAll();
  }

  static async getDriverById(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID không hợp lệ');
    }

    const driver = await DriverModel.findById(id);
    
    if (!driver) {
      throw new Error('Không tìm thấy tài xế');
    }

    return driver;
  }

  static async createDriver(driverData) {
    const { name, phone, license_number } = driverData;

    // Validation
    if (!name || !phone || !license_number) {
      throw new Error('Tên, số điện thoại và số bằng lái là bắt buộc');
    }

    // Business rule: Kiểm tra trùng số bằng lái
    const existingDriver = await DriverModel.findByLicenseNumber(license_number);
    if (existingDriver) {
      throw new Error(`Số bằng lái ${license_number} đã tồn tại`);
    }

    // Format
    driverData.name = name.trim();
    driverData.phone = phone.trim();
    driverData.license_number = license_number.trim();

    return await DriverModel.create(driverData);
  }

  static async updateDriver(id, driverData) {
    if (!id || isNaN(id)) {
      throw new Error('ID không hợp lệ');
    }

    const exists = await DriverModel.exists(id);
    if (!exists) {
      throw new Error('Không tìm thấy tài xế để cập nhật');
    }

    const { name, phone, license_number } = driverData;

    if (!name || !phone || !license_number) {
      throw new Error('Tên, số điện thoại và số bằng lái là bắt buộc');
    }

    // Format
    driverData.name = name.trim();
    driverData.phone = phone.trim();
    driverData.license_number = license_number.trim();

    return await DriverModel.update(id, driverData);
  }

  static async deleteDriver(id) {
    if (!id || isNaN(id)) {
      throw new Error('ID không hợp lệ');
    }

    const exists = await DriverModel.exists(id);
    if (!exists) {
      throw new Error('Không tìm thấy tài xế để xóa');
    }

    const deleted = await DriverModel.delete(id);
    
    if (!deleted) {
      throw new Error('Xóa tài xế thất bại');
    }

    return true;
  }
}

export default DriverService;
```

#### Bước 3: Tạo Routes

Tương tự như Bus routes, tạo `routes/driversRoutes_NEW.js` với pattern:
- Gọi `DriverService` thay vì SQL trực tiếp
- Xử lý lỗi thống nhất

---

## BƯỚC 4: TEST TỪNG MODULE

### 4.1 Test với Postman/Thunder Client

**Test Bus Module:**

```http
### 1. Lấy tất cả xe bus
GET http://localhost:5000/api/buses

### 2. Lấy xe bus theo ID
GET http://localhost:5000/api/buses/1

### 3. Tạo xe bus mới
POST http://localhost:5000/api/buses
Content-Type: application/json

{
  "bus_number": "B999",
  "license_plate": "99z-99999",
  "status": "active"
}

### 4. Tạo xe bus trùng biển số (phải lỗi)
POST http://localhost:5000/api/buses
Content-Type: application/json

{
  "bus_number": "B998",
  "license_plate": "99z-99999",
  "status": "active"
}

### 5. Cập nhật xe bus
PUT http://localhost:5000/api/buses/1
Content-Type: application/json

{
  "bus_number": "B001-UPDATED",
  "license_plate": "30A-11111",
  "status": "active"
}

### 6. Xóa xe bus
DELETE http://localhost:5000/api/buses/999
```

**Kết quả mong đợi:**
- ✅ Biển số tự động chuyển thành chữ hoa
- ✅ Không cho tạo trùng biển số
- ✅ Validation đầy đủ
- ✅ Response nhất quán

---

### 4.2 So sánh với Routes cũ

Nếu dùng Option B (test song song):

```bash
# Test routes cũ
curl http://localhost:5000/api/buses

# Test routes mới
curl http://localhost:5000/api/buses-v2

# So sánh response
```

---

## BƯỚC 5: UPDATE SERVER.JS

### 5.1 Nếu thay thế hoàn toàn

```javascript
// server.js

// Import routes mới (không cần đổi gì nếu đã đổi tên file)
import busRoutes from './routes/BusesRoutes.js'; // ✅ Đã là routes mới
import studentsRoutes from './routes/studentsRoutes.js'; // ✅ Đã là routes mới
import driversRoutes from './routes/driversRoutes.js'; // ✅ Đã là routes mới

// Sử dụng như cũ
app.use('/api/buses', busRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/drivers', driversRoutes);
```

### 5.2 Nếu test song song

```javascript
// server.js

// Import cả 2 versions
import busRoutesOld from './routes/BusesRoutes_OLD.js';
import busRoutesNew from './routes/BusesRoutes.js';

// Mount 2 endpoints khác nhau
app.use('/api/buses', busRoutesOld);      // Routes cũ
app.use('/api/buses-v2', busRoutesNew);   // Routes mới

// Sau khi test xong, xóa routes cũ và chỉ giữ mới
```

---

## BƯỚC 6: TEST TOÀN BỘ HỆ THỐNG

### 6.1 Checklist

- [ ] Tất cả routes hoạt động bình thường
- [ ] Frontend vẫn hoạt động (nếu không đổi endpoint)
- [ ] Không có lỗi trong console
- [ ] Database queries chạy đúng
- [ ] Validation hoạt động
- [ ] Error handling đúng

### 6.2 Test E2E (End-to-End)

1. Mở frontend
2. Test các chức năng:
   - Xem danh sách xe bus
   - Thêm xe bus mới
   - Sửa xe bus
   - Xóa xe bus
   - Tương tự với học sinh, tài xế, etc.

---

## BƯỚC 7: CLEAN UP

### 7.1 Xóa files backup

```bash
# Sau khi chắc chắn mọi thứ OK
rm routes/BusesRoutes_OLD.js
rm routes/studentsRoutes_OLD.js
# ...
```

### 7.2 Commit changes

```bash
git add .
git commit -m "feat: Migrate to 3-layer architecture (MVC pattern)

- Add Model layer for database queries
- Add Service layer for business logic
- Refactor Routes to only handle HTTP
- Improve validation and error handling
- Better code organization and maintainability"
```

---

## 🛠️ TROUBLESHOOTING

### Lỗi 1: "Cannot find module '../models/Bus.js'"

**Nguyên nhân**: Chưa tạo file hoặc đường dẫn sai

**Giải pháp**:
```bash
# Kiểm tra file có tồn tại
ls backend/models/Bus.js

# Kiểm tra cú pháp import
# Đúng: import BusModel from '../models/Bus.js';
# Sai:  import BusModel from '../models/Bus'; (thiếu .js)
```

---

### Lỗi 2: "pool is not defined"

**Nguyên nhân**: Quên import pool trong Model

**Giải pháp**:
```javascript
// models/Bus.js
import pool from '../config/db.js'; // ✅ Thêm dòng này
```

---

### Lỗi 3: Routes cũ vẫn chạy thay vì routes mới

**Nguyên nhân**: Server cache hoặc chưa đổi tên file

**Giải pháp**:
```bash
# Restart server
# Ctrl+C rồi npm start lại

# Hoặc dùng nodemon để auto-reload
npm install -g nodemon
nodemon backend/server.js
```

---

### Lỗi 4: "Cannot destructure property 'bus_number' of 'undefined'"

**Nguyên nhân**: req.body empty (thiếu middleware)

**Giải pháp**:
```javascript
// server.js
app.use(express.json()); // ✅ Đảm bảo có dòng này
app.use(express.urlencoded({ extended: true }));
```

---

## 📊 TIẾN ĐỘ MIGRATION

### Ưu tiên (làm trước)

- [x] **Bus** - Đơn giản nhất, đã có sẵn
- [x] **Student** - Phức tạp hơn (nhiều JOIN), đã có sẵn
- [ ] **Driver** - Tương tự Bus
- [ ] **Parent** - Tương tự Bus
- [ ] **Route** - Có quan hệ với Bus, Driver
- [ ] **Schedule** - Phức tạp nhất

### Ước tính thời gian

| Module | Độ phức tạp | Thời gian |
|--------|-------------|-----------|
| Bus | Đơn giản | 30 phút |
| Student | Trung bình | 1 giờ |
| Driver | Đơn giản | 30 phút |
| Parent | Đơn giản | 30 phút |
| Route | Trung bình | 1 giờ |
| Schedule | Phức tạp | 2 giờ |
| **TỔNG** | | **~6 giờ** |

---

## 🎯 KẾT QUẢ SAU MIGRATION

### Trước

```
backend/
└── routes/
    ├── BusesRoutes.js        (SQL + Logic + HTTP)
    ├── studentsRoutes.js     (SQL + Logic + HTTP)
    └── driversRoutes.js      (SQL + Logic + HTTP)

❌ Code lộn xộn, khó bảo trì
```

### Sau

```
backend/
├── models/                   (Database queries)
│   ├── Bus.js
│   ├── Student.js
│   └── Driver.js
├── services/                 (Business logic)
│   ├── busService.js
│   ├── studentService.js
│   └── driverService.js
└── routes/                   (HTTP handlers)
    ├── BusesRoutes.js
    ├── studentsRoutes.js
    └── driversRoutes.js

✅ Code sạch, dễ đọc, dễ bảo trì
```

---

## 💡 TIPS

1. **Làm từng module một**: Đừng migration tất cả cùng lúc
2. **Test thường xuyên**: Sau mỗi module, test ngay
3. **Keep backup**: Giữ files cũ cho đến khi chắc chắn 100%
4. **Document changes**: Ghi chú những gì đã thay đổi
5. **Ask for help**: Nếu bị stuck, hỏi team hoặc Google

---

**🎉 Chúc bạn migration thành công!**
