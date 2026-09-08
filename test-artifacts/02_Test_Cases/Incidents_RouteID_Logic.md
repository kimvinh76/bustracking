# Incidents - Route ID Logic & Business Rules

## 📋 Tổng quan

File này giải thích logic xử lý `route_id` khi tạo incident và khi nào cần/không cần `route_id`.

---

## 🔄 Logic tự động điền `route_id` (Đã cải tiến)

### Flow xử lý khi tạo incident:

```
1. Driver/Frontend gửi incident data (có thể có hoặc không có route_id)
   ↓
2. Backend kiểm tra:
   - Có route_id trong request? 
     → YES: Sử dụng route_id đó
     → NO: Chuyển sang bước 3
   ↓
3. Tìm schedule đang active (status='in_progress') trong ngày hôm nay
   ↓
4. Match schedule với driver_id HOẶC bus_id
   ↓
5. Nếu tìm thấy schedule active:
     → Tự động lấy route_id từ schedule
   Nếu không tìm thấy:
     → route_id = NULL
   ↓
6. Lưu incident vào database
```

### Code implementation:

```javascript
// Backend: services/incidentService.js

// Tự động lấy route_id từ schedule đang active
let finalRouteId = route_id;

if (!finalRouteId) {
  const today = new Date().toISOString().split('T')[0];
  const activeSchedules = await ScheduleModel.findByDateAndStatus(today, 'in_progress');
  
  const matchedSchedule = activeSchedules.find(
    s => s.driver_id === driver_id || s.bus_id === bus_id
  );
  
  if (matchedSchedule) {
    finalRouteId = matchedSchedule.route_id;
  }
}
```

---

## ✅ Khi nào `route_id` = NULL là HỢP LÝ?

### Trường hợp 1: Sự cố NGOÀI lịch trình

**Ví dụ**:
- Xe hỏng tại bãi đỗ (chưa xuất bến)
- Tai nạn khi đang về gara sau ca làm việc
- Sự cố khi xe đang bảo trì, không hoạt động

**Dữ liệu mẫu**:
```json
{
  "driver_id": 1,
  "bus_id": 1,
  "route_id": null,
  "incident_type": "mechanical",
  "description": "Xe hỏng lốp tại bãi đỗ, cần thay lốp trước khi xuất bến",
  "severity": "high"
}
```

### Trường hợp 2: Sự cố không liên quan tuyến

**Ví dụ**:
- Driver báo bệnh, không thể lái xe
- Xe bị trộm/phá hoại khi đậu qua đêm
- Thiếu giấy tờ, đăng kiểm hết hạn

**Dữ liệu mẫu**:
```json
{
  "driver_id": 2,
  "bus_id": 3,
  "route_id": null,
  "incident_type": "other",
  "description": "Tài xế bị ốm đột ngột, cần tìm người thay thế",
  "severity": "critical"
}
```

---

## ❌ Khi nào `route_id` = NULL là KHÔNG HỢP LÝ?

### Trường hợp 1: Driver đang chạy tuyến

**Vấn đề**: Driver đang chạy tuyến Gò Vấp - Sáng, gặp kẹt xe nhưng không gửi route_id.

**Logic cũ** (trước khi cải tiến):
```json
{
  "driver_id": 2,
  "bus_id": 3,
  "route_id": null,  // ❌ THIẾU THÔNG TIN QUAN TRỌNG
  "incident_type": "traffic",
  "description": "Kẹt xe nghiêm trọng"
}
```

**Logic mới** (sau khi cải tiến):
```json
// Frontend gửi không có route_id
{
  "driver_id": 2,
  "bus_id": 3,
  "incident_type": "traffic",
  "description": "Kẹt xe nghiêm trọng"
}

// Backend TỰ ĐỘNG điền route_id từ schedule đang active
{
  "driver_id": 2,
  "bus_id": 3,
  "route_id": 2,  // ✅ Tự động lấy từ schedule
  "incident_type": "traffic",
  "description": "Kẹt xe nghiêm trọng"
}
```

---

## 🧪 Test Cases

### Test Case 1: Tạo incident KHI ĐANG CHẠY TUYẾN (không gửi route_id)

**Pre-condition**:
- Schedule ID=4 đang có status='in_progress'
- Driver ID=2, Bus ID=3, Route ID=2
- Date = hôm nay

**Request**:
```json
POST /api/incidents/create
{
  "driver_id": 2,
  "bus_id": 3,
  "incident_type": "traffic",
  "description": "Kẹt xe tại ngã tư Hàng Xanh"
}
```

