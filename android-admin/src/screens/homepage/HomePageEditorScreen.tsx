import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { homepageApi } from '../../api/endpoints';
import { HomeSection } from '../../types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Header } from '../../components/Header';
import { WebPImagePicker } from '../../components/WebPImagePicker';
import { Send, CheckCircle2, Plus, Trash2, Eye } from 'lucide-react-native';

export const HomePageEditorScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  // New slide form
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideSubtitle, setNewSlideSubtitle] = useState('');
  const [newSlideImage, setNewSlideImage] = useState('');

  const loadSections = async () => {
    setIsLoading(true);
    try {
      const draft = await homepageApi.getDraft();
      if (draft && draft.length > 0) {
        setSections(draft);
      } else {
        const live = await homepageApi.getSections();
        setSections(live || []);
      }
    } catch {
      // Fallback
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  const handleToggleSection = (id: string) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await homepageApi.saveDraft(sections);
      await homepageApi.publishSections(sections);
      Alert.alert(
        'Published!',
        'Homepage modifications have been published to https://saveandsmile.vercel.app successfully.'
      );
    } catch (err: any) {
      Alert.alert('Publish Failed', err?.message || 'Could not publish homepage changes.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Home Page Editor"
        subtitle="Manage storefront sections and hero slides"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={handlePublish}
            disabled={isPublishing}
            style={[styles.publishBtn, isPublishing && { opacity: 0.6 }]}
          >
            {isPublishing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Send size={13} color={colors.white} />
                <Text style={styles.publishBtnText}>Publish Live</Text>
              </>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollPadding}>
        {/* Publish Banner */}
        <View style={styles.infoBanner}>
          <CheckCircle2 size={16} color={colors.primary.DEFAULT} />
          <Text style={styles.infoBannerText}>
            Changes saved here update the live storefront instantly upon tapping "Publish Live".
          </Text>
        </View>

        {/* Hero Banner Section */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Add Promotional Hero Banner</Text>

          <Text style={styles.inputLabel}>Banner Headline</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Mega Electronics Sale - Up to 40% OFF"
            placeholderTextColor={colors.slate.muted}
            value={newSlideTitle}
            onChangeText={setNewSlideTitle}
          />

          <Text style={styles.inputLabel}>Subheading / Caption</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Limited Stock Available Nationwide"
            placeholderTextColor={colors.slate.muted}
            value={newSlideSubtitle}
            onChangeText={setNewSlideSubtitle}
          />

          <WebPImagePicker
            currentImageUrl={newSlideImage}
            onImageUploaded={setNewSlideImage}
            label="Hero Slide Image (WebP Auto-Converted)"
            aspect={[16, 9]}
          />
        </View>

        {/* Sections Listing */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Storefront Display Sections ({sections.length})</Text>

          {isLoading ? (
            <ActivityIndicator color={colors.primary.DEFAULT} style={{ padding: 20 }} />
          ) : sections.length === 0 ? (
            <Text style={styles.emptyText}>No customizable sections found in database.</Text>
          ) : (
            sections.map(s => (
              <View key={s.id} style={styles.sectionRow}>
                <View style={styles.sectionInfo}>
                  <Text style={styles.sectionTitle}>{s.title || s.id}</Text>
                  <Text style={styles.sectionSubtitle}>Type: {s.type || 'Custom'}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleToggleSection(s.id)}
                  style={[styles.togglePill, s.enabled && styles.togglePillActive]}
                >
                  <Text style={[styles.toggleText, s.enabled && styles.toggleTextActive]}>
                    {s.enabled ? 'Enabled' : 'Hidden'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
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
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: spacing.borderRadius.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 4,
  },
  publishBtnText: {
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary.subtle,
    borderWidth: 1,
    borderColor: colors.primary.border,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
  },
  infoBannerText: {
    fontSize: 11.5,
    color: colors.primary.DEFAULT,
    flex: 1,
    fontWeight: '500',
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
  emptyText: {
    fontSize: 11.5,
    color: colors.slate.muted,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.slate.divider,
    paddingVertical: spacing.sm,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.slate.ink,
  },
  sectionSubtitle: {
    fontSize: 10.5,
    color: colors.slate.muted,
    marginTop: 1,
  },
  togglePill: {
    backgroundColor: colors.slate.background,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: 9999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  togglePillActive: {
    backgroundColor: colors.primary.subtle,
    borderColor: colors.primary.border,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.slate.muted,
  },
  toggleTextActive: {
    color: colors.primary.DEFAULT,
  },
});
