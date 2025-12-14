# API Testing Guide

## Test Backend APIs

### 1. Kiểm tra backend đang chạy
```bash
curl http://localhost:5000/api/health
```

### 2. Test Route APIs

#### Lấy tất cả tuyến đường
```bash
curl http://localhost:5000/api/routes
```

#### Lấy điểm dừng của tuyến (route_id = 1)
```bash
curl http://localhost:5000/api/routes/1/stops
```

### 3. Test Schedule APIs

#### Lấy lịch của driver (driver_id = 1)
```bash
curl http://localhost:5000/api/schedules/driver/1
```

#### Lấy chi tiết schedule (schedule_id = 24, driver_id = 1)
```bash
curl http://localhost:5000/api/schedules/1/24
```

### 4. Test Students API
```bash
curl http://localhost:5000/api/students
```

## Frontend Test

1. Đăng nhập driver: `driver1` / `driver123`
2. Chọn schedule ID 24 (hoặc schedule nào có sẵn)
3. Click "Bắt đầu tuyến"
4. Kiểm tra console log:
   - ✅ "📅 Schedule data: ..."
   - ✅ "🗺️ Route stops: ..."
   - ✅ "✅ Loaded schedule with X stops and Y students"

## Expected Response

### GET /api/routes/1/stops
```json
{
  "success": true,
  "data": [
    {
      "stop_id": 1,
      "name": "Nhà Văn hóa Thanh Niên",
      "latitude": "10.75875000",
      "longitude": "106.68095000",
      "stop_order": 0
    },
    ...
  ]
}
```

## Debug Checklist

- [ ] Backend chạy trên port 5000
- [ ] Frontend chạy trên port 5173
- [ ] MySQL database `school_bus_db` tồn tại
- [ ] Tables: routes, route_stops, stops có data
- [ ] CORS enabled cho localhost:5173
