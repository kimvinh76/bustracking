# School Bus Management System - Cấu trúc dự án

## 📁 Cấu trúc thư mục chính

```
CNPM_Nhom04/
├── School Bus/              # Main application
│   ├── backend/            # Node.js + Express API
│   │   ├── config/         # Database config
│   │   ├── routes/         # API routes
│   │   └── server.js       # Entry point
│   │
│   └── src/                # React Frontend
│       ├── components/     # Reusable components
│       │   ├── admin/     
│       │   ├── driver/    
│       │   ├── parent/    
│       │   └── map/       # Map components (BusRoute*)
│       │
│       ├── pages/         # Page components
│       │   ├── admin/     
│       │   ├── driver/    # DriverMapPage.jsx
│       │   └── parent/    
│       │
│       ├── services/      # API services
│       │   ├── api.js              # Axios instance
│       │   ├── schedulesService.js # Schedule APIs
│       │   ├── routesService.js    # Route APIs ⭐
│       │   ├── studentsService.js  
│       │   └── busTrackingService.js # WebSocket
│       │
│       └── routes/        # React Router
│
└── school_bus_db.sql      # Database schema
```

## 🔑 Các file quan trọng

### Backend API
- `backend/routes/routeRoutes.js` - API lấy tuyến đường và điểm dừng
- `backend/routes/schedulesRoutes.js` - API lịch làm việc
- `backend/config/db.js` - Kết nối MySQL

### Frontend Services
- `services/routesService.js` ⭐ **MỚI** - Fetch route stops từ DB
  - `getRouteStops(routeId)` - Lấy điểm dừng
  - `transformStopsForMap(stops)` - Transform data cho map
  - `calculateStopTimes(stops, startTime, speed)` - Tính thời gian đến

- `services/schedulesService.js` - Fetch schedule data
- `services/busTrackingService.js` - WebSocket real-time tracking

### Driver Map Page
- `pages/driver/DriverMapPage.jsx` ⭐ **ĐÃ CẬP NHẬT**
  - Không dùng mock data nữa
  - Fetch từ API: schedule → route → stops
  - Tính thời gian tự động dựa trên khoảng cách
  - Icon xe bus chạy qua BusRouteDriver component

### Map Components
- `components/map/BusRouteDriver.jsx` - Xe bus chạy trên map
  - Dùng OSRM để tạo route hợp lý (không xuyên nhà)
  - Icon xe bus tự động
  - Callback khi đến điểm dừng

## 🚀 Workflow chạy driver map

1. Driver click "Bắt đầu tuyến" từ DriverSchedulePage
2. Navigate to `/driver/map/:scheduleId`
3. DriverMapPage load data:
   ```javascript
   scheduleData = await schedulesService.getScheduleById(scheduleId, driverId)
   routeStops = await routesService.getRouteStops(scheduleData.routeId)
   transformedStops = routesService.transformStopsForMap(routeStops)
   stopsWithTime = routesService.calculateStopTimes(transformedStops, startTime, 25)
   ```
4. Render map với BusRouteDriver component
5. Xe bus chạy theo waypoints, dùng OSRM routing
6. WebSocket sync vị trí real-time

## 🗄️ Database Tables quan trọng

- `routes` - Tuyến đường
- `route_stops` - Điểm dừng của tuyến (stop_order: 0=start, 99=end)
- `stops` - Thông tin điểm dừng (latitude, longitude)
- `schedules` - Lịch làm việc driver
- `students` - Học sinh (liên kết với stops)

## ⚙️ Cách tính toán thời gian

```javascript
// Vận tốc mặc định: 25 km/h
// Công thức: thời gian = khoảng cách / vận tốc
// Thêm 3 phút dừng đón học sinh mỗi điểm
```

## 🎯 Next Steps (Tuần 6-7)

- [ ] Tích hợp real-time tracking với WebSocket
- [ ] Parent page fetch data từ API (tương tự driver)
- [ ] Tối ưu OSRM routing
- [ ] Geofencing alerts
- [ ] Performance optimization

## 🧹 Files đã xóa

- ❌ `bus-management/` folder - Duplicate, không dùng
- ❌ Mock data trong DriverMapPage.jsx

---
**Ghi chú:** Không cần chuyển MongoDB. MySQL + WebSocket đủ cho real-time tracking.
