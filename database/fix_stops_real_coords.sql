-- =====================================================================
-- CẬP NHẬT TRẠM DỪNG + TUYẾN ĐƯỜNG THEO ĐỊA ĐIỂM THỰC TẾ TP.HCM
-- Trường: Trường Đại học Sài Gòn - 273 An Dương Vương, P.3, Q.5
-- ---------------------------------------------------------------------
-- Cách chạy: copy TOÀN BỘ file này, dán vào TiDB Cloud SQL Editor
--            (chọn database school_bus_db) rồi bấm Run 1 lần.
-- An toàn:   - Không đổi cấu trúc bảng.
--            - Giữ nguyên id trạm (stops.id) nên không gãy khóa ngoại.
--            - Chạy lại nhiều lần vẫn cho cùng kết quả.
-- =====================================================================

START TRANSACTION;

-- 1) TRẠM DỪNG (tọa độ đã đối chiếu bằng ArcGIS / OpenStreetMap)
-- Trường học (id 43 được hệ thống coi là trạm trường)
UPDATE `stops` SET `name`='Trường Đại học Sài Gòn',            `address`='273 An Dương Vương, P.3, Q.5, TP.HCM',                                  `latitude`=10.76061800, `longitude`=106.68204900, `status`='active' WHERE `id`=43;

-- Khu Quận 1 / Quận 5
UPDATE `stops` SET `name`='Nhà Văn hóa Thanh Niên',            `address`='4 Phạm Ngọc Thạch, P. Bến Nghé, Q.1, TP.HCM',                           `latitude`=10.78188000, `longitude`=106.69727700, `status`='active' WHERE `id`=1;
UPDATE `stops` SET `name`='Chợ Bến Thành',                     `address`='Đường Lê Lợi, P. Bến Thành, Q.1, TP.HCM',                                `latitude`=10.77199200, `longitude`=106.69828800, `status`='active' WHERE `id`=48;
UPDATE `stops` SET `name`='Công viên 23/9',                    `address`='Đường Phạm Ngũ Lão, P. Phạm Ngũ Lão, Q.1, TP.HCM',                       `latitude`=10.76895700, `longitude`=106.69259300, `status`='active' WHERE `id`=44;
UPDATE `stops` SET `name`='Ngã Sáu Phù Đổng',                  `address`='Vòng xoay Phù Đổng Thiên Vương, P. Bến Thành, Q.1, TP.HCM',              `latitude`=10.77135300, `longitude`=106.69344800, `status`='active' WHERE `id`=46;
UPDATE `stops` SET `name`='Công viên Lê Văn Tám',              `address`='Đường Điện Biên Phủ, P. Đa Kao, Q.1, TP.HCM',                            `latitude`=10.78760600, `longitude`=106.69473200, `status`='active' WHERE `id`=47;
UPDATE `stops` SET `name`='Ngã tư Nguyễn Văn Cừ - Trần Hưng Đạo', `address`='Giao lộ Nguyễn Văn Cừ & Trần Hưng Đạo, Q.1 - Q.5, TP.HCM',          `latitude`=10.75645600, `longitude`=106.68523600, `status`='active' WHERE `id`=100;
UPDATE `stops` SET `name`='Chợ An Đông',                       `address`='34-36 An Dương Vương, P.9, Q.5, TP.HCM',                                 `latitude`=10.75912300, `longitude`=106.67187400, `status`='active' WHERE `id`=45;

