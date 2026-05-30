# Bus Tracking System

## Tổng quan
Hệ thống theo dõi xe buýt và quản trị lịch trình cho trường học. Backend mô phỏng và phát trạng thái realtime qua WebSocket, frontend hiển thị bản đồ, quản trị tuyến, tài xế, học sinh và lịch trình. Hỗ trợ lưu lịch sử vị trí (tùy chọn) để phát lại hành trình.

## Cấu trúc dự án
```
frontend/    React + Vite (UI, WebSocket client, map)
backend/     Node.js + Express (REST API, Socket.IO, simulation)
database/    SQL scripts (schema, seed)
docs/        Documentation
```

## Chức năng backend
- Xác thực đăng nhập và phân quyền theo role (admin, driver, parent)
- Quản lý user (CRUD)
- Quản lý xe buýt (CRUD, lọc xe đang hoạt động, tìm theo biển số)
- Quản lý tuyến đường và điểm dừng (CRUD, danh sách stop, thông tin đón/trả)
- Tính lại quãng đường tuyến theo route_stops
- Quản lý lịch trình (CRUD cho admin, lịch theo driver, lịch đang chạy, lịch theo tuyến)
- Gán học sinh vào tuyến/điểm dừng (theo ca sáng/chiều)
- Quản lý học sinh (CRUD, tìm kiếm, lọc theo lớp, theo tuyến)
- Quản lý phụ huynh và quan hệ phụ huynh - học sinh
- Danh sách lớp học đang active
- Quản lý sự cố (tạo, lọc theo trạng thái/mức độ/tuyến, cập nhật trạng thái)
- Realtime tracking qua Socket.IO (join/leave room, status updates, alerts)
- Mô phỏng trip trên backend, phát trạng thái đồng bộ cho mọi client
- Lưu checkpoint trip để khôi phục sau restart
- Lưu lịch sử vị trí (bus_locations) theo lịch trình hoặc xe (tùy chọn)
- API đọc lịch sử vị trí theo bus_id/schedule_id

## Chức năng frontend
- Đăng nhập theo role, tự điều hướng theo quyền
- Admin
	- Bản đồ realtime theo dõi chuyến đang chạy
	- Quản lý tuyến đường, xe buýt, tài xế, học sinh, phụ huynh, lịch trình, user
	- Nhận cảnh báo sự cố theo thời gian thực
	- Xem lại lịch sử hành trình và phát lại trên bản đồ
- Driver
	- Xem lịch làm việc và chi tiết lịch trình
	- Bản đồ chuyến đi, trạng thái trip, danh sách học sinh
	- Gửi sự cố, xác nhận điểm dừng, điều khiển start/pause/resume/stop
- Parent
	- Thông tin học sinh, tuyến được gán
	- Theo dõi realtime vị trí xe buýt
	- Xem sự cố liên quan tuyến

## Luồng realtime
- Driver gửi lệnh điều khiển trip và cảnh báo
- Backend mô phỏng trip và phát `bus_status_update` cho admin/driver/parent
- Admin/Parent chỉ lắng nghe trạng thái, không tự tính vị trí

## Công nghệ
- Frontend: React, Vite, React Router, Leaflet, Socket.IO client, Tailwind CSS
- Backend: Node.js, Express, Socket.IO, MySQL, JWT, Axios
- Dev/Tooling: ESLint, Jest, Docker Compose

## Cấu hình môi trường
Tạo file `.env` từ `.env.example` ở từng thư mục:
- Backend: `backend/.env.example` -> `backend/.env`
- Frontend: `frontend/.env.example` -> `frontend/.env`

## Khởi chạy
### Docker
```bash
docker-compose up --build
```
Truy cập: http://localhost:5173

### Local development
```bash
# Backend
cd backend
npm install
npm run dev
```
```bash
# Frontend
cd frontend
npm install
npm run dev
```

## Lịch sử vị trí
Lịch sử chỉ được ghi khi bật `ENABLE_BUS_LOCATION_HISTORY=1` và cấu hình
`BUS_LOCATION_HISTORY_INTERVAL_MS` trong `backend/.env`. Dữ liệu nằm ở bảng
`bus_locations` và có thể phát lại trên trang quản trị.
