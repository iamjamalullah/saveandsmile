import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { useAdminData } from '../../context/AdminDataContext';
import { OrderStatus } from '../../types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Header } from '../../components/Header';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Trash2,
  Share2,
  FileText,
  Truck,
  CheckCircle2,
} from 'lucide-react-native';

const STATUS_OPTIONS: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export const OrderDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { orderId } = route.params;
  const { orders, settings, updateOrderStatus, deleteOrder } = useAdminData();

  const order = orders.find(o => String(o.id) === String(orderId));
  const [isUpdating, setIsUpdating] = useState(false);

  if (!order) {
    return (
      <View style={styles.container}>
        <Header title="Order Details" onBack={() => navigation.goBack()} />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Order not found or has been removed.</Text>
        </View>
      </View>
    );
  }

  const customerName = order.customer?.name || order.customerName || 'Customer';
  const customerMobile = order.customer?.mobile || order.customerMobile || '';
  const customerCity = order.customer?.city || order.customerCity || '';
  const customerAddress = order.customer?.address || order.customerAddress || '';
  const specialNotes = order.customerNotes || '';
  const currency = settings?.currency || 'Rs.';

  const handleCall = () => {
    if (customerMobile) Linking.openURL(`tel:${customerMobile}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    if (customerMobile) {
      const cleanPhone = customerMobile.replace(/[^0-9]/g, '');
      const formatted = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
      const text = encodeURIComponent(
        `Assalam o Alaikum ${customerName}, this is regarding your order ${order.id} on Save & Smile.`
      );
      Linking.openURL(`https://wa.me/${formatted}?text=${text}`).catch(() => {});
    }
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    Alert.alert(
      'Update Order Status',
      `Change order status from ${order.status} to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Update',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await updateOrderStatus(order.id, newStatus);
            } catch (err: any) {
              Alert.alert('Update Failed', err?.message || 'Could not update status.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to permanently delete order ${order.id}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOrder(order.id);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete order.');
            }
          },
        },
      ]
    );
  };

  const handleShareInvoice = async () => {
    const itemsText = (order.items || [])
      .map(
        i =>
          `• ${i.qty}x ${i.product?.name || i.name} ${
            i.variantTitle ? `(${i.variantTitle})` : ''
          } - ${currency} ${Number(i.lineTotal || 0).toLocaleString()}`
      )
      .join('\n');

    const invoiceText = `
SAVE & SMILE INVOICE
Order ID: ${order.id}
Date: ${order.date || order.createdAt}
----------------------------
CUSTOMER:
${customerName}
${customerMobile}
${customerCity}
${customerAddress}
${specialNotes ? `Note: ${specialNotes}\n` : ''}----------------------------
ITEMS:
${itemsText}
----------------------------
Subtotal: ${currency} ${Number(order.subtotal || 0).toLocaleString()}
Shipping: ${currency} ${Number(order.shippingFee || 0).toLocaleString()}
TOTAL DUE (COD): ${currency} ${Number(order.total || 0).toLocaleString()}
----------------------------
Thank you for shopping with Save & Smile!
https://saveandsmile.vercel.app
    `.trim();

    try {
      await Share.share({ message: invoiceText });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <Header
        title={`Order ${order.id}`}
        subtitle={order.date || order.createdAt || 'Order details'}
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity onPress={handleShareInvoice} style={styles.headerBtn}>
              <Share2 size={15} color={colors.primary.DEFAULT} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteHeaderBtn}>
              <Trash2 size={15} color={colors.danger.DEFAULT} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollPadding}>
        {/* Status Card & Actions */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.sectionLabel}>Current Order Status</Text>
              <View style={{ marginTop: 4 }}>
                <StatusBadge status={order.status} />
              </View>
            </View>
            <View style={styles.paymentMethod}>
              <Text style={styles.sectionLabel}>Payment</Text>
              <Text style={styles.paymentText}>{order.paymentMethod || 'Cash on Delivery'}</Text>
            </View>
          </View>

          {/* Quick status change buttons */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.md, marginBottom: 6 }]}>
            Change Fulfillment Status:
          </Text>
          <View style={styles.statusBtnRow}>
            {STATUS_OPTIONS.map(st => {
              const isActive = order.status === st;
              return (
                <TouchableOpacity
                  key={st}
                  disabled={isActive || isUpdating}
                  onPress={() => handleStatusChange(st)}
                  style={[
                    styles.statusChoiceBtn,
                    isActive && styles.statusChoiceBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChoiceText,
                      isActive && styles.statusChoiceTextActive,
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Customer Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Customer & Delivery Information</Text>

          <View style={styles.customerGrid}>
            <View style={styles.customerField}>
              <Text style={styles.fieldLabel}>Customer Name</Text>
              <Text style={styles.fieldValue}>{customerName}</Text>
            </View>

            {customerMobile ? (
              <View style={styles.customerField}>
                <Text style={styles.fieldLabel}>Mobile Phone</Text>
                <View style={styles.phoneActionRow}>
                  <Text style={styles.fieldValue}>{customerMobile}</Text>
                  <TouchableOpacity onPress={handleWhatsApp} style={styles.waBtn}>
                    <MessageSquare size={12} color="#059669" />
                    <Text style={styles.waBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCall} style={styles.callBtn}>
                    <Phone size={12} color="#0284c7" />
                    <Text style={styles.callBtnText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <View style={styles.customerField}>
              <Text style={styles.fieldLabel}>Delivery Address</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 2 }}>
                <MapPin size={13} color={colors.primary.DEFAULT} style={{ marginTop: 2 }} />
                <Text style={styles.fieldValue}>
                  {customerCity ? `${customerCity}, ` : ''}{customerAddress}
                </Text>
              </View>
            </View>

            {specialNotes ? (
              <View style={styles.notesBox}>
                <FileText size={13} color="#92400e" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notesLabel}>Customer Special Note</Text>
                  <Text style={styles.notesText}>{specialNotes}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Purchased Items List */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>
            Purchased Items ({order.items?.length || 0})
          </Text>

          {(order.items || []).map((item, idx) => {
            const itemName = item.product?.name || item.name || 'Product';
            const itemImg = item.image || item.product?.image || 'https://saveandsmile.vercel.app/images/cat1.jpg';

            return (
              <View key={item.id || idx} style={styles.itemRow}>
                <Image source={{ uri: itemImg }} style={styles.itemThumb} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{itemName}</Text>
                  {item.variantTitle ? (
                    <View style={styles.itemVariantTag}>
                      <Text style={styles.itemVariantText}>{item.variantTitle}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.itemSku}>SKU: {item.sku || 'N/A'}</Text>
                </View>

                <View style={styles.itemPriceCol}>
                  <Text style={styles.itemQty}>{item.qty} × {currency}{Number(item.unitPrice || 0).toLocaleString()}</Text>
                  <Text style={styles.itemTotal}>{currency} {Number(item.lineTotal || 0).toLocaleString()}</Text>
                </View>
              </View>
            );
          })}

          {/* Pricing Totals */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowLabel}>Subtotal</Text>
              <Text style={styles.totalRowValue}>{currency} {Number(order.subtotal || 0).toLocaleString()}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalRowLabel}>Shipping Fee</Text>
              <Text style={styles.totalRowValue}>
                {order.shippingFee ? `${currency} ${Number(order.shippingFee).toLocaleString()}` : 'FREE'}
              </Text>
            </View>

            {order.discount ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Discount</Text>
                <Text style={[styles.totalRowValue, { color: colors.danger.DEFAULT }]}>
                  -{currency} {Number(order.discount).toLocaleString()}
                </Text>
              </View>
            ) : null}

            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total Due (COD)</Text>
              <Text style={styles.grandTotalValue}>{currency} {Number(order.total || 0).toLocaleString()}</Text>
            </View>
          </View>
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
  notFoundContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 13,
    color: colors.slate.muted,
  },
  headerBtn: {
    padding: 6,
    backgroundColor: colors.primary.subtle,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary.border,
  },
  deleteHeaderBtn: {
    padding: 6,
    backgroundColor: colors.danger.subtle,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger.border,
  },
  content: {
    flex: 1,
  },
  scrollPadding: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate.border,
    ...spacing.shadow.sm,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate.divider,
    paddingBottom: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.slate.muted,
    textTransform: 'uppercase',
  },
  paymentMethod: {
    alignItems: 'flex-end',
  },
  paymentText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.slate.ink,
    marginTop: 2,
  },
  statusBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChoiceBtn: {
    backgroundColor: colors.slate.background,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  statusChoiceBtnActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  statusChoiceText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate.body,
  },
  statusChoiceTextActive: {
    color: colors.white,
  },
  customerGrid: {
    gap: spacing.sm,
  },
  customerField: {},
  fieldLabel: {
    fontSize: 10,
    color: colors.slate.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.slate.ink,
    marginTop: 1,
  },
  phoneActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  waBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  callBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284c7',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: spacing.borderRadius.md,
    padding: spacing.sm,
    gap: 6,
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400e',
  },
  notesText: {
    fontSize: 11.5,
    color: '#78350f',
    marginTop: 1,
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.slate.divider,
    paddingVertical: spacing.sm,
  },
  itemThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: colors.slate.background,
    borderWidth: 1,
    borderColor: colors.slate.border,
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.slate.ink,
    lineHeight: 15,
  },
  itemVariantTag: {
    backgroundColor: colors.primary.subtle,
    borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  itemVariantText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  itemSku: {
    fontSize: 9,
    color: colors.slate.muted,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  itemPriceCol: {
    alignItems: 'flex-end',
  },
  itemQty: {
    fontSize: 10.5,
    color: colors.slate.muted,
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate.ink,
    marginTop: 1,
  },
  totalsSection: {
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalRowLabel: {
    fontSize: 11,
    color: colors.slate.muted,
  },
  totalRowValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.slate.ink,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.slate.border,
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary.DEFAULT,
  },
});
