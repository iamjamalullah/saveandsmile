import { ConnectionStatus, Order, Product, Inquiry } from '../types';
import { ordersApi, productsApi, inquiriesApi } from '../api/endpoints';

type SyncCallback = (data: {
  orders?: Order[];
  products?: Product[];
  inquiries?: Inquiry[];
  status: ConnectionStatus;
  lastSyncTime: Date;
}) => void;

class RealtimeSyncService {
  private status: ConnectionStatus = 'disconnected';
  private timer: NodeJS.Timeout | null = null;
  private subscribers: Set<SyncCallback> = new Set();
  private lastKnownOrderIds: Set<string> = new Set();
  private lastSyncTime: Date = new Date();
  private isSyncing = false;
  private pollIntervalMs = 7000; // 7 seconds live sync
  private consecutiveFailures = 0;

  public subscribe(cb: SyncCallback): () => void {
    this.subscribers.add(cb);
    // Initial emit
    cb({
      status: this.status,
      lastSyncTime: this.lastSyncTime,
    });

    return () => {
      this.subscribers.delete(cb);
    };
  }

  public start(): void {
    if (this.timer) return;
    this.status = 'connecting';
    this.notifySubscribers();
    this.triggerSync();
    this.timer = setInterval(() => this.triggerSync(), this.pollIntervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.status = 'disconnected';
    this.notifySubscribers();
  }

  public async triggerSync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.status = 'syncing';
    this.notifySubscribers();

    try {
      const [freshOrders, freshProducts, freshInquiries] = await Promise.all([
        ordersApi.getOrders().catch(() => null),
        productsApi.getProducts().catch(() => null),
        inquiriesApi.getInquiries().catch(() => null),
      ]);

      if (freshOrders !== null || freshProducts !== null) {
        this.status = 'connected';
        this.consecutiveFailures = 0;
        this.lastSyncTime = new Date();

        // Check for new orders to detect incoming events
        if (freshOrders) {
          const newOrdersFound: Order[] = [];
          for (const ord of freshOrders) {
            const ordId = String(ord.id);
            if (this.lastKnownOrderIds.size > 0 && !this.lastKnownOrderIds.has(ordId)) {
              newOrdersFound.push(ord);
            }
          }
          // Update known set
          this.lastKnownOrderIds = new Set(freshOrders.map(o => String(o.id)));
        }

        this.notifySubscribers({
          orders: freshOrders ?? undefined,
          products: freshProducts ?? undefined,
          inquiries: freshInquiries ?? undefined,
        });
      } else {
        throw new Error('Sync failed to retrieve data');
      }
    } catch (err) {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= 2) {
        this.status = 'disconnected';
      }
      this.notifySubscribers();
    } finally {
      this.isSyncing = false;
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getLastSyncTime(): Date {
    return this.lastSyncTime;
  }

  private notifySubscribers(partialData?: {
    orders?: Order[];
    products?: Product[];
    inquiries?: Inquiry[];
  }): void {
    const payload = {
      ...partialData,
      status: this.status,
      lastSyncTime: this.lastSyncTime,
    };
    this.subscribers.forEach(cb => {
      try {
        cb(payload);
      } catch (e) {
        console.warn('Realtime subscriber error:', e);
      }
    });
  }
}

export const realtimeSync = new RealtimeSyncService();
