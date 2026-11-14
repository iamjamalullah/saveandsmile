import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Product } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Layers, Edit3, Trash2, RotateCw } from 'lucide-react-native';

interface ProductCardProps {
  product: Product;
  currency?: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStock: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency = 'Rs.',
  onEdit,
  onDelete,
  onToggleStock,
}) => {
  const discount =
    product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        {/* Product Thumbnail */}
        <Image
          source={{ uri: product.image || 'https://saveandsmile.vercel.app/images/cat1.jpg' }}
          style={styles.thumbnail}
        />

        {/* Details */}
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {product.name}
            </Text>
          </View>

          {/* Badges: Category & Variants */}
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText} numberOfLines={1}>{product.category}</Text>
            </View>

            {product.hasVariants && product.variants && product.variants.length > 0 && (
              <View style={styles.variantBadge}>
                <Layers size={9} color={colors.primary.DEFAULT} />
                <Text style={styles.variantBadgeText}>{product.variants.length} Variants</Text>
              </View>
            )}
          </View>

          {/* SKU */}
          <Text style={styles.skuText}>SKU: {product.sku || `GS-${product.id}`}</Text>

          {/* Price & Stock Row */}
          <View style={styles.priceStockRow}>
            <View style={styles.priceBlock}>
              <Text style={styles.price}>
                <Text style={styles.currency}>{currency} </Text>
                {product.price.toLocaleString()}
              </Text>
              {discount > 0 && (
                <View style={styles.oldPriceRow}>
                  <Text style={styles.oldPrice}>{currency} {product.oldPrice.toLocaleString()}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{discount}%</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Stock pill with restock toggle */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onToggleStock}
              style={[
                styles.stockPill,
                isOutOfStock ? styles.stockOut : isLowStock ? styles.stockLow : styles.stockIn,
              ]}
            >
              <Text
                style={[
                  styles.stockPillText,
                  isOutOfStock ? styles.stockOutText : isLowStock ? styles.stockLowText : styles.stockInText,
                ]}
              >
                {isOutOfStock ? 'Out of Stock' : `${product.stock} In Stock`}
              </Text>
              <RotateCw size={10} color={isOutOfStock ? colors.danger.DEFAULT : isLowStock ? colors.accent.dark : colors.primary.DEFAULT} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.actionFooter}>
        <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
          <Edit3 size={13} color={colors.primary.DEFAULT} />
          <Text style={styles.editBtnText}>Edit Product</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Trash2 size={13} color={colors.danger.DEFAULT} />
        </TouchableOpacity>
      </View>
    </View>
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
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: spacing.borderRadius.sm,
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
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  title: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.slate.ink,
    lineHeight: 16,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 3,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: colors.slate.background,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 4,
    paddingVertical: 1.5,
    paddingHorizontal: 5,
  },
  categoryBadgeText: {
    fontSize: 9.5,
    color: colors.slate.body,
    fontWeight: '500',
  },
  variantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary.subtle,
    borderWidth: 1,
    borderColor: colors.primary.border,
    borderRadius: 4,
    paddingVertical: 1.5,
    paddingHorizontal: 5,
  },
  variantBadgeText: {
    fontSize: 9.5,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  skuText: {
    fontSize: 9.5,
    color: colors.slate.muted,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  priceBlock: {},
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  currency: {
    fontSize: 10,
    color: colors.slate.muted,
  },
  oldPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  oldPrice: {
    fontSize: 9.5,
    color: colors.slate.muted,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: colors.danger.subtle,
    borderRadius: 3,
    paddingHorizontal: 3,
  },
  discountText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.danger.DEFAULT,
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 9999,
    borderWidth: 1,
  },
  stockIn: {
    backgroundColor: colors.primary.subtle,
    borderColor: colors.primary.border,
  },
  stockInText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  stockLow: {
    backgroundColor: colors.accent.subtle,
    borderColor: colors.accent.light,
  },
  stockLowText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent.dark,
  },
  stockOut: {
    backgroundColor: colors.danger.subtle,
    borderColor: colors.danger.border,
  },
  stockOutText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.danger.DEFAULT,
  },
  actionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.slate.divider,
    paddingTop: spacing.xs + 2,
    marginTop: spacing.xs + 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.primary.subtle,
    borderWidth: 1,
    borderColor: colors.primary.border,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.danger.subtle,
    borderWidth: 1,
    borderColor: colors.danger.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
