# Test Artifacts - School Bus Tracking System

Thư mục này chứa tất cả các tài liệu liên quan đến kiểm thử dự án.

## Cấu trúc thư mục

### 📋 01_Test_Plans/
Chứa các kế hoạch kiểm thử (Test Plan), bao gồm:
- Phạm vi kiểm thử
- Chiến lược kiểm thử
- Tài nguyên và lịch trình

### ✅ 02_Test_Cases/
Chứa các file Excel Test Case theo module:
- `Auth_Module.xlsx` - Test cases cho đăng nhập/đăng ký
- `Driver_Module.xlsx` - Test cases cho chức năng tài xế
- `Parent_Module.xlsx` - Test cases cho chức năng phụ huynh
- `Admin_Module.xlsx` - Test cases cho quản trị viên
- `Route_Module.xlsx` - Test cases cho quản lý tuyến đường

### 🐛 03_Bug_Reports/
Chứa các báo cáo lỗi:
- File Excel tổng hợp lỗi (`Bug_List.xlsx`)
- Thư mục `evidences/` chứa ảnh chụp màn hình và video lỗi

### 🔌 04_API_Tests/
Chứa các file test API:
- Postman Collection (`.json`)
- Postman Environment variables
- Kết quả test API

### 🗄️ 05_SQL_Queries/
Chứa các câu lệnh SQL để verify data:
- Queries kiểm tra dữ liệu users
- Queries kiểm tra routes, schedules
- Queries kiểm tra incidents

## Hướng dẫn sử dụng

1. **Viết Test Case**: Tạo file Excel trong `02_Test_Cases/` theo template chuẩn
2. **Báo cáo Bug**: Ghi nhận lỗi vào `03_Bug_Reports/Bug_List.xlsx`, đính kèm evidence
3. **Test API**: Import Postman collection từ `04_API_Tests/`
4. **Verify Database**: Sử dụng SQL queries trong `05_SQL_Queries/`
