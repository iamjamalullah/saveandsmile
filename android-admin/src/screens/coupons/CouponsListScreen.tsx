import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Switch, Alert } from 'react-native';
import { useAdminData } from '../../context/AdminDataContext';
import { Header } from '../../components/Header';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Coupon } from '../../types';
import { Tag, Plus, Trash2, CheckCircle2, X } from 'lucide-react-native';

export const CouponsListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { coupons, saveCoupon, deleteCoupon, isRefreshing, refreshAll, settings } = useAdminData();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<Partial<Coupon>>({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    minPurchaseAmount: 1000,
    isActive: true,
  });

  const handleSave = async () => {
    if (!form.code?.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid coupon code.');
      return;
    }

    try {
      await saveCoupon({
        ...form,
        code: form.code.trim().toUpperCase(),
        discountValue: Number(form.discountValue || 0),
        minPurchaseAmount: Number(form.minPurchaseAmount || 0),
      });
      setModalVisible(false);
      setForm({ code: '', discountType: 'percentage', discountValue: 10, minPurchaseAmount: 1000, isActive: true });
    } catch {
      Alert.alert('Error', 'Failed to save coupon.');
    }
  };

  const handleDelete = (id: string | number) => {
    Alert.alert('Delete Coupon', 'Are you sure you want to delete this coupon?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCoupon(id) },
    ]);
  };

  const renderItem = ({ item }: { item: Coupon }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.codeWrap}>
          <Tag size={16} color="#059669" />
          <Text style={styles.codeText}>{item.code}</Text>
        </View>
        <Switch
          value={item.isActive}
          onValueChange={val => saveCoupon({ ...item, isActive: val })}
          trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
          thumbColor={item.isActive ? '#059669' : '#94a3b8'}
        />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.discountText}>
          {item.discountType === 'percentage'
            ? `${item.discountValue}% OFF`
            : `${settings.currency || 'Rs.'} ${item.discountValue.toLocaleString()} FLAT OFF`}
        </Text>
        {item.minPurchaseAmount ? (
          <Text style={styles.minSpendText}>
            Min. Spend: {settings.currency || 'Rs.'} {item.minPurchaseAmount.toLocaleString()}
          </Text>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.usageText}>
          Used: {item.usedCount || 0} times
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Discounts & Coupons"
        subtitle={`${coupons.length} promotional codes`}
        onBack={() => navigation.goBack()}
        showLiveStore={false}
        rightAction={
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
            <Plus size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>New Coupon</Text>
          </TouchableOpacity>
        }
      />

      {coupons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Tag size={48} color={colors.slate.muted} />
          <Text style={styles.emptyTitle}>No Active Coupons</Text>
          <Text style={styles.emptySubtitle}>Create promo codes for marketing campaigns and discounts.</Text>
        </View>
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refreshAll}
          refreshing={isRefreshing}
        />
      )}

      {/* Add Coupon Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Discount Coupon</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.slate.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Coupon Code *</Text>
              <TextInput
                style={styles.input}
                value={form.code}
                onChangeText={code => setForm(f => ({ ...f, code }))}
                placeholder="e.g. SAVE10 or EIDSPECIAL"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Discount Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, form.discountType === 'percentage' && styles.typeBtnActive]}
                  onPress={() => setForm(f => ({ ...f, discountType: 'percentage' }))}
                >
                  <Text style={[styles.typeBtnText, form.discountType === 'percentage' && styles.typeBtnTextActive]}>
                    Percentage (%)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, form.discountType === 'fixed' && styles.typeBtnActive]}
                  onPress={() => setForm(f => ({ ...f, discountType: 'fixed' }))}
                >
                  <Text style={[styles.typeBtnText, form.discountType === 'fixed' && styles.typeBtnTextActive]}>
                    Flat Amount (Rs.)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {form.discountType === 'percentage' ? 'Discount Percentage (%)' : 'Flat Discount (Rs.)'}
              </Text>
              <TextInput
                style={styles.input}
                value={String(form.discountValue || '')}
                onChangeText={v => setForm(f => ({ ...f, discountValue: Number(v) || 0 }))}
                keyboardType="numeric"
                placeholder="10"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Minimum Purchase Amount (Rs.)</Text>
              <TextInput
                style={styles.input}
                value={String(form.minPurchaseAmount || '')}
                onChangeText={v => setForm(f => ({ ...f, minPurchaseAmount: Number(v) || 0 }))}
                keyboardType="numeric"
                placeholder="1000"
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <CheckCircle2 size={16} color="#ffffff" />
              <Text style={styles.saveBtnText}>Save Coupon</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate.canvas,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
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
    alignItems: 'center',
  },
  codeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064e3b',
    letterSpacing: 0.5,
  },
  cardBody: {
    marginVertical: spacing.sm,
  },
  discountText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.slate.ink,
  },
  minSpendText: {
    fontSize: 11,
    color: colors.slate.muted,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.slate.light,
  },
  usageText: {
    fontSize: 11,
    color: colors.slate.muted,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate.ink,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.slate.light,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: spacing.borderRadius.sm,
    padding: 10,
    fontSize: 13,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: colors.slate.light,
    borderWidth: 1,
    borderColor: colors.slate.border,
  },
  typeBtnActive: {
    backgroundColor: colors.primary.subtle,
    borderColor: colors.primary.DEFAULT,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate.muted,
  },
  typeBtnTextActive: {
    color: colors.primary.DEFAULT,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: spacing.borderRadius.md,
    gap: 6,
    marginTop: spacing.sm,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
