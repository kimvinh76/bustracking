# 🧪 HƯỚNG DẪN TEST API CHO NGƯỜI MỚI BẮT ĐẦU

## 📚 MỤC LỤC
1. [API là gì?](#api-là-gì)
2. [Cách test API](#cách-test-api)
3. [Sửa lỗi "Invalid URL"](#sửa-lỗi-invalid-url)
4. [Test từng bước](#test-từng-bước)
5. [Hiểu Response](#hiểu-response)

---

## 1. API LÀ GÌ?

### Khái niệm đơn giản

**API (Application Programming Interface)** là cách để:
- **Frontend (React)** giao tiếp với **Backend (Node.js)**
- **Gửi request** (yêu cầu) và **nhận response** (phản hồi)

### Ví dụ thực tế

Giống như bạn vào nhà hàng:
```
Bạn (Frontend) → Phục vụ (API) → Bếp (Backend) → Database (Kho nguyên liệu)
     ↓              ↓              ↓                    ↓
"Cho tôi       Nhận yêu cầu    Nấu món ăn         Lấy nguyên liệu
 1 phở"        và chuyển        từ nguyên liệu     từ kho
                 ↓
              Trả món
```

### Trong dự án Bus Tracking

```
React App → API Request → Node.js Server → MySQL Database
(Giao diện)   (HTTP)      (Xử lý logic)    (Lưu dữ liệu)
```

---

## 2. CÁCH TEST API

### A. Hiểu các phần của 1 API Request

```
┌─────────────────────────────────────────────────────┐
│  1. METHOD (Phương thức)                             │
│     GET, POST, PUT, DELETE                           │
├─────────────────────────────────────────────────────┤
│  2. URL (Địa chỉ)                                    │
│     http://localhost:5000/api/buses                  │
│     └──┬──┘ └─┬─┘└─┬──┘└────┬─────┘                │
│     Protocol Port Host     Path                      │
├─────────────────────────────────────────────────────┤
│  3. HEADERS (Tùy chọn)                               │
│     Content-Type: application/json                   │
├─────────────────────────────────────────────────────┤
│  4. BODY (Chỉ với POST/PUT)                          │
│     { "bus_number": "B01" }                          │
└─────────────────────────────────────────────────────┘
```

### B. Các HTTP Methods

| Method | Mục đích | Ví dụ |
|--------|----------|-------|
| **GET** | Lấy dữ liệu (đọc) | Xem danh sách xe bus |
| **POST** | Tạo mới | Thêm xe bus mới |
| **PUT** | Cập nhật toàn bộ | Sửa thông tin xe bus |
| **PATCH** | Cập nhật 1 phần | Đổi status xe bus |
| **DELETE** | Xóa | Xóa xe bus |

---

## 3. SỬA LỖI "INVALID URL"

### Nguyên nhân

Lỗi "Invalid URL" trong Thunder Client thường do:

1. ❌ **Server chưa chạy**
2. ❌ **Port sai**
3. ❌ **URL gõ sai**
4. ❌ **Thunder Client chưa cài đúng**

### Giải pháp

#### Bước 1: Kiểm tra Server đang chạy

```powershell
# Mở terminal trong VS Code (Ctrl + `)
cd "School Bus/backend"

# Kiểm tra có file server.js không
ls server.js

# Khởi động server
npm start
```

**Kết quả mong đợi:**
```
🚀 Backend server đang chạy tại http://localhost:5000
🔌 WebSocket server đang chạy tại ws://localhost:5000
📊 Health check: http://localhost:5000/api/health
🚌 Bus API: http://localhost:5000/api/buses
```

#### Bước 2: Test bằng Browser trước (Dễ nhất)

Mở trình duyệt, gõ vào thanh địa chỉ:

```
http://localhost:5000/api/buses
```

**Nếu thấy:**
```json
{
  "success": true,
  "data": [ ... ]
}
```
→ ✅ Server hoạt động bình thường!

**Nếu thấy:**
```
This site can't be reached
```
→ ❌ Server chưa chạy, quay lại Bước 1

#### Bước 3: Test bằng PowerShell/CMD

```powershell
# Test bằng curl
curl http://localhost:5000/api/buses

# Hoặc Invoke-WebRequest (PowerShell)
Invoke-WebRequest -Uri http://localhost:5000/api/buses
```

#### Bước 4: Test bằng Thunder Client

**A. Cài đặt Thunder Client**

1. VS Code → Extensions (Ctrl+Shift+X)
2. Search "Thunder Client"
3. Install → Reload VS Code

**B. Tạo Request mới**

1. Click biểu tượng sấm sét (⚡) ở sidebar trái
2. Click "New Request"
3. Điền thông tin:
   ```
   Method: GET
   URL: http://localhost:5000/api/buses
   ```
4. Click "Send"

**⚠️ LƯU Ý QUAN TRỌNG:**

Đừng gõ thừa khoảng trắng trong URL:
```
❌ http://localhost:5000/api/buses /active  (SAI - có khoảng trắng)
✅ http://localhost:5000/api/buses/active   (ĐÚNG)
```

---

## 4. TEST TỪNG BƯỚC (CHO NGƯỜI MỚI)

### Test 1: Health Check (Kiểm tra server)

**Mục đích:** Kiểm tra server có chạy không

```
Method: GET
URL: http://localhost:5000/api/health
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Server and database are healthy",
  "timestamp": "2025-12-27T15:38:39.123Z"
}
```

**Nếu thấy kết quả này** → Server đang chạy tốt! ✅

---

### Test 2: Lấy tất cả xe bus

**Mục đích:** Xem danh sách xe bus

```
Method: GET
URL: http://localhost:5000/api/buses
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "bus_number": "BUS-04",
      "license_plate": "51K-123.45",
      "capacity": 20,
      "status": "active"
    }
  ],
  "count": 1
}
```

**Giải thích:**
- `success: true` → API hoạt động thành công
- `data: [...]` → Mảng chứa danh sách xe bus
- `count: 1` → Có 1 xe bus

---

### Test 3: Lấy xe bus đang hoạt động

**Mục đích:** Chỉ lấy xe bus có status = "active"

```
Method: GET
URL: http://localhost:5000/api/buses/active
```

**⚠️ Đây là route BẠN ĐANG TEST trong screenshot!**

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "bus_number": "BUS-04",
      "license_plate": "51K-123.45",
      "status": "active"
    }
  ],
  "count": 1
}
```

