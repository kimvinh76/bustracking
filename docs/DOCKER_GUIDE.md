# Docker Guide

## Yêu cầu
Docker Desktop đang chạy

## Lệnh cơ bản

```bash
# Khởi động
docker-compose up --build

# Chạy background
docker-compose up -d

# Dừng
docker-compose down

# Xóa volumes (mất data)
docker-compose down -v
```

## Rebuild khi sửa code

```bash
# Backend
docker-compose up --build server-backend

# Frontend (hot reload tự động)
docker-compose restart client-frontend
```

## Debug

```bash
# Xem logs
docker-compose logs -f

# Logs của 1 service
docker-compose logs -f server-backend

# Vào container
docker exec -it school-bus-backend sh

# Kiểm tra trạng thái
docker-compose ps
```

## Truy cập

Frontend: http://localhost:5173  
Backend API: http://localhost:5000/api  
MySQL: localhost:3306

## Xử lý lỗi

```bash
# Port bị chiếm
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Build lại từ đầu
docker-compose down
docker-compose build --no-cache
docker-compose up

# Database không khởi tạo
docker-compose down -v
docker-compose up --build
```

## Lưu ý

MySQL cần 30s để khởi động lần đầu  
Frontend có hot reload, backend cần rebuild  
Data MySQL lưu trong volume mysql_data