**Expected**:
- Status: 201 Created
- Response có `route_id: 2` (tự động lấy từ schedule)

**SQL Verify**:
```sql
SELECT * FROM incidents 
WHERE driver_id = 2 
ORDER BY created_at DESC 
LIMIT 1;
-- Kỳ vọng: route_id = 2
```

---

### Test Case 2: Tạo incident NGOÀI lịch trình (không có schedule active)

**Pre-condition**:
- Không có schedule nào có status='in_progress' cho driver_id=1, bus_id=1

**Request**:
```json
POST /api/incidents/create
{
  "driver_id": 1,
  "bus_id": 1,
  "incident_type": "mechanical",
  "description": "Xe hỏng lốp tại bãi đỗ"
}
```

**Expected**:
- Status: 201 Created
- Response có `route_id: null` (không tìm thấy schedule active)

**SQL Verify**:
```sql
SELECT * FROM incidents 
WHERE driver_id = 1 
ORDER BY created_at DESC 
LIMIT 1;
-- Kỳ vọng: route_id = NULL
```

---

### Test Case 3: Tạo incident VỚI route_id cụ thể

**Request**:
```json
POST /api/incidents/create
{
  "driver_id": 2,
  "bus_id": 3,
  "route_id": 4,
  "incident_type": "traffic",
  "description": "Kẹt xe tại tuyến Gò Vấp - Chiều"
}
```

**Expected**:
- Status: 201 Created
- Response có `route_id: 4` (sử dụng route_id từ request, KHÔNG tìm schedule)

---

### Test Case 4: Tạo incident với route_id không tồn tại (Negative)

**Request**:
```json
POST /api/incidents/create
{
  "driver_id": 2,
  "bus_id": 3,
  "route_id": 999,
  "incident_type": "traffic",
  "description": "Test"
}
```

**Expected**:
- Status: 400 Bad Request
- Message: "Không tìm thấy tuyến đường"

---

## 📊 Database Schema

```sql
CREATE TABLE `incidents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `driver_id` int(11) NOT NULL,
  `bus_id` int(11) NOT NULL,
  `route_id` int(11) DEFAULT NULL,  -- ✅ Cho phép NULL
  `incident_type` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `status` enum('reported','in_progress','resolved','closed') DEFAULT 'reported',
  -- ...
  FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE SET NULL
);
```

**Thiết kế hợp lý vì**:
- `route_id` có thể NULL → cho phép sự cố ngoài tuyến
- Foreign Key ON DELETE SET NULL → khi xóa route, incident không bị xóa

---

## 🎯 Kết luận

### Logic CŨ (trước khi cải tiến):
- ❌ Frontend phải luôn gửi `route_id`
- ❌ Nếu quên gửi → mất thông tin tuyến đường
- ❌ Driver phải thủ công chọn route khi báo cáo

### Logic MỚI (sau khi cải tiến):
- ✅ Frontend có thể BỎ QUA `route_id`
- ✅ Backend TỰ ĐỘNG lấy từ schedule đang active
- ✅ Nếu không có schedule active → `route_id` = NULL (hợp lý)
- ✅ Driver chỉ cần nhấn "Báo cáo sự cố" mà không cần chọn route

### Lợi ích:
1. **Giảm lỗi người dùng**: Driver không cần nhớ/chọn route
2. **Tự động hóa**: Backend thông minh hơn, tự điền thông tin
3. **Linh hoạt**: Vẫn cho phép sự cố ngoài tuyến (route_id = null)
4. **Dữ liệu chính xác**: Route ID luôn khớp với schedule đang chạy

---

## 📝 Checklist cho Frontend Developer

Khi implement form báo cáo incident:

- [ ] Không bắt buộc user nhập/chọn route_id
- [ ] Gửi driver_id, bus_id lên backend
- [ ] Backend sẽ tự động xử lý route_id
- [ ] Hiển thị route_name trong response (để user biết incident thuộc tuyến nào)
- [ ] Cho phép user OVERRIDE route_id nếu cần (optional field)

**UI Mockup**:
```
┌─────────────────────────────────┐
│ Báo cáo sự cố                   │
├─────────────────────────────────┤
│ Loại sự cố: [Dropdown]          │ ← Required
│ Mô tả: [Textarea]               │ ← Required
│ Mức độ: [Dropdown]              │ ← Default: medium
│                                 │
│ [x] Tự động xác định tuyến      │ ← Checkbox (default ON)
│ Tuyến đường: [Quận 1 - Sáng]    │ ← Auto-fill, disabled nếu checkbox ON
│                                 │
│ [ Gửi báo cáo ]                 │
└─────────────────────────────────┘
```
