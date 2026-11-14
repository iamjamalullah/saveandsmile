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
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Header } from '../../components/Header';
import { Save, Check } from 'lucide-react-native';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { settings, updateStoreSettings } = useAdminData();

  const [name, setName] = useState(settings?.name || 'Save & Smile');
  const [tagline, setTagline] = useState(settings?.tagline || 'Your Trusted Online Shopping Hub');
  const [phone, setPhone] = useState(settings?.phone || '0333-7221552');
  const [whatsapp, setWhatsapp] = useState(settings?.whatsapp || '923337221552');
  const [currency, setCurrency] = useState(settings?.currency || 'Rs.');
  const [shippingFee, setShippingFee] = useState(String(settings?.shippingFee || 200));
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    String(settings?.freeShippingThreshold || 3000)
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateStoreSettings({
        name: name.trim(),
        tagline: tagline.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        currency: currency.trim() || 'Rs.',
        shippingFee: Number(shippingFee) || 0,
        freeShippingThreshold: Number(freeShippingThreshold) || 0,
      });
      Alert.alert('Settings Saved', 'Store configuration successfully updated in production database.');
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Store Settings"
        subtitle="Business profile & fulfillment defaults"
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
        {/* Business Identity */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Brand & Storefront Identity</Text>

          <Text style={styles.inputLabel}>Store Brand Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Save & Smile"
            placeholderTextColor={colors.slate.muted}
          />

          <Text style={styles.inputLabel}>Tagline / Motto</Text>
          <TextInput
            style={styles.textInput}
            value={tagline}
            onChangeText={setTagline}
            placeholder="Your Trusted Online Shopping Hub"
            placeholderTextColor={colors.slate.muted}
          />

          <Text style={styles.inputLabel}>Support Phone Number</Text>
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="0333-7221552"
            placeholderTextColor={colors.slate.muted}
          />

          <Text style={styles.inputLabel}>WhatsApp Chat Number (with country code)</Text>
          <TextInput
            style={styles.textInput}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="923337221552"
            placeholderTextColor={colors.slate.muted}
          />
        </View>

        {/* Shipping & Delivery Configuration */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Fulfillment & Pricing Settings</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Standard Shipping (Rs.)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={shippingFee}
                onChangeText={setShippingFee}
                placeholder="200"
                placeholderTextColor={colors.slate.muted}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.inputLabel}>Free Shipping Over (Rs.)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={freeShippingThreshold}
                onChangeText={setFreeShippingThreshold}
                placeholder="3000"
                placeholderTextColor={colors.slate.muted}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Currency Symbol</Text>
          <TextInput
            style={styles.textInput}
            value={currency}
            onChangeText={setCurrency}
            placeholder="Rs."
            placeholderTextColor={colors.slate.muted}
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
    gap: spacing.md,
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  col: {
    flex: 1,
  },
});
