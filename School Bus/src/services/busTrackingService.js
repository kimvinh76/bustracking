// Frontend WebSocket service cho real-time bus tracking
class BusTrackingService {
  constructor() {
    this.ws = null;
    this.clientId = null;
    this.role = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.isConnected = false;
    this.heartbeatInterval = null;
  }

  connect(role, userId = null) {
    this.role = role;
    this.clientId = `${role}_${userId || Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.ws = new WebSocket('ws://localhost:5000');

      this.ws.onopen = () => {
        console.log(`🔌 WebSocket connected as ${role}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Register client
        this.send({
          type: 'register_client',
          clientId: this.clientId,
          role: this.role,
          userId: userId
        });

        // Request current status
        this.send({
          type: 'request_current_status'
        });

        // Start heartbeat to keep connection alive
        this.startHeartbeat();

        // Trigger connected event
        this.emit('connected', { role, clientId: this.clientId });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log(`🔌 WebSocket disconnected`);
        this.isConnected = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        
        // Auto reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... attempt ${this.reconnectAttempts}`);
            this.connect(this.role, userId);
          }, this.reconnectDelay);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send:', data);
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'bus_status_update':
        this.emit('busStatusUpdate', data.data);
        break;
      
      case 'incident_alert':
        this.emit('incidentAlert', data.data);
        break;

      default:
        console.log('📨 Received message:', data);
    }
  }

  // Driver methods - chỉ driver mới được call
  updateDriverStatus(status) {
    if (this.role !== 'driver') {
      console.warn('⚠️ Only driver can update status');
      return;
    }

    this.send({
      type: 'driver_status_update',
      status: status
    });
  }

  // Event system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Event callback error for ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Utility methods
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      clientId: this.clientId,
      role: this.role,
      readyState: this.ws ? this.ws.readyState : -1
    };
  }
}

// Export singleton instance
export default new BusTrackingService();