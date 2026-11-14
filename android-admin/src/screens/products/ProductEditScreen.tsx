import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAdminData } from '../../context/AdminDataContext';
import { ColorGallery, Product, ProductVariant, VariantOption } from '../../types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Header } from '../../components/Header';
import { WebPImagePicker } from '../../components/WebPImagePicker';
import { VariantEditor } from '../../components/VariantEditor';
import { Save, Check } from 'lucide-react-native';

export const ProductEditScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const existingProduct: Product | null = route.params?.product || null;
  const isEditing = Boolean(existingProduct?.id);

  const { categories, saveProduct } = useAdminData();

  // Form states
  const [name, setName] = useState(existingProduct?.name || '');
  const [sku, setSku] = useState(existingProduct?.sku || '');
  const [category, setCategory] = useState(existingProduct?.category || categories[0]?.name || 'Storage & Organization');
  const [price, setPrice] = useState(existingProduct ? String(existingProduct.price) : '');
  const [oldPrice, setOldPrice] = useState(existingProduct?.oldPrice ? String(existingProduct.oldPrice) : '');
  const [stock, setStock] = useState(existingProduct ? String(existingProduct.stock) : '15');
  const [description, setDescription] = useState(existingProduct?.description || '');
  const [image, setImage] = useState(existingProduct?.image || '');
  const [images, setImages] = useState<string[]>(existingProduct?.images || []);

  // Multi-variant states
  const [hasVariants, setHasVariants] = useState(Boolean(existingProduct?.hasVariants));
  const [options, setOptions] = useState<VariantOption[]>(existingProduct?.options || []);
  const [variants, setVariants] = useState<ProductVariant[]>(existingProduct?.variants || []);
  const [colorGalleries, setColorGalleries] = useState<ColorGallery[]>(existingProduct?.colorGalleries || []);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Product title / name is required.');
      return;
    }
    if (!price.trim() || isNaN(Number(price))) {
      Alert.alert('Validation Error', 'A valid product price is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Product> = {
        id: existingProduct?.id,
        name: name.trim(),
        sku: sku.trim() || `GS-${Date.now().toString().slice(-4)}`,
        category,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : Number(price),
        stock: parseInt(stock, 10) || 0,
        description: description.trim(),
        image: image || (images.length > 0 ? images[0] : 'https://saveandsmile.vercel.app/images/cat1.jpg'),
        images: images.length > 0 ? images : [image || 'https://saveandsmile.vercel.app/images/cat1.jpg'],
        hasVariants,
        options: hasVariants ? options : [],
        variants: hasVariants ? variants : [],
        colorGalleries: hasVariants ? colorGalleries : [],
      };

      await saveProduct(payload);
      Alert.alert('Success', `Product "${name}" saved and persisted successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save product to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit Product' : 'Add New Product'}
        subtitle={isEditing ? `ID: ${existingProduct?.id}` : 'Catalog Management'}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Check size={14} color={colors.white} />
                <Text style={styles.saveBtnText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollPadding}>
        {/* Basic Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Basic Details</Text>

          <Text style={styles.inputLabel}>Product Title *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. S7 Ultra Smart Watch"
            placeholderTextColor={colors.slate.muted}
            value={name}
            onChangeText={setName}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>SKU Code</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. GS-1051"
                placeholderTextColor={colors.slate.muted}
                value={sku}
                onChangeText={setSku}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.inputLabel}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
                {categories.map(c => {
                  const isSel = category.toLowerCase() === c.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={c.name}
                      onPress={() => setCategory(c.name)}
                      style={[styles.catPickChip, isSel && styles.catPickChipActive]}
                    >
                      <Text style={[styles.catPickText, isSel && styles.catPickTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Pricing & Stock Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Pricing & Inventory</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Selling Price (Rs.) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2000"
                keyboardType="numeric"
                placeholderTextColor={colors.slate.muted}
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.inputLabel}>Original / Old Price</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2500"
                keyboardType="numeric"
                placeholderTextColor={colors.slate.muted}
                value={oldPrice}
                onChangeText={setOldPrice}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.inputLabel}>Stock Quantity</Text>
              <TextInput
                style={styles.textInput}
                placeholder="15"
                keyboardType="numeric"
                placeholderTextColor={colors.slate.muted}
                value={stock}
                onChangeText={setStock}
              />
            </View>
          </View>
        </View>

        {/* Media & WebP Image Upload Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Media & Image System (WebP Pipeline)</Text>

          <WebPImagePicker
            currentImageUrl={image}
            onImageUploaded={url => {
              setImage(url);
              if (url && !images.includes(url)) setImages(prev => [url, ...prev]);
            }}
            label="Main Product Image (Server-Converted WebP)"
          />
        </View>

        {/* Multi-Variants Configuration Card */}
        <View style={styles.card}>
          <View style={styles.variantsHeader}>
            <Text style={styles.cardHeading}>Multi-Variant Configuration</Text>
            <TouchableOpacity
              onPress={() => setHasVariants(v => !v)}
              style={[styles.toggleBtn, hasVariants && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleBtnText, hasVariants && styles.toggleBtnTextActive]}>
                {hasVariants ? 'Variants Enabled' : 'Enable Variants'}
              </Text>
            </TouchableOpacity>
          </View>

          {hasVariants ? (
            <VariantEditor
              options={options}
              variants={variants}
              colorGalleries={colorGalleries}
              basePrice={Number(price) || 0}
              baseSku={sku}
              onOptionsChange={setOptions}
              onVariantsChange={setVariants}
              onColorGalleriesChange={setColorGalleries}
            />
          ) : (
            <Text style={styles.variantsDisabledText}>
              Enable variants if this gadget comes in multiple colors, sizes, or specifications.
            </Text>
          )}
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Product Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter product description, key highlights and features..."
            placeholderTextColor={colors.slate.muted}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: spacing.borderRadius.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 4,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
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
  textArea: {
    height: 90,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  col: {
    flex: 1,
  },
  catPickChip: {
    backgroundColor: colors.slate.background,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 5,
  },
  catPickChipActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  catPickText: {
    fontSize: 10.5,
    color: colors.slate.muted,
  },
  catPickTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  variantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  toggleBtn: {
    backgroundColor: colors.slate.background,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary.subtle,
    borderColor: colors.primary.border,
  },
  toggleBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.slate.body,
  },
  toggleBtnTextActive: {
    color: colors.primary.DEFAULT,
  },
  variantsDisabledText: {
    fontSize: 11.5,
    color: colors.slate.muted,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
});
