
USE `school_bus_db`;

START TRANSACTION;

-- 1) TRẠM DỪNG (20 trạm có thật, tọa độ đã căn lên đúng mặt đường đón/trả)
-- Trạm trường học (id = 43)
UPDATE `stops` SET `name`='Trường Đại học Sài Gòn',               `address`='273 An Dương Vương, P.3, Q.5, TP.HCM',                                       `latitude`=10.76065200, `longitude`=106.68203500, `status`='active' WHERE `id`=43;

-- Khu Quận 1 / Quận 5
UPDATE `stops` SET `name`='Nhà Văn hóa Thanh Niên',               `address`='4 Phạm Ngọc Thạch (góc Nguyễn Thị Minh Khai), P. Bến Nghé, Q.1, TP.HCM',    `latitude`=10.78193000, `longitude`=106.69722200, `status`='active' WHERE `id`=1;
UPDATE `stops` SET `name`='Chợ Bến Thành',                        `address`='Công trường Quách Thị Trang, P. Bến Thành, Q.1, TP.HCM',                     `latitude`=10.77195000, `longitude`=106.69831400, `status`='active' WHERE `id`=48;
UPDATE `stops` SET `name`='Công viên 23/9',                       `address`='Mặt tiền Lê Lai - Công viên 23/9, P. Phạm Ngũ Lão, Q.1, TP.HCM',             `latitude`=10.76943900, `longitude`=106.69239200, `status`='active' WHERE `id`=44;
UPDATE `stops` SET `name`='Ngã Sáu Phù Đổng',                     `address`='Vòng xoay Ngã Sáu Phù Đổng, P. Bến Thành, Q.1, TP.HCM',                      `latitude`=10.77135300, `longitude`=106.69344800, `status`='active' WHERE `id`=46;
UPDATE `stops` SET `name`='Công viên Lê Văn Tám',                 `address`='Mặt tiền Điện Biên Phủ - CV Lê Văn Tám, P. Đa Kao, Q.1, TP.HCM',             `latitude`=10.78754400, `longitude`=106.69479900, `status`='active' WHERE `id`=47;
UPDATE `stops` SET `name`='Ngã tư Nguyễn Văn Cừ - Trần Hưng Đạo', `address`='Giao lộ Nguyễn Văn Cừ & Trần Hưng Đạo, Q.1 - Q.5, TP.HCM',                   `latitude`=10.75646800, `longitude`=106.68526000, `status`='active' WHERE `id`=100;
UPDATE `stops` SET `name`='Chợ An Đông',                          `address`='34-36 An Dương Vương, P.9, Q.5, TP.HCM',                                     `latitude`=10.75912200, `longitude`=106.67187200, `status`='active' WHERE `id`=45;

-- Khu Phú Nhuận / Gò Vấp
UPDATE `stops` SET `name`='Ngã tư Phú Nhuận',                     `address`='Giao lộ Phan Đình Phùng - Hoàng Văn Thụ - Nguyễn Kiệm, Q. Phú Nhuận, TP.HCM', `latitude`=10.79916500, `longitude`=106.68028800, `status`='active' WHERE `id`=101;
UPDATE `stops` SET `name`='Cầu vượt Nguyễn Thái Sơn',             `address`='Nút giao Nguyễn Kiệm & Nguyễn Thái Sơn, P.3, Q. Gò Vấp, TP.HCM',             `latitude`=10.81445400, `longitude`=106.67882400, `status`='active' WHERE `id`=52;
UPDATE `stops` SET `name`='Ngã Sáu Gò Vấp',                       `address`='Giao lộ Quang Trung & Nguyễn Kiệm, Q. Gò Vấp, TP.HCM',                       `latitude`=10.82652900, `longitude`=106.67985100, `status`='active' WHERE `id`=51;
UPDATE `stops` SET `name`='Lotte Mart Gò Vấp',                    `address`='242 Nguyễn Văn Lượng, P.17, Q. Gò Vấp, TP.HCM',                              `latitude`=10.83848600, `longitude`=106.67097000, `status`='active' WHERE `id`=53;
UPDATE `stops` SET `name`='Công viên Làng Hoa Gò Vấp',            `address`='Đường Lê Văn Thọ, P.8, Q. Gò Vấp, TP.HCM',                                   `latitude`=10.84217800, `longitude`=106.65699000, `status`='active' WHERE `id`=49;
UPDATE `stops` SET `name`='197 Lê Đức Thọ',                       `address`='197 Lê Đức Thọ, P.17, Q. Gò Vấp, TP.HCM',                                    `latitude`=10.83804800, `longitude`=106.68040600, `status`='active' WHERE `id`=50;

