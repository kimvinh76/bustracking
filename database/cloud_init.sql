USE school_bus_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ==============================================================================
-- 1. BẢNG USERS
-- ==============================================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','driver','parent') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@schoolbus.com', '$2b$10$w0954b.8XhS1Bq3g1Y.jE.mZ0wM8ZlH2mH7wT1Rz0j5Zl2q5r6r0e', 'admin', '2025-10-20 13:44:19', '2025-10-20 13:44:19'),
(2, 'driver_a', 'driver.a@schoolbus.com', '$2b$10$w0954b.8XhS1Bq3g1Y.jE.mZ0wM8ZlH2mH7wT1Rz0j5Zl2q5r6r0e', 'driver', '2025-10-20 13:44:19', '2025-10-20 13:44:19'),
(3, 'driver_b', 'driver.b@schoolbus.com', '$2b$10$w0954b.8XhS1Bq3g1Y.jE.mZ0wM8ZlH2mH7wT1Rz0j5Zl2q5r6r0e', 'driver', '2025-10-20 13:44:19', '2025-10-20 13:44:19'),
(4, 'parent_khang', 'parent.khang@gmail.com', '$2b$10$w0954b.8XhS1Bq3g1Y.jE.mZ0wM8ZlH2mH7wT1Rz0j5Zl2q5r6r0e', 'parent', '2025-10-20 13:44:19', '2025-10-20 13:44:19'),
(5, 'parent_linh', 'parent.linh@gmail.com', '$2b$10$w0954b.8XhS1Bq3g1Y.jE.mZ0wM8ZlH2mH7wT1Rz0j5Zl2q5r6r0e', 'parent', '2025-10-20 13:44:19', '2025-10-20 13:44:19'),
(6, 'parent_tuan', 'parent.tuan@gmail.com', '$2b$10$w0954b.8XhS1Bq3g1Y.jE.mZ0wM8ZlH2mH7wT1Rz0j5Zl2q5r6r0e', 'parent', '2025-10-20 13:44:19', '2025-10-20 13:44:19'),
(7, 'driver_c', 'driver.c@schoolbus.com', '$2b$10$w0954b.8XhS1Bq3g1Y.jE.mZ0wM8ZlH2mH7wT1Rz0j5Zl2q5r6r0e', 'driver', '2025-10-20 13:44:19', '2025-10-20 13:44:19');

