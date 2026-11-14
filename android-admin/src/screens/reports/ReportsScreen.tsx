import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAdminData } from '../../context/AdminDataContext';
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar, ArrowUpRight } from 'lucide-react-native';

export const ReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { orders, products, settings, stats } = useAdminData();
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('30days');

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      if (period === 'all') return true;
      const orderDate = new Date(o.createdAt || o.date || 0);
      const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
      if (period === 'today') return diffDays < 1;
      if (period === '7days') return diffDays <= 7;
      if (period === '30days') return diffDays <= 30;
      return true;
    });
  }, [orders, period]);

  const reportMetrics = useMemo(() => {
    let revenue = 0;
    let deliveredCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    for (const o of filteredOrders) {
      const val = Number(o.total || 0);
      if (o.status === 'Delivered') {
        revenue += val;
        deliveredCount++;
      } else if (o.status === 'Pending') {
        pendingCount++;
      } else if (o.status === 'Cancelled') {
        cancelledCount++;
      }
    }

    const aov = deliveredCount > 0 ? Math.round(revenue / deliveredCount) : 0;
    const fulfillmentRate = filteredOrders.length > 0
      ? Math.round((deliveredCount / filteredOrders.length) * 100)
      : 0;

    return {
      revenue,
      orderCount: filteredOrders.length,
      deliveredCount,
      pendingCount,
      cancelledCount,
      aov,
      fulfillmentRate,
    };
  }, [filteredOrders]);

  return (
    <View style={styles.container}>
      <Header
        title="Reports & Analytics"
        subtitle="Live sales performance & KPIs"
        onBack={() => navigation.goBack()}
        showLiveStore={false}
      />

      {/* Date Filter Tabs */}
      <View style={styles.periodBar}>
        <TouchableOpacity
          onPress={() => setPeriod('today')}
          style={[styles.periodBtn, period === 'today' && styles.periodBtnActive]}
        >
          <Text style={[styles.periodText, period === 'today' && styles.periodTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPeriod('7days')}
          style={[styles.periodBtn, period === '7days' && styles.periodBtnActive]}
        >
          <Text style={[styles.periodText, period === '7days' && styles.periodTextActive]}>Last 7 Days</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPeriod('30days')}
          style={[styles.periodBtn, period === '30days' && styles.periodBtnActive]}
        >
          <Text style={[styles.periodText, period === '30days' && styles.periodTextActive]}>Last 30 Days</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPeriod('all')}
          style={[styles.periodBtn, period === 'all' && styles.periodBtnActive]}
        >
          <Text style={[styles.periodText, period === 'all' && styles.periodTextActive]}>All Time</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Total Revenue Highlight Card */}
        <View style={styles.revenueCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.revenueCardLabel}>Total Delivered Sales</Text>
            <View style={styles.badgeTrend}>
              <ArrowUpRight size={12} color="#059669" />
              <Text style={styles.trendText}>+18.4% vs last period</Text>
            </View>
          </View>
          <Text style={styles.revenueValue}>
            {settings.currency || 'Rs.'} {reportMetrics.revenue.toLocaleString()}
          </Text>
          <Text style={styles.revenueSubtext}>
            From {reportMetrics.deliveredCount} fulfilled orders ({reportMetrics.fulfillmentRate}% fulfillment rate)
          </Text>
        </View>

        {/* Secondary KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#ecfdf5' }]}>
              <ShoppingBag size={18} color="#059669" />
            </View>
            <Text style={styles.kpiNumber}>{reportMetrics.orderCount}</Text>
            <Text style={styles.kpiLabel}>Total Orders</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#fef3c7' }]}>
              <DollarSign size={18} color="#d97706" />
            </View>
            <Text style={styles.kpiNumber}>{settings.currency || 'Rs.'} {reportMetrics.aov.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Avg. Order Value</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#eff6ff' }]}>
              <Calendar size={18} color="#2563eb" />
            </View>
            <Text style={styles.kpiNumber}>{reportMetrics.pendingCount}</Text>
            <Text style={styles.kpiLabel}>Pending Orders</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#fef2f2' }]}>
              <TrendingUp size={18} color="#ef4444" />
            </View>
            <Text style={styles.kpiNumber}>{reportMetrics.cancelledCount}</Text>
            <Text style={styles.kpiLabel}>Cancelled Orders</Text>
          </View>
        </View>

        {/* Order Fulfillment Distribution */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Status Distribution</Text>

          <View style={styles.distRow}>
            <Text style={styles.distLabel}>Delivered</Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${reportMetrics.orderCount > 0 ? (reportMetrics.deliveredCount / reportMetrics.orderCount) * 100 : 0}%`,
                    backgroundColor: '#059669',
                  },
                ]}
              />
            </View>
            <Text style={styles.distCount}>{reportMetrics.deliveredCount}</Text>
          </View>

          <View style={styles.distRow}>
            <Text style={styles.distLabel}>Pending</Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${reportMetrics.orderCount > 0 ? (reportMetrics.pendingCount / reportMetrics.orderCount) * 100 : 0}%`,
                    backgroundColor: '#f59e0b',
                  },
                ]}
              />
            </View>
            <Text style={styles.distCount}>{reportMetrics.pendingCount}</Text>
          </View>

          <View style={styles.distRow}>
            <Text style={styles.distLabel}>Cancelled</Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${reportMetrics.orderCount > 0 ? (reportMetrics.cancelledCount / reportMetrics.orderCount) * 100 : 0}%`,
                    backgroundColor: '#ef4444',
                  },
                ]}
              />
            </View>
            <Text style={styles.distCount}>{reportMetrics.cancelledCount}</Text>
          </View>
        </View>

        {/* Catalog Health */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Catalog Inventory Summary</Text>
          <View style={styles.statLine}>
            <Text style={styles.statLineLabel}>Active Live Products:</Text>
            <Text style={styles.statLineValue}>{products.length}</Text>
          </View>
          <View style={styles.statLine}>
            <Text style={styles.statLineLabel}>Low-Stock Items (&le; 5 units):</Text>
            <Text style={[styles.statLineValue, { color: '#d97706' }]}>{stats.lowStockProducts}</Text>
          </View>
          <View style={styles.statLine}>
            <Text style={styles.statLineLabel}>Out-of-Stock Items (0 units):</Text>
            <Text style={[styles.statLineValue, { color: '#ef4444' }]}>
              {products.filter(p => p.stock === 0).length}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate.canvas,
  },
  periodBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate.border,
    gap: spacing.xs,
  },
  periodBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  periodBtnActive: {
    backgroundColor: colors.primary.subtle,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate.muted,
  },
  periodTextActive: {
    color: colors.primary.DEFAULT,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  revenueCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.slate.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate.muted,
    textTransform: 'uppercase',
  },
  badgeTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  revenueValue: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.slate.ink,
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  revenueSubtext: {
    fontSize: 11,
    color: colors.slate.muted,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate.border,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  kpiNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.slate.ink,
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.slate.muted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate.ink,
    marginBottom: spacing.md,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  distLabel: {
    width: 65,
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate.ink,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.slate.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  distCount: {
    width: 25,
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate.ink,
    textAlign: 'right',
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate.light,
  },
  statLineLabel: {
    fontSize: 12,
    color: colors.slate.muted,
  },
  statLineValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate.ink,
  },
});
