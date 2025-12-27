# 🧪 TEST API - BUS TRACKING SYSTEM

## 📝 HƯỚNG DẪN SỬ DỤNG

File này chứa các API endpoints để test với **Thunder Client** (VS Code) hoặc **Postman**.

### Cài đặt Thunder Client (VS Code)
1. Mở VS Code
2. Extensions → Search "Thunder Client"
3. Install
4. Click biểu tượng sấm sét ở sidebar

---

## 🚌 BUS API (Routes mới - đã cải tiến)

### 1. Lấy tất cả xe bus
```http
GET http://localhost:5000/api/buses
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "bus_number": "B01",
      "license_plate": "30A-12345",
      "status": "active"
    }
  ],
  "count": 1
}
```

---

### 2. Lấy xe bus theo ID
```http
GET http://localhost:5000/api/buses/1
```

---

### 3. Lấy xe bus đang hoạt động
```http
GET http://localhost:5000/api/buses/active
```

---

### 4. Tạo xe bus mới
```http
POST http://localhost:5000/api/buses
Content-Type: application/json

{
  "bus_number": "B999",
  "license_plate": "99z-99999",
  "status": "active"
}
```

**Kết quả mong đợi:**
- ✅ Biển số tự động chuyển thành chữ hoa: `"99Z-99999"`
- ✅ Tự động trim khoảng trắng
- ✅ Status code: 201

---

### 5. Tạo xe bus trùng biển số (Test validation)
```http
POST http://localhost:5000/api/buses
Content-Type: application/json

{
  "bus_number": "B998",
  "license_plate": "99z-99999"
}
```

**Kết quả mong đợi:**
- ❌ Lỗi: `"Biển số xe 99Z-99999 đã tồn tại"`
- ❌ Status code: 400

---

### 6. Tạo xe bus thiếu thông tin (Test validation)
```http
POST http://localhost:5000/api/buses
Content-Type: application/json

{
  "bus_number": "B997"
}
```

**Kết quả mong đợi:**
- ❌ Lỗi: `"Mã xe và biển số xe là bắt buộc"`
- ❌ Status code: 400

---

### 7. Cập nhật xe bus
```http
PUT http://localhost:5000/api/buses/1
Content-Type: application/json

{
  "bus_number": "B001-UPDATED",
  "license_plate": "30A-11111",
  "status": "active"
}
```

---

### 8. Xóa xe bus
```http
DELETE http://localhost:5000/api/buses/999
```

---

## 👨‍🎓 STUDENT API (Routes mới)

### 1. Lấy tất cả học sinh
```http
GET http://localhost:5000/api/students
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Nguyễn Văn A",
      "grade": "10",
      "class": "10A1",
      "class_name": "10A1",
      "parent_name": "Nguyễn Văn B",
      "morning_route_name": "Tuyến 1",
      "afternoon_route_name": "Tuyến 1"
    }
  ],
  "count": 1
}
```

---

### 2. Lấy học sinh theo ID
```http
GET http://localhost:5000/api/students/1
```

---

### 3. Tìm kiếm học sinh theo tên
```http
GET http://localhost:5000/api/students/search?q=Nguyễn
```

**Query params:**
- `q`: Từ khóa tìm kiếm (tối thiểu 2 ký tự)

---

### 4. Lấy học sinh theo lớp
```http
GET http://localhost:5000/api/students/class/10A1
```

---

### 5. Lấy học sinh theo tuyến đường
```http
GET http://localhost:5000/api/students/route/1?timeOfDay=morning
```

**Query params:**
- `timeOfDay`: `morning` hoặc `afternoon` (default: `morning`)

---

### 6. Tạo học sinh mới
```http
POST http://localhost:5000/api/students
Content-Type: application/json

{
  "name": "Trần Thị C",
  "class": "10A1",
  "phone": "0123456789",
  "address": "123 Đường ABC",
  "parent_id": 1,
  "morning_route_id": 1,
  "morning_pickup_stop_id": 1,
  "afternoon_route_id": 1,
  "afternoon_dropoff_stop_id": 1
}
```

