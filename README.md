# Bus Tracking System

## Tổng quan
Hệ thống theo dõi xe buýt và quản trị lịch trình cho trường học. Backend mô phỏng và phát trạng thái realtime qua WebSocket, frontend hiển thị bản đồ, quản trị tuyến, tài xế, học sinh và lịch trình. Hỗ trợ lưu lịch sử vị trí (tùy chọn) để phát lại hành trình.

## Đóng góp của nhánh `kim-vinh` (Từ đầu dự án đến nay)
Trong suốt quá trình phát triển dự án, nhánh `kim-vinh` đã đảm nhiệm và hoàn thành các chức năng cốt lõi sau:

1. **Hệ thống WebSocket & Theo dõi Realtime**: Xây dựng và cải tiến luồng WebSocket (`bus_status_update`) giữa Server, Admin, Driver và Parent; bổ sung API truy xuất nhanh các chuyến xe đang hoạt động (in-progress) cho Admin.
2. **Mô phỏng chuyến đi (Trip Simulation) & Redis**: Triển khai kiến trúc Trip Simulation trên Backend để mô phỏng hành trình thật. Tích hợp hệ thống **Redis** để lưu và quản lý trạng thái chuyến đi (State Management), đảm bảo khả năng mở rộng và chịu lỗi.
3. **Lưu vết và Phát lại Hành trình (History Tracking)**: Bổ sung module theo dõi lịch sử vị trí xe buýt và giao diện cho phép Admin phát lại (Playback) hành trình trực quan trên bản đồ.
4. **Interactive Route Builder (Bản đồ xếp trạm)**: Xây dựng giao diện UI/UX kéo thả (Drag-and-Drop với dnd-kit) kết hợp bản đồ Leaflet để cấu hình Tuyến đường. Tự động hóa logic khóa điểm Trường học theo ca Sáng/Chiều.
5. **Chuẩn hóa Database & Luồng dữ liệu Học sinh**: Thiết kế lại kiến trúc gán học sinh vào tuyến/trạm thông qua bảng trung gian `student_route_subscriptions`, giải quyết triệt để lỗi đồng bộ và hiển thị học sinh trên UI của Tài xế.
6. **Thời gian thực tế (Actual Time)**: Hoàn thiện tính năng ghi nhận và hiển thị song song Giờ Dự kiến (Scheduled) và Giờ Thực tế (Actual) trên toàn bộ hệ thống Admin và Driver.
7. **Tối ưu Hệ thống, Bảo mật & Docker**:
   - Bổ sung **DB Transactions** (giao dịch) trong quá trình khởi tạo Tài xế để tránh rác dữ liệu.
   - Sửa các lỗi lệch múi giờ trong cấu hình MySQL.
   - Refactor và bảo mật toàn diện cấu hình môi trường Docker (`.env`).
   - Cấu hình lại cơ chế `docker-compose.yml` để tự động tuần tự hóa và thực thi các DB Migrations (từ 01 đến 05) khi chạy lần đầu.

## Cấu trúc dự án
```
frontend/    React + Vite (UI, WebSocket client, map)
backend/     Node.js + Express (REST API, Socket.IO, simulation)
database/    SQL scripts (schema, seed, migrations)
docs/        Documentation
```

## Chức năng backend
- Xác thực đăng nhập và phân quyền theo role (admin, driver, parent)
- Quản lý user (CRUD)
- Quản lý xe buýt (CRUD, lọc xe đang hoạt động, tìm theo biển số)
- Quản lý tuyến đường (Interactive Map kéo thả xếp trạm, tự động tính quãng đường)
- Tự động gán/lock điểm Trường học theo ca Sáng/Chiều
- Quản lý lịch trình (Hiển thị song song Giờ dự kiến và Giờ thực tế chạy)
- Gán học sinh vào tuyến/điểm dừng (chuẩn hóa RESTful với bảng trung gian `student_route_subscriptions`)
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
- Frontend: React, Vite, React Router, Leaflet, dnd-kit (kéo thả), Socket.IO client, Tailwind CSS
- Backend: Node.js, Express, Socket.IO, MySQL, Redis (quản lý state trip), JWT, Axios
- Dev/Tooling: ESLint, Jest, Docker Compose (Tự động khởi tạo và chạy Migrations tuần tự)

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
