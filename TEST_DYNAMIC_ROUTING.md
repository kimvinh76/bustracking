# 🧪 Test Dynamic Routing - Checklist

## Bước 1: Kiểm tra Backend
```bash
# Terminal 1 - Start backend
cd "School Bus/backend"
npm run dev

# Kiểm tra log phải có:
# ✅ 🚀 Backend server đang chạy tại http://localhost:5000
# ✅ 🔌 WebSocket server đang chạy tại ws://localhost:5000
```

## Bước 2: Test API với các Driver khác nhau

### Driver 1 (Tuyến Quận 1)
```bash
# Lấy schedules
curl http://localhost:5000/api/schedules/driver/1

# Lấy schedule detail (ví dụ schedule 24)
curl http://localhost:5000/api/schedules/1/24

# Kiểm tra route_id trong response → phải = 1
```

### Driver 2 (Tuyến Gò Vấp)
```bash
# Lấy schedules
curl http://localhost:5000/api/schedules/driver/2

# Lấy schedule detail (ví dụ schedule 4)
curl http://localhost:5000/api/schedules/2/4

# Kiểm tra route_id trong response → phải = 2 (khác driver 1)
```

### Driver 3 (Tuyến Thủ Đức)
```bash
curl http://localhost:5000/api/schedules/driver/3
curl http://localhost:5000/api/schedules/3/6

# Kiểm tra route_id → phải = 6 (khác driver 1 & 2)
```

## Bước 3: Test Route Stops khác nhau

### Route 1 - Quận 1
```bash
curl http://localhost:5000/api/routes/1/stops

# Expected stops:
# - Nhà Văn hóa Thanh Niên (10.75875, 106.68095)
# - Nguyễn Văn Cừ (10.76055, 106.6834)
# - Nguyễn Biểu (10.7579, 106.6831)
# - Trường THCS Nguyễn Du (10.7545, 106.6815)
```

### Route 2 - Gò Vấp
```bash
curl http://localhost:5000/api/routes/2/stops

# Expected stops:
# - Công viên Làng Hoa (10.8371, 106.6795)
# - Ngã Tư Phan Văn Trì (10.842, 106.685)
# - Ngã Năm Chương Chợ (10.8395, 106.6826)
# - Cầu vượt Nguyễn Thái Sơn (10.845, 106.758)
# - Trường THCS Nguyễn Du (10.7545, 106.6815)
```

### Route 6 - Thủ Đức
```bash
curl http://localhost:5000/api/routes/6/stops

# Expected stops:
# - Chung cư Sunview Town (10.8516, 106.7718)
# - Vincom Thủ Đức (10.85, 106.77)
# - Xà Lộ Hà Nội (10.86, 106.78)
# - Cầu Sài Gòn (10.82, 106.74)
# - Trường THCS Nguyễn Du (10.7545, 106.6815)
```

## Bước 4: Test Frontend với các Driver

### Test Driver 1
```
1. Login: driver1 / driver123
2. URL: http://localhost:5173/driver/schedule
3. Chọn schedule ID 24 (hoặc schedule nào driver 1 có)
4. Click "Bắt đầu tuyến"
5. Mở F12 Console → Kiểm tra:
   ✅ "📅 Schedule data: { routeId: 1, routeName: 'Tuyến Quận 1 - Sáng' }"
   ✅ "🗺️ Route stops: [ {id:1, name:'Nhà Văn hóa...' } ]"
   ✅ "✅ Loaded schedule with 4 stops"
6. Map phải hiển thị 4 markers tại Quận 1
```

### Test Driver 2
```
1. Logout driver1
2. Login: driver2 / driver123
3. Chọn schedule driver 2 (ví dụ: schedule 4)
4. Click "Bắt đầu tuyến"
5. Kiểm tra console:
   ✅ routeId: 2, routeName: 'Tuyến Gò Vấp - Sáng'
   ✅ 5 stops khác hoàn toàn
6. Map phải hiển thị markers tại Gò Vấp (KHÁC driver 1)
```

### Test Driver 3
```
1. Logout driver2
2. Login: driver3 / driver123
3. Chọn schedule driver 3 (ví dụ: schedule 6)
4. Click "Bắt đầu tuyến"
5. Kiểm tra console:
   ✅ routeId: 6, routeName: 'Tuyến Thủ Đức - Sáng'
   ✅ 5 stops khác driver 1 & 2
6. Map phải hiển thị markers tại Thủ Đức
```

## Bước 5: Test Bus Animation

Mỗi driver khi "Bắt đầu tuyến":
- ✅ Icon xe bus phải xuất hiện
- ✅ Xe chạy theo OSRM route (không xuyên nhà)
- ✅ Xe dừng đúng các điểm dừng theo thứ tự
- ✅ Thời gian đến được tính tự động

## 🐛 Debug WebSocket Error

Nếu thấy `❌ WebSocket error: installHook.js:1`:

1. **Kiểm tra backend console log:**
   ```
   Phải có: 🔌 WebSocket server đang chạy tại ws://localhost:5000
   ```

2. **Frontend sẽ fallback gracefully:**
   ```
   Console log: ⚠️ WebSocket not available, using localStorage only
   ```

3. **App vẫn hoạt động bình thường** (chỉ mất real-time sync)

## ✅ Expected Results

- ✅ **3 drivers** → 3 routes khác nhau
- ✅ **Mỗi route** → stops khác nhau (lat/lng khác)
- ✅ **Map render** đúng tuyến cho mỗi driver
- ✅ **KHÔNG có hard-code** route nào
- ✅ **100% data từ database**

## 🎯 Success Criteria

| Driver | Schedule | Route ID | Route Name | Stops Count | Map Location |
|--------|----------|----------|------------|-------------|--------------|
| 1      | 24       | 1        | Quận 1     | 4           | Quận 1       |
| 2      | 4        | 2        | Gò Vấp     | 5           | Gò Vấp       |
| 3      | 6        | 6        | Thủ Đức    | 5           | Thủ Đức      |