**Nếu gặp lỗi "Invalid URL":**
1. Kiểm tra server có chạy (xem Test 1)
2. Kiểm tra URL không có khoảng trắng thừa
3. Thử test bằng browser trước

---

### Test 4: Tạo xe bus mới (POST)

**Mục đích:** Thêm xe bus vào database

```
Method: POST
URL: http://localhost:5000/api/buses
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "bus_number": "B999",
  "license_plate": "99z-99999",
  "status": "active"
}
```

**Các bước trong Thunder Client:**
1. Method: Chọn "POST"
2. URL: `http://localhost:5000/api/buses`
3. Tab "Body" → Chọn "JSON"
4. Gõ vào body:
   ```json
   {
     "bus_number": "B999",
     "license_plate": "99z-99999"
   }
   ```
5. Click "Send"

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Tạo xe bus thành công",
  "data": {
    "id": 10,
    "bus_number": "B999",
    "license_plate": "99Z-99999",  // ✅ Tự động viết hoa!
    "status": "active"
  }
}
```

**Chú ý:**
- Biển số `"99z-99999"` tự động chuyển thành `"99Z-99999"` (chữ hoa)
- Đây là tính năng của code mới (Service layer)

---

### Test 5: Tạo xe bus trùng biển số (Test validation)

**Mục đích:** Kiểm tra hệ thống có chặn trùng biển số không

```
Method: POST
URL: http://localhost:5000/api/buses
Body:
{
  "bus_number": "B998",
  "license_plate": "99Z-99999"
}
```

**Kết quả mong đợi:**
```json
{
  "success": false,
  "message": "Biển số xe 99Z-99999 đã tồn tại"
}
```

**HTTP Status:** 400 (Bad Request)

**Giải thích:**
- Hệ thống từ chối tạo xe bus vì biển số đã có
- Đây là business logic trong BusService

---

### Test 6: Lấy xe bus theo ID

**Mục đích:** Xem chi tiết 1 xe bus cụ thể

```
Method: GET
URL: http://localhost:5000/api/buses/1
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "bus_number": "BUS-04",
    "license_plate": "51K-123.45",
    "capacity": 20,
    "status": "active"
  }
}
```

**Nếu ID không tồn tại:**
```json
{
  "success": false,
  "message": "Không tìm thấy xe bus"
}
```

**HTTP Status:** 404 (Not Found)

---

### Test 7: Cập nhật xe bus

**Mục đích:** Sửa thông tin xe bus

```
Method: PUT
URL: http://localhost:5000/api/buses/1
Body:
{
  "bus_number": "BUS-04-UPDATED",
  "license_plate": "51K-123.45",
  "capacity": 25,
  "status": "active"
}
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Cập nhật xe bus thành công",
  "data": {
    "id": 1,
    "bus_number": "BUS-04-UPDATED",
    "license_plate": "51K-123.45",
    "capacity": 25,
    "status": "active"
  }
}
```

---

### Test 8: Xóa xe bus

**Mục đích:** Xóa xe bus khỏi hệ thống

```
Method: DELETE
URL: http://localhost:5000/api/buses/10
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Xóa xe bus thành công"
}
```

**Nếu ID không tồn tại:**
```json
{
  "success": false,
  "message": "Không tìm thấy xe bus để xóa"
}
```

---

## 5. HIỂU RESPONSE

### A. HTTP Status Codes

| Code | Ý nghĩa | Khi nào xảy ra |
|------|---------|----------------|
| **200** | OK | GET/PUT thành công |
| **201** | Created | POST tạo mới thành công |
| **400** | Bad Request | Dữ liệu không hợp lệ (validation failed) |
| **404** | Not Found | Không tìm thấy resource (VD: ID không tồn tại) |
| **500** | Internal Server Error | Lỗi server (bug trong code) |

### B. Cấu trúc Response

```json
{
  "success": true,           // true/false - API có thành công không
  "message": "...",          // Thông báo cho user (chỉ có khi cần)
  "data": { ... },          // Dữ liệu trả về
  "count": 10,              // Số lượng records (với danh sách)
  "error": "..."            // Chi tiết lỗi (khi success = false)
}
```

### C. Đọc Response trong Thunder Client

```
┌────────────────────────────────────────┐
│  Status: 200 OK          Time: 45ms    │  ← HTTP Status + Thời gian xử lý
├────────────────────────────────────────┤
│  Response Body:                        │
│  {                                     │
│    "success": true,                    │  ← Kiểm tra này trước
│    "data": [ ... ]                     │  ← Dữ liệu ở đây
│  }                                     │
└────────────────────────────────────────┘
```

**Các tab trong Thunder Client:**
- **Body**: Nội dung response (JSON/text)
- **Headers**: HTTP headers (metadata)
- **Cookies**: Cookies nếu có
- **Timeline**: Chi tiết timing

---

## 6. TROUBLESHOOTING (XỬ LÝ LỖI)

### Lỗi 1: "Invalid URL" (Lỗi bạn đang gặp)

**Nguyên nhân:**
- Server chưa chạy
- URL gõ sai
- Thunder Client lỗi

**Cách fix:**

```bash
# Bước 1: Kiểm tra server
cd "School Bus/backend"
npm start

