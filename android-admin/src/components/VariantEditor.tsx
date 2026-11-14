import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { ColorGallery, ProductVariant, VariantOption, VariantValue } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { WebPImagePicker } from './WebPImagePicker';
import { Plus, Trash2, Layers, Check, Palette } from 'lucide-react-native';

const PRESET_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Brown', hex: '#8b5a2b' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Grey', hex: '#64748b' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Gold', hex: '#eab308' },
];

const PRESET_SIZES = ['Small', 'Medium', 'Large', 'XL', 'Standard'];

interface VariantEditorProps {
  options: VariantOption[];
  variants: ProductVariant[];
  colorGalleries: ColorGallery[];
  basePrice: number;
  baseSku: string;
  onOptionsChange: (options: VariantOption[]) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
  onColorGalleriesChange: (galleries: ColorGallery[]) => void;
}

export const VariantEditor: React.FC<VariantEditorProps> = ({
  options,
  variants,
  colorGalleries,
  basePrice,
  baseSku,
  onOptionsChange,
  onVariantsChange,
  onColorGalleriesChange,
}) => {
  const [newOptionName, setNewOptionName] = useState('');
  const [newValueText, setNewValueText] = useState<{ [optId: string]: string }>({});

  // Helper to re-generate variant matrix
  const regenerateVariants = (newOpts: VariantOption[]) => {
    if (newOpts.length === 0 || newOpts.every(o => o.values.length === 0)) {
      onVariantsChange([]);
      return;
    }

    const validOpts = newOpts.filter(o => o.values.length > 0);
    if (validOpts.length === 0) {
      onVariantsChange([]);
      return;
    }

    // Cartesian product
    const cartesian = (arrays: VariantValue[][]): VariantValue[][] => {
      return arrays.reduce(
        (acc, curr) => acc.flatMap(a => curr.map(b => [...a, b])),
        [[]] as VariantValue[][]
      );
    };

    const valueArrays = validOpts.map(o => o.values);
    const combinations = cartesian(valueArrays);

    const generated: ProductVariant[] = combinations.map((combo, idx) => {
      const title = combo.map(v => v.name).join(' / ');
      const optRecord: Record<string, string> = {};
      combo.forEach((v, i) => {
        optRecord[validOpts[i].name] = v.name;
      });

      // Preserve existing values if user had already edited this combination
      const existing = variants.find(v => v.title.toLowerCase() === title.toLowerCase());
      const skuSuffix = combo.map(v => v.name.slice(0, 3).toUpperCase()).join('-');

      return {
        id: existing?.id,
        title,
        sku: existing?.sku || `${baseSku || 'SKU'}-${skuSuffix}`,
        price: existing?.price || basePrice || 0,
        oldPrice: existing?.oldPrice || basePrice || 0,
        stockQuantity: existing !== undefined ? existing.stockQuantity : 10,
        image: existing?.image || '',
        options: optRecord,
        isAvailable: existing !== undefined ? existing.isAvailable : true,
      };
    });

    onVariantsChange(generated);
  };

  const addOption = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (options.some(o => o.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Duplicate Option', `Option "${trimmed}" already exists.`);
      return;
    }

    const newOpt: VariantOption = {
      id: `opt_${Date.now()}`,
      name: trimmed,
      values: [],
    };

    const next = [...options, newOpt];
    onOptionsChange(next);
    setNewOptionName('');
  };

  const removeOption = (id: string) => {
    const next = options.filter(o => o.id !== id);
    onOptionsChange(next);
    regenerateVariants(next);
  };

  const addValue = (optId: string, valName: string, hex?: string) => {
    const trimmed = valName.trim();
    if (!trimmed) return;

    const opt = options.find(o => o.id === optId);
    if (!opt) return;

    if (opt.values.some(v => v.name.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    const nextOpts = options.map(o => {
      if (o.id === optId) {
        return {
          ...o,
          values: [...o.values, { id: `val_${Date.now()}`, name: trimmed, hex }],
        };
      }
      return o;
    });

    onOptionsChange(nextOpts);
    regenerateVariants(nextOpts);

    // If color option, sync color galleries
    if (opt.name.toLowerCase() === 'color') {
      if (!colorGalleries.some(cg => cg.colorName.toLowerCase() === trimmed.toLowerCase())) {
        onColorGalleriesChange([
          ...colorGalleries,
          { colorName: trimmed, images: [], primaryImage: '' },
        ]);
      }
    }

    setNewValueText(prev => ({ ...prev, [optId]: '' }));
  };

  const removeValue = (optId: string, valId: string) => {
    const nextOpts = options.map(o => {
      if (o.id === optId) {
        return {
          ...o,
          values: o.values.filter(v => v.id !== valId),
        };
      }
      return o;
    });

    onOptionsChange(nextOpts);
    regenerateVariants(nextOpts);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, val: any) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: val };
    onVariantsChange(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Layers size={14} color={colors.primary.DEFAULT} />
          <Text style={styles.sectionTitle}>Product Variants & Options</Text>
        </View>
        <Text style={styles.variantCount}>{variants.length} combinations</Text>
      </View>

      {/* Quick Add Presets */}
      <View style={styles.presetButtonsRow}>
        <TouchableOpacity
          onPress={() => addOption('Color')}
          disabled={options.some(o => o.name.toLowerCase() === 'color')}
          style={[
            styles.presetBtn,
            options.some(o => o.name.toLowerCase() === 'color') && styles.presetBtnDisabled,
          ]}
        >
          <Palette size={11} color={colors.primary.DEFAULT} />
          <Text style={styles.presetBtnText}>+ Add Color Option</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => addOption('Size')}
          disabled={options.some(o => o.name.toLowerCase() === 'size')}
          style={[
            styles.presetBtn,
            options.some(o => o.name.toLowerCase() === 'size') && styles.presetBtnDisabled,
          ]}
        >
          <Plus size={11} color={colors.primary.DEFAULT} />
          <Text style={styles.presetBtnText}>+ Add Size Option</Text>
        </TouchableOpacity>
      </View>

      {/* Options List */}
      {options.map(opt => {
        const isColor = opt.name.toLowerCase() === 'color';
        const isSize = opt.name.toLowerCase() === 'size';

        return (
          <View key={opt.id} style={styles.optionBox}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionName}>{opt.name}</Text>
              <TouchableOpacity onPress={() => removeOption(opt.id)}>
                <Trash2 size={13} color={colors.danger.DEFAULT} />
              </TouchableOpacity>
            </View>

            {/* Presets chips */}
            {isColor && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetChipsScroll}>
                {PRESET_COLORS.map(c => {
                  const exists = opt.values.some(v => v.name.toLowerCase() === c.name.toLowerCase());
                  return (
                    <TouchableOpacity
                      key={c.name}
                      onPress={() => addValue(opt.id, c.name, c.hex)}
                      disabled={exists}
                      style={[styles.colorPresetChip, exists && styles.presetChipSelected]}
                    >
                      <View style={[styles.swatch, { backgroundColor: c.hex }]} />
                      <Text style={styles.chipText}>{c.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {isSize && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetChipsScroll}>
                {PRESET_SIZES.map(s => {
                  const exists = opt.values.some(v => v.name.toLowerCase() === s.toLowerCase());
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => addValue(opt.id, s)}
                      disabled={exists}
                      style={[styles.sizePresetChip, exists && styles.presetChipSelected]}
                    >
                      <Text style={styles.chipText}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Existing Values Chips */}
            <View style={styles.valuesList}>
              {opt.values.map(v => (
                <View key={v.id} style={styles.valueChip}>
                  {v.hex ? <View style={[styles.swatchSmall, { backgroundColor: v.hex }]} /> : null}
                  <Text style={styles.valueText}>{v.name}</Text>
                  <TouchableOpacity onPress={() => removeValue(opt.id, v.id!)}>
                    <Text style={styles.chipRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Manual value input */}
            <View style={styles.addValRow}>
              <TextInput
                style={styles.addValInput}
                placeholder={`Type custom ${opt.name}...`}
                placeholderTextColor={colors.slate.muted}
                value={newValueText[opt.id] || ''}
                onChangeText={t => setNewValueText(prev => ({ ...prev, [optId]: t }))}
              />
              <TouchableOpacity
                onPress={() => addValue(opt.id, newValueText[opt.id] || '')}
                style={styles.addValBtn}
              >
                <Plus size={13} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Generated Combinations Table */}
      {variants.length > 0 && (
        <View style={styles.variantsTableBox}>
          <Text style={styles.tableHeaderTitle}>Generated Variants ({variants.length})</Text>

          {variants.map((v, idx) => (
            <View key={v.title || idx} style={styles.variantRow}>
              <View style={styles.variantTopRow}>
                <Text style={styles.variantTitle}>{v.title}</Text>
                <TouchableOpacity
                  onPress={() => updateVariant(idx, 'isAvailable', !v.isAvailable)}
                  style={[styles.availBadge, !v.isAvailable && styles.availBadgeDisabled]}
                >
                  <Text style={styles.availText}>{v.isAvailable ? 'Active' : 'Disabled'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.variantInputsRow}>
                <View style={styles.inputCell}>
                  <Text style={styles.cellLabel}>Price</Text>
                  <TextInput
                    style={styles.cellInput}
                    keyboardType="numeric"
                    value={String(v.price || '')}
                    onChangeText={t => updateVariant(idx, 'price', Number(t) || 0)}
                  />
                </View>

                <View style={styles.inputCell}>
                  <Text style={styles.cellLabel}>Stock</Text>
                  <TextInput
                    style={styles.cellInput}
                    keyboardType="numeric"
                    value={String(v.stockQuantity || '')}
                    onChangeText={t => updateVariant(idx, 'stockQuantity', parseInt(t, 10) || 0)}
                  />
                </View>

                <View style={[styles.inputCell, { flex: 1.5 }]}>
                  <Text style={styles.cellLabel}>SKU</Text>
                  <TextInput
                    style={styles.cellInput}
                    value={v.sku}
                    onChangeText={t => updateVariant(idx, 'sku', t)}
                  />
                </View>
              </View>

              {/* Variant Specific WebP Image */}
              <WebPImagePicker
                currentImageUrl={v.image}
                onImageUploaded={url => updateVariant(idx, 'image', url)}
                label={`Image for "${v.title}"`}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  variantCount: {
    fontSize: 11,
    color: colors.slate.muted,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary.subtle,
    borderWidth: 1,
    borderColor: colors.primary.border,
    borderRadius: spacing.borderRadius.sm,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  presetBtnDisabled: {
    opacity: 0.4,
  },
  presetBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  optionBox: {
    backgroundColor: colors.slate.background,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate.ink,
    textTransform: 'uppercase',
  },
  presetChipsScroll: {
    marginBottom: 6,
  },
  colorPresetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 9999,
    paddingVertical: 3,
    paddingHorizontal: 7,
    marginRight: 6,
    gap: 4,
  },
  sizePresetChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 9999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  presetChipSelected: {
    opacity: 0.35,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.slate.border,
  },
  swatchSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 3,
  },
  chipText: {
    fontSize: 10,
    color: colors.slate.body,
    fontWeight: '500',
  },
  valuesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  valueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary.border,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  valueText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
    marginRight: 4,
  },
  chipRemove: {
    fontSize: 9,
    color: colors.danger.DEFAULT,
    fontWeight: '700',
  },
  addValRow: {
    flexDirection: 'row',
    gap: 6,
  },
  addValInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    color: colors.slate.ink,
  },
  addValBtn: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 6,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantsTableBox: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  tableHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate.ink,
    marginBottom: spacing.xs,
  },
  variantRow: {
    backgroundColor: colors.slate.background,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: spacing.borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  variantTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  variantTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  availBadge: {
    backgroundColor: colors.primary.subtle,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  availBadgeDisabled: {
    backgroundColor: colors.danger.subtle,
  },
  availText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  variantInputsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  inputCell: {
    flex: 1,
  },
  cellLabel: {
    fontSize: 9.5,
    color: colors.slate.muted,
    marginBottom: 2,
  },
  cellInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 11,
    color: colors.slate.ink,
  },
});
