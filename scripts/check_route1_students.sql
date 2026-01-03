-- Kiểm tra dữ liệu học sinh và điểm đón của tuyến 1 (morning)
USE school_bus_db;

-- 1. Xem thông tin tuyến 1
SELECT * FROM routes WHERE id = 1;

-- 2. Xem các điểm dừng của tuyến 1
SELECT rs.stop_order, s.id, s.name, rs.student_pickup_count
FROM route_stops rs
JOIN stops s ON rs.stop_id = s.id
WHERE rs.route_id = 1
ORDER BY rs.stop_order;

-- 3. Xem học sinh được gán tuyến 1 (sáng) và điểm đón của họ
SELECT 
    s.id,
    s.name,
    s.class,
    s.morning_route_id,
    s.morning_pickup_stop_id,
    st.name AS pickup_stop_name
FROM students s
LEFT JOIN stops st ON s.morning_pickup_stop_id = st.id
WHERE s.morning_route_id = 1
ORDER BY s.morning_pickup_stop_id, s.name;

-- 4. Đếm số học sinh tại mỗi điểm dừng của tuyến 1
SELECT 
    st.id AS stop_id,
    st.name AS stop_name,
    COUNT(s.id) AS student_count,
    GROUP_CONCAT(s.name SEPARATOR ', ') AS students
FROM stops st
LEFT JOIN students s ON s.morning_pickup_stop_id = st.id AND s.morning_route_id = 1
WHERE st.id IN (SELECT stop_id FROM route_stops WHERE route_id = 1)
GROUP BY st.id, st.name
ORDER BY (SELECT stop_order FROM route_stops WHERE route_id = 1 AND stop_id = st.id);
