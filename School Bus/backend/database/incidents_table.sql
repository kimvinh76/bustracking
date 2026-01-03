-- incidents_table.sql
-- Migration: tạo bảng incidents cho module sự cố

CREATE TABLE IF NOT EXISTS incidents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  bus_id INT NOT NULL,
  route_id INT NULL,
  incident_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  severity ENUM('low','medium','high','critical') DEFAULT 'medium',
  status ENUM('reported','in_progress','resolved','closed') DEFAULT 'reported',
  location VARCHAR(255) NULL,
  latitude DECIMAL(10,8) NULL,
  longitude DECIMAL(11,8) NULL,
  resolution_notes TEXT NULL,
  resolved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_incidents_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  CONSTRAINT fk_incidents_bus FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
  CONSTRAINT fk_incidents_route FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes giúp lọc nhanh theo mức độ, trạng thái, thời gian
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_incidents_driver ON incidents(driver_id);
CREATE INDEX idx_incidents_bus ON incidents(bus_id);
CREATE INDEX idx_incidents_route ON incidents(route_id);

-- Hướng dẫn chạy:
-- mysql -u root -p school_bus_db < "School Bus/backend/database/incidents_table.sql";
