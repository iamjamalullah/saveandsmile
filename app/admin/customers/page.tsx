'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Download,
  Filter,
  Eye,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  X
} from 'lucide-react';

interface CustomerOrder {
  id: string | number;
  orderCode?: string;
  grandTotal?: number;
  total?: number;
  status?: string;
  createdAt?: string;
  items?: Array<{ title?: string; price?: number; quantity?: number }>;
}

interface CustomerAddress {
  line1: string;
  city: string;
  region?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  segment: 'vip' | 'returning' | 'new';
  ordersCount: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderAt: string;
  lastOrderAt: string;
  createdAt: string;
  addresses: CustomerAddress[];
  marketingOptIn: boolean;
  notes?: string;
  orders: CustomerOrder[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'vip' | 'returning' | 'new'>('all');
  const [sortBy, setSortBy] = useState<'spent' | 'orders' | 'recent' | 'name'>('spent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerNotes, setCustomerNotes] = useState<Record<string, string>>({});
  const [activeNoteText, setActiveNoteText] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to load customers: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (segmentFilter !== 'all') {
      result = result.filter(c => c.segment === segmentFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.addresses.some(a => a.city.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      if (sortBy === 'spent') {
        valA = a.totalSpent;
        valB = b.totalSpent;
      } else if (sortBy === 'orders') {
        valA = a.ordersCount;
        valB = b.ordersCount;
      } else if (sortBy === 'recent') {
        valA = new Date(a.lastOrderAt).getTime();
        valB = new Date(b.lastOrderAt).getTime();
      } else if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [customers, segmentFilter, search, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const total = customers.length;
    const vipCount = customers.filter(c => c.segment === 'vip').length;
    const returningCount = customers.filter(c => c.segment === 'returning').length;
    const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    const avgAOV = total > 0 ? Math.round(totalRevenue / customers.reduce((acc, c) => acc + c.ordersCount, 0) || 0) : 0;
    return { total, vipCount, returningCount, totalRevenue, avgAOV };
  }, [customers]);

  const exportCSV = () => {
    const headers = ['Customer ID', 'Name', 'Phone', 'Email', 'City', 'Orders Count', 'Total Spent (Rs)', 'AOV (Rs)', 'Segment', 'First Order', 'Last Order'];
    const rows = filteredCustomers.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.phone,
      c.email,
      `"${(c.addresses[0]?.city || 'Pakistan').replace(/"/g, '""')}"`,
      c.ordersCount,
      c.totalSpent,
      c.averageOrderValue,
      c.segment.toUpperCase(),
      c.firstOrderAt ? new Date(c.firstOrderAt).toLocaleDateString() : '',
      c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `saveandsmile_customers_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveNoteText(customerNotes[customer.id] || customer.notes || '');
  };

  const handleSaveNote = () => {
    if (!selectedCustomer) return;
    setCustomerNotes(prev => ({ ...prev, [selectedCustomer.id]: activeNoteText }));
    setNotice({ type: 'success', message: 'Internal customer note updated successfully.' });
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            Customers & CRM
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage wholesale buyer profiles, lifetime order history, spending segments, and contact details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCustomers}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            notice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Buyers</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            <p className="text-xs text-gray-500 mt-1">Direct store customers</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">VIP Wholesalers</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900">{stats.vipCount}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">3+ orders or Rs. 10k+ spend</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Returning Buyers</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900">{stats.returningCount}</h3>
            <p className="text-xs text-gray-500 mt-1">Repeat verified purchasers</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total LTV Revenue</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900">Rs. {stats.totalRevenue.toLocaleString()}</h3>
            <p className="text-xs text-gray-500 mt-1">Avg Basket: Rs. {stats.avgAOV.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by buyer name, phone number, email or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'vip', 'returning', 'new'] as const).map(seg => (
              <button
                key={seg}
                onClick={() => setSegmentFilter(seg)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition ${
                  segmentFilter === seg
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {seg === 'all' ? 'All Customers' : `${seg} (${customers.filter(c => c.segment === seg).length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>Showing {filteredCustomers.length} of {customers.length} customers</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-medium text-gray-700">
              <Filter className="w-3.5 h-3.5" />
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-gray-800 cursor-pointer focus:outline-none"
            >
              <option value="spent">Total Spent</option>
              <option value="orders">Orders Count</option>
              <option value="recent">Recent Order Date</option>
              <option value="name">Customer Name</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1 hover:bg-gray-100 rounded"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-sm">Loading customer database...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900">No customers found</h3>
            <p className="text-sm text-gray-500 mt-1">Try clearing your search query or segment filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Customer / Contact</th>
                  <th className="px-6 py-3.5">City / Address</th>
                  <th className="px-6 py-3.5">Segment</th>
                  <th className="px-6 py-3.5 text-center">Orders</th>
                  <th className="px-6 py-3.5 text-right">Total Spent</th>
                  <th className="px-6 py-3.5">Last Active</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map(customer => {
                  const mainAddr = customer.addresses[0];
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/75 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{customer.name}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                {customer.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-start gap-1.5 text-xs text-gray-600 max-w-xs">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-900">{mainAddr?.city || 'Pakistan'}</span>
                            <div className="text-gray-500 truncate max-w-[200px]" title={mainAddr?.line1}>
                              {mainAddr?.line1 || 'Standard delivery address'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            customer.segment === 'vip'
                              ? 'bg-amber-100 text-amber-800'
                              : customer.segment === 'returning'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {customer.segment === 'vip' && <Sparkles className="w-3 h-3" />}
                          {customer.segment.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md text-xs">
                          {customer.ordersCount}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-gray-900">Rs. {customer.totalSpent.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">AOV: Rs. {customer.averageOrderValue.toLocaleString()}</div>
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-500">
                        {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {customer.phone && customer.phone !== 'N/A' && (
                            <a
                              href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(
                                customer.name
                              )},%20thank%20you%20for%20shopping%20at%20Save%20%26%20Smile!`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Message on WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenCustomer(customer)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View customer profile & order history"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile & Orders Drawer Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedCustomer.name}</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded">{selectedCustomer.id}</span>
                    <span>•</span>
                    <span className="capitalize font-semibold text-emerald-700">{selectedCustomer.segment} Buyer</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Contact & Address Information */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Phone Number</span>
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Email Address</span>
                  <div className="flex items-center gap-2 text-gray-900 font-medium truncate">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{selectedCustomer.email}</span>
                  </div>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">Delivery Address</span>
                  <div className="flex items-start gap-2 text-gray-800">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>
                      {selectedCustomer.addresses[0]?.line1}, {selectedCustomer.addresses[0]?.city},{' '}
                      {selectedCustomer.addresses[0]?.country || 'Pakistan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                  <span className="text-xs text-emerald-700 font-medium block">Lifetime Spend</span>
                  <span className="text-lg font-bold text-emerald-900">
                    Rs. {selectedCustomer.totalSpent.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                  <span className="text-xs text-blue-700 font-medium block">Total Orders</span>
                  <span className="text-lg font-bold text-blue-900">{selectedCustomer.ordersCount}</span>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-center">
                  <span className="text-xs text-purple-700 font-medium block">Avg Order Value</span>
                  <span className="text-lg font-bold text-purple-900">
                    Rs. {selectedCustomer.averageOrderValue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  Order History ({selectedCustomer.orders.length})
                </h3>

                {selectedCustomer.orders.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No orders recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.orders.map((ord, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-gray-200 rounded-xl hover:border-emerald-300 transition bg-white"
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-gray-900">
                            Order #{ord.orderCode || ord.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.status || 'Processing'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                          <span className="font-bold text-gray-900 text-sm">
                            Rs. {(parseFloat(String(ord.grandTotal || ord.total || 0))).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Notes */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Internal CRM Notes
                </h3>
                <textarea
                  rows={3}
                  value={activeNoteText}
                  onChange={e => setActiveNoteText(e.target.value)}
                  placeholder="Add private staff notes on wholesale discount deals, preferred couriers, or special instructions..."
                  className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleSaveNote}
                  className="mt-2 px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition"
                >
                  Save Internal Note
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <a
                href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
              >
                <MessageSquare className="w-4 h-4" />
                Contact Buyer via WhatsApp
              </a>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
