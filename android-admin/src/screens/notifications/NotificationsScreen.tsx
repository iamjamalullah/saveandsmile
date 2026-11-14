import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAdminData } from '../../context/AdminDataContext';
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { NotificationItem } from '../../types';
import { Bell, ShoppingBag, AlertTriangle, MessageSquare, Star, Info, CheckCheck, Trash2 } from 'lucide-react-native';

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllNotifications,
  } = useAdminData();

  const handleNotificationPress = (item: NotificationItem) => {
    markNotificationRead(item.id);
    if (item.category === 'order' && item.targetId) {
      navigation.navigate('OrderDetail', { orderId: item.targetId });
    } else if (item.category === 'inquiry') {
      navigation.navigate('Inquiries');
    } else if (item.category === 'inventory') {
      navigation.navigate('Products');
    } else if (item.category === 'review') {
      navigation.navigate('Reviews');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'order':
        return <ShoppingBag size={18} color="#059669" />;
      case 'inventory':
        return <AlertTriangle size={18} color="#d97706" />;
      case 'inquiry':
        return <MessageSquare size={18} color="#2563eb" />;
      case 'review':
        return <Star size={18} color="#7c3aed" />;
      default:
        return <Info size={18} color="#64748b" />;
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.itemCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        {getCategoryIcon(item.category)}
      </View>
      <View style={styles.contentWrap}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.itemTime}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.itemBody} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        subtitle={`${notifications.length} recent alerts`}
        onBack={() => navigation.goBack()}
        showLiveStore={false}
        rightAction={
          notifications.length > 0 ? (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={markAllNotificationsRead} style={styles.headerBtn}>
                <CheckCheck size={16} color={colors.primary.DEFAULT} />
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAllNotifications} style={styles.headerBtn}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={48} color={colors.slate.muted} />
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>
            You will receive instant alerts when new orders arrive or stock levels run low.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate.canvas,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    padding: 6,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate.border,
  },
  unreadCard: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.slate.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate.ink,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '800',
    color: '#064e3b',
  },
  itemTime: {
    fontSize: 10,
    color: colors.slate.muted,
    marginLeft: 6,
  },
  itemBody: {
    fontSize: 12,
    color: colors.slate.muted,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate.ink,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.slate.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
