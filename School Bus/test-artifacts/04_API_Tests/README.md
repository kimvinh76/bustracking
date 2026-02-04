# API Tests - School Bus Tracking System

## Postman Collection

Import file `Postman_Collection.json` vào Postman để test API.

## API Endpoints cần test

### 🔐 Authentication
- POST `/auth/login` - Đăng nhập
- POST `/auth/register` - Đăng ký
- POST `/auth/logout` - Đăng xuất
- POST `/auth/refresh` - Refresh token

### 👨‍✈️ Drivers
- GET `/drivers` - Lấy danh sách tài xế
- GET `/drivers/:id` - Lấy thông tin 1 tài xế
- POST `/drivers` - Tạo tài xế mới
- PUT `/drivers/:id` - Cập nhật tài xế
- DELETE `/drivers/:id` - Xóa tài xế

### 🚌 Buses
- GET `/buses` - Lấy danh sách xe bus
- GET `/buses/:id` - Lấy thông tin 1 xe bus
- POST `/buses` - Tạo xe bus mới
- PUT `/buses/:id` - Cập nhật xe bus
- DELETE `/buses/:id` - Xóa xe bus

### 🗺️ Routes
- GET `/routes` - Lấy danh sách tuyến đường
- GET `/routes/:id` - Lấy thông tin 1 tuyến
- GET `/routes/:id/stops` - Lấy điểm dừng của tuyến
- POST `/routes` - Tạo tuyến mới
- PUT `/routes/:id` - Cập nhật tuyến
- DELETE `/routes/:id` - Xóa tuyến

### 📅 Schedules
- GET `/schedules` - Lấy danh sách lịch trình
- GET `/schedules/:id` - Lấy chi tiết lịch trình
- POST `/schedules` - Tạo lịch trình mới
- PUT `/schedules/:id` - Cập nhật lịch trình
- DELETE `/schedules/:id` - Xóa lịch trình

###  Incidents
- GET `/incidents` - Lấy danh sách sự cố
- POST `/incidents` - Báo cáo sự cố mới
- PUT `/incidents/:id` - Cập nhật sự cố

### 👨‍ Students
- GET `/students` - Lấy danh sách học sinh
- GET `/students/:id` - Thông tin học sinh
- POST `/students` - Thêm học sinh
- PUT `/students/:id` - Cập nhật học sinh
- DELETE `/students/:id` - Xóa học sinh

## Test Cases cho mỗi API

1. **Happy Path**: Request đúng format, data hợp lệ → Status 200/201
2. **Missing Required Fields**: Thiếu field bắt buộc → Status 400
3. **Invalid Data Type**: Sai kiểu dữ liệu → Status 400
4. **Unauthorized**: Không có token → Status 401
5. **Forbidden**: Token hợp lệ nhưng không có quyền → Status 403
6. **Not Found**: Resource không tồn tại → Status 404
7. **Duplicate**: Tạo resource trùng (unique field) → Status 409
8. **Server Error**: Mock server error → Status 500

## Environment Variables

Tạo file `.env` hoặc Postman Environment:

```
BASE_URL=http://localhost:3000
API_VERSION=/api
TOKEN=your_jwt_token_here
```
