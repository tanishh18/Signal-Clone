/**
 * Centralized WebSocket client for real-time messaging and events.
 * Connects to `/ws?token=<JWT>` per Phase 6 specification.
 */

type WebSocketStatus = "disconnected" | "connecting" | "connected" | "error";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler<T = any> = (data: T) => void;
type StatusHandler = (status: WebSocketStatus) => void;

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

class SignalWebSocketClient {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private status: WebSocketStatus = "disconnected";
  private eventListeners: Map<string, Set<EventHandler>> = new Map();
  private statusListeners: Set<StatusHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isExplicitDisconnect = false;

  public getStatus(): WebSocketStatus {
    return this.status;
  }

  public onStatusChange(handler: StatusHandler): () => void {
    this.statusListeners.add(handler);
    handler(this.status);
    return () => {
      this.statusListeners.delete(handler);
    };
  }

  private setStatus(newStatus: WebSocketStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((fn) => fn(newStatus));
    }
  }

  public connect(token: string) {
    if (!token) return;

    // If already connected with the same token, do nothing
    if (
      this.socket &&
      this.token === token &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    // Clean up previous connection if exists
    this.disconnect();

    this.token = token;
    this.isExplicitDisconnect = false;
    this.setStatus("connecting");

    try {
      const url = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus("connected");
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const type = payload.type;
          const data = payload.data !== undefined ? payload.data : payload;

          // Notify type-specific listeners
          const listeners = this.eventListeners.get(type);
          if (listeners) {
            listeners.forEach((fn) => fn(data));
          }

          // Notify wildcard listeners
          const allListeners = this.eventListeners.get("*");
          if (allListeners) {
            allListeners.forEach((fn) => fn(payload));
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      this.socket.onerror = () => {
        this.setStatus("error");
      };

      this.socket.onclose = (event) => {
        this.socket = null;
        this.setStatus("disconnected");

        // Do not reconnect on explicit logout or policy violation (auth failure)
        if (this.isExplicitDisconnect || event.code === 1008) {
          return;
        }

        this.scheduleReconnect();
      };
    } catch (err) {
      console.error("WebSocket connection initiation error:", err);
      this.setStatus("error");
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isExplicitDisconnect || !this.token) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }

      this.reconnectTimer = setTimeout(() => {
        if (!this.isExplicitDisconnect && this.token) {
          this.connect(this.token);
        }
      }, delay);
    } else {
      this.setStatus("error");
    }
  }

  public disconnect() {
    this.isExplicitDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // Ignore close error
      }
      this.socket = null;
    }
    this.token = null;
    this.reconnectAttempts = 0;
    this.setStatus("disconnected");
  }

  public send(type: string, data: Record<string, unknown> = {}): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected; cannot send event:", type);
      return false;
    }

    try {
      this.socket.send(
        JSON.stringify({
          type,
          data,
          ...data, // also spread at top-level for maximum schema compatibility
        })
      );
      return true;
    } catch (err) {
      console.error("Failed to send WebSocket message:", err);
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public on<T = any>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(handler as EventHandler);

    return () => {
      this.off(eventType, handler as EventHandler);
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public off<T = any>(eventType: string, handler: EventHandler<T>) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(handler as EventHandler);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventType);
      }
    }
  }
}

export const signalWs = new SignalWebSocketClient();
