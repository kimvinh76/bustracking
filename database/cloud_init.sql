-- =====================================================================
-- School Bus DB - Cloud init (TiDB Cloud / MySQL 8)
-- File nay = KET QUA chay day du migrations 01 -> 05 (dump tu dong),
-- khop 100% cau truc + du lieu voi Docker local.
-- Chay 1 lan duy nhat: se XOA va TAO LAI toan bo bang trong school_bus_db.
-- =====================================================================


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `school_bus_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `school_bus_db`;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','driver','parent') COLLATE utf8mb4_unicode_ci DEFAULT 'parent',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `users` VALUES (1,'admin','admin@school.com','$2a$10$XmbXi18nOj/DfQwt1fcMo.K4nP/OMAmZwfU564D93NMjL5vdIpgC.','admin','2025-10-20 13:44:19','2025-11-24 05:28:15'),(2,'driver1','driver1@school.com','$2a$10$PmnlX1T865c7EtYmZhDROuhzkwU8qk2xcDprLRi5pCo2/nighuZya','driver','2025-10-20 13:44:19','2025-11-24 11:42:11'),(3,'driver2','driver2@school.com','$2a$10$PmnlX1T865c7EtYmZhDROuhzkwU8qk2xcDprLRi5pCo2/nighuZya','driver','2025-10-20 13:44:19','2025-11-24 11:42:11'),(7,'driver3','driver3@school.com','$2a$10$PmnlX1T865c7EtYmZhDROuhzkwU8qk2xcDprLRi5pCo2/nighuZya','driver','2025-10-20 13:44:19','2025-11-24 11:42:11'),(24,'pa1','pa1@gmail.com','$2a$10$DIePYzTOuAu2uFstj90wuOLodjioJ.IxJj2n/C0rIh4gYgS/xP4Eq','parent','2025-11-12 04:54:45','2025-11-24 05:28:16'),(25,'pa2','pa2@gmail.com','$2a$10$DIePYzTOuAu2uFstj90wuOLodjioJ.IxJj2n/C0rIh4gYgS/xP4Eq','parent','2025-11-12 04:55:01','2025-11-24 05:28:16'),(26,'pa3','pa3@gmail.com','$2a$10$DIePYzTOuAu2uFstj90wuOLodjioJ.IxJj2n/C0rIh4gYgS/xP4Eq','parent','2025-11-12 05:03:23','2025-11-24 05:28:16'),(27,'pa4','pa4@gmail.com','$2a$10$DIePYzTOuAu2uFstj90wuOLodjioJ.IxJj2n/C0rIh4gYgS/xP4Eq','parent','2025-11-12 05:03:42','2025-11-24 05:28:16'),(28,'pa5','pa5@gmail.com','$2a$10$DIePYzTOuAu2uFstj90wuOLodjioJ.IxJj2n/C0rIh4gYgS/xP4Eq','parent','2025-11-12 05:04:00','2025-11-24 05:28:16'),(29,'pa6','pa6@gmail.com','$2a$10$DIePYzTOuAu2uFstj90wuOLodjioJ.IxJj2n/C0rIh4gYgS/xP4Eq','parent','2025-11-12 05:04:14','2025-11-24 05:28:16'),(30,'pa10','pa10@gmail.com','$2a$10$DIePYzTOuAu2uFstj90wuOLodjioJ.IxJj2n/C0rIh4gYgS/xP4Eq','parent','2025-11-12 05:04:40','2025-11-24 05:28:16'),(31,'pa9','pa9@gmail.com','$2a$10$DIePYzTOuAu2uFstj90wuOLodjioJ.IxJj2n/C0rIh4gYgS/xP4Eq','parent','2025-11-12 05:04:55','2025-11-24 05:28:16'),(32,'pa7','pa7@gmail.com','$2a$10$DIePYzTOuAu2uFstj90wuOLodjioJ.IxJj2n/C0rIh4gYgS/xP4Eq','parent','2025-11-12 05:05:08','2025-11-24 05:28:16'),(33,'pa8','pa8@gmail.com','$2a$10$DIePYzTOuAu2uFstj90wuOLodjioJ.IxJj2n/C0rIh4gYgS/xP4Eq','parent','2025-11-12 05:05:21','2025-11-24 12:41:52');
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

DROP TABLE IF EXISTS `buses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bus_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `license_plate` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int DEFAULT '25' COMMENT 'Sức chứa tối đa của xe',
  `status` enum('active','maintenance','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bus_number` (`bus_number`),
  UNIQUE KEY `license_plate` (`license_plate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `buses` VALUES (1,'BUS-04','51K-123.45',20,'active','2025-10-20 13:44:19'),(2,'BUS-02','51K-678.90',20,'active','2025-10-20 13:44:19'),(3,'BUS-03','51K-111.22',15,'active','2025-10-20 13:44:19'),(6,'BUS-06','51K-123.964',25,'active','2025-11-10 15:15:58'),(7,'B899','LICENTEST899',25,'active','2025-12-27 15:48:56');
DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '2024-2025',
  `max_students` int DEFAULT '40',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_class_year` (`class_name`,`academic_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `classes` VALUES (1,'6A1','6','2024-2025',40,'active','2025-10-21 15:55:59'),(2,'6A2','6','2024-2025',40,'active','2025-10-21 15:55:59'),(3,'6A3','6','2024-2025',40,'active','2025-10-21 15:55:59'),(4,'6B1','6','2024-2025',40,'active','2025-10-21 15:55:59'),(5,'6B2','6','2024-2025',40,'active','2025-10-21 15:55:59'),(6,'7A1','7','2024-2025',40,'active','2025-10-21 15:55:59'),(7,'7A2','7','2024-2025',40,'active','2025-10-21 15:55:59'),(8,'7B1','7','2024-2025',40,'active','2025-10-21 15:55:59'),(9,'7B2','7','2024-2025',40,'active','2025-10-21 15:55:59'),(10,'8A1','8','2024-2025',40,'active','2025-10-21 15:55:59'),(11,'8A2','8','2024-2025',40,'active','2025-10-21 15:55:59'),(12,'9A1','9','2024-2025',40,'active','2025-10-21 15:55:59'),(13,'9A2','9','2024-2025',40,'active','2025-10-21 15:55:59');
DROP TABLE IF EXISTS `parents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `relationship` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `parents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `parents` VALUES (4,30,'Nguyễn Văn Minh','0901234567','136 Phạm Ngũ Lão, P. Phạm Ngũ Lão, Q.1, TP.HCM','Ba'),(5,31,'Trần Thị Lan','0912345678','120 Phan Đình Phùng, P.2, Q. Phú Nhuận, TP.HCM','Mẹ'),(6,33,'Lê Minh Tuấn','0923456789','58 Quang Trung, P.10, Q. Gò Vấp, TP.HCM','Ba'),(7,32,'Phạm Thị Hoa','0934567890','210 Nguyễn Văn Lượng, P.17, Q. Gò Vấp, TP.HCM','Mẹ'),(8,29,'Hoàng Văn Nam','0945678901','25 Nguyễn Văn Bá, P. Trường Thọ, TP. Thủ Đức, TP.HCM','Ba'),(9,28,'Võ Thị Mai','0956789012','180 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM','Mẹ'),(10,27,'Đỗ Văn Phong','0967890123','12 Phạm Ngọc Thạch, P. Võ Thị Sáu, Q.3, TP.HCM','Ba'),(11,26,'Bùi Thị Linh','0978901234','185 Lê Văn Thọ, P.8, Q. Gò Vấp, TP.HCM','Mẹ'),(12,25,'Cao Minh Đức','0989012345','108 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM','Ba'),(13,24,'Lâm Thị Xuân','0990123456','68 Lê Lợi, P. Bến Thành, Q.1, TP.HCM','Mẹ');
DROP TABLE IF EXISTS `stops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stops` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `stops` VALUES (1,'Nhà Văn hóa Thanh Niên','4 Phạm Ngọc Thạch (góc Nguyễn Thị Minh Khai), P. Bến Nghé, Q.1, TP.HCM',10.78193000,106.69722200,'active'),(2,'Ngã tư Hàng Xanh','Giao lộ Điện Biên Phủ & Xô Viết Nghệ Tĩnh, Q. Bình Thạnh, TP.HCM',10.80139000,106.70987100,'active'),(3,'Gigamall Thủ Đức','240-242 Phạm Văn Đồng, P. Hiệp Bình Chánh, TP. Thủ Đức, TP.HCM',10.82821000,106.72187400,'active'),(43,'Trường Đại học Sài Gòn','273 An Dương Vương, P.3, Q.5, TP.HCM',10.76065200,106.68203500,'active'),(44,'Công viên 23/9','Mặt tiền Lê Lai - Công viên 23/9, P. Phạm Ngũ Lão, Q.1, TP.HCM',10.76943900,106.69239200,'active'),(45,'Chợ An Đông','34-36 An Dương Vương, P.9, Q.5, TP.HCM',10.75912200,106.67187200,'active'),(46,'Ngã Sáu Phù Đổng','Vòng xoay Ngã Sáu Phù Đổng, P. Bến Thành, Q.1, TP.HCM',10.77135300,106.69344800,'active'),(47,'Công viên Lê Văn Tám','Mặt tiền Điện Biên Phủ - CV Lê Văn Tám, P. Đa Kao, Q.1, TP.HCM',10.78754400,106.69479900,'active'),(48,'Chợ Bến Thành','Công trường Quách Thị Trang, P. Bến Thành, Q.1, TP.HCM',10.77195000,106.69831400,'active'),(49,'Công viên Làng Hoa Gò Vấp','Đường Lê Văn Thọ, P.8, Q. Gò Vấp, TP.HCM',10.84217800,106.65699000,'active'),(50,'197 Lê Đức Thọ','197 Lê Đức Thọ, P.17, Q. Gò Vấp, TP.HCM',10.83804800,106.68040600,'active'),(51,'Ngã Sáu Gò Vấp','Giao lộ Quang Trung & Nguyễn Kiệm, Q. Gò Vấp, TP.HCM',10.82652900,106.67985100,'active'),(52,'Cầu vượt Nguyễn Thái Sơn','Nút giao Nguyễn Kiệm & Nguyễn Thái Sơn, P.3, Q. Gò Vấp, TP.HCM',10.81445400,106.67882400,'active'),(53,'Lotte Mart Gò Vấp','242 Nguyễn Văn Lượng, P.17, Q. Gò Vấp, TP.HCM',10.83848600,106.67097000,'active'),(54,'Chung cư Sunview Town','Đường Gò Dưa, P. Hiệp Bình Phước, TP. Thủ Đức, TP.HCM',10.86516300,106.72755200,'active'),(55,'Vincom Plaza Thủ Đức','216 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM',10.85062100,106.76533600,'active'),(56,'Ngã tư Bình Thái','Giao lộ Xa lộ Hà Nội & Đỗ Xuân Hợp, P. Trường Thọ, TP. Thủ Đức, TP.HCM',10.83557100,106.76581500,'active'),(57,'Chân Cầu Sài Gòn (Thảo Điền)','159 Xa lộ Hà Nội, P. Thảo Điền, TP. Thủ Đức, TP.HCM',10.80316000,106.74013300,'active'),(100,'Ngã tư Nguyễn Văn Cừ - Trần Hưng Đạo','Giao lộ Nguyễn Văn Cừ & Trần Hưng Đạo, Q.1 - Q.5, TP.HCM',10.75646800,106.68526000,'active'),(101,'Ngã tư Phú Nhuận','Giao lộ Phan Đình Phùng - Hoàng Văn Thụ - Nguyễn Kiệm, Q. Phú Nhuận, TP.HCM',10.79916500,106.68028800,'active');
DROP TABLE IF EXISTS `routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `routes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `route_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `distance` decimal(10,2) DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `shift_type` enum('morning','afternoon') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'morning' COMMENT 'Ca chạy của tuyến',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `routes` VALUES (1,'Tuyến 01: Trung tâm Q.1 – ĐH Sài Gòn (Sáng)',5.14,'active','2025-10-20 13:44:19','morning'),(2,'Tuyến 02: Gò Vấp – Phú Nhuận – ĐH Sài Gòn (Sáng)',17.28,'active','2025-10-20 13:44:19','morning'),(3,'Tuyến 03: ĐH Sài Gòn – Hàng Xanh – Thủ Đức (Chiều)',21.46,'active','2025-10-20 13:44:19','afternoon'),(4,'Tuyến 04: ĐH Sài Gòn – Phú Nhuận – Gò Vấp (Chiều)',14.94,'active','2025-10-24 11:28:48','afternoon'),(5,'Tuyến 05: ĐH Sài Gòn – Trung tâm Q.1 (Chiều)',7.16,'active','2025-10-24 12:19:25','afternoon'),(6,'Tuyến 06: Thủ Đức – Hàng Xanh – ĐH Sài Gòn (Sáng)',18.66,'active','2025-10-24 12:19:25','morning');
DROP TABLE IF EXISTS `drivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drivers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `license_number` (`license_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `drivers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `drivers` VALUES (1,2,'Nguyễn Văn A','0901234567','A1-12345','23 An Dương Vương, P.8, Q.5, TP.HCM','active','2025-10-20 13:44:19','2025-11-23 03:33:24'),(2,3,'Trần Thị B','0912345678','A1-54321','273 An Dương Vương, P.3, Q.5, TP.HCM','active','2025-10-20 13:44:19','2025-10-23 03:03:13'),(3,7,'Lê Văn C','0923456789','A1-98765','273 An Dương Vương, P.3, Q.5, TP.HCM','active','2025-10-20 13:44:19','2025-10-23 02:40:09');
DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `class` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  KEY `class_id` (`class_id`),
  KEY `idx_class_id` (`class_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `students_ibfk_4` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `students` VALUES (4,'Nguyễn Minh Khang','6',1,'6A1','136 Phạm Ngũ Lão, P. Phạm Ngũ Lão, Q.1, TP.HCM','0901234567',4,'active'),(5,'Trần Thùy Linh','6',2,'6A2','120 Phan Đình Phùng, P.2, Q. Phú Nhuận, TP.HCM','0912345678',5,'active'),(6,'Lê Tuấn Anh','7',6,'7A1','58 Quang Trung, P.10, Q. Gò Vấp, TP.HCM','0923456789',6,'active'),(7,'Phạm Hoài An','7',7,'7A2','210 Nguyễn Văn Lượng, P.17, Q. Gò Vấp, TP.HCM','0934567890',7,'active'),(8,'Hoàng Nam Phong','8',10,'8A1','25 Nguyễn Văn Bá, P. Trường Thọ, TP. Thủ Đức, TP.HCM','0945678901',8,'active'),(9,'Võ Mai Phương','6',3,'6A3','180 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM','0956789012',9,'active'),(10,'Đỗ Phong Vũ','7',8,'7B1','12 Phạm Ngọc Thạch, P. Võ Thị Sáu, Q.3, TP.HCM','0967890123',10,'active'),(11,'Bùi Linh Chi','6',4,'6B1','185 Lê Văn Thọ, P.8, Q. Gò Vấp, TP.HCM','0978901234',11,'active'),(12,'Cao Đức Minh','7',9,'7B2','108 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM','0989012345',12,'active'),(13,'Lâm Xuân Mai','7',6,'7A1','68 Lê Lợi, P. Bến Thành, Q.1, TP.HCM','0990123456',13,'active');
DROP TABLE IF EXISTS `route_stops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_stops` (
  `id` int NOT NULL AUTO_INCREMENT,
  `route_id` int NOT NULL,
  `stop_id` int NOT NULL,
  `stop_order` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_route_stop_order` (`route_id`,`stop_order`),
  KEY `idx_route_id` (`route_id`),
  KEY `idx_stop_id` (`stop_id`),
  CONSTRAINT `route_stops_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `route_stops_ibfk_2` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `route_stops` VALUES (108,1,1,0,'2025-11-26 03:48:47'),(109,1,48,1,'2025-11-26 03:48:47'),(110,1,44,2,'2025-11-26 03:48:47'),(111,1,100,3,'2025-11-26 03:48:47'),(112,1,43,99,'2025-11-26 03:48:47'),(113,2,49,0,'2025-11-26 03:48:47'),(114,2,53,1,'2025-11-26 03:48:47'),(115,2,51,2,'2025-11-26 03:48:47'),(116,2,52,3,'2025-11-26 03:48:47'),(117,2,101,4,'2025-11-26 03:48:47'),(118,2,43,99,'2025-11-26 03:48:47'),(119,3,43,0,'2025-11-26 03:48:47'),(120,3,2,1,'2025-11-26 03:48:47'),(121,3,57,2,'2025-11-26 03:48:47'),(122,3,56,3,'2025-11-26 03:48:47'),(123,3,55,99,'2025-11-26 03:48:47'),(124,4,43,0,'2025-11-26 03:48:47'),(125,4,101,1,'2025-11-26 03:48:47'),(126,4,52,2,'2025-11-26 03:48:47'),(127,4,51,3,'2025-11-26 03:48:47'),(128,4,53,4,'2025-11-26 03:48:47'),(129,4,49,99,'2025-11-26 03:48:47'),(130,5,43,0,'2025-11-26 03:48:47'),(131,5,100,1,'2025-11-26 03:48:47'),(132,5,44,2,'2025-11-26 03:48:47'),(133,5,48,3,'2025-11-26 03:48:47'),(134,5,1,99,'2025-11-26 03:48:47'),(135,6,55,0,'2025-11-26 03:48:47'),(136,6,56,1,'2025-11-26 03:48:47'),(137,6,57,2,'2025-11-26 03:48:47'),(138,6,2,3,'2025-11-26 03:48:47'),(139,6,43,99,'2025-11-26 03:48:47');
DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `driver_id` int NOT NULL,
  `bus_id` int NOT NULL,
  `route_id` int NOT NULL,
  `date` date NOT NULL,
  `shift_type` enum('morning','afternoon','evening') COLLATE utf8mb4_unicode_ci NOT NULL,
  `scheduled_start_time` time NOT NULL COMMENT 'Thời gian dự kiến bắt đầu chuyến (theo lịch)',
  `scheduled_end_time` time NOT NULL COMMENT 'Thời gian dự kiến kết thúc chuyến (theo lịch)',
  `student_count` int DEFAULT '0',
  `status` enum('scheduled','in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `actual_end_time` datetime DEFAULT NULL COMMENT 'Thời gian thực tế tài xế bấm nút kết thúc chuyến',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `actual_start_time` datetime DEFAULT NULL COMMENT 'Thời gian thực tế tài xế bấm nút bắt đầu chuyến',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_driver_date_shift` (`driver_id`,`date`,`shift_type`),
  UNIQUE KEY `schedules_bus_date_shift` (`bus_id`,`date`,`shift_type`),
  KEY `bus_id` (`bus_id`),
  KEY `route_id` (`route_id`),
  CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schedules_ibfk_3` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `incidents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incidents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `driver_id` int NOT NULL,
  `bus_id` int NOT NULL,
  `route_id` int DEFAULT NULL,
  `incident_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `status` enum('reported','in_progress','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'reported',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `resolution_notes` text COLLATE utf8mb4_unicode_ci,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_incidents_severity` (`severity`),
  KEY `idx_incidents_status` (`status`),
  KEY `idx_incidents_created_at` (`created_at`),
  KEY `idx_incidents_driver` (`driver_id`),
  KEY `idx_incidents_bus` (`bus_id`),
  KEY `idx_incidents_route` (`route_id`),
  CONSTRAINT `fk_incidents_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_incidents_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_incidents_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `bus_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bus_locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bus_id` int NOT NULL COMMENT 'ID xe bus',
  `driver_id` int NOT NULL COMMENT 'ID tài xế đang lái',
  `schedule_id` int DEFAULT NULL COMMENT 'ID lịch trình hiện tại',
  `latitude` decimal(10,8) NOT NULL COMMENT 'Vĩ độ (-90 to 90)',
  `longitude` decimal(11,8) NOT NULL COMMENT 'Kinh độ (-180 to 180)',
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm ghi nhận',
  PRIMARY KEY (`id`),
  KEY `idx_bus_timestamp` (`bus_id`,`timestamp`),
  KEY `idx_schedule` (`schedule_id`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `driver_id` (`driver_id`),
  KEY `idx_bus_id_timestamp` (`bus_id`,`timestamp`),
  KEY `idx_schedule_id` (`schedule_id`),
  CONSTRAINT `bus_locations_ibfk_1` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bus_locations_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bus_locations_ibfk_3` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử GPS (tùy chọn, không dùng cho realtime; map dùng WebSocket)';
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `student_route_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_route_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `route_id` int NOT NULL,
  `stop_id` int NOT NULL,
  `shift_type` enum('morning','afternoon') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_shift` (`student_id`,`shift_type`),
  KEY `route_id` (`route_id`),
  KEY `stop_id` (`stop_id`),
  CONSTRAINT `student_route_subscriptions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_route_subscriptions_ibfk_2` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_route_subscriptions_ibfk_3` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

INSERT INTO `student_route_subscriptions` VALUES (1,4,1,44,'morning','active'),(2,5,2,101,'morning','active'),(3,6,2,51,'morning','active'),(4,7,2,53,'morning','active'),(5,8,6,56,'morning','active'),(6,9,6,55,'morning','active'),(7,10,1,1,'morning','active'),(8,11,2,49,'morning','active'),(9,12,6,55,'morning','active'),(10,13,1,48,'morning','active'),(16,4,5,44,'afternoon','active'),(17,5,4,101,'afternoon','active'),(18,6,4,51,'afternoon','active'),(19,7,4,53,'afternoon','active'),(20,8,3,56,'afternoon','active'),(21,9,3,55,'afternoon','active'),(22,10,5,1,'afternoon','active'),(23,11,4,49,'afternoon','active'),(24,12,3,55,'afternoon','active'),(25,13,5,48,'afternoon','active');
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

