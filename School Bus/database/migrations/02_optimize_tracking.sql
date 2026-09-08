-- 02_optimize_tracking.sql
-- Kịch bản Migration tối ưu hóa Tracking (Bus Location) và loại bỏ bảng thừa (Trip Simulation)

-- 1. Bổ sung INDEX (chỉ mục) cho bảng bus_locations
-- Việc này giúp các API xem lịch sử tìm kiếm theo bus_id và thời gian nhanh hơn đáng kể
-- trên môi trường Production (thay vì Full Table Scan)
ALTER TABLE `bus_locations` 
ADD INDEX `idx_bus_id_timestamp` (`bus_id`, `timestamp`);

-- Nếu sau này cần lấy lịch sử theo chuyến xe cụ thể, index này cũng rất hữu ích
ALTER TABLE `bus_locations` 
ADD INDEX `idx_schedule_id` (`schedule_id`);

-- 2. Xóa bỏ bảng trip_simulations
-- Do hệ thống sẽ chuyển sang sử dụng Redis để lưu trạng thái Realtime (Active/Paused trips),
-- bảng trip_simulations không còn giá trị lưu trữ và được xóa để dọn dẹp Database.
DROP TABLE IF EXISTS `trip_simulations`;
