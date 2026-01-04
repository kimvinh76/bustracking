# 1. Dùng Node version 20 (nhẹ, thống nhất với frontend)
FROM node:20-alpine

# 2. Tạo thư mục làm việc bên trong container
WORKDIR /app

# 3. Copy file package để cài thư viện trước
COPY package*.json ./

# 4. Cài đặt thư viện
RUN npm install

# 5. Copy toàn bộ code backend vào
COPY . .

# 6. Mở cổng 5000
EXPOSE 5000

# 7. Chạy server (Giả sử trong package.json lệnh start là "node index.js" hoặc "node server.js")
CMD ["npm", "start"]