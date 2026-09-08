// Dịch vụ WebSocket phía FE, ĐÃ NÂNG CẤP LÊN SOCKET.IO


import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

class BusTrackingService {
  constructor() {
    this.socket = null;
    this.role = null;
    this.tripId = null;
    this._listenersRegistered = false;
  }

  // Khởi tạo và kết nối tới server
  connect(role, tripId) {
    const normalizedTripId = tripId != null ? String(tripId) : null;
    const prevTripId = this.tripId;
    this.role = role;
    this.tripId = normalizedTripId;

    // Nếu socket đã tồn tại và đang kết nối: chỉ cần join lại đúng room (tripId mới)
    if (this.socket && this.socket.connected) {
      if (prevTripId && prevTripId !== this.tripId) {
        this.socket.emit('leave_trip', { tripId: prevTripId });
      }
      if (this.tripId) this.socket.emit('join_trip', { tripId: this.tripId });
      return;
    }

    // Nếu socket đã tồn tại nhưng chưa connected (hoặc đang reconnect): cứ dùng lại
    if (!this.socket) {
      // Khởi tạo socket. `autoConnect: false` để ta kiểm soát thời điểm kết nối
      this.socket = io(SOCKET_URL, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
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

  /** Rời room — giữ socket cho các trang khác (admin/parent). */
  leaveTrip(tripId) {
    const id = tripId != null ? String(tripId) : this.tripId;
    if (this.socket?.connected && id) {
      this.socket.emit("leave_trip", { tripId: id });
    }
    if (id && this.tripId === id) {
      this.tripId = null;
    }
  }

  disconnect() {
    if (this.socket) {
      if (this.tripId) this.leaveTrip(this.tripId);
      this.socket.disconnect();
      this.socket = null;
      this.tripId = null;
      this.role = null;
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

  // Driver điều khiển mô phỏng từ backend (start/pause/resume/stop)
  controlTrip(action, payload = {}) {
    if (this.role !== 'driver' || !this.socket || !this.tripId) {
      console.warn(' Only driver can control trip, or socket not connected/tripId not set.');
      return;
    }
    // Gửi lệnh điều khiển để backend phát vị trí đồng bộ cho mọi client
    this.socket.emit('driver_trip_control', {
      tripId: this.tripId,
      action,
      ...payload
    });
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