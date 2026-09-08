# SQL Queries - School Bus Tracking System

## Mục đích

Thư mục này chứa các câu lệnh SQL để verify dữ liệu trong database sau khi test.

## Cấu trúc file

Mỗi file SQL nên đặt tên theo module hoặc chức năng:
- `verify_users.sql` - Verify user data
- `verify_routes.sql` - Verify routes data
- `verify_schedules.sql` - Verify schedules data
- `verify_students.sql` - Verify students data

## Ví dụ các queries

### Verify User sau khi đăng ký
```sql
-- Kiểm tra user vừa tạo
SELECT * FROM users 
WHERE email = 'test@example.com';

-- Kiểm tra password đã được hash
SELECT username, password 
FROM users 
WHERE username = 'testuser'
LIMIT 1;
```

### Verify Route creation
```sql
-- Kiểm tra route vừa tạo
SELECT * FROM routes 
WHERE route_name = 'Test Route 01';

-- Kiểm tra route stops
SELECT rs.*, s.name, s.address 
FROM route_stops rs
JOIN stops s ON rs.stop_id = s.id
WHERE rs.route_id = ?
ORDER BY rs.stop_order;
```

### Verify Schedule
```sql
-- Kiểm tra schedule
SELECT 
  s.*,
  r.route_name,
  b.license_plate,
  d.full_name as driver_name
FROM schedules s
LEFT JOIN routes r ON s.route_id = r.id
LEFT JOIN buses b ON s.bus_id = b.id
LEFT JOIN drivers d ON s.driver_id = d.id
WHERE s.id = ?;

-- Count students in schedule
SELECT COUNT(*) as student_count
FROM students
WHERE route_id = ? AND shift = 'morning';
```

### Verify Incidents
```sql
-- Lấy tất cả incidents của một schedule
SELECT 
  i.*,
  u.username as reported_by_user
FROM incidents i
LEFT JOIN users u ON i.reported_by = u.id
WHERE i.schedule_id = ?
ORDER BY i.created_at DESC;
```

### Data Consistency Checks
```sql
-- Kiểm tra orphan records
-- Students không có route
SELECT * FROM students WHERE route_id NOT IN (SELECT id FROM routes);

-- Schedules không có bus/driver/route
SELECT * FROM schedules 
WHERE bus_id NOT IN (SELECT id FROM buses)
   OR driver_id NOT IN (SELECT id FROM drivers)
   OR route_id NOT IN (SELECT id FROM routes);

-- Route stops trỏ đến route hoặc stop không tồn tại
SELECT * FROM route_stops
WHERE route_id NOT IN (SELECT id FROM routes)
   OR stop_id NOT IN (SELECT id FROM stops);
```

## Lưu ý

- Luôn backup database trước khi chạy queries
- Sử dụng `SELECT` để verify, tránh `UPDATE/DELETE` trực tiếp
- Comment rõ ràng mục đích của từng query
