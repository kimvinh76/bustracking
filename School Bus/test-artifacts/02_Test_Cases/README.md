# Test Cases - School Bus Tracking System

## Cấu trúc Test Case Excel

Mỗi file Excel nên có các cột sau:

| STT | Test Case ID | Module | Feature | Description | Pre-condition | Test Steps | Expected Result | Actual Result | Status | Priority | Notes |
|-----|--------------|--------|---------|-------------|---------------|------------|-----------------|---------------|--------|----------|-------|

## Các module cần test

### 🔐 Auth Module
- Đăng nhập (Admin, Driver, Parent)
- Đăng xuất
- Quên mật khẩu
- Thay đổi mật khẩu

### 👨‍✈️ Driver Module
- Xem lịch trình
- Bắt đầu/kết thúc chuyến đi
- Cập nhật vị trí xe
- Báo cáo sự cố
- Xác nhận đón/trả học sinh

### 👨‍👩‍👧 Parent Module
- Xem vị trí xe bus
- Xem lịch trình con
- Xem thông báo
- Đánh giá dịch vụ

### 👔 Admin Module
- Quản lý users (CRUD)
- Quản lý routes (CRUD)
- Quản lý schedules (CRUD)
- Quản lý buses (CRUD)
- Quản lý drivers (CRUD)
- Xem báo cáo

## Độ ưu tiên

- **High**: Chức năng cốt lõi, ảnh hưởng trực tiếp đến hệ thống
- **Medium**: Chức năng quan trọng nhưng có workaround
- **Low**: Chức năng phụ, không ảnh hưởng nhiều

## Template Test Case

Tải file mẫu: `Test_Case_Template.xlsx`
