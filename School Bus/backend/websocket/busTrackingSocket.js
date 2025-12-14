// WebSocket server cho real-time bus tracking
import WebSocket, { WebSocketServer } from 'ws';

class BusTrackingSocket {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map để lưu client info
    this.busStatus = {
      isRunning: false,
      currentPosition: null,
      currentStopIndex: 0,
      driverStatus: "not_started", // not_started, in_progress, paused, completed
      tripId: null,
      lastUpdate: null
    };
  }

  init(server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        // Remove client from map when disconnected
        for (const [clientId, client] of this.clients.entries()) {
          if (client.ws === ws) {
            this.clients.delete(clientId);
            console.log(`Client ${clientId} disconnected`);
            break;
          }
        }
      });

      // Send current bus status to new client
      ws.send(JSON.stringify({
        type: 'bus_status_update',
        data: this.busStatus
      }));
    });

    console.log('WebSocket server initialized');
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'register_client':
        // Register client với role (driver, admin, parent)
        this.clients.set(data.clientId, {
          ws: ws,
          role: data.role,
          userId: data.userId
        });
        console.log(`Client registered: ${data.clientId} as ${data.role}`);
        break;

      case 'ping':
        // Respond to heartbeat ping
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'driver_status_update':
        // Chỉ driver mới được update status
        const client = this.getClientByWebSocket(ws);
        if (client && client.role === 'driver') {
          this.busStatus = {
            ...this.busStatus,
            ...data.status,
            lastUpdate: new Date()
          };
          
          // Broadcast tới tất cả clients
          this.broadcast({
            type: 'bus_status_update',
            data: this.busStatus
          });

          console.log('Bus status updated:', this.busStatus);
        }
        break;

      case 'request_current_status':
        // Gửi status hiện tại cho client yêu cầu
        ws.send(JSON.stringify({
          type: 'bus_status_update',
          data: this.busStatus
        }));
        break;
    }
  }

  getClientByWebSocket(ws) {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.ws === ws) {
        return client;
      }
    }
    return null;
  }

  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // API để update từ REST endpoints
  updateBusStatus(status) {
    this.busStatus = {
      ...this.busStatus,
      ...status,
      lastUpdate: new Date()
    };

    this.broadcast({
      type: 'bus_status_update',
      data: this.busStatus
    });
  }
}

export default new BusTrackingSocket();