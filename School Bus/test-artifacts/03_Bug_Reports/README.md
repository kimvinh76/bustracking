# Bug Reports - School Bus Tracking System

## Cấu trúc Bug Report Excel

File `Bug_List.xlsx` nên có các cột:

| Bug ID | Date Found | Module | Severity | Priority | Summary | Description | Steps to Reproduce | Expected | Actual | Environment | Evidence | Status | Assigned To | Notes |
|--------|------------|--------|----------|----------|---------|-------------|-------------------|----------|--------|-------------|----------|--------|-------------|-------|

## Mức độ nghiêm trọng (Severity)

- **Critical**: Hệ thống crash, mất dữ liệu, không thể sử dụng
- **Major**: Chức năng chính không hoạt động, nhưng có workaround
- **Minor**: Chức năng phụ bị lỗi, ít ảnh hưởng
- **Trivial**: Lỗi UI/UX nhỏ, lỗi chính tả

## Độ ưu tiên (Priority)

- **P1**: Fix ngay lập tức
- **P2**: Fix trong sprint hiện tại
- **P3**: Fix trong sprint tiếp theo
- **P4**: Fix khi có thời gian

## Trạng thái (Status)

- **New**: Mới phát hiện
- **Assigned**: Đã giao cho dev
- **In Progress**: Đang fix
- **Fixed**: Đã fix, chờ verify
- **Verified**: Đã verify OK
- **Closed**: Đóng bug
- **Reopen**: Mở lại (lỗi vẫn còn)

## Thư mục evidences/

Lưu ảnh chụp màn hình, video recording theo format:
- `bug_[ID]_[description].png`
- `bug_001_login_crash.png`
- `bug_002_map_not_loading.mp4`
