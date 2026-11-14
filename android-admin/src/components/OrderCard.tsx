import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { Order, OrderStatus } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { StatusBadge } from './StatusBadge';
import { Phone, MessageSquare, MapPin, Package, Eye, ChevronRight, FileText } from 'lucide-react-native';

interface OrderCardProps {
  order: Order;
  currency?: string;
  onPress: () => void;
  onQuickStatusChange?: (status: OrderStatus) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  currency = 'Rs.',
  onPress,
  onQuickStatusChange,
}) => {
  const customerName = order.customer?.name || order.customerName || 'Customer';
  const customerMobile = order.customer?.mobile || order.customerMobile || '';
  const customerCity = order.customer?.city || order.customerCity || '';
  const customerAddress = order.customer?.address || order.customerAddress || '';
  const specialNotes = order.customerNotes || '';

  const handleCall = () => {
    if (customerMobile) {
      Linking.openURL(`tel:${customerMobile}`).catch(() => {});
    }
  };

  const handleWhatsApp = () => {
    if (customerMobile) {
      const cleanPhone = customerMobile.replace(/[^0-9]/g, '');
      const formatted = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
      const text = encodeURIComponent(`Assalam o Alaikum ${customerName}, this is regarding your order ${order.id} on Save & Smile.`);
      Linking.openURL(`https://wa.me/${formatted}?text=${text}`).catch(() => {});
    }
  };

  const itemsSummary = (order.items || [])
    .map(i => `${i.qty || 1}x ${i.product?.name || i.name || 'Product'}`)
    .join(', ');

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.orderIdBlock}>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.date}>{order.date || order.createdAt || 'Recent'}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {/* Customer Info */}
      <View style={styles.customerRow}>
        <View style={styles.customerDetails}>
          <Text style={styles.customerName}>{customerName}</Text>
          <View style={styles.locationRow}>
            <MapPin size={11} color={colors.slate.muted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {customerCity ? `${customerCity} — ` : ''}{customerAddress}
            </Text>
          </View>
        </View>

        {customerMobile ? (
          <View style={styles.contactButtons}>
            <TouchableOpacity onPress={handleWhatsApp} style={styles.iconBtnWhatsApp} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <MessageSquare size={13} color="#059669" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCall} style={styles.iconBtnCall} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Phone size={13} color="#0284c7" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Special Customer Note Badge */}
      {specialNotes ? (
        <View style={styles.noteBanner}>
          <FileText size={11} color="#92400e" />
          <Text style={styles.noteText} numberOfLines={2}>
            "{specialNotes}"
          </Text>
        </View>
      ) : null}

      {/* Items Summary */}
      <View style={styles.itemsRow}>
        <Package size={12} color={colors.slate.muted} style={{ marginTop: 2 }} />
        <Text style={styles.itemsText} numberOfLines={2}>
          <Text style={styles.itemsCount}>{order.items?.length || 0} item(s): </Text>
          {itemsSummary || 'Order details'}
        </Text>
      </View>

      {/* Footer / Total & Quick Actions */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total Due (COD)</Text>
          <Text style={styles.totalAmount}>
            <Text style={styles.currency}>{currency} </Text>
            {Number(order.total || 0).toLocaleString()}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onPress} style={styles.detailBtn}>
            <Eye size={12} color={colors.primary.DEFAULT} />
            <Text style={styles.detailBtnText}>Details</Text>
            <ChevronRight size={12} color={colors.primary.DEFAULT} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.slate.border,
    ...spacing.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.slate.divider,
    paddingBottom: spacing.xs + 2,
    marginBottom: spacing.xs + 2,
  },
  orderIdBlock: {
    flex: 1,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
    letterSpacing: -0.2,
  },
  date: {
    fontSize: 10,
    color: colors.slate.muted,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  customerDetails: {
    flex: 1,
    marginRight: spacing.sm,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate.ink,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    fontSize: 11,
    color: colors.slate.muted,
    flex: 1,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtnWhatsApp: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnCall: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: spacing.borderRadius.sm,
    paddingVertical: 3,
    paddingHorizontal: 6,
    gap: 4,
    marginBottom: spacing.xs,
  },
  noteText: {
    fontSize: 10.5,
    color: '#92400e',
    flex: 1,
    fontStyle: 'italic',
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    backgroundColor: colors.slate.background,
    borderRadius: spacing.borderRadius.sm,
    padding: 6,
    marginBottom: spacing.xs + 2,
  },
  itemsCount: {
    fontWeight: '600',
    color: colors.slate.ink,
  },
  itemsText: {
    fontSize: 10.5,
    color: colors.slate.body,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.slate.divider,
    paddingTop: spacing.xs + 2,
  },
  totalLabel: {
    fontSize: 9.5,
    color: colors.slate.muted,
    textTransform: 'uppercase',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  currency: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.slate.muted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.subtle,
    borderWidth: 1,
    borderColor: colors.primary.border,
    borderRadius: spacing.borderRadius.sm,
    paddingVertical: 5,
    paddingHorizontal: 8,
    gap: 3,
  },
  detailBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
});
