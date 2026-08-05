// Real-time Event Hub using BroadcastChannel & CustomEvent fallback
type SocketCallback = (data: any) => void;

class RealtimeSocketHub {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<SocketCallback>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('innkeeper_module4_events');
      this.channel.onmessage = (event) => {
        const { type, payload } = event.data;
        this.notifyListeners(type, payload);
      };
    }
  }

  public emit(type: string, payload: any) {
    // Notify local listeners
    this.notifyListeners(type, payload);

    // Broadcast across browser tabs/windows
    if (this.channel) {
      this.channel.postMessage({ type, payload });
    }
  }

  public subscribe(type: string, callback: SocketCallback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  private notifyListeners(type: string, payload: any) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }
  }
}

export const realtimeHub = new RealtimeSocketHub();