-- ==============================================================================
-- 2. BẢNG BUSES
-- ==============================================================================
DROP TABLE IF EXISTS `buses`;
CREATE TABLE `buses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bus_number` varchar(20) NOT NULL,
  `license_plate` varchar(20) NOT NULL,
  `capacity` int(11) DEFAULT 25 COMMENT 'Sức chứa tối đa của xe',
  `status` enum('active','maintenance','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bus_number` (`bus_number`),
  UNIQUE KEY `license_plate` (`license_plate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `buses` (`id`, `bus_number`, `license_plate`, `capacity`, `status`, `created_at`) VALUES
(1, 'BUS-04', '51K-123.45', 20, 'active', '2025-10-20 13:44:19'),
(2, 'BUS-02', '51K-678.90', 20, 'active', '2025-10-20 13:44:19'),
(3, 'BUS-03', '51K-111.22', 15, 'active', '2025-10-20 13:44:19'),
(6, 'BUS-06', '51K-123.964', 25, 'active', '2025-11-10 15:15:58'),
(7, 'B899', 'LICENTEST899', 25, 'active', '2025-12-27 15:48:56');

-- ==============================================================================
-- 3. BẢNG CLASSES
-- ==============================================================================
DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_name` varchar(20) NOT NULL,
  `grade` varchar(20) NOT NULL,
  `academic_year` varchar(20) DEFAULT '2024-2025',
  `max_students` int(11) DEFAULT 40,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_class_year` (`class_name`,`academic_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `classes` (`id`, `class_name`, `grade`, `academic_year`, `max_students`, `status`, `created_at`) VALUES
(1, '6A1', '6', '2024-2025', 40, 'active', '2025-10-21 15:55:59'),
(2, '6A2', '6', '2024-2025', 40, 'active', '2025-10-21 15:55:59'),
(3, '6A3', '6', '2024-2025', 40, 'active', '2025-10-21 15:55:59'),
(4, '6B1', '6', '2024-2025', 40, 'active', '2025-10-21 15:55:59'),
(5, '6B2', '6', '2024-2025', 40, 'active', '2025-10-21 15:55:59'),
(6, '7A1', '7', '2024-2025', 40, 'active', '2025-10-21 15:55:59'),
(7, '7A2', '7', '2024-2025', 40, 'active', '2025-10-21 15:55:59'),
(8, '7B1', '7', '2024-2025', 40, 'active', '2025-10-21 15:55:59'),
(9, '7B2', '7', '2024-2025', 40, 'active', '2025-10-21 15:55:59'),
(10, '8A1', '8', '2024-2025', 40, 'active', '2025-10-21 15:55:59'),
(11, '8A2', '8', '2024-2025', 40, 'active', '2025-10-21 15:55:59'),
(12, '9A1', '9', '2024-2025', 40, 'active', '2025-10-21 15:55:59'),
(13, '9A2', '9', '2024-2025', 40, 'active', '2025-10-21 15:55:59');

-- ==============================================================================
-- 4. BẢNG DRIVERS
-- ==============================================================================
DROP TABLE IF EXISTS `drivers`;
CREATE TABLE `drivers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `license_number` (`license_number`),
  KEY `user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `drivers` (`id`, `user_id`, `name`, `phone`, `license_number`, `address`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 'Nguyễn Văn A', '0901234567', 'A1-12345', '23 an dương vương', 'active', '2025-10-20 13:44:19', '2025-11-23 03:33:24'),
(2, 3, 'Trần Thị B', '0912345678', 'A1-54321', '273 an dương vương', 'active', '2025-10-20 13:44:19', '2025-10-23 03:03:13'),
(3, 7, 'Lê Văn C', '0923456789', 'A1-98765', '273 an dương vương', 'active', '2025-10-20 13:44:19', '2025-10-23 02:40:09');

-- ==============================================================================
-- 5. BẢNG PARENTS
-- ==============================================================================
DROP TABLE IF EXISTS `parents`;
CREATE TABLE `parents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `relationship` varchar(50) DEFAULT 'parent',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `parents` (`id`, `user_id`, `name`, `phone`, `address`, `relationship`) VALUES
(4, 4, 'Nguyễn Văn Ba', '0901234567', '123 Nguyễn Thái Học, Q.1, TP.HCM', 'father'),
(5, 5, 'Trần Thị Mẹ', '0912345678', '456 Lê Văn Sỹ, Q.3, TP.HCM', 'mother'),
(6, 6, 'Lê Văn Bố', '0923456789', '789 Võ Văn Tần, Q.Gò Vấp, TP.HCM', 'father'),
(7, 4, 'Phạm Thị Mẹ', '0934567890', '321 Phan Văn Trị, Q.Gò Vấp, TP.HCM', 'mother');

-- ==============================================================================
-- 6. BẢNG ROUTES (Đã bao gồm shift_type từ Migration 05)
-- ==============================================================================
DROP TABLE IF EXISTS `routes`;
CREATE TABLE `routes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route_name` varchar(100) NOT NULL,
  `distance` decimal(10,2) DEFAULT NULL,
  `shift_type` enum('morning','afternoon') NOT NULL DEFAULT 'morning',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `routes` (`id`, `route_name`, `distance`, `shift_type`, `status`, `created_at`) VALUES
(1, 'Tuyến Quận 1 - Sáng', 1.05, 'morning', 'active', '2025-10-20 13:44:19'),
(2, 'Tuyến Gò Vấp - Sáng', 10.03, 'morning', 'active', '2025-10-20 13:44:19'),
(3, 'Tuyến Thủ Đức - Chiều', 18.20, 'afternoon', 'active', '2025-10-20 13:44:19'),
(4, 'Tuyến Gò Vấp - Chiều', 22.00, 'afternoon', 'active', '2025-10-24 11:28:48'),
(5, 'Tuyến Quận 1 - Chiều', 5.59, 'afternoon', 'active', '2025-10-24 12:19:25'),
(6, 'Tuyến Thủ Đức - Sáng', 18.20, 'morning', 'active', '2025-10-24 12:19:25');

-- ==============================================================================
-- 7. BẢNG STOPS
-- ==============================================================================
DROP TABLE IF EXISTS `stops`;
CREATE TABLE `stops` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` text DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `stops` (`id`, `name`, `address`, `latitude`, `longitude`, `status`) VALUES
(1, 'Trường THCS ABC', '123 Nguyễn Văn Cừ, Q.5, TP.HCM', 10.75780000, 106.68350000, 'active'),
(2, 'Chợ Bến Thành', 'Chợ Bến Thành, Q.1, TP.HCM', 10.77250000, 106.69800000, 'active'),
(48, 'Công viên 23/9', 'Công viên 23/9, Q.1, TP.HCM', 10.76890000, 106.69340000, 'active'),
(50, 'Ngã tư Hàng Xanh', 'Ngã tư Hàng Xanh, Q.Bình Thạnh, TP.HCM', 10.80150000, 106.71150000, 'active'),
(51, 'Chợ Gò Vấp', 'Chợ Gò Vấp, Q.Gò Vấp, TP.HCM', 10.82850000, 106.68850000, 'active'),
(52, 'Công viên Gia Định', 'Công viên Gia Định, Q.Gò Vấp, TP.HCM', 10.81550000, 106.67850000, 'active'),
(55, 'Ngã tư Thủ Đức', 'Ngã tư Thủ Đức, TP.Thủ Đức', 10.85250000, 106.77150000, 'active'),
(56, 'Kha Vạn Cân', 'Đường Kha Vạn Cân, TP.Thủ Đức', 10.84550000, 106.75850000, 'active'),
(57, 'Cầu Sài Gòn', 'Cầu Sài Gòn, TP.HCM', 10.82000000, 106.74000000, 'active'),
(100, 'Nguyễn Văn Cừ', 'Đường Nguyễn Văn Cừ, Q.1, TP.HCM', 10.76055000, 106.68340000, 'active'),
(101, 'Nguyễn Biểu', 'Đường Nguyễn Biểu, Q.1, TP.HCM', 10.75790000, 106.68310000, 'active');

-- ==============================================================================
-- 8. BẢNG ROUTE_STOPS
-- ==============================================================================
DROP TABLE IF EXISTS `route_stops`;
CREATE TABLE `route_stops` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route_id` int(11) NOT NULL,
  `stop_id` int(11) NOT NULL,
  `stop_order` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_route_stop_order` (`route_id`,`stop_order`),
  KEY `idx_route_id` (`route_id`),
  KEY `idx_stop_id` (`stop_id`),
  FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `route_stops` (`id`, `route_id`, `stop_id`, `stop_order`, `created_at`) VALUES
(1, 1, 101, 1, '2025-10-20 13:44:19'),
(2, 1, 100, 2, '2025-10-20 13:44:19'),
(3, 1, 48, 3, '2025-10-20 13:44:19'),
(4, 1, 2, 4, '2025-10-20 13:44:19'),
(5, 2, 51, 1, '2025-10-20 13:44:19'),
(6, 2, 52, 2, '2025-10-20 13:44:19'),
(7, 2, 50, 3, '2025-10-20 13:44:19'),
(8, 2, 1, 4, '2025-10-20 13:44:19'),
(9, 6, 55, 1, '2025-10-20 13:44:19'),
(10, 6, 56, 2, '2025-10-20 13:44:19'),
(11, 6, 57, 3, '2025-10-20 13:44:19'),
(12, 6, 1, 4, '2025-10-20 13:44:19');

-- ==============================================================================
-- 9. BẢNG SCHEDULES (Đã bao gồm actual_start_time từ Migration 03)
-- ==============================================================================
DROP TABLE IF EXISTS `schedules`;
CREATE TABLE `schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `driver_id` int(11) NOT NULL,
  `bus_id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `shift_type` enum('morning','afternoon') NOT NULL,
  `scheduled_start_time` time NOT NULL,
  `scheduled_end_time` time DEFAULT NULL,
  `actual_start_time` datetime DEFAULT NULL,
  `student_count` int(11) DEFAULT 0,
  `status` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
  `actual_end_time` time DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_driver_date_shift` (`driver_id`,`date`,`shift_type`),
  UNIQUE KEY `schedules_bus_date_shift` (`bus_id`,`date`,`shift_type`),
  KEY `bus_id` (`bus_id`),
  KEY `route_id` (`route_id`),
  FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 10. BẢNG STUDENTS (Đã chuẩn hoá theo Migration 04)
-- ==============================================================================
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `grade` varchar(20) DEFAULT NULL,
  `class_id` int(11) DEFAULT NULL,
  `class` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  KEY `class_id` (`class_id`),
  FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `students` (`id`, `name`, `grade`, `class_id`, `class`, `address`, `phone`, `parent_id`, `status`) VALUES
(4, 'Nguyễn Minh Khang', '6', 1, '6A1', '123 Nguyễn Thái Học, Q.1, TP.HCM', '0901234567', 4, 'active'),
(5, 'Trần Thùy Linh', '6', 2, '6A2', '456 Lê Văn Sỹ, Q.3, TP.HCM', '0912345678', 5, 'active'),
(6, 'Lê Tuấn Anh', '7', 6, '7A1', '789 Võ Văn Tần, Q.Gò Vấp, TP.HCM', '0923456789', 6, 'active'),
(7, 'Phạm Hoài An', '7', 7, '7A2', '321 Phan Văn Trị, Q.Gò Vấp, TP.HCM', '0934567890', 7, 'active'),
(8, 'Hoàng Nam Phong', '8', 10, '8A1', '654 Kha Vạn Cân, Q.Thủ Đức, TP.HCM', '0945678901', 4, 'active'),
(9, 'Vũ Mai Phương', '6', 3, '6A3', '987 Lê Văn Việt, Q.Thủ Đức, TP.HCM', '0956789012', 5, 'active'),
(10, 'Đỗ Phong Vực', '7', 8, '7B1', '147 Điện Biên Phủ, Q.1, TP.HCM', '0967890123', 6, 'active'),
(11, 'Bùi Linh Chi', '6', 4, '6B1', '258 Nguyễn Oanh, Q.Gò Vấp, TP.HCM', '0978901234', 7, 'active'),
(12, 'Cao Đức Minh', '7', 9, '7B2', '369 Võ Văn Ngân, Q.Thủ Đức, TP.HCM', '0989012345', 4, 'active'),
(13, 'Lâm Xuân Mai', '7', 6, '7A1', '741 Pasteur, Q.1, TP.HCM', '0990123456', 5, 'active');

-- ==============================================================================
-- 11. BẢNG STUDENT_ROUTE_SUBSCRIPTIONS (Migration 04: Junction Table)
-- ==============================================================================
DROP TABLE IF EXISTS `student_route_subscriptions`;
CREATE TABLE `student_route_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `route_id` int(11) NOT NULL,
  `stop_id` int(11) NOT NULL,
  `shift_type` enum('morning','afternoon') NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_shift` (`student_id`,`shift_type`),
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `student_route_subscriptions` (`student_id`, `route_id`, `stop_id`, `shift_type`) VALUES
(4, 6, 55, 'morning'),
(4, 3, 56, 'afternoon'),
(5, 2, 50, 'morning'),
(5, 4, 52, 'afternoon'),
(6, 6, 57, 'morning'),
(6, 3, 57, 'afternoon'),
(7, 6, 56, 'morning'),
(7, 3, 56, 'afternoon'),
(8, 2, 51, 'morning'),
(8, 4, 52, 'afternoon'),
(9, 1, 100, 'morning'),
(9, 5, 48, 'afternoon'),
(10, 1, 101, 'morning'),
(10, 5, 2, 'afternoon'),
(11, 1, 101, 'morning'),
(11, 5, 48, 'afternoon'),
(12, 1, 100, 'morning'),
(12, 5, 2, 'afternoon'),
(13, 1, 100, 'morning'),
(13, 5, 2, 'afternoon');

-- ==============================================================================
-- 12. BẢNG BUS_LOCATIONS (Đã tối ưu Index theo Migration 02)
-- ==============================================================================
DROP TABLE IF EXISTS `bus_locations`;
CREATE TABLE `bus_locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bus_id` int(11) NOT NULL,
  `driver_id` int(11) NOT NULL,
  `schedule_id` int(11) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `speed` decimal(5,2) DEFAULT 0.00,
  `heading` decimal(5,2) DEFAULT 0.00,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bus_id_timestamp` (`bus_id`,`timestamp`),
  KEY `idx_schedule_id` (`schedule_id`),
  FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 13. BẢNG INCIDENTS
-- ==============================================================================
DROP TABLE IF EXISTS `incidents`;
CREATE TABLE `incidents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `driver_id` int(11) NOT NULL,
  `bus_id` int(11) NOT NULL,
  `route_id` int(11) DEFAULT NULL,
  `incident_type` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `status` enum('reported','investigating','resolved','closed') DEFAULT 'reported',
  `location` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `resolution_notes` text DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