**Chú ý:**
- ✅ Tự động lấy `grade` và `class_id` từ lớp `10A1`
- ✅ Tự động trim tên và lớp

---

### 7. Tạo học sinh với lớp không tồn tại (Test validation)
```http
POST http://localhost:5000/api/students
Content-Type: application/json

{
  "name": "Test Student",
  "class": "99Z9"
}
```

**Kết quả mong đợi:**
- ❌ Lỗi: `"Không tìm thấy lớp học \"99Z9\""`
- ❌ Status code: 400

---

### 8. Cập nhật học sinh
```http
PUT http://localhost:5000/api/students/1
Content-Type: application/json

{
  "name": "Nguyễn Văn A (Updated)",
  "class": "10A2",
  "phone": "0987654321",
  "address": "456 Đường XYZ"
}
```

---

### 9. Gán học sinh vào tuyến đường
```http
PUT http://localhost:5000/api/students/1/assign-route
Content-Type: application/json

{
  "routeId": 2,
  "timeOfDay": "morning",
  "stopId": 5
}
```

**Parameters:**
- `routeId`: ID của tuyến đường
- `timeOfDay`: `"morning"` hoặc `"afternoon"`
- `stopId`: ID của trạm đón/trả

---

### 10. Xóa học sinh (Soft delete)
```http
DELETE http://localhost:5000/api/students/1
```

**Chú ý:** Soft delete - chỉ đổi `status` thành `"inactive"`, không xóa khỏi database

---

## 🔍 SO SÁNH: CŨ vs MỚI

### Test tạo xe bus với biển số thường

#### Routes CŨ
```http
POST http://localhost:5000/api/buses
Content-Type: application/json

{
  "bus_number": "B100",
  "license_plate": "30a-12345"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "license_plate": "30a-12345"  // ❌ Không format
  }
}
```

#### Routes MỚI
```http
POST http://localhost:5000/api/buses
Content-Type: application/json

{
  "bus_number": "B100",
  "license_plate": "30a-12345"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "license_plate": "30A-12345"  // ✅ Tự động chữ hoa
  }
}
```

---

### Test tạo xe bus trùng biển số

#### Routes CŨ
```http
POST http://localhost:5000/api/buses
Content-Type: application/json

{
  "bus_number": "B101",
  "license_plate": "30A-12345"
}
```

**Response:**
```json
{
  "success": false,
  "error": "Duplicate entry..."  // ❌ Lỗi database không rõ ràng
}
```

#### Routes MỚI
```http
POST http://localhost:5000/api/buses
Content-Type: application/json

{
  "bus_number": "B101",
  "license_plate": "30A-12345"
}
```

**Response:**
```json
{
  "success": false,
  "message": "Biển số xe 30A-12345 đã tồn tại"  // ✅ Message rõ ràng
}
```

---

## 🧪 TEST WORKFLOW

### Workflow 1: Tạo và quản lý xe bus

```bash
# 1. Xem danh sách xe bus ban đầu
GET /api/buses

# 2. Tạo xe bus mới
POST /api/buses
{
  "bus_number": "B888",
  "license_plate": "88x-88888"
}

# 3. Kiểm tra xe bus vừa tạo
GET /api/buses

# 4. Lấy chi tiết xe bus
GET /api/buses/{id_vừa_tạo}

# 5. Cập nhật xe bus
PUT /api/buses/{id_vừa_tạo}
{
  "bus_number": "B888-UPDATED",
  "license_plate": "88X-88888",
  "status": "active"
}

# 6. Kiểm tra xe bus sau khi cập nhật
GET /api/buses/{id_vừa_tạo}

# 7. Xóa xe bus
DELETE /api/buses/{id_vừa_tạo}

# 8. Kiểm tra xe bus đã bị xóa
GET /api/buses/{id_vừa_tạo}  # Should return 404
```

---

### Workflow 2: Tạo học sinh và gán tuyến đường

