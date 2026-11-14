import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { useAdminData } from '../../context/AdminDataContext';
import { Order, OrderStatus } from '../../types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Header } from '../../components/Header';
import { OrderCard } from '../../components/OrderCard';
import { Search, Download, Filter, X } from 'lucide-react-native';

const STATUS_TABS: { label: string; value: 'ALL' | OrderStatus }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Processing', value: 'Processing' },
  { label: 'Shipped', value: 'Shipped' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Cancelled', value: 'Cancelled' },
];

export const OrdersListScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { orders, settings, isRefreshing, refreshAll, updateOrderStatus } = useAdminData();
  const initialFilter = route?.params?.filter || 'ALL';

  const [activeStatus, setActiveStatus] = useState<'ALL' | OrderStatus>(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');

  // Unique cities from orders
  const cities = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => {
      const c = o.customer?.city || o.customerCity;
      if (c && c.trim()) set.add(c.trim());
    });
    return Array.from(set).sort();
  }, [orders]);

  // Status counts
  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      Pending: orders.filter(o => o.status === 'Pending').length,
      Processing: orders.filter(o => o.status === 'Processing').length,
      Shipped: orders.filter(o => o.status === 'Shipped').length,
      Delivered: orders.filter(o => o.status === 'Delivered').length,
      Cancelled: orders.filter(o => o.status === 'Cancelled').length,
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Status
      if (activeStatus !== 'ALL' && o.status.toLowerCase() !== activeStatus.toLowerCase()) {
        return false;
      }

      // City
      const cCity = o.customer?.city || o.customerCity || '';
      if (selectedCity !== 'ALL' && cCity.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Search
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase().trim();
        const cName = (o.customer?.name || o.customerName || '').toLowerCase();
        const cMobile = o.customer?.mobile || o.customerMobile || '';
        const orderId = String(o.id || '').toLowerCase();
        return orderId.includes(s) || cName.includes(s) || cMobile.includes(s) || cCity.toLowerCase().includes(s);
      }

      return true;
    });
  }, [orders, activeStatus, selectedCity, searchTerm]);

  // Export / Share CSV summary
  const handleExportCSV = async () => {
    if (filteredOrders.length === 0) {
      Alert.alert('No Orders', 'There are no orders matching your current filter to export.');
      return;
    }

    const header = 'Order ID,Date,Customer,Phone,City,Address,Total COD,Status\n';
    const rows = filteredOrders
      .map(o => {
        const name = (o.customer?.name || o.customerName || '').replace(/,/g, ' ');
        const phone = o.customer?.mobile || o.customerMobile || '';
        const city = o.customer?.city || o.customerCity || '';
        const addr = (o.customer?.address || o.customerAddress || '').replace(/,/g, ' ');
        return `${o.id},"${o.date || o.createdAt || ''}","${name}","${phone}","${city}","${addr}",${o.total},${o.status}`;
      })
      .join('\n');

    try {
      await Share.share({
        title: `Save & Smile Orders Export (${new Date().toLocaleDateString()})`,
        message: `${header}${rows}`,
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <Header
        title="Customer Orders"
        subtitle={`Tracking ${orders.length} real-time purchases`}
        rightAction={
          <TouchableOpacity onPress={handleExportCSV} style={styles.exportBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Download size={15} color={colors.primary.DEFAULT} />
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchWrapper}>
          <Search size={15} color={colors.slate.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order ID, name, mobile, city..."
            placeholderTextColor={colors.slate.muted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <X size={15} color={colors.slate.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.statusTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusTabsScroll}>
          {STATUS_TABS.map(tab => {
            const isActive = activeStatus === tab.value;
            const count = counts[tab.value];

            return (
              <TouchableOpacity
                key={tab.value}
                onPress={() => setActiveStatus(tab.value)}
                style={[styles.statusTab, isActive && styles.statusTabActive]}
              >
                <Text style={[styles.statusTabText, isActive && styles.statusTabTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                  <Text style={[styles.countText, isActive && styles.countTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* City Filters if any exist */}
      {cities.length > 0 && (
        <View style={styles.citiesWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.citiesScroll}>
            <TouchableOpacity
              onPress={() => setSelectedCity('ALL')}
              style={[styles.cityChip, selectedCity === 'ALL' && styles.cityChipActive]}
            >
              <Text style={[styles.cityChipText, selectedCity === 'ALL' && styles.cityChipTextActive]}>
                All Cities
              </Text>
            </TouchableOpacity>

            {cities.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedCity(c)}
                style={[styles.cityChip, selectedCity === c && styles.cityChipActive]}
              >
                <Text style={[styles.cityChipText, selectedCity === c && styles.cityChipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Order List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAll}
            colors={[colors.primary.DEFAULT]}
          />
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            currency={settings?.currency}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              No orders matched your status or search criteria.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate.background,
  },
  exportBtn: {
    padding: spacing.xs,
    backgroundColor: colors.primary.subtle,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary.border,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    gap: 8,
    ...spacing.shadow.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.slate.ink,
  },
  statusTabsWrapper: {
    paddingVertical: spacing.xs + 2,
  },
  statusTabsScroll: {
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 9999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 5,
  },
  statusTabActive: {
    backgroundColor: colors.slate.ink,
    borderColor: colors.slate.ink,
  },
  statusTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate.body,
  },
  statusTabTextActive: {
    color: colors.white,
  },
  countBadge: {
    backgroundColor: colors.slate.background,
    borderRadius: 9999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.slate.muted,
  },
  countTextActive: {
    color: colors.white,
  },
  citiesWrapper: {
    paddingBottom: spacing.xs,
  },
  citiesScroll: {
    paddingHorizontal: spacing.md,
    gap: 5,
  },
  cityChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  cityChipActive: {
    backgroundColor: colors.primary.subtle,
    borderColor: colors.primary.border,
  },
  cityChipText: {
    fontSize: 10,
    color: colors.slate.muted,
  },
  cityChipTextActive: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  emptyContainer: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.slate.border,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate.ink,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11.5,
    color: colors.slate.muted,
    textAlign: 'center',
  },
});
