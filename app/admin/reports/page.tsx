'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart2,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  X,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DailySale {
  date: string;
  sales: number;
  orders: number;
}

interface ProductSale {
  title: string;
  count: number;
  revenue: number;
}

interface AnalyticsData {
  grossRevenue: number;
  netRevenue: number;
  totalShipping: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalOrders: number;
  averageOrderValue: number;
  dailySales: DailySale[];
  topProducts: ProductSale[];
  categoryPerformance?: Record<string, { count: number; revenue: number }>;
}

export default function ReportsAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.success && json.analytics) {
        setData(json.analytics);
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to load analytics: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportReportCSV = () => {
    if (!data) return;
    const headers = ['Metric / Product', 'Value / Orders Count', 'Revenue Generated (Rs)'];
    const rows = [
      ['Gross Sales Revenue', `${data.totalOrders || 0} Orders`, data.grossRevenue || 0],
      ['Net Product Revenue', '-', data.netRevenue || 0],
      ['Shipping Collected', '-', data.totalShipping || 0],
      ['Average Order Value', '-', data.averageOrderValue || 0],
      ['Delivered Orders', data.deliveredOrders || 0, '-'],
      ['Processing Orders', data.processingOrders || 0, '-'],
      ['Cancelled Orders', data.cancelledOrders || 0, '-'],
      ['--- TOP PRODUCTS ---', '---', '---'],
      ...(data.topProducts || []).map(p => [`"${p.title.replace(/"/g, '""')}"`, p.count, p.revenue])
    ];

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `sales_analytics_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-emerald-600" />
            Financial Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real database metrics on gross sales, net margin, courier delivery performance, and top product revenue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportReportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Financial Report
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

      {/* KPI Cards */}
      {loading || !data ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm">Calculating real-time financial metrics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Gross Sales</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">Rs. {data.grossRevenue.toLocaleString()}</h3>
              <p className="text-xs text-gray-400 mt-1">Across all verified store orders</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Net Revenue</span>
              <h3 className="text-2xl font-bold text-emerald-600 mt-2">Rs. {data.netRevenue.toLocaleString()}</h3>
              <p className="text-xs text-emerald-700 font-medium mt-1">Excluding shipping charges</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Courier Shipping</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">Rs. {data.totalShipping.toLocaleString()}</h3>
              <p className="text-xs text-gray-400 mt-1">Nationwide logistics fee</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Avg Order Value</span>
              <h3 className="text-2xl font-bold text-indigo-600 mt-2">Rs. {data.averageOrderValue.toLocaleString()}</h3>
              <p className="text-xs text-gray-400 mt-1">Average cart ticket size</p>
            </div>
          </div>

          {/* Order Status Funnel */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              Order Status Pipeline Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-xs text-emerald-700 font-semibold block uppercase">Delivered</span>
                <span className="text-3xl font-bold text-emerald-900 mt-1 block">{data.deliveredOrders}</span>
                <span className="text-[11px] text-emerald-600 font-medium">Successful COD Collection</span>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-xs text-blue-700 font-semibold block uppercase">Processing / In Transit</span>
                <span className="text-3xl font-bold text-blue-900 mt-1 block">{data.processingOrders}</span>
                <span className="text-[11px] text-blue-600 font-medium">With Leopard / Trax</span>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-xs text-amber-700 font-semibold block uppercase">Pending Review</span>
                <span className="text-3xl font-bold text-amber-900 mt-1 block">{data.pendingOrders}</span>
                <span className="text-[11px] text-amber-600 font-medium">Awaiting Call Confirmation</span>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <span className="text-xs text-red-700 font-semibold block uppercase">Cancelled</span>
                <span className="text-3xl font-bold text-red-900 mt-1 block">{data.cancelledOrders}</span>
                <span className="text-[11px] text-red-600 font-medium">Customer Voided</span>
              </div>
            </div>
          </div>

          {/* Daily Sales Trend Breakdown */}
          {data.dailySales && data.dailySales.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Daily Sales Revenue Log
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 uppercase font-semibold text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-center">Orders Count</th>
                      <th className="px-4 py-3 text-right">Daily Revenue (Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.dailySales.map(day => (
                      <tr key={day.date} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{day.date}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-gray-100 px-2 py-0.5 rounded font-bold">{day.orders}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">
                          Rs. {day.sales.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Selling Products Table */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Top Selling Products by Revenue
            </h3>
            {data.topProducts && data.topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 uppercase font-semibold text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3 text-center">Units Sold</th>
                      <th className="px-4 py-3 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                        <td className="px-4 py-3 text-center font-bold">{p.count}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">
                          Rs. {p.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No individual item units recorded yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
