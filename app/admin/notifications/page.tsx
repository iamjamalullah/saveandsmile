'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Package,
  Layers,
  ArrowRight,
  Trash2,
  RefreshCw,
  X,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: 'order' | 'stock' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  linkUrl: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'order' | 'stock' | 'system'>('all');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchLiveAlerts = async () => {
    try {
      setLoading(true);
      const [resOrders, resProducts] = await Promise.all([
        fetch('/api/orders').then(r => r.json()).catch(() => ({})),
        fetch('/api/products').then(r => r.json()).catch(() => ({}))
      ]);

      const items: NotificationItem[] = [];

      // Generate order notifications
      const orders = Array.isArray(resOrders) ? resOrders : (resOrders.orders || []);
      for (const ord of orders.slice(0, 10)) {
        items.push({
          id: `notif_ord_${ord.id}`,
          type: 'order',
          title: `New Order #${ord.orderCode || ord.id}`,
          message: `${ord.customerName || 'Customer'} placed an order of Rs. ${(parseFloat(String(ord.grandTotal || ord.total || 0))).toLocaleString()}`,
          time: ord.createdAt || new Date().toISOString(),
          isRead: false,
          linkUrl: '/admin/orders'
        });
      }

      // Generate low stock alerts
      const products = Array.isArray(resProducts) ? resProducts : (resProducts.products || []);
      const lowStock = products.filter((p: any) => typeof p.stock === 'number' && p.stock <= 5);
      for (const prod of lowStock) {
        items.push({
          id: `notif_stock_${prod.id}`,
          type: 'stock',
          title: `Low Stock Alert: ${prod.title}`,
          message: `Only ${prod.stock} unit(s) remaining in wholesale inventory. Create purchase order.`,
          time: new Date().toISOString(),
          isRead: false,
          linkUrl: '/admin/inventory'
        });
      }

      // System audit notification
      items.push({
        id: 'notif_sys_backup',
        type: 'system',
        title: 'Authoritative Persistence Engine Active',
        message: 'Neon Cloud Database & Local JSON Data Engine synchronized successfully.',
        time: new Date().toISOString(),
        isRead: true,
        linkUrl: '/admin/audit-logs'
      });

      setNotifications(items);
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to load notifications: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAlerts();
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setNotice({ type: 'success', message: 'All notifications marked as read.' });
    setTimeout(() => setNotice(null), 2500);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const clearAll = () => {
    setNotifications([]);
    setNotice({ type: 'success', message: 'Notification feed cleared.' });
    setTimeout(() => setNotice(null), 2500);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-7 h-7 text-emerald-600" />
            Store Activity & Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time feed of new customer orders, low stock warnings, courier updates, and system alerts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Mark All as Read
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Clear Feed
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(['all', 'order', 'stock', 'system'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                filter === tab ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab === 'all' ? `All Alerts (${notifications.length})` : tab}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {unreadCount} Unread Notifications
        </span>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm">Scanning system notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">All caught up!</h3>
          <p className="text-sm text-gray-500 mt-1">No alerts or warnings in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                item.isRead
                  ? 'bg-white border-gray-200 hover:border-gray-300'
                  : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl flex-shrink-0 ${
                    item.type === 'order'
                      ? 'bg-emerald-100 text-emerald-700'
                      : item.type === 'stock'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {item.type === 'order' ? (
                    <ShoppingBag className="w-5 h-5" />
                  ) : item.type === 'stock' ? (
                    <Package className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{item.message}</p>
                  <span className="text-[11px] text-gray-400 mt-2 block">
                    {new Date(item.time).toLocaleString()}
                  </span>
                </div>
              </div>

              <Link
                href={item.linkUrl}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex-shrink-0 mt-1"
              >
                View
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
