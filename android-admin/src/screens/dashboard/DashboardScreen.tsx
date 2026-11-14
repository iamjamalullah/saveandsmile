import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAdminData } from '../../context/AdminDataContext';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { OrderCard } from '../../components/OrderCard';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Receipt,
  LayoutTemplate,
  BarChart3,
  ChevronRight,
} from 'lucide-react-native';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const { stats, orders, settings, isLoading, isRefreshing, refreshAll } = useAdminData();

  const recentOrders = orders.slice(0, 5);

  return (
    <View style={styles.container}>
      <Header
        title="Admin Console"
        subtitle={`Welcome back, ${user?.name || 'Administrator'}`}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAll}
            colors={[colors.primary.DEFAULT]}
          />
        }
      >
        {/* Pending Orders Notice Banner */}
        {stats.pendingOrders > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('OrdersTab', { filter: 'Pending' })}
            style={styles.pendingBanner}
          >
            <View style={styles.bannerIcon}>
              <Receipt size={16} color="#78350f" />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>
                {stats.pendingOrders} Orders Need Confirmation
              </Text>
              <Text style={styles.bannerSubtitle}>
                Review and process newly placed customer orders
              </Text>
            </View>
            <ChevronRight size={14} color="#78350f" />
          </TouchableOpacity>
        )}

        {/* 2x2 Grid of Key Performance Indicators */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <StatCard
              title="Delivered Revenue"
              value={`${settings?.currency || 'Rs.'} ${stats.totalRevenue.toLocaleString()}`}
              subValue="Fulfillments settled"
              icon={<DollarSign size={14} color={colors.primary.DEFAULT} />}
              tone="primary"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              subValue={`${stats.pendingOrders} Pending · ${stats.deliveredOrders} Delivered`}
              icon={<ShoppingCart size={14} color={colors.accent.dark} />}
              tone="accent"
            />
          </View>

          <View style={styles.kpiRow}>
            <StatCard
              title="Catalog Items"
              value={stats.totalProducts}
              subValue={`${stats.lowStockProducts} low stock items`}
              icon={<Package size={14} color={colors.info.dark} />}
              tone="info"
            />
            <StatCard
              title="Avg Order Value"
              value={`${settings?.currency || 'Rs.'} ${stats.averageOrderValue.toLocaleString()}`}
              subValue="Per fulfilled purchase"
              icon={<TrendingUp size={14} color={colors.primary.DEFAULT} />}
              tone="primary"
            />
          </View>
        </View>

        {/* Low Stock Alert */}
        {stats.lowStockProducts > 0 && (
          <View style={styles.alertBox}>
            <AlertTriangle size={15} color="#b45309" />
            <Text style={styles.alertText}>
              <Text style={{ fontWeight: '700' }}>{stats.lowStockProducts} products</Text> have 5 or fewer items remaining in stock.
            </Text>
          </View>
        )}

        {/* Quick Actions Shortcuts */}
        <View style={styles.quickActionsBox}>
          <Text style={styles.sectionTitle}>Quick Management Actions</Text>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProductEdit', { product: null })}
              style={styles.quickActionBtn}
            >
              <PlusCircle size={16} color={colors.primary.DEFAULT} />
              <Text style={styles.quickActionText}>Add Product</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('OrdersTab')}
              style={styles.quickActionBtn}
            >
              <Receipt size={16} color={colors.primary.DEFAULT} />
              <Text style={styles.quickActionText}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('HomePageEditor')}
              style={styles.quickActionBtn}
            >
              <LayoutTemplate size={16} color={colors.primary.DEFAULT} />
              <Text style={styles.quickActionText}>Home Page</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Reports')}
              style={styles.quickActionBtn}
            >
              <BarChart3 size={16} color={colors.primary.DEFAULT} />
              <Text style={styles.quickActionText}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.recentOrdersSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Orders ({orders.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersTab')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyText}>No customer orders recorded yet.</Text>
            </View>
          ) : (
            recentOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                currency={settings?.currency}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...spacing.shadow.sm,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#78350f',
  },
  bannerSubtitle: {
    fontSize: 10.5,
    color: '#92400e',
    marginTop: 1,
  },
  kpiGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: spacing.borderRadius.md,
    padding: spacing.sm,
    gap: 8,
    marginBottom: spacing.md,
  },
  alertText: {
    fontSize: 11,
    color: '#92400e',
    flex: 1,
  },
  quickActionsBox: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate.border,
    marginBottom: spacing.md,
    ...spacing.shadow.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate.ink,
    letterSpacing: -0.2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary.subtle,
    borderWidth: 1,
    borderColor: colors.primary.border,
    borderRadius: spacing.borderRadius.sm,
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  quickActionText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  recentOrdersSection: {
    marginBottom: spacing.xxxl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  emptyOrders: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.slate.border,
  },
  emptyText: {
    fontSize: 12,
    color: colors.slate.muted,
  },
});
