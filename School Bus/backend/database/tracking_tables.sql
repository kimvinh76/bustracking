-- ===================================
-- MIGRATION SQL: Add Tracking Tables
-- ===================================
-- Mục đích: Thêm 2 bảng mới để hỗ trợ Real-time Bus Tracking (Tuần 6)
-- Chạy file này: mysql -u root -p school_bus_db < tracking_tables.sql
-- ===================================

USE school_bus_db;

-- ===================================
-- TABLE: bus_locations
-- Lưu lịch sử vị trí GPS của xe bus (real-time tracking)
-- ===================================
CREATE TABLE IF NOT EXISTS bus_locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bus_id INT NOT NULL COMMENT 'ID xe bus',
  driver_id INT NOT NULL COMMENT 'ID tài xế đang lái',
  schedule_id INT COMMENT 'ID lịch trình hiện tại',
  
  -- GPS Data
  latitude DECIMAL(10, 8) NOT NULL COMMENT 'Vĩ độ (-90 to 90)',
  longitude DECIMAL(11, 8) NOT NULL COMMENT 'Kinh độ (-180 to 180)',
  
  -- Movement Data
  speed DECIMAL(5, 2) DEFAULT 0 COMMENT 'Vận tốc hiện tại (km/h)',
  heading DECIMAL(5, 2) COMMENT 'Hướng di chuyển (0-360 degrees, 0=North)',
  accuracy DECIMAL(6, 2) COMMENT 'Độ chính xác GPS (meters)',
  
  -- Metadata
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm ghi nhận',
  
  -- Indexes for performance
  INDEX idx_bus_timestamp (bus_id, timestamp),
  INDEX idx_schedule (schedule_id),
  INDEX idx_timestamp (timestamp),
  
  -- Foreign Keys
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Lịch sử vị trí GPS của xe bus';

-- ===================================
-- TABLE: stop_arrivals
-- Lưu thông tin đến/rời điểm dừng (ETA và actual time)
-- ===================================
CREATE TABLE IF NOT EXISTS stop_arrivals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_id INT NOT NULL COMMENT 'ID lịch trình',
  stop_id INT NOT NULL COMMENT 'ID điểm dừng',
  stop_order INT NOT NULL COMMENT 'Thứ tự điểm dừng trong tuyến',
  
  -- Scheduled Time (từ lịch trình ban đầu)
  scheduled_time TIME COMMENT 'Giờ dự kiến đến điểm (tính từ schedule start time)',
  
  -- Real-time ETA (cập nhật liên tục khi xe chạy)
  estimated_arrival_time DATETIME COMMENT 'Thời gian đến dự kiến (ETA) - tính real-time',
  distance_remaining DECIMAL(8, 2) COMMENT 'Khoảng cách còn lại đến điểm (km)',
  
  -- Actual Times (ghi nhận thực tế)
  actual_arrival_time DATETIME COMMENT 'Thời gian đến thực tế',
  actual_departure_time DATETIME COMMENT 'Thời gian rời điểm thực tế',
  
  -- Status
  arrival_status ENUM('pending', 'approaching', 'arrived', 'departed') DEFAULT 'pending' 
    COMMENT 'pending: chưa đến, approaching: sắp đến (<500m), arrived: đã đến, departed: đã rời',
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE KEY unique_schedule_stop (schedule_id, stop_id),
  INDEX idx_schedule (schedule_id),
  INDEX idx_status (arrival_status),
  
  -- Foreign Keys
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Thông tin đến/rời điểm dừng (ETA và thực tế)';

-- ===================================
-- INSERT SAMPLE DATA (Optional - for testing)
-- ===================================

-- Tạo stop_arrivals cho schedule hiện có (schedule_id = 43)
INSERT INTO stop_arrivals (schedule_id, stop_id, stop_order, scheduled_time, arrival_status)
SELECT 
  43 as schedule_id,
  rs.stop_id,
  rs.stop_order,
  CASE 
    WHEN rs.stop_order = 0 THEN '06:00:00'  -- Điểm xuất phát
    WHEN rs.stop_order = 1 THEN '06:15:00'  -- Stop 1
    WHEN rs.stop_order = 2 THEN '06:30:00'  -- Stop 2
    WHEN rs.stop_order = 99 THEN '07:00:00' -- Điểm kết thúc
    ELSE '06:45:00'
  END as scheduled_time,
  'pending' as arrival_status
FROM route_stops rs
WHERE rs.route_id = 1  -- Tuyến Quận 1 - Sáng
ON DUPLICATE KEY UPDATE scheduled_time = VALUES(scheduled_time);

-- ===================================
-- VERIFICATION QUERIES
-- ===================================

-- Kiểm tra tables đã tạo
SELECT 
  TABLE_NAME, 
  TABLE_ROWS, 
  CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'school_bus_db'
  AND TABLE_NAME IN ('bus_locations', 'stop_arrivals');

-- Xem cấu trúc bảng
DESCRIBE bus_locations;
DESCRIBE stop_arrivals;

-- ===================================
-- NOTES:
-- 1. bus_locations: Lưu GPS mỗi 5-10 giây → nhiều records
-- 2. stop_arrivals: Mỗi schedule có N records (N = số stops trong route)
-- 3. ETA sẽ được tính và cập nhật bởi backend service
-- ===================================
