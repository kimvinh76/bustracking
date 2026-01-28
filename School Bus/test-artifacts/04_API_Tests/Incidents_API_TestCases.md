# Incidents API - Test Cases (Postman)

## Base URL
```
http://localhost:3000/api
```

---

## Test Case 1: Tạo incident mới (Driver báo cáo)

**Endpoint**: `POST /incidents/create`

**Request Body**:
```json
{
  "driver_id": 1,
  "bus_id": 1,
  "route_id": 1,
  "incident_type": "traffic",
  "description": "Kẹt xe nghiêm trọng trên đường Điện Biên Phủ",
  "severity": "medium",
  "status": "reported",
  "location": "Ngã tư Điện Biên Phủ - Xô Viết Nghệ Tĩnh",
  "latitude": 10.7967,
  "longitude": 106.7036
}
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "message": "Báo cáo sự cố đã được tạo thành công",
  "incident": {
    "id": 3,
    "driver_id": 1,
    "bus_id": 1,
    "route_id": 1,
    "incident_type": "traffic",
    "description": "Kẹt xe nghiêm trọng trên đường Điện Biên Phủ",
    "severity": "medium",
    "status": "reported",
    "location": "Ngã tư Điện Biên Phủ - Xô Viết Nghệ Tĩnh",
    "latitude": 10.7967,
    "longitude": 106.7036,
    "resolution_notes": null,
    "resolved_at": null,
    "created_at": "2026-01-28T10:30:00.000Z",
    "driver_name": "Nguyễn Văn A",
    "bus_number": "BUS-04",
    "license_plate": "51K-123.45",
    "route_name": "Tuyến Quận 1 - Sáng"
  }
}
```

**Assertions**:
- ✅ Status code = 201
- ✅ `success` = true
- ✅ `incident.id` tồn tại
- ✅ `incident.status` = "reported"
- ✅ `incident.resolution_notes` = null
- ✅ `incident.resolved_at` = null

---

## Test Case 2: Tạo incident thiếu thông tin bắt buộc (Negative)

**Endpoint**: `POST /incidents/create`

**Request Body**:
```json
{
  "driver_id": 1,
  "incident_type": "traffic"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Thiếu thông tin bắt buộc: driver_id, bus_id, incident_type, description"
}
```

**Assertions**:
- ✅ Status code = 400
- ✅ `success` = false
- ✅ Message chứa "Thiếu thông tin bắt buộc"

---

## Test Case 3: Tạo incident với severity không hợp lệ (Negative)

**Endpoint**: `POST /incidents/create`

**Request Body**:
```json
{
  "driver_id": 1,
  "bus_id": 1,
  "incident_type": "traffic",
  "description": "Test invalid severity",
  "severity": "super_high"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Severity không hợp lệ (low/medium/high/critical)"
}
```

---

## Test Case 4: Lấy tất cả incidents (Admin)

**Endpoint**: `GET /incidents`

**Query Params**: (optional)
- `limit`: 50
- `offset`: 0