-- Khu Bình Thạnh / Thủ Đức (dời trạm Cầu Sài Gòn xuống chân cầu phía Thảo Điền để xe dừng được)
UPDATE `stops` SET `name`='Ngã tư Hàng Xanh',                     `address`='Giao lộ Điện Biên Phủ & Xô Viết Nghệ Tĩnh, Q. Bình Thạnh, TP.HCM',           `latitude`=10.80139000, `longitude`=106.70987100, `status`='active' WHERE `id`=2;
UPDATE `stops` SET `name`='Chân Cầu Sài Gòn (Thảo Điền)',         `address`='159 Xa lộ Hà Nội, P. Thảo Điền, TP. Thủ Đức, TP.HCM',                        `latitude`=10.80316000, `longitude`=106.74013300, `status`='active' WHERE `id`=57;
UPDATE `stops` SET `name`='Ngã tư Bình Thái',                     `address`='Giao lộ Xa lộ Hà Nội & Đỗ Xuân Hợp, P. Trường Thọ, TP. Thủ Đức, TP.HCM',     `latitude`=10.83557100, `longitude`=106.76581500, `status`='active' WHERE `id`=56;
UPDATE `stops` SET `name`='Vincom Plaza Thủ Đức',                 `address`='216 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM',                          `latitude`=10.85062100, `longitude`=106.76533600, `status`='active' WHERE `id`=55;
UPDATE `stops` SET `name`='Gigamall Thủ Đức',                     `address`='240-242 Phạm Văn Đồng, P. Hiệp Bình Chánh, TP. Thủ Đức, TP.HCM',             `latitude`=10.82821000, `longitude`=106.72187400, `status`='active' WHERE `id`=3;
UPDATE `stops` SET `name`='Chung cư Sunview Town',                `address`='Đường Gò Dưa, P. Hiệp Bình Phước, TP. Thủ Đức, TP.HCM',                      `latitude`=10.86516300, `longitude`=106.72755200, `status`='active' WHERE `id`=54;

-- 2) LỘ TRÌNH 6 TUYẾN (Ca sáng: kết thúc tại ĐH Sài Gòn; Ca chiều: xuất phát từ ĐH Sài Gòn)
DELETE FROM `route_stops` WHERE `route_id` IN (1,2,3,4,5,6);

INSERT INTO `route_stops` (`route_id`,`stop_id`,`stop_order`) VALUES
-- Tuyến 1: Quận 1 - Sáng   (NVH Thanh Niên -> Chợ Bến Thành -> CV 23/9 -> Nguyễn Văn Cừ -> ĐH Sài Gòn)
(1,1,0),(1,48,1),(1,44,2),(1,100,3),(1,43,99),
-- Tuyến 5: Quận 1 - Chiều  (ĐH Sài Gòn -> Nguyễn Văn Cừ -> CV 23/9 -> Chợ Bến Thành -> NVH Thanh Niên)
(5,43,0),(5,100,1),(5,44,2),(5,48,3),(5,1,99),
-- Tuyến 2: Gò Vấp - Sáng   (CV Làng Hoa -> Lotte Mart GV -> Ngã Sáu GV -> Cầu vượt NTS -> Ngã tư Phú Nhuận -> ĐH Sài Gòn)
(2,49,0),(2,53,1),(2,51,2),(2,52,3),(2,101,4),(2,43,99),
-- Tuyến 4: Gò Vấp - Chiều  (chiều ngược lại)
(4,43,0),(4,101,1),(4,52,2),(4,51,3),(4,53,4),(4,49,99),
-- Tuyến 6: Thủ Đức - Sáng  (Vincom Thủ Đức -> Ngã tư Bình Thái -> Chân Cầu Sài Gòn -> Hàng Xanh -> ĐH Sài Gòn)
(6,55,0),(6,56,1),(6,57,2),(6,2,3),(6,43,99),
-- Tuyến 3: Thủ Đức - Chiều (chiều ngược lại)
(3,43,0),(3,2,1),(3,57,2),(3,56,3),(3,55,99);

-- 3) QUÃNG ĐƯỜNG ĐƯỜNG BỘ THỰC TẾ (OSRM theo đúng tọa độ đã căn lên mặt đường)
UPDATE `routes` SET `distance`=5.14  WHERE `id`=1;
UPDATE `routes` SET `distance`=17.28 WHERE `id`=2;
UPDATE `routes` SET `distance`=21.46 WHERE `id`=3;
UPDATE `routes` SET `distance`=14.94 WHERE `id`=4;
UPDATE `routes` SET `distance`=7.16  WHERE `id`=5;
UPDATE `routes` SET `distance`=18.66 WHERE `id`=6;

-- 4) ĐỊA CHỈ THỰC TẾ CHO PHỤ HUYNH & HỌC SINH (khớp số nhà/đường có thật ngay gần trạm đón/trả)
UPDATE `parents`  SET `address`='136 Phạm Ngũ Lão, P. Phạm Ngũ Lão, Q.1, TP.HCM'      WHERE `id`=4;
UPDATE `students` SET `address`='136 Phạm Ngũ Lão, P. Phạm Ngũ Lão, Q.1, TP.HCM'      WHERE `id`=4;

UPDATE `parents`  SET `address`='120 Phan Đình Phùng, P.2, Q. Phú Nhuận, TP.HCM'      WHERE `id`=5;
UPDATE `students` SET `address`='120 Phan Đình Phùng, P.2, Q. Phú Nhuận, TP.HCM'      WHERE `id`=5;