-- Khu Phú Nhuận / Gò Vấp
UPDATE `stops` SET `name`='Ngã tư Phú Nhuận',                  `address`='Giao lộ Phan Đình Phùng - Hoàng Văn Thụ - Nguyễn Kiệm, Q. Phú Nhuận, TP.HCM', `latitude`=10.79916900, `longitude`=106.68029600, `status`='active' WHERE `id`=101;
UPDATE `stops` SET `name`='Cầu vượt Nguyễn Thái Sơn',          `address`='Giao lộ Nguyễn Kiệm & Nguyễn Thái Sơn, P.3, Q. Gò Vấp, TP.HCM',          `latitude`=10.81446700, `longitude`=106.67880900, `status`='active' WHERE `id`=52;
UPDATE `stops` SET `name`='Ngã Sáu Gò Vấp',                    `address`='Giao lộ Quang Trung & Nguyễn Kiệm, Q. Gò Vấp, TP.HCM',                   `latitude`=10.82652800, `longitude`=106.67982000, `status`='active' WHERE `id`=51;
UPDATE `stops` SET `name`='Lotte Mart Gò Vấp',                 `address`='242 Nguyễn Văn Lượng, P.17, Q. Gò Vấp, TP.HCM',                          `latitude`=10.83848500, `longitude`=106.67101900, `status`='active' WHERE `id`=53;
UPDATE `stops` SET `name`='Công viên Làng Hoa Gò Vấp',         `address`='Đường Lê Văn Thọ, P.8, Q. Gò Vấp, TP.HCM',                               `latitude`=10.84218000, `longitude`=106.65706800, `status`='active' WHERE `id`=49;
UPDATE `stops` SET `name`='197 Lê Đức Thọ',                    `address`='197 Lê Đức Thọ, P.17, Q. Gò Vấp, TP.HCM',                                `latitude`=10.83799500, `longitude`=106.68029000, `status`='active' WHERE `id`=50;

-- Khu Bình Thạnh / Thủ Đức
UPDATE `stops` SET `name`='Ngã tư Hàng Xanh',                  `address`='Giao lộ Điện Biên Phủ & Xô Viết Nghệ Tĩnh, Q. Bình Thạnh, TP.HCM',       `latitude`=10.80149200, `longitude`=106.70985100, `status`='active' WHERE `id`=2;
UPDATE `stops` SET `name`='Cầu Sài Gòn',                       `address`='Xa lộ Hà Nội, giáp Q. Bình Thạnh - TP. Thủ Đức, TP.HCM',                 `latitude`=10.79890500, `longitude`=106.72716100, `status`='active' WHERE `id`=57;
UPDATE `stops` SET `name`='Ngã tư Bình Thái',                  `address`='Giao lộ Xa lộ Hà Nội & Nguyễn Văn Bá, P. Trường Thọ, TP. Thủ Đức, TP.HCM', `latitude`=10.83556600, `longitude`=106.76581200, `status`='active' WHERE `id`=56;
UPDATE `stops` SET `name`='Vincom Plaza Thủ Đức',              `address`='216 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM',                      `latitude`=10.85052000, `longitude`=106.76532600, `status`='active' WHERE `id`=55;
UPDATE `stops` SET `name`='Gigamall Thủ Đức',                  `address`='240-242 Phạm Văn Đồng, P. Hiệp Bình Chánh, TP. Thủ Đức, TP.HCM',         `latitude`=10.82794600, `longitude`=106.72193500, `status`='active' WHERE `id`=3;
UPDATE `stops` SET `name`='Chung cư Sunview Town',             `address`='Đường Gò Dưa, P. Hiệp Bình Phước, TP. Thủ Đức, TP.HCM',                  `latitude`=10.86546200, `longitude`=106.72739400, `status`='active' WHERE `id`=54;

-- 2) LỘ TRÌNH 6 TUYẾN (sáng: kết thúc tại trường, chiều: xuất phát từ trường)
--    stop_order: 0 = điểm đầu, 1..n = giữa, 99 = điểm cuối
DELETE FROM `route_stops` WHERE `route_id` IN (1,2,3,4,5,6);

