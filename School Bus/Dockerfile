# --- File: School Bus/Dockerfile ---
# Sửa: Dùng Node 20 (Vite yêu cầu Node 20.19+ hoặc 22.12+)
FROM node:20-alpine

# Thêm build tools cần thiết cho Alpine Linux (để build native modules như rollup)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package.json (của React) ở thư mục gốc vào
COPY package*.json ./

# Xóa cache và cài sạch thư viện cho React (bao gồm optional dependencies)
RUN npm cache clean --force && \
    rm -rf node_modules package-lock.json && \
    npm install --include=optional

# Copy toàn bộ code (src, public, index.html...) vào
# Nhờ file .dockerignore ở trên, nó sẽ tự động BỎ QUA thư mục backend
COPY . .

# Mở cổng 5173
EXPOSE 5173

# Chạy Vite với host 0.0.0.0 để máy ngoài truy cập được
CMD ["npm", "run", "dev", "--", "--host"]