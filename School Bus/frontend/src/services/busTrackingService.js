// Dịch vụ WebSocket phía FE, ĐÃ NÂNG CẤP LÊN SOCKET.IO


import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // Địa chỉ backend server (Socket.IO dùng HTTP handshake trước)

class BusTrackingService {
  constructor() {
    this.socket = null;
    this.role = null;
    this.tripId = null;
    this._listenersRegistered = false;
  }

  // Khởi tạo và kết nối tới server
  connect(role, tripId) {
    this.role = role;
    this.tripId = tripId;

    // Nếu socket đã tồn tại và đang kết nối: chỉ cần join lại đúng room (tripId mới)
    if (this.socket && this.socket.connected) {
      if (this.tripId) this.socket.emit('join_trip', { tripId: this.tripId });
      return;
    }

    // Nếu socket đã tồn tại nhưng chưa connected (hoặc đang reconnect): cứ dùng lại
    if (!this.socket) {
      // Khởi tạo socket. `autoConnect: false` để ta kiểm soát thời điểm kết nối
      this.socket = io(SOCKET_URL, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
      this._listenersRegistered = false;
    }

    if (this.socket && !this._listenersRegistered) {
      // Lắng nghe các sự kiện mặc định của Socket.IO
      this.socket.on('connect', () => {
        console.log(`Socket.IO connected as ${this.role} with id ${this.socket.id}`);
        
        // SAU KHI KẾT NỐI, THAM GIA PHÒNG THEO DÕI CHUYẾN ĐI
        if (this.tripId) this.socket.emit('join_trip', { tripId: this.tripId });
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`Socket.IO disconnected: ${reason}`);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });

      this._listenersRegistered = true;
    }

    // Bắt đầu kết nối
    this.socket.connect();
  }

  // Ngắt kết nối
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // === CÁC PHƯƠNG THỨC GIAO TIẾP VỚI SERVER ===

  // Driver cập nhật trạng thái
  updateDriverStatus(status) {
    if (this.role !== 'driver' || !this.socket || !this.tripId) {
      console.warn(' Only driver can update status, or socket not connected/tripId not set.');
      return;
    }
    // Gửi sự kiện lên server, kèm theo tripId để server biết gửi vào phòng nào
    this.socket.emit('driver_status_update', { tripId: this.tripId, status });
  }

  // === HỆ THỐNG LẮNG NGHE SỰ KIỆN (EVENT LISTENER) ===
  // Các component trong app sẽ dùng các hàm này

  // Lắng nghe một sự kiện từ server
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Hủy lắng nghe một sự kiện
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Helper để lấy trạng thái kết nối
  getConnectionStatus() {
    return {
      isConnected: this.socket ? this.socket.connected : false,
      socketId: this.socket ? this.socket.id : null,
      role: this.role,
      tripId: this.tripId
    };
  }
}

// Xuất một thực thể duy nhất (singleton) để toàn bộ app dùng chung
export default new BusTrackingService();