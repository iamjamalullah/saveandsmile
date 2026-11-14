import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert } from 'react-native';
import { useAdminData } from '../../context/AdminDataContext';
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Inquiry } from '../../types';
import { MessageSquare, Phone, MessageCircle, CheckCircle, Clock, Trash2 } from 'lucide-react-native';

export const InquiriesListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { inquiries, updateInquiryStatus, deleteInquiry, isRefreshing, refreshAll } = useAdminData();
  const [filter, setFilter] = useState<'all' | 'new' | 'resolved'>('all');

  const filteredInquiries = inquiries.filter(inq => {
    if (filter === 'new') return inq.status === 'new';
    if (filter === 'resolved') return inq.status === 'resolved';
    return true;
  });

  const handleCall = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9]/g, '');
    const num = clean.startsWith('0') ? `92${clean.slice(1)}` : clean;
    Linking.openURL(`https://wa.me/${num}?text=Hi%20from%20Save%20%26%20Smile%20Support`).catch(() => {});
  };

  const handleDelete = (id: string | number) => {
    Alert.alert('Delete Inquiry', 'Are you sure you want to delete this customer inquiry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteInquiry(id) },
    ]);
  };

  const renderItem = ({ item }: { item: Inquiry }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          {item.phone && <Text style={styles.customerPhone}>{item.phone}</Text>}
          {item.email && <Text style={styles.customerEmail}>{item.email}</Text>}
        </View>
        <View style={[styles.statusBadge, item.status === 'resolved' ? styles.statusResolved : styles.statusNew]}>
          <Text style={[styles.statusText, item.status === 'resolved' ? styles.statusTextResolved : styles.statusTextNew]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {item.subject && <Text style={styles.subjectText}>{item.subject}</Text>}
      <Text style={styles.messageText}>{item.message}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>

        <View style={styles.actionRow}>
          {item.phone && (
            <>
              <TouchableOpacity onPress={() => handleCall(item.phone)} style={styles.actionBtn}>
                <Phone size={14} color="#059669" />
                <Text style={styles.actionBtnText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleWhatsApp(item.phone)} style={styles.actionBtn}>
                <MessageCircle size={14} color="#10b981" />
                <Text style={styles.actionBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </>
          )}

          {item.status !== 'resolved' ? (
            <TouchableOpacity
              onPress={() => updateInquiryStatus(item.id, 'resolved')}
              style={[styles.actionBtn, styles.resolveBtn]}
            >
              <CheckCircle size={14} color="#ffffff" />
              <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Resolve</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Trash2 size={14} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Customer Inquiries"
        subtitle={`${inquiries.length} total messages`}
        onBack={() => navigation.goBack()}
        showLiveStore={false}
      />

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[styles.tabItem, filter === 'all' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>
            All ({inquiries.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('new')}
          style={[styles.tabItem, filter === 'new' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, filter === 'new' && styles.tabTextActive]}>
            New ({inquiries.filter(i => i.status === 'new').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('resolved')}
          style={[styles.tabItem, filter === 'resolved' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, filter === 'resolved' && styles.tabTextActive]}>
            Resolved ({inquiries.filter(i => i.status === 'resolved').length})
          </Text>
        </TouchableOpacity>
      </View>

      {filteredInquiries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageSquare size={48} color={colors.slate.muted} />
          <Text style={styles.emptyTitle}>No Inquiries</Text>
          <Text style={styles.emptySubtitle}>All customer messages and inquiries will appear here in real-time.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInquiries}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refreshAll}
          refreshing={isRefreshing}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate.border,
    gap: spacing.sm,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: spacing.borderRadius.sm,
  },
  tabItemActive: {
    backgroundColor: colors.primary.subtle,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate.muted,
  },
  tabTextActive: {
    color: colors.primary.DEFAULT,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  customerPhone: {
    fontSize: 11,
    color: colors.primary.DEFAULT,
    fontWeight: '500',
  },
  customerEmail: {
    fontSize: 10,
    color: colors.slate.muted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusNew: {
    backgroundColor: '#fef3c7',
  },
  statusResolved: {
    backgroundColor: '#ecfdf5',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextNew: {
    color: '#b45309',
  },
  statusTextResolved: {
    color: '#047857',
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate.ink,
    marginTop: 4,
  },
  messageText: {
    fontSize: 12,
    color: colors.slate.ink,
    lineHeight: 18,
    marginVertical: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.slate.light,
    marginTop: spacing.xs,
  },
  dateText: {
    fontSize: 10,
    color: colors.slate.muted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.slate.light,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  resolveBtn: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate.ink,
  },
  deleteBtn: {
    padding: 6,
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
  },
});