UPDATE `parents`  SET `address`='58 Quang Trung, P.10, Q. Gò Vấp, TP.HCM'             WHERE `id`=6;
UPDATE `students` SET `address`='58 Quang Trung, P.10, Q. Gò Vấp, TP.HCM'             WHERE `id`=6;

UPDATE `parents`  SET `address`='210 Nguyễn Văn Lượng, P.17, Q. Gò Vấp, TP.HCM'       WHERE `id`=7;
UPDATE `students` SET `address`='210 Nguyễn Văn Lượng, P.17, Q. Gò Vấp, TP.HCM'       WHERE `id`=7;

UPDATE `parents`  SET `address`='25 Nguyễn Văn Bá, P. Trường Thọ, TP. Thủ Đức, TP.HCM' WHERE `id`=8;
UPDATE `students` SET `address`='25 Nguyễn Văn Bá, P. Trường Thọ, TP. Thủ Đức, TP.HCM' WHERE `id`=8;

UPDATE `parents`  SET `address`='180 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM'   WHERE `id`=9;
UPDATE `students` SET `address`='180 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM'   WHERE `id`=9;

UPDATE `parents`  SET `address`='12 Phạm Ngọc Thạch, P. Võ Thị Sáu, Q.3, TP.HCM'      WHERE `id`=10;
UPDATE `students` SET `address`='12 Phạm Ngọc Thạch, P. Võ Thị Sáu, Q.3, TP.HCM'      WHERE `id`=10;

UPDATE `parents`  SET `address`='185 Lê Văn Thọ, P.8, Q. Gò Vấp, TP.HCM'              WHERE `id`=11;
UPDATE `students` SET `address`='185 Lê Văn Thọ, P.8, Q. Gò Vấp, TP.HCM'              WHERE `id`=11;

UPDATE `parents`  SET `address`='108 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM'   WHERE `id`=12;
UPDATE `students` SET `address`='108 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM'   WHERE `id`=12;

UPDATE `parents`  SET `address`='68 Lê Lợi, P. Bến Thành, Q.1, TP.HCM'                WHERE `id`=13;
UPDATE `students` SET `address`='68 Lê Lợi, P. Bến Thành, Q.1, TP.HCM'                WHERE `id`=13;

-- Chuẩn hóa luôn địa chỉ tài xế (xóa ký tự xuống dòng/khoảng trắng thừa)
UPDATE `drivers` SET `address`='23 An Dương Vương, P.8, Q.5, TP.HCM'  WHERE `id`=1;
UPDATE `drivers` SET `address`='273 An Dương Vương, P.3, Q.5, TP.HCM' WHERE `id` IN (2, 3);

-- 5) ĐĂNG KÝ ĐIỂM ĐÓN/TRẢ CỦA HỌC SINH (mỗi em đi đúng trạm sát địa chỉ nhà)
INSERT INTO `student_route_subscriptions` (`student_id`,`route_id`,`stop_id`,`shift_type`,`status`) VALUES
(4, 1,44, 'morning','active'),(4, 5,44, 'afternoon','active'),   -- 136 Phạm Ngũ Lão, Q.1       -> Công viên 23/9
(10,1,1,  'morning','active'),(10,5,1,  'afternoon','active'),   -- 12 Phạm Ngọc Thạch, Q.3     -> Nhà Văn hóa Thanh Niên
(13,1,48, 'morning','active'),(13,5,48, 'afternoon','active'),   -- 68 Lê Lợi, Q.1              -> Chợ Bến Thành
(5, 2,101,'morning','active'),(5, 4,101,'afternoon','active'),   -- 120 Phan Đình Phùng, PN     -> Ngã tư Phú Nhuận
(6, 2,51, 'morning','active'),(6, 4,51, 'afternoon','active'),   -- 58 Quang Trung, Gò Vấp      -> Ngã Sáu Gò Vấp
(7, 2,53, 'morning','active'),(7, 4,53, 'afternoon','active'),   -- 210 Nguyễn Văn Lượng, GV    -> Lotte Mart Gò Vấp
(11,2,49, 'morning','active'),(11,4,49, 'afternoon','active'),   -- 185 Lê Văn Thọ, Gò Vấp      -> Công viên Làng Hoa Gò Vấp
(8, 6,56, 'morning','active'),(8, 3,56, 'afternoon','active'),   -- 25 Nguyễn Văn Bá, Thủ Đức   -> Ngã tư Bình Thái
(9, 6,55, 'morning','active'),(9, 3,55, 'afternoon','active'),   -- 180 Võ Văn Ngân, Thủ Đức    -> Vincom Plaza Thủ Đức
(12,6,55, 'morning','active'),(12,3,55, 'afternoon','active')    -- 108 Võ Văn Ngân, Thủ Đức    -> Vincom Plaza Thủ Đức
ON DUPLICATE KEY UPDATE `route_id`=VALUES(`route_id`), `stop_id`=VALUES(`stop_id`), `status`=VALUES(`status`);

COMMIT;