# Bước 2: Đợi thấy message này
# 🚀 Backend server đang chạy tại http://localhost:5000

# Bước 3: Test bằng browser
# Mở: http://localhost:5000/api/health

# Bước 4: Nếu browser OK, Thunder Client mới test tiếp
```

---

### Lỗi 2: "Cannot GET /api/buses"

**Nguyên nhân:** Endpoint không tồn tại

**Cách fix:**

```bash
# Kiểm tra file routes có được import không
# Mở: School Bus/backend/server.js

# Phải có dòng:
app.use('/api/buses', busRoutes);
```

---

### Lỗi 3: "ECONNREFUSED"

**Nguyên nhân:** Server không chạy ở port đó

**Cách fix:**

```bash
# Kiểm tra port
netstat -ano | findstr :5000

# Nếu không thấy gì → Server chưa chạy
# Chạy lại: npm start
```

---

### Lỗi 4: Response trống

**Nguyên nhân:** Database trống

**Cách fix:**

```bash
# Kiểm tra database có dữ liệu không
# Hoặc tạo xe bus mới bằng POST
```

---

## 7. WORKFLOW TEST API (CHUẨN)

### Quy trình test 1 API endpoint

```
1. ✅ Kiểm tra server đang chạy
   → npm start
   
2. ✅ Test bằng browser trước (GET endpoints)
   → http://localhost:5000/api/buses
   
