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
  Alert,
} from 'react-native';
import { useAdminData } from '../../context/AdminDataContext';
import { Product } from '../../types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Header } from '../../components/Header';
import { ProductCard } from '../../components/ProductCard';
import { Search, Plus, X } from 'lucide-react-native';

export const ProductsListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { products, categories, settings, isRefreshing, refreshAll, deleteProduct, toggleProductStock } = useAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStock, setSelectedStock] = useState<'ALL' | 'in-stock' | 'low-stock' | 'out-of-stock'>('ALL');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category
      if (selectedCategory !== 'ALL' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Stock
      if (selectedStock === 'in-stock' && p.stock <= 5) return false;
      if (selectedStock === 'low-stock' && (p.stock === 0 || p.stock > 5)) return false;
      if (selectedStock === 'out-of-stock' && p.stock > 0) return false;

      // Search
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase().trim();
        const name = (p.name || '').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return name.includes(s) || sku.includes(s) || cat.includes(s);
      }

      return true;
    });
  }, [products, selectedCategory, selectedStock, searchTerm]);

  const handleDelete = (p: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${p.name}"? This removes it from the catalog.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(p.id);
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete product.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Products Catalog"
        subtitle={`${products.length} gadgets across ${categories.length} categories`}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('ProductEdit', { product: null })}
            style={styles.addBtn}
          >
            <Plus size={14} color={colors.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchWrapper}>
          <Search size={15} color={colors.slate.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products by title, SKU..."
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

      {/* Category Horizontal Filter */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <TouchableOpacity
            onPress={() => setSelectedCategory('ALL')}
            style={[styles.categoryChip, selectedCategory === 'ALL' && styles.categoryChipActive]}
          >
            <Text style={[styles.categoryChipText, selectedCategory === 'ALL' && styles.categoryChipTextActive]}>
              All ({products.length})
            </Text>
          </TouchableOpacity>

          {categories.map(c => {
            const isActive = selectedCategory.toLowerCase() === c.name.toLowerCase();
            const count = products.filter(p => p.category.toLowerCase() === c.name.toLowerCase()).length;
            return (
              <TouchableOpacity
                key={c.id || c.name}
                onPress={() => setSelectedCategory(c.name)}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                  {c.icon || '📦'} {c.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Stock Quick Filter Chips */}
      <View style={styles.stockChipsRow}>
        {(['ALL', 'in-stock', 'low-stock', 'out-of-stock'] as const).map(st => {
          const isActive = selectedStock === st;
          const labels = {
            ALL: 'All Stock',
            'in-stock': 'In Stock (>5)',
            'low-stock': 'Low Stock (1-5)',
            'out-of-stock': 'Out of Stock (0)',
          };

          return (
            <TouchableOpacity
              key={st}
              onPress={() => setSelectedStock(st)}
              style={[styles.stockChip, isActive && styles.stockChipActive]}
            >
              <Text style={[styles.stockChipText, isActive && styles.stockChipTextActive]}>
                {labels[st]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
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
          <ProductCard
            product={item}
            currency={settings?.currency}
            onEdit={() => navigation.navigate('ProductEdit', { product: item })}
            onDelete={() => handleDelete(item)}
            onToggleStock={() => toggleProductStock(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your category filter or search query.
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
  categoriesWrapper: {
    paddingVertical: spacing.xs + 2,
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  categoryChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  categoryChipActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  categoryChipText: {
    fontSize: 11,
    color: colors.slate.body,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  stockChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 6,
    paddingBottom: spacing.xs,
  },
  stockChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  stockChipActive: {
    backgroundColor: colors.slate.ink,
    borderColor: colors.slate.ink,
  },
  stockChipText: {
    fontSize: 10,
    color: colors.slate.muted,
  },
  stockChipTextActive: {
    color: colors.white,
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
