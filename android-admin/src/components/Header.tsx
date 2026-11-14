import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { ArrowLeft, ExternalLink, Bell } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showLiveStore?: boolean;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  showLiveStore = true,
  rightAction,
}) => {
  const openStore = () => {
    Linking.openURL('https://saveandsmile.vercel.app').catch(() => {});
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={20} color={colors.slate.ink} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.right}>
        {rightAction}
        {showLiveStore && (
          <TouchableOpacity onPress={openStore} style={styles.storeButton}>
            <ExternalLink size={13} color={colors.primary.DEFAULT} />
            <Text style={styles.storeButtonText}>Live Store</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate.ink,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.slate.muted,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.subtle,
    borderWidth: 1,
    borderColor: colors.primary.border,
    borderRadius: spacing.borderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  storeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
});
