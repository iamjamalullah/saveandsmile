import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { ArrowLeft, ExternalLink, Bell, Wifi, WifiOff, RefreshCw } from 'lucide-react-native';
import { useAdminData } from '../context/AdminDataContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showLiveStore?: boolean;
  onNotificationPress?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  showLiveStore = true,
  onNotificationPress,
  rightAction,
}) => {
  const { connectionStatus, unreadNotificationCount } = useAdminData();

  const openStore = () => {
    Linking.openURL('https://saveandsmile.vercel.app').catch(() => {});
  };

  const renderConnectionPill = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
        );
      case 'syncing':
        return (
          <View style={[styles.statusDot, { backgroundColor: '#3b82f6' }]} />
        );
      case 'connecting':
        return (
          <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
        );
      case 'disconnected':
      default:
        return (
          <View style={[styles.statusDot, { backgroundColor: '#ef4444' }]} />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={20} color={colors.slate.ink} />
          </TouchableOpacity>
        )}
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <View style={styles.titleWithDot}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              {renderConnectionPill()}
            </View>
            {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.right}>
        {rightAction}

        {onNotificationPress && (
          <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
            <Bell size={18} color={colors.slate.ink} />
            {unreadNotificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {showLiveStore && (
          <TouchableOpacity onPress={openStore} style={styles.storeButton}>
            <ExternalLink size={12} color={colors.primary.DEFAULT} />
            <Text style={styles.storeButtonText}>Live</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    paddingHorizontal: spacing.md,
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
  titleRow: {
    flex: 1,
  },
  titleContainer: {
    justifyContent: 'center',
  },
  titleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate.ink,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 10,
    color: colors.slate.muted,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
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
    gap: 3,
  },
  storeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
});
