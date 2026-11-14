import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { uploadApi } from '../api/endpoints';
import { Camera, Image as ImageIcon, X, UploadCloud, CheckCircle } from 'lucide-react-native';

interface WebPImagePickerProps {
  currentImageUrl?: string;
  onImageUploaded: (webpUrl: string) => void;
  label?: string;
  aspect?: [number, number];
}

export const WebPImagePicker: React.FC<WebPImagePickerProps> = ({
  currentImageUrl,
  onImageUploaded,
  label = 'Product Image (WebP Auto-Converted)',
  aspect = [1, 1],
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImageUrl);

  const processAndUpload = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploading(true);
    try {
      const fileName = asset.fileName || `mobile_upload_${Date.now()}.jpg`;
      const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;

      // Hit centralized server-side WebP upload pipeline
      const res = await uploadApi.uploadImages([
        {
          name: fileName,
          dataUrl: base64Data,
        },
      ]);

      if (res?.urls && res.urls.length > 0) {
        const webpUrl = res.urls[0];
        setPreviewUrl(webpUrl);
        onImageUploaded(webpUrl);
      } else {
        throw new Error('Server returned empty image URL');
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message || 'Could not convert and upload image to WebP format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll access is needed to select product images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processAndUpload(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err?.message || 'Failed to open image gallery.');
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is needed to take product photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processAndUpload(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err?.message || 'Failed to capture photo.');
    }
  };

  const handleClear = () => {
    setPreviewUrl(undefined);
    onImageUploaded('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {previewUrl ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="cover" />
          <TouchableOpacity onPress={handleClear} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={14} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.webpBadge}>
            <CheckCircle size={10} color={colors.primary.DEFAULT} />
            <Text style={styles.webpBadgeText}>Server WebP</Text>
          </View>
        </View>
      ) : (
        <View style={styles.actionsBox}>
          {isUploading ? (
            <View style={styles.uploadingBox}>
              <ActivityIndicator color={colors.primary.DEFAULT} size="small" />
              <Text style={styles.uploadingText}>Converting to WebP & Uploading...</Text>
            </View>
          ) : (
            <View style={styles.buttonsRow}>
              <TouchableOpacity onPress={handlePickFromGallery} style={styles.actionBtn}>
                <ImageIcon size={16} color={colors.primary.DEFAULT} />
                <Text style={styles.actionBtnText}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCaptureCamera} style={styles.actionBtn}>
                <Camera size={16} color={colors.primary.DEFAULT} />
                <Text style={styles.actionBtnText}>Take Camera Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs + 2,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.slate.ink,
    marginBottom: 6,
  },
  previewContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.slate.border,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webpBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  webpBadgeText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  actionsBox: {
    borderWidth: 1.5,
    borderColor: colors.slate.border,
    borderStyle: 'dashed',
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.slate.background,
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.xs,
  },
  uploadingText: {
    fontSize: 11.5,
    color: colors.slate.muted,
    fontWeight: '500',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate.border,
    borderRadius: spacing.borderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate.body,
  },
});