**Expected Response** (200 OK):
```json
{
  "success": true,
  "incidents": [
    {
      "id": 2,
      "driver_id": 2,
      "bus_id": 3,
      "route_id": 2,
      "incident_type": "traffic",
      "description": "Giao thông kẹt xe nghiêm trọng",
      "severity": "medium",
      "status": "reported",
      "resolution_notes": null,
      "resolved_at": null,
      "created_at": "2026-01-14T12:27:12.000Z",
      "driver_name": "Trần Thị B",
      "bus_number": "BUS-03",
      "route_name": "Tuyến Gò Vấp - Sáng"
    },
    {
      "id": 1,
      "driver_id": 1,
      "bus_id": 1,
      "route_id": 1,
      "incident_type": "traffic",
      "description": "Kẹt xe trên đường",
      "severity": "medium",
      "status": "reported",
      "resolution_notes": null,
      "resolved_at": null,
      "created_at": "2026-01-03T05:38:48.000Z",
      "driver_name": "Nguyễn Văn A",
      "bus_number": "BUS-04",
      "route_name": "Tuyến Quận 1 - Sáng"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

**Assertions**:
- ✅ Status code = 200
- ✅ `success` = true
- ✅ `incidents` là array
- ✅ Có `pagination` object

---

## Test Case 5: Lấy incidents theo status

**Endpoint**: `GET /incidents?status=reported`

**Expected Response** (200 OK):
```json
{
  "success": true,
  "incidents": [
    {
      "id": 2,
      "status": "reported",
      "resolution_notes": null,
      "resolved_at": null,
      ...
    },
    {
      "id": 1,
      "status": "reported",
      "resolution_notes": null,
      "resolved_at": null,
      ...
    }
  ],
  "pagination": {...}
}
```

**Assertions**:
- ✅ Tất cả incidents trả về có `status` = "reported"
- ✅ `resolution_notes` và `resolved_at` = null

---

## Test Case 6: Lấy incidents theo severity

**Endpoint**: `GET /incidents?severity=medium`

**Expected Response** (200 OK):
```json
{
  "success": true,
  "incidents": [
    {
      "severity": "medium",
      ...
    }
  ],
  "pagination": {...}
}
```

---

## Test Case 7: Lấy incidents theo route_id

**Endpoint**: `GET /incidents/route/1`

**Query Params**: (optional)
- `status`: "reported,in_progress" (default)

**Expected Response** (200 OK):
```json
{
  "success": true,
  "incidents": [
    {
      "id": 1,
      "route_id": 1,
      "status": "reported",
      ...
    }
  ]
}
```

**Assertions**:
- ✅ Tất cả incidents có `route_id` = 1
- ✅ Limit tự động = 10 incidents

---

## Test Case 8: Cập nhật status thành "in_progress" (Admin)

**Endpoint**: `PUT /incidents/1/status`

**Request Body**:
```json
{
  "status": "in_progress",
  "admin_notes": "Đã liên hệ tài xế, đang theo dõi tình hình"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái sự cố"
}
```

**Sau đó GET /incidents/1 để verify**:
```json
{
  "id": 1,
  "status": "in_progress",
  "resolution_notes": "Đã liên hệ tài xế, đang theo dõi tình hình",
  "resolved_at": null
}
```

**Assertions**:
- ✅ Status code = 200
- ✅ `status` đã đổi thành "in_progress"
- ✅ `resolution_notes` có giá trị từ `admin_notes`
- ✅ `resolved_at` vẫn = null (chưa resolve)

---

## Test Case 9: Cập nhật status thành "resolved" (Admin) ⭐

**Endpoint**: `PUT /incidents/1/status`

**Request Body**:
```json
{
  "status": "resolved",
  "admin_notes": "Xe đã đi qua khu vực kẹt xe, tuyến hoạt động bình thường"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái sự cố"
}
```

**Sau đó GET /incidents/1 để verify**:
```json
{
  "id": 1,
  "status": "resolved",
  "resolution_notes": "Xe đã đi qua khu vực kẹt xe, tuyến hoạt động bình thường",
  "resolved_at": "2026-01-28T10:45:00.000Z"
}
```

**Assertions**:
- ✅ Status code = 200
- ✅ `status` = "resolved"
- ✅ `resolution_notes` có giá trị
- ✅ **`resolved_at` ≠ null** (đã có timestamp)

---

## Test Case 10: Cập nhật status thành "closed" (Admin) ⭐

**Endpoint**: `PUT /incidents/1/status`

**Request Body**:
```json
{
  "status": "closed",
  "admin_notes": "Sự cố đã được xử lý hoàn toàn và đóng"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái sự cố"
}
```

**Sau đó GET /incidents/1 để verify**:
```json
{
  "id": 1,
  "status": "closed",
  "resolution_notes": "Sự cố đã được xử lý hoàn toàn và đóng",
  "resolved_at": "2026-01-28T10:50:00.000Z"
}
```

**Assertions**:
- ✅ `status` = "closed"
- ✅ **`resolved_at` ≠ null**

---

## Test Case 11: Cập nhật status không hợp lệ (Negative)

**Endpoint**: `PUT /incidents/1/status`

**Request Body**:
```json
{
  "status": "pending"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Trạng thái không hợp lệ"
}
```

**Assertions**:
- ✅ Status code = 400
- ✅ Message chứa "không hợp lệ"

---

## Test Case 12: Cập nhật incident không tồn tại (Negative)

**Endpoint**: `PUT /incidents/999999/status`

**Request Body**:
```json
{
  "status": "resolved",
  "admin_notes": "Test"
}
```

**Expected Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Không tìm thấy sự cố"
}
```

**Assertions**:
- ✅ Status code = 404
- ✅ Message = "Không tìm thấy sự cố"

---

## Summary: Khi nào `resolution_notes` và `resolved_at` có dữ liệu?

| Action | `resolution_notes` | `resolved_at` |
|--------|-------------------|---------------|
| Tạo mới incident (POST /incidents/create) | NULL | NULL |
| Update status → "in_progress" | admin_notes (nếu có) | NULL |
| Update status → "resolved" | **admin_notes** | **Timestamp hiện tại** |
| Update status → "closed" | **admin_notes** | **Timestamp hiện tại** |

**Kết luận**:
- ✅ Logic hiện tại **ĐÚNG**
- ✅ Chỉ khi Admin resolve/close incident thì mới fill `resolved_at`
- ✅ `resolution_notes` được set từ `admin_notes` trong request body

---

## Postman Collection Setup

### Variables (Environment)
```json
{
  "base_url": "http://localhost:3000/api",
  "driver_id": "1",
  "bus_id": "1",
  "route_id": "1"
}
```

### Pre-request Script (optional - để log request)
```javascript
console.log("Request URL:", pm.request.url.toString());
console.log("Request Body:", pm.request.body.raw);
```

### Tests Script (cho mọi request)
```javascript
// Test Case: Status code is 200/201
pm.test("Status code is OK", function () {
    pm.expect([200, 201]).to.include(pm.response.code);
});

// Test Case: Response has success field
pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});

// Test Case: Response time < 1000ms
pm.test("Response time is less than 1000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});
```