INSERT INTO `route_stops` (`route_id`,`stop_id`,`stop_order`) VALUES
-- Tuyến 1: Quận 1 - Sáng   (NVH Thanh Niên -> Chợ Bến Thành -> CV 23/9 -> Nguyễn Văn Cừ -> ĐH Sài Gòn)
(1,1,0),(1,48,1),(1,44,2),(1,100,3),(1,43,99),
-- Tuyến 5: Quận 1 - Chiều  (ĐH Sài Gòn -> Nguyễn Văn Cừ -> CV 23/9 -> Chợ Bến Thành -> NVH Thanh Niên)
(5,43,0),(5,100,1),(5,44,2),(5,48,3),(5,1,99),
-- Tuyến 2: Gò Vấp - Sáng   (Làng Hoa -> Lotte Mart -> Ngã Sáu GV -> Cầu vượt NTS -> Ngã tư Phú Nhuận -> ĐH Sài Gòn)
(2,49,0),(2,53,1),(2,51,2),(2,52,3),(2,101,4),(2,43,99),
-- Tuyến 4: Gò Vấp - Chiều  (chiều ngược lại)
(4,43,0),(4,101,1),(4,52,2),(4,51,3),(4,53,4),(4,49,99),
-- Tuyến 6: Thủ Đức - Sáng  (Vincom Thủ Đức -> Ngã tư Bình Thái -> Cầu Sài Gòn -> Hàng Xanh -> ĐH Sài Gòn)
(6,55,0),(6,56,1),(6,57,2),(6,2,3),(6,43,99),
-- Tuyến 3: Thủ Đức - Chiều (chiều ngược lại)
(3,43,0),(3,2,1),(3,57,2),(3,56,3),(3,55,99);

-- 3) QUÃNG ĐƯỜNG ĐƯỜNG BỘ THỰC TẾ (đo bằng OSRM theo đúng thứ tự trạm ở trên)
UPDATE `routes` SET `distance`=5.14  WHERE `id`=1;
UPDATE `routes` SET `distance`=17.28 WHERE `id`=2;
UPDATE `routes` SET `distance`=23.61 WHERE `id`=3;
UPDATE `routes` SET `distance`=14.94 WHERE `id`=4;
UPDATE `routes` SET `distance`=7.16  WHERE `id`=5;
UPDATE `routes` SET `distance`=18.19 WHERE `id`=6;

-- 4) ĐIỂM ĐÓN/TRẢ CỦA HỌC SINH: gán trạm gần nhà nhất, nằm đúng trên tuyến mới
--    (student_id, shift_type) là khóa duy nhất nên dùng upsert cho chắc chắn
INSERT INTO `student_route_subscriptions` (`student_id`,`route_id`,`stop_id`,`shift_type`,`status`) VALUES
(4, 1,44, 'morning','active'),(4, 5,44, 'afternoon','active'),   -- 123 Nguyễn Thái Học, Q.1  -> CV 23/9
(10,1,1,  'morning','active'),(10,5,1,  'afternoon','active'),   -- 147 Điện Biên Phủ, Q.1    -> NVH Thanh Niên
(13,1,48, 'morning','active'),(13,5,48, 'afternoon','active'),   -- 741 Pasteur, Q.1          -> Chợ Bến Thành
(5, 2,101,'morning','active'),(5, 4,101,'afternoon','active'),   -- 456 Lê Văn Sỹ, Q.3        -> Ngã tư Phú Nhuận
(6, 2,51, 'morning','active'),(6, 4,51, 'afternoon','active'),   -- Gò Vấp                    -> Ngã Sáu Gò Vấp
(7, 2,53, 'morning','active'),(7, 4,53, 'afternoon','active'),   -- 321 Phan Văn Trị, Gò Vấp  -> Lotte Mart Gò Vấp
(11,2,49, 'morning','active'),(11,4,49, 'afternoon','active'),   -- 258 Nguyễn Oanh, Gò Vấp   -> CV Làng Hoa
(8, 6,56, 'morning','active'),(8, 3,56, 'afternoon','active'),   -- 654 Kha Vạn Cân, Thủ Đức  -> Ngã tư Bình Thái
(9, 6,55, 'morning','active'),(9, 3,55, 'afternoon','active'),   -- 987 Lê Văn Việt, Thủ Đức  -> Vincom Thủ Đức
(12,6,55, 'morning','active'),(12,3,55, 'afternoon','active')    -- 369 Võ Văn Ngân, Thủ Đức  -> Vincom Thủ Đức
ON DUPLICATE KEY UPDATE `route_id`=VALUES(`route_id`), `stop_id`=VALUES(`stop_id`), `status`=VALUES(`status`);

COMMIT;

-- 5) KIỂM TRA NHANH SAU KHI CHẠY (tùy chọn)
-- SELECT r.id, r.route_name, r.distance, rs.stop_order, s.name
-- FROM routes r JOIN route_stops rs ON rs.route_id = r.id JOIN stops s ON s.id = rs.stop_id
-- ORDER BY r.id, rs.stop_order;