3. ✅ Test bằng Thunder Client
   → Tạo request mới
   → Điền method + URL
   → Send
   
4. ✅ Kiểm tra response
   → Status code 200/201? → OK
   → success: true? → OK
   → data có đúng không? → OK
   
5. ✅ Test edge cases (trường hợp đặc biệt)
   → ID không tồn tại
   → Dữ liệu thiếu
   → Dữ liệu sai format
```

---

## 8. BÀI TẬP THỰC HÀNH

### Bài 1: Test Health Check

```
✅ Làm theo Test 1 phía trên
✅ Chụp màn hình kết quả
✅ Kiểm tra status = 200
```

### Bài 2: Lấy danh sách xe bus

```
✅ GET http://localhost:5000/api/buses
✅ Đếm có bao nhiêu xe bus
✅ Ghi lại license_plate của xe đầu tiên
```

### Bài 3: Tạo xe bus mới

```
✅ POST http://localhost:5000/api/buses
✅ Body: { "bus_number": "TEST-01", "license_plate": "test-123" }
✅ Kiểm tra biển số có tự động viết hoa không
```

### Bài 4: Test validation

```
✅ POST với body trống: {}
✅ Xem error message
✅ Status code phải là 400
```

### Bài 5: Test route mới (GET active buses)

```
✅ GET http://localhost:5000/api/buses/active
✅ So sánh kết quả với /api/buses
✅ Chỉ nên thấy xe có status = "active"
```

---

## 9. CHECKLIST TRƯỚC KHI TEST

- [ ] Server đã chạy (`npm start`)
- [ ] Thấy message "Backend server đang chạy..."
- [ ] Browser test được `http://localhost:5000/api/health`
- [ ] Thunder Client đã cài đặt
- [ ] Đã tạo request mới trong Thunder Client
- [ ] URL không có khoảng trắng thừa
- [ ] Method chọn đúng (GET/POST/PUT/DELETE)
- [ ] Body có JSON hợp lệ (với POST/PUT)
- [ ] Header `Content-Type: application/json` (với POST/PUT)

---

## 10. TÀI LIỆU THAM KHẢO

### REST API Basics
- [HTTP Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

### Tools
- [Thunder Client Documentation](https://www.thunderclient.com/docs)
- [Postman Learning Center](https://learning.postman.com/)

---

## 📌 KẾT LUẬN

**3 bước test API cơ bản:**

1. **Server chạy chưa?** → `npm start`
2. **Browser test được chưa?** → Mở `http://localhost:5000/api/buses`
3. **Thunder Client** → Tạo request → Send

**Nếu vẫn lỗi "Invalid URL":**
1. Restart VS Code
2. Restart server (`Ctrl+C` → `npm start`)
3. Thử Postman thay vì Thunder Client
4. Thử test bằng `curl` trong terminal

---

**🎉 Chúc bạn test API thành công!**

Nếu vẫn gặp lỗi, hãy chụp màn hình:
1. Thunder Client request
2. Terminal (nơi chạy npm start)
3. Browser test result
