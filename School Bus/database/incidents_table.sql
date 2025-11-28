-- Tạo bảng incidents để lưu trữ các báo cáo sự cố
CREATE TABLE IF NOT EXISTS incidents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT,
  bus_id INT,
  route_id INT,
  incident_type VARCHAR(50) NOT NULL, -- 'vehicle', 'traffic', 'student', 'emergency', 'weather', 'safety', 'other'
  description TEXT NOT NULL,
  severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
  status ENUM('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending',
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  admin_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
  
  INDEX idx_driver_id (driver_id),
  INDEX idx_bus_id (bus_id),
  INDEX idx_route_id (route_id),
  INDEX idx_status (status),
  INDEX idx_severity (severity),
  INDEX idx_created_at (created_at)
);

-- Thêm một số dữ liệu demo
INSERT INTO incidents (driver_id, bus_id, route_id, incident_type, description, severity, status, latitude, longitude) VALUES
(1, 1, 1, 'traffic', 'Giao thông kẹt xe nghiêm trọng tại ngã tư Hàng Xanh', 'medium', 'investigating', 10.7961, 106.7037),
(2, 2, 2, 'vehicle', 'Xe gặp sự cố phanh, đang dừng an toàn để kiểm tra', 'high', 'pending', 10.8371, 106.6795),
(1, 1, 1, 'student', 'Học sinh Nguyễn Văn A không có mặt tại điểm đón', 'low', 'resolved', 10.7588, 106.6834);