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
import { Category } from '../../types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Header } from '../../components/Header';
import { WebPImagePicker } from '../../components/WebPImagePicker';
import { Plus, Edit3, Trash2, X, Check } from 'lucide-react-native';

export const CategoriesListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { categories, products, saveCategory, deleteCategory } = useAdminData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [image, setImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenAdd = () => {
    setEditingCat(null);
    setName('');
    setIcon('📦');
    setImage('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCat(c);
    setName(c.name);
    setIcon(c.icon || '📦');
    setImage(c.image || '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Category name is required.');
      return;
    }

    setIsSaving(true);
    try {
      await saveCategory({
        id: editingCat?.id,
        name: name.trim(),
        icon: icon.trim() || '📦',
        image: image || '/images/cat1.jpg',
      });
      setModalOpen(false);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (c: Category) => {
    const assignedProducts = products.filter(
      p => p.category.toLowerCase() === c.name.toLowerCase()
    );

    if (assignedProducts.length > 0) {
      Alert.alert(
        'Cannot Delete Category',
        `Category "${c.name}" currently has ${assignedProducts.length} assigned products. Please reassign or delete the products first.`
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete category "${c.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(c.id);
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete category.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Categories"
        subtitle={`${categories.length} catalog collections`}
        rightAction={
          <TouchableOpacity onPress={handleOpenAdd} style={styles.addBtn}>
            <Plus size={14} color={colors.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={categories}
        keyExtractor={item => String(item.id || item.name)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const count = products.filter(
            p => p.category.toLowerCase() === item.name.toLowerCase()
          ).length;

          return (
            <View style={styles.card}>
              <Image
                source={{ uri: item.image || 'https://saveandsmile.vercel.app/images/cat1.jpg' }}
                style={styles.thumbnail}
              />
              <View style={styles.infoCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.icon}>{item.icon || '📦'}</Text>
                  <Text style={styles.name}>{item.name}</Text>
                </View>
                <Text style={styles.countText}>{count} products assigned</Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={() => handleOpenEdit(item)} style={styles.editBtn}>
                  <Edit3 size={13} color={colors.primary.DEFAULT} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                  <Trash2 size={13} color={colors.danger.DEFAULT} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Add / Edit Category Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCat ? `Edit Category: ${editingCat.name}` : 'Add New Category'}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <X size={18} color={colors.slate.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Category Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Smart Watches"
              placeholderTextColor={colors.slate.muted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Emoji / Icon</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. ⌚ or 📦"
              placeholderTextColor={colors.slate.muted}
              value={icon}
              onChangeText={setIcon}
            />

            <WebPImagePicker
              currentImageUrl={image}
              onImageUploaded={setImage}
              label="Category Thumbnail (WebP)"
            />

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.modalSaveBtn, isSaving && { opacity: 0.6 }]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Check size={14} color={colors.white} />
                  <Text style={styles.modalSaveText}>Save Category</Text>
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
    width: 44,
    height: 44,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.slate.background,
    borderWidth: 1,
    borderColor: colors.slate.border,
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  countText: {
    fontSize: 11,
    color: colors.slate.muted,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: colors.primary.subtle,
    borderWidth: 1,
    borderColor: colors.primary.border,
    alignItems: 'center',
    justifyContent: 'center',
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
