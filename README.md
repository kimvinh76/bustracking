# Bus Tracking System

Hệ thống quản lý xe buýt đưa đón học sinh và theo dõi lộ trình trực tuyến theo thời gian thực (**Admin – Tài xế – Phụ huynh**).

---

## 1. Demo Cloud (Production)

* **Frontend (Vercel):** [https://bustracking-pied.vercel.app](https://bustracking-pied.vercel.app)
* **Backend API & WebSocket (Render):** [https://bustracking-w7as.onrender.com](https://bustracking-w7as.onrender.com)
* **Health Check API:** [https://bustracking-w7as.onrender.com/api/health](https://bustracking-w7as.onrender.com/api/health)
* **Database (TiDB Cloud – MySQL 8 Compatible):** Khởi tạo từ file duy nhất [`database/cloud_init.sql`](database/cloud_init.sql)
* **State Cache (Redis Cloud):** Lưu checkpoint mô phỏng chuyến đi qua `REDIS_URL` (tự động fallback sang RAM nếu không cấu hình)

> **Lưu ý khi dùng bản Cloud:**
> * Render Free Tier tự ngủ sau ~15 phút không có truy cập; lần mở đầu tiên có thể mất 30–50 giây để khởi động lại.
> * **Tài khoản test mặc định:**
>   * **Admin:** `admin` / `admin123`
>   * **Tài xế (Driver):** `driver1` / `driver123` *(hoặc `driver2`, `driver3`)*
>   * **Phụ huynh (Parent):** `pa1` / `parent123` *(từ `pa1` đến `pa10`)*

---

## 2. Hướng dẫn cài đặt & chạy Local

### Cách 1: Chạy nhanh toàn bộ bằng Docker (khuyên dùng)
Yêu cầu máy đã cài **Docker Desktop**:
```bash
# Tạo file .env ở thư mục gốc và backend/ nếu chưa có (xem mục Biến môi trường bên dưới)
docker compose up --build
```
* Truy cập Web: `http://localhost:5173`
* Backend API: `http://localhost:5000`
* MySQL 8 trong Docker mở cổng **`3308`** (tránh trùng MySQL `3306` trên máy cá nhân) và tự động nạp dữ liệu chuẩn từ [`database/cloud_init.sql`](database/cloud_init.sql).
* *Nếu trước đây bạn từng chạy Docker cũ và muốn nạp lại DB mới nhất:* `docker compose down -v && docker compose up --build`

### Cách 2: Chạy thủ công Backend + Frontend (không cần Docker)
```bash
# 1. Backend
cd backend
cp .env.example .env   # điền thông tin DB (TiDB Cloud hoặc MySQL local đã import database/cloud_init.sql)
npm install
npm run dev            # chạy ở http://localhost:5000

# 2. Frontend (mở terminal mới)
cd frontend
cp .env.example .env   # mặc định tự gọi http://localhost:5000 khi mở từ localhost
npm install
npm run dev            # chạy ở http://localhost:5173
```
> **Ghi chú Redis:** Không bắt buộc cài Redis khi chạy local — nếu không có Redis ở `localhost:6379`, backend tự chuyển sang chạy bằng RAM.

---

## 3. Cấu trúc dự án

```text
frontend/    React, Vite, Leaflet (Google Maps tiles), dnd-kit, Socket.IO client, Tailwind CSS
backend/     Node.js, Express, Socket.IO, MySQL2, Redis, JWT (12h), Jest
database/    cloud_init.sql (1 file SQL chuẩn duy nhất cho cả Docker local & TiDB Cloud)
```

---

## 4. Chức năng chính theo vai trò

* **Admin:**
  * Bản đồ theo dõi trực tiếp các chuyến đang chạy + chế độ xem trước mạng lưới trạm & từng tuyến khi chưa có xe chạy.
  * Xây dựng tuyến đường trực quan (**Route Builder**): kéo thả sắp xếp trạm, tìm địa điểm thật & tự gợi ý tên đường/trạm buýt khi chấm trên Google Maps, tự đo quãng đường thực tế qua OSRM.
  * Quản lý Xe buýt, Tài xế, Học sinh (gán lớp/khối, địa chỉ riêng/chung với phụ huynh), Phụ huynh (liên kết con em), Tài khoản (RBAC), Lịch trình (tự đếm số học sinh đăng ký, hiển thị giờ dự kiến & giờ thực tế).
  * Nhận cảnh báo sự cố realtime và phát lại hành trình cũ (**History Playback**).
* **Tài xế (Driver):**
  * Xem danh sách lịch làm việc, chi tiết số học sinh theo đúng sức chứa xe buýt, danh sách trạm dừng.
  * Điều khiển chuyến (`Bắt đầu`, dừng từng trạm, `Tiếp tục`, `Kết thúc`), điểm danh **Đã đón / Vắng mặt** cho từng em ngay tại trạm đang dừng, gửi báo cáo sự cố kèm vị trí.
* **Phụ huynh (Parent):**
  * Hỗ trợ phụ huynh có **1 hoặc nhiều con** (chuyển đổi xem riêng từng bé).
  * Theo dõi vị trí xe realtime trên bản đồ, timeline tiến độ từng trạm (đánh dấu nổi trạm đón/trả của bé), nhận trạng thái lên xe / vắng mặt và cảnh báo sự cố tức thời.

---

## 5. Xử lý sự cố thường gặp (Troubleshooting)

* **Lỗi `ECONNREFUSED` khi chạy Backend local:** Kiểm tra `backend/.env` đã trỏ đúng `DB_HOST`, `DB_PORT` (Docker dùng `3308`, TiDB Cloud dùng `4000` kèm `DB_SSL=true`).
* **Không phân giải được `tile.openstreetmap.org` ở mạng Việt Nam:** Hệ thống đã chuyển mặc định sang **Google Maps đường phố tiếng Việt** (tự fallback nếu lỗi mạng).
* **Chạy script trên TiDB Cloud báo `No database selected`:** Đảm bảo chọn schema `school_bus_db` hoặc giữ dòng `USE school_bus_db;` ở đầu script.
* **Chạy kiểm tra code:**
  * Frontend: `cd frontend && npm run lint && npm run build`
  * Backend: `cd backend && npm test`
