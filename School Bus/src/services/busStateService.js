// Simple shared state service without WebSocket
class BusStateService {
  constructor() {
    this.storageKey = 'bus_tracking_state';
    this.listeners = new Map();
    this.pollInterval = null;
    this.isPolling = false;
  }

  // Lưu trạng thái bus (chỉ driver được phép)
  updateBusState(state, role = 'driver') {
    if (role !== 'driver') {
      console.warn('⚠️ Only driver can update bus state');
      return;
    }

    const currentState = this.getBusState();
    const newState = {
      ...currentState,
      ...state,
      lastUpdate: Date.now(),
      updatedBy: role
    };

    localStorage.setItem(this.storageKey, JSON.stringify(newState));
    console.log('🚌 Bus state updated:', newState);
    
    // Notify listeners
    this.notifyListeners(newState);
  }

  // Lấy trạng thái hiện tại
  getBusState() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading bus state:', error);
    }
    
    // Default state
    return {
      isRunning: false,
      driverStatus: 'not_started', // not_started, in_progress, paused, completed
      currentStopIndex: 0,
      currentPosition: null,
      tripId: null,
      lastUpdate: null,
      updatedBy: null
    };
  }

  // Bắt đầu polling để kiểm tra thay đổi (cho admin và parent)
  startPolling(callback, intervalMs = 1000) {
    if (this.isPolling) return;
    
    this.isPolling = true;
    let lastUpdate = this.getBusState().lastUpdate;
    
    this.pollInterval = setInterval(() => {
      const currentState = this.getBusState();
      
      // Chỉ callback khi có thay đổi
      if (currentState.lastUpdate !== lastUpdate) {
        lastUpdate = currentState.lastUpdate;
        callback(currentState);
      }
    }, intervalMs);
    
    // Call immediately với state hiện tại
    callback(this.getBusState());
  }

  // Dừng polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  // Event system (cho compatibility)
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

  notifyListeners(state) {
    if (this.listeners.has('stateChanged')) {
      this.listeners.get('stateChanged').forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('Event callback error:', error);
        }
      });
    }
  }

  // Reset state (khi cần thiết)
  resetState() {
    localStorage.removeItem(this.storageKey);
  }

  // Check if state is fresh (within last 5 minutes)
  isStateFresh() {
    const state = this.getBusState();
    if (!state.lastUpdate) return false;
    
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - state.lastUpdate) < fiveMinutes;
  }
}

export default new BusStateService();