```bash
# 1. Xem danh sách học sinh
GET /api/students

# 2. Tạo học sinh mới
POST /api/students
{
  "name": "Test Student",
  "class": "10A1",
  "phone": "0123456789"
}

# 3. Gán tuyến đường sáng
PUT /api/students/{id_vừa_tạo}/assign-route
{
  "routeId": 1,
  "timeOfDay": "morning",
  "stopId": 1
}

# 4. Gán tuyến đường chiều
PUT /api/students/{id_vừa_tạo}/assign-route
{
  "routeId": 2,
  "timeOfDay": "afternoon",
  "stopId": 5
}

# 5. Kiểm tra học sinh đã được gán tuyến
GET /api/students/{id_vừa_tạo}

# 6. Xem tất cả học sinh trong tuyến đường
GET /api/students/route/1?timeOfDay=morning

# 7. Xóa học sinh
DELETE /api/students/{id_vừa_tạo}
```

---

## ✅ CHECKLIST TEST

Sau khi migration sang routes mới, test các tính năng:

### Bus Module
- [ ] Lấy danh sách xe bus
- [ ] Lấy xe bus theo ID
- [ ] Tạo xe bus mới (biển số tự động viết hoa)
- [ ] Tạo xe bus trùng biển số (phải lỗi)
- [ ] Tạo xe bus thiếu thông tin (phải lỗi)
- [ ] Cập nhật xe bus
- [ ] Xóa xe bus

### Student Module
- [ ] Lấy danh sách học sinh
- [ ] Lấy học sinh theo ID
- [ ] Tìm kiếm học sinh theo tên
- [ ] Lấy học sinh theo lớp
- [ ] Lấy học sinh theo tuyến đường
- [ ] Tạo học sinh mới (tự động lấy grade từ class)
- [ ] Tạo học sinh với lớp không tồn tại (phải lỗi)
- [ ] Cập nhật học sinh
- [ ] Gán tuyến đường
- [ ] Xóa học sinh (soft delete)

---

## 🐛 DEBUG TIPS

### Lỗi 404 - Not Found
```bash
# Kiểm tra endpoint đúng chưa
GET http://localhost:5000/api/buses  # ✅ Đúng
GET http://localhost:5000/buses      # ❌ Sai (thiếu /api)
```

### Lỗi 500 - Internal Server Error
```bash
# Xem terminal để thấy error stack trace
# Thường do:
# - Lỗi SQL syntax
# - Thiếu import
# - Lỗi logic trong code
```

### Request không gửi được
```bash
# Kiểm tra:
1. Server có đang chạy không? (npm start)
2. Port đúng không? (5000)
3. Content-Type header đã có chưa?
```

### Response không đúng
```bash
# Kiểm tra:
1. Đã dùng file routes MỚI chưa?
2. Đã restart server sau khi sửa code chưa?
3. Đã có dữ liệu trong database chưa?
```

---

## 📊 EXPECTED RESULTS

### ✅ Routes MỚI (Cải tiến)

| Feature | Kết quả |
|---------|---------|
| Biển số xe | Tự động viết hoa |
| Validation | Đầy đủ, message rõ ràng |
| Kiểm tra trùng | Có |
| Error handling | Nhất quán, status code đúng |
| Response format | Chuẩn, có `success`, `message`, `data` |

### ❌ Routes CŨ

| Feature | Kết quả |
|---------|---------|
| Biển số xe | Không format |
| Validation | Đơn giản |
| Kiểm tra trùng | Không (lỗi database) |
| Error handling | Không nhất quán |
| Response format | Không đồng nhất |

---

## 🚀 NEXT STEPS

Sau khi test xong Bus và Student:

1. [ ] Áp dụng cho Driver module
2. [ ] Áp dụng cho Parent module
3. [ ] Áp dụng cho Route module
4. [ ] Áp dụng cho Schedule module
5. [ ] Viết automated tests (Jest)
6. [ ] Deploy lên production

---

**📌 Lưu ý**: Đảm bảo server đang chạy trước khi test!

```bash
cd "School Bus/backend"
npm start
```

Server sẽ chạy tại: http://localhost:5000
