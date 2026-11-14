import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAdminData } from '../../context/AdminDataContext';
import { watchShopApi } from '../../api/endpoints';
import { WatchShopItem } from '../../types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Header } from '../../components/Header';
import { WebPImagePicker } from '../../components/WebPImagePicker';
import { Plus, Trash2, Video, X, Check } from 'lucide-react-native';

export const WatchShopScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { watchShop, settings, refreshAll } = useAdminData();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [price, setPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !videoUrl.trim()) {
      Alert.alert('Required', 'Video title and streaming/video URL are required.');
      return;
    }

    setIsSaving(true);
    try {
      await watchShopApi.createItem({
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        thumbnail: thumbnail || 'https://saveandsmile.vercel.app/images/cat1.jpg',
        price: Number(price) || 0,
      });
      await refreshAll();
      setModalOpen(false);
      setTitle('');
      setVideoUrl('');
      setThumbnail('');
      setPrice('');
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save Watch & Shop video item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item: WatchShopItem) => {
    Alert.alert('Delete Reel', `Delete video reel "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await watchShopApi.deleteItem(item.id);
            await refreshAll();
          } catch (err: any) {
            Alert.alert('Delete Failed', err?.message || 'Could not delete item.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Watch & Shop"
        subtitle="Manage video product reels & promotions"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={() => setModalOpen(true)} style={styles.addBtn}>
            <Plus size={14} color={colors.white} />
            <Text style={styles.addBtnText}>Add Reel</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={watchShop}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={{ uri: item.thumbnail || 'https://saveandsmile.vercel.app/images/cat1.jpg' }}
              style={styles.thumbnail}
            />
            <View style={styles.infoCol}>
              <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.metaRow}>
                <Video size={11} color={colors.primary.DEFAULT} />
                <Text style={styles.metaText} numberOfLines={1}>{item.videoUrl}</Text>
              </View>
              {item.price ? (
                <Text style={styles.priceText}>
                  {settings?.currency || 'Rs.'} {Number(item.price).toLocaleString()}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Trash2 size={13} color={colors.danger.DEFAULT} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Watch & Shop Reels</Text>
            <Text style={styles.emptySubtitle}>Tap "+ Add Reel" to publish your first video product showcase.</Text>
          </View>
        }
      />

      {/* Add Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Watch & Shop Video</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <X size={18} color={colors.slate.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Video Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Smart Watch Water Test Demonstration"
              placeholderTextColor={colors.slate.muted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>Video MP4 / Stream URL *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://.../video.mp4 or YouTube Short"
              placeholderTextColor={colors.slate.muted}
              value={videoUrl}
              onChangeText={setVideoUrl}
            />

            <Text style={styles.inputLabel}>Tagged Product Price (Rs.)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="2500"
              keyboardType="numeric"
              placeholderTextColor={colors.slate.muted}
              value={price}
              onChangeText={setPrice}
            />

            <WebPImagePicker
              currentImageUrl={thumbnail}
              onImageUploaded={setThumbnail}
              label="Video Thumbnail Image (WebP)"
            />

            <TouchableOpacity
              onPress={handleCreate}
              disabled={isSaving}
              style={[styles.modalSaveBtn, isSaving && { opacity: 0.6 }]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Check size={14} color={colors.white} />
                  <Text style={styles.modalSaveText}>Save Reel</Text>
                </>
              )}
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
    backgroundColor: colors.slate.background,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: spacing.borderRadius.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 3,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate.border,
    ...spacing.shadow.sm,
  },
  thumbnail: {
    width: 50,
    height: 70,
    borderRadius: spacing.borderRadius.sm,
    backgroundColor: colors.slate.background,
    borderWidth: 1,
    borderColor: colors.slate.border,
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.slate.ink,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    fontSize: 10,
    color: colors.slate.muted,
    flex: 1,
  },
  priceText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
    marginTop: 3,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: colors.danger.subtle,
    borderWidth: 1,
    borderColor: colors.danger.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.xl,
    padding: spacing.xl,
    ...spacing.shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate.divider,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate.body,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.slate.background,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    fontSize: 12,
    color: colors.slate.ink,
    marginBottom: spacing.sm,
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: spacing.borderRadius.md,
    paddingVertical: 10,
    gap: 6,
    marginTop: spacing.md,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});
