import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAdminData } from '../../context/AdminDataContext';
import { Review } from '../../types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Header } from '../../components/Header';
import { Star, Check, X, Trash2 } from 'lucide-react-native';

export const ReviewsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { reviews, approveReview, rejectReview, deleteReview } = useAdminData();
  const [filter, setFilter] = useState<'ALL' | 'pending' | 'approved' | 'rejected'>('ALL');

  const filtered = useMemo(() => {
    return reviews.filter(r => (filter === 'ALL' ? true : r.status === filter));
  }, [reviews, filter]);

  const handleApprove = async (r: Review) => {
    try {
      await approveReview(r.id);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not approve review.');
    }
  };

  const handleReject = async (r: Review) => {
    try {
      await rejectReview(r.id);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not reject review.');
    }
  };

  const handleDelete = (r: Review) => {
    Alert.alert('Delete Review', `Delete review by "${r.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReview(r.id);
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Could not delete review.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Customer Reviews"
        subtitle={`${reviews.length} feedback submissions`}
        onBack={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(['ALL', 'pending', 'approved', 'rejected'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            style={[styles.tabBtn, filter === tab && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
              {tab.toUpperCase()} ({reviews.filter(r => (tab === 'ALL' ? true : r.status === tab)).length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.reviewerName}>{item.name}</Text>
                {item.productName ? (
                  <Text style={styles.productRef} numberOfLines={1}>For: {item.productName}</Text>
                ) : null}
              </View>

              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map(st => (
                  <Star
                    key={st}
                    size={11}
                    color={st <= item.rating ? '#f59e0b' : colors.slate.border}
                    fill={st <= item.rating ? '#f59e0b' : 'transparent'}
                  />
                ))}
              </View>
            </View>

            <Text style={styles.reviewBody}>{item.text}</Text>

            <View style={styles.footerRow}>
              <View style={[styles.statusPill, item.status === 'approved' ? styles.statusApproved : item.status === 'rejected' ? styles.statusRejected : styles.statusPending]}>
                <Text style={styles.statusPillText}>{item.status.toUpperCase()}</Text>
              </View>

              <View style={styles.actions}>
                {item.status !== 'approved' && (
                  <TouchableOpacity onPress={() => handleApprove(item)} style={styles.actionApprove}>
                    <Check size={12} color="#059669" />
                    <Text style={styles.approveText}>Approve</Text>
                  </TouchableOpacity>
                )}
                {item.status !== 'rejected' && (
                  <TouchableOpacity onPress={() => handleReject(item)} style={styles.actionReject}>
                    <X size={12} color="#b45309" />
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionDelete}>
                  <Trash2 size={12} color={colors.danger.DEFAULT} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Reviews</Text>
            <Text style={styles.emptySubtitle}>No reviews matched the "{filter}" tab filter.</Text>
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
  tabsRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: spacing.borderRadius.sm,
    paddingVertical: 6,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.slate.ink,
    borderColor: colors.slate.ink,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.slate.muted,
  },
  tabTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate.border,
    ...spacing.shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  productRef: {
    fontSize: 10.5,
    color: colors.slate.muted,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewBody: {
    fontSize: 11.5,
    color: colors.slate.body,
    lineHeight: 16,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.slate.divider,
    paddingTop: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  statusPill: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusApproved: {
    backgroundColor: '#ecfdf5',
  },
  statusRejected: {
    backgroundColor: '#fee2e2',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionApprove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  approveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  actionReject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  rejectText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#b45309',
  },
  actionDelete: {
    padding: 4,
    backgroundColor: colors.danger.subtle,
    borderRadius: 4,
  },
  emptyContainer: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
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
  },
});
