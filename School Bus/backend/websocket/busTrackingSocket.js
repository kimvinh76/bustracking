// WebSocket server cho realtime tracking, ĐÃ NÂNG CẤP LÊN SOCKET.IO
// Ý NGHĨA CÁC THAY ĐỔI:
// - Sử dụng 'socket.io' thay cho 'ws' để có các tính năng cao cấp hơn.
// - Bỏ quản lý client thủ công: Socket.IO tự quản lý kết nối.
// - Sử dụng Rooms: Mỗi chuyến đi (`tripId`) là một "phòng". Client (tài xế, phụ huynh) sẽ "tham gia" vào phòng này.
// - Gửi tin nhắn theo mục tiêu: Cập nhật vị trí chỉ được gửi đến các client trong cùng một phòng, thay vì gửi cho tất cả mọi người.
// - Tự động giữ kết nối: Socket.IO tự xử lý ping/pong và kết nối lại.

import { Server } from 'socket.io';
import RouteService from '../services/routeService.js';

class BusTrackingSocket {
  constructor() {
    this.io = null;
    // Quản lý trạng thái của từng chuyến đi riêng biệt
    this.tripStatuses = new Map(); 
  }

  // Khởi tạo Socket.IO server
  init(server) {
    // Cấu hình CORS để cho phép client từ frontend kết nối vào
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:5173", // Địa chỉ của frontend
        methods: ["GET", "POST"]
      }
    });

    // Lắng nghe sự kiện khi có một client mới kết nối
    this.io.on('connection', (socket) => {
      console.log(`New client connected: ${socket.id}`);

      // 1. THAM GIA PHÒNG (ROOM)
      // Client sẽ gửi sự kiện 'join_trip' với tripId để tham gia vào phòng theo dõi tương ứng
      socket.on('join_trip', ({ tripId }) => {
        if (!tripId) return;
        
        // Cho socket này tham gia vào phòng có tên là tripId
        socket.join(tripId);
        console.log(`Client ${socket.id} joined trip room: ${tripId}`);

        // Gửi trạng thái hiện tại của chuyến đi cho client vừa tham gia
        const currentStatus = this.tripStatuses.get(tripId) || this.getInitialStatus(tripId);
        socket.emit('bus_status_update', currentStatus);
      });

      // 2. TÀI XẾ CẬP NHẬT TRẠNG THÁI
      // Lắng nghe sự kiện cập nhật từ tài xế
      socket.on('driver_status_update', async ({ tripId, status }) => {
        if (!tripId) return;

        let etaNextStop = null;

        // Tính toán ETA bằng OSRM nếu có đủ thông tin vị trí và điểm đến tiếp theo
        if (status.currentPosition && status.nextStop && status.nextStop.lat && status.nextStop.lng) {
            try {
                const durationInSeconds = await RouteService.getEtaOSRM(
                    status.currentPosition.lat, status.currentPosition.lng,
                    status.nextStop.lat, status.nextStop.lng
                );
                // etaNextStop = Math.ceil(durationInSeconds / 60); // Đổi ra phút
                // Hoặc giữ nguyên giây nếu FE cần, user yêu cầu "Math.ceil(durationInSeconds / 60)" logic trong prompt
                etaNextStop = Math.ceil(durationInSeconds / 60); 
            } catch (err) {
                console.error("Error calculating ETA:", err);
            }
        }

        // Lấy trạng thái cũ, kết hợp với trạng thái mới và cập nhật
        const currentStatus = this.tripStatuses.get(tripId) || this.getInitialStatus(tripId);
        const newStatus = {
          ...currentStatus,
          ...status,
          etaNextStop: etaNextStop, // Thêm dữ liệu ETA vào status
          lastUpdate: new Date()
        };
        this.tripStatuses.set(tripId, newStatus);

        // Gửi cập nhật đến TẤT CẢ client trong cùng một phòng (tripId)
        this.io.to(tripId).emit('bus_status_update', newStatus);
        console.log(`Status updated for trip ${tripId}:`, newStatus);
      });
      
      // 3. XỬ LÝ KHI CLIENT NGẮT KẾT NỐI
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        // Socket.IO tự động dọn dẹp client ra khỏi các phòng
      });
    });

    console.log('Socket.IO server initialized');
  }

  // API để các phần khác của backend (ví dụ: REST endpoint) có thể cập nhật trạng thái
  updateBusStatus(tripId, status) {
    if (!tripId) return;

    const currentStatus = this.tripStatuses.get(tripId) || this.getInitialStatus(tripId);
    const newStatus = {
      ...currentStatus,
      ...status,
      lastUpdate: new Date()
    };
    this.tripStatuses.set(tripId, newStatus);
    
    // Gửi cập nhật đến phòng tương ứng
    this.io.to(tripId).emit('bus_status_update', newStatus);
    console.log(`External status update for trip ${tripId}`);
  }

  // Helper để tạo trạng thái ban đầu cho một chuyến đi mới
  getInitialStatus(tripId) {
    return {
      tripId: tripId,
      isRunning: false,
      currentPosition: null,
      driverStatus: "not_started",
      lastUpdate: null
    };
  }
}

export default new BusTrackingSocket();