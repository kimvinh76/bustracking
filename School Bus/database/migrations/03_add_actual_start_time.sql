-- Migration: Thêm cột actual_start_time và dọn dẹp dữ liệu kẹt

-- 1. Thêm cột actual_start_time
ALTER TABLE schedules 
ADD COLUMN actual_start_time DATETIME DEFAULT NULL COMMENT 'Thời gian thực tế tài xế bấm nút bắt đầu chuyến';

-- 2. Dọn sạch rác (Lưu ý: sẽ xóa toàn bộ dữ liệu lịch trình hiện có)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE bus_locations;
TRUNCATE TABLE schedules;
SET FOREIGN_KEY_CHECKS = 1;
