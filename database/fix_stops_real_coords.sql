-- Script cập nhật dữ liệu trạm dừng (stops) theo tọa độ & địa chỉ thực tế tại TP.HCM
-- Lưu ý: Chỉ UPDATE theo id hiện có (KHÔNG xóa/tạo mới id) để giữ nguyên toàn vẹn khóa ngoại route_stops & student_route_subscriptions.
-- Copy toàn bộ script này và chạy trực tiếp trong TiDB Cloud SQL Editor.

UPDATE `stops` SET `name` = 'Nhà Văn hóa Thanh Niên', `address` = '4 Phạm Ngọc Thạch, P. Bến Nghé, Q.1, TP.HCM', `latitude` = 10.78188000, `longitude` = 106.69727700 WHERE `id` = 1;
UPDATE `stops` SET `name` = 'Ngã tư Hàng Xanh', `address` = 'Giao lộ Điện Biên Phủ & Xô Viết Nghệ Tĩnh, Q. Bình Thạnh, TP.HCM', `latitude` = 10.80149200, `longitude` = 106.70985100 WHERE `id` = 2;
UPDATE `stops` SET `name` = 'Gigamall Thủ Đức', `address` = '240 Phạm Văn Đồng, P. Hiệp Bình Chánh, TP. Thủ Đức, TP.HCM', `latitude` = 10.82794600, `longitude` = 106.72193500 WHERE `id` = 3;

UPDATE `stops` SET `name` = 'Trường THCS Nguyễn Du', `address` = '139 Nguyễn Du, P. Bến Thành, Q.1, TP.HCM', `latitude` = 10.77280500, `longitude` = 106.69396500 WHERE `id` = 43;
UPDATE `stops` SET `name` = 'Công viên 23/9', `address` = 'Đường Phạm Ngũ Lão - Lê Lai, P. Bến Thành, Q.1, TP.HCM', `latitude` = 10.76895700, `longitude` = 106.69259300 WHERE `id` = 44;
UPDATE `stops` SET `name` = 'Nhà Văn hóa Thanh Niên', `address` = '4 Phạm Ngọc Thạch, P. Bến Nghé, Q.1, TP.HCM', `latitude` = 10.78188000, `longitude` = 106.69727700 WHERE `id` = 45;
UPDATE `stops` SET `name` = 'Ngã Sáu Phù Đổng', `address` = 'Vòng xoay Ngã Sáu Phù Đổng, P. Bến Thành, Q.1, TP.HCM', `latitude` = 10.77135300, `longitude` = 106.69344800 WHERE `id` = 46;
UPDATE `stops` SET `name` = 'Ngã tư Hàng Xanh', `address` = 'Giao lộ Điện Biên Phủ & Xô Viết Nghệ Tĩnh, Q. Bình Thạnh, TP.HCM', `latitude` = 10.80149200, `longitude` = 106.70985100 WHERE `id` = 47;
UPDATE `stops` SET `name` = 'Chợ Bến Thành', `address` = '1 Lê Lợi, P. Bến Thành, Q.1, TP.HCM', `latitude` = 10.77199200, `longitude` = 106.69828800 WHERE `id` = 48;

UPDATE `stops` SET `name` = 'Công viên Làng Hoa Gò Vấp', `address` = 'Đường Lê Văn Thọ - Số 8, P.8, Q. Gò Vấp, TP.HCM', `latitude` = 10.84208800, `longitude` = 106.65653500 WHERE `id` = 49;
UPDATE `stops` SET `name` = 'Trạm 197 Lê Đức Thọ', `address` = '197 Lê Đức Thọ, P.17, Q. Gò Vấp, TP.HCM', `latitude` = 10.83799500, `longitude` = 106.68029000 WHERE `id` = 50;
UPDATE `stops` SET `name` = 'Ngã Sáu Gò Vấp (Chuồng Chó)', `address` = 'Giao lộ Quang Trung & Nguyễn Kiệm, Q. Gò Vấp, TP.HCM', `latitude` = 10.82652800, `longitude` = 106.67982000 WHERE `id` = 51;
UPDATE `stops` SET `name` = 'Cầu vượt Nguyễn Thái Sơn', `address` = 'Nút giao Nguyễn Thái Sơn - Nguyễn Kiệm, P.3, Q. Gò Vấp, TP.HCM', `latitude` = 10.81446700, `longitude` = 106.67880900 WHERE `id` = 52;
UPDATE `stops` SET `name` = 'Lotte Mart Gò Vấp', `address` = '242 Nguyễn Văn Lượng, P.10, Q. Gò Vấp, TP.HCM', `latitude` = 10.83848500, `longitude` = 106.67101900 WHERE `id` = 53;

UPDATE `stops` SET `name` = 'Chung cư Sunview Town', `address` = 'Đường Gò Dưa, P. Hiệp Bình Phước, TP. Thủ Đức, TP.HCM', `latitude` = 10.86546200, `longitude` = 106.72739400 WHERE `id` = 54;
UPDATE `stops` SET `name` = 'Vincom Plaza Thủ Đức', `address` = '216 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM', `latitude` = 10.85052000, `longitude` = 106.76532600 WHERE `id` = 55;
UPDATE `stops` SET `name` = 'Ngã tư Bình Thái', `address` = 'Xa lộ Hà Nội - Nguyễn Văn Bá, P. Trường Thọ, TP. Thủ Đức, TP.HCM', `latitude` = 10.83556600, `longitude` = 106.76581200 WHERE `id` = 56;
UPDATE `stops` SET `name` = 'Cầu Sài Gòn', `address` = 'Cầu Sài Gòn, Xa lộ Hà Nội, TP. Thủ Đức, TP.HCM', `latitude` = 10.79890500, `longitude` = 106.72716100 WHERE `id` = 57;

UPDATE `stops` SET `name` = 'Nguyễn Văn Cừ', `address` = 'Giao lộ Nguyễn Văn Cừ & Trần Hưng Đạo, Q.1 - Q.5, TP.HCM', `latitude` = 10.75645600, `longitude` = 106.68523600 WHERE `id` = 100;
UPDATE `stops` SET `name` = 'Nguyễn Biểu', `address` = 'Giao lộ Nguyễn Biểu & Trần Hưng Đạo, P.1, Q.5, TP.HCM', `latitude` = 10.75605100, `longitude` = 106.68365700 WHERE `id` = 101;

-- Đồng bộ lại khoảng cách đường bộ (OSRM) cho 6 tuyến mặc định theo tọa độ thực tế mới
UPDATE `routes` SET `distance` = 7.19 WHERE `id` = 1;
UPDATE `routes` SET `distance` = 20.54 WHERE `id` = 2;
UPDATE `routes` SET `distance` = 25.78 WHERE `id` = 3;
UPDATE `routes` SET `distance` = 13.49 WHERE `id` = 4;
UPDATE `routes` SET `distance` = 9.55 WHERE `id` = 5;
UPDATE `routes` SET `distance` = 20.73 WHERE `id` = 6;
