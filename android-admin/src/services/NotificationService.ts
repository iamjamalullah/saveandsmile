import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationItem, NotificationCategory } from '../types';
import { notificationsApi } from '../api/endpoints';

// Configure default notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private inAppNotifications: NotificationItem[] = [];
  private listeners: Set<(items: NotificationItem[]) => void> = new Set();
  private navigationHandler: ((screen: string, params?: any) => void) | null = null;

  public setNavigationHandler(handler: (screen: string, params?: any) => void): void {
    this.navigationHandler = handler;
  }

  public async registerForPushNotificationsAsync(): Promise<string | null> {
    if (Platform.OS !== 'android') return null;

    try {
      // 1. Setup Android 13+ Notification Channels
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Alerts',
        description: 'New orders, order status confirmations, and cancellations',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#047857',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('inventory', {
        name: 'Inventory Alerts',
        description: 'Low stock and out-of-stock product warnings',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: '#f59e0b',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('inquiries', {
        name: 'Customer Inquiries',
        description: 'New customer WhatsApp and contact form messages',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });

      // 2. Request Android 13+ permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission denied by user');
        return null;
      }

      // 3. Get Expo Push Token / FCM device token
      const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
      if (tokenData?.data) {
        // Register token with Save & Smile backend
        await notificationsApi.registerDeviceToken(tokenData.data, 'android');
        return tokenData.data;
      }
    } catch (err) {
      console.warn('Error configuring push notifications:', err);
    }
    return null;
  }

  public setupNotificationListeners(): () => void {
    // 1. Foreground notification received listener
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data || {};
      const newItem: NotificationItem = {
        id: notification.request.identifier || String(Date.now()),
        title: notification.request.content.title || 'Notification',
        body: notification.request.content.body || '',
        category: (data.category as NotificationCategory) || 'order',
        targetId: data.targetId ? String(data.targetId) : undefined,
        targetScreen: data.targetScreen || 'OrderDetail',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      this.addInAppNotification(newItem);
    });

    // 2. User tapped notification listener (Deep link routing)
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data || {};
      const targetScreen = data.targetScreen || 'OrderDetail';
      const targetId = data.targetId;

      if (this.navigationHandler) {
        if (targetScreen === 'OrderDetail' && targetId) {
          this.navigationHandler('OrderDetail', { orderId: targetId });
        } else if (targetScreen === 'Inquiries') {
          this.navigationHandler('Inquiries');
        } else if (targetScreen === 'Products') {
          this.navigationHandler('Products');
        }
      }
    });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }

  public addInAppNotification(item: NotificationItem): void {
    // Prevent duplicate entries
    if (this.inAppNotifications.some(n => n.id === item.id)) return;
    this.inAppNotifications = [item, ...this.inAppNotifications.slice(0, 99)]; // Keep latest 100
    this.notifySubscribers();
  }

  public getInAppNotifications(): NotificationItem[] {
    return this.inAppNotifications;
  }

  public getUnreadCount(): number {
    return this.inAppNotifications.filter(n => !n.isRead).length;
  }

  public markAsRead(id: string): void {
    this.inAppNotifications = this.inAppNotifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    );
    this.notifySubscribers();
  }

  public markAllAsRead(): void {
    this.inAppNotifications = this.inAppNotifications.map(n => ({ ...n, isRead: true }));
    this.notifySubscribers();
  }

  public clearAll(): void {
    this.inAppNotifications = [];
    this.notifySubscribers();
  }

  public subscribe(cb: (items: NotificationItem[]) => void): () => void {
    this.listeners.add(cb);
    cb(this.inAppNotifications);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notifySubscribers(): void {
    this.listeners.forEach(cb => {
      try {
        cb(this.inAppNotifications);
      } catch {}
    });
  }
}

export const notificationService = new NotificationService();
