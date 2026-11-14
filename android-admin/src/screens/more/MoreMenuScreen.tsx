import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Header } from '../../components/Header';
import {
  Tags,
  LayoutTemplate,
  Video,
  Star,
  Sliders,
  LogOut,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Server,
} from 'lucide-react-native';

export const MoreMenuScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Save & Smile Admin?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const menuSections = [
    {
      label: 'Storefront & Content',
      items: [
        {
          id: 'Categories',
          label: 'Categories Management',
          subtitle: 'Create, edit & upload category WebP thumbnails',
          icon: <Tags size={18} color={colors.primary.DEFAULT} />,
          screen: 'CategoriesTab',
        },
        {
          id: 'HomePageEditor',
          label: 'Home Page Editor',
          subtitle: 'Hero slides, promotional banners & sections',
          icon: <LayoutTemplate size={18} color={colors.primary.DEFAULT} />,
          screen: 'HomePageEditor',
        },
        {
          id: 'WatchShop',
          label: 'Watch & Shop',
          subtitle: 'Product video reels & promotional media',
          icon: <Video size={18} color={colors.primary.DEFAULT} />,
          screen: 'WatchShop',
        },
      ],
    },
    {
      label: 'Engagement & System',
      items: [
        {
          id: 'Reviews',
          label: 'Customer Reviews',
          subtitle: 'Approve, reject or moderate feedback',
          icon: <Star size={18} color="#f59e0b" />,
          screen: 'Reviews',
        },
        {
          id: 'Settings',
          label: 'Store Settings',
          subtitle: 'Business contact, delivery charges & thresholds',
          icon: <Sliders size={18} color={colors.slate.ink} />,
          screen: 'Settings',
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="More Modules" subtitle="Complete management options" />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollPadding}>
        {/* Staff Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'SA')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Store Administrator'}</Text>
            <Text style={styles.profileRole}>Role: {user?.role?.toUpperCase() || 'ADMINISTRATOR'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'admin@saveandsmile.com'}</Text>
          </View>
        </View>

        {/* Menu Groups */}
        {menuSections.map(sec => (
          <View key={sec.label} style={styles.menuSection}>
            <Text style={styles.sectionHeading}>{sec.label}</Text>
            <View style={styles.card}>
              {sec.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => navigation.navigate(item.screen)}
                  style={[
                    styles.menuRow,
                    idx < sec.items.length - 1 && styles.menuRowDivider,
                  ]}
                >
                  <View style={styles.menuIconBox}>{item.icon}</View>
                  <View style={styles.menuTextBox}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <ChevronRight size={15} color={colors.slate.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* System & Production Status */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeading}>System & Server Status</Text>
          <View style={styles.card}>
            <View style={styles.serverRow}>
              <Server size={16} color={colors.primary.DEFAULT} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.serverTitle}>Authoritative Production API</Text>
                <Text style={styles.serverUrl}>https://saveandsmile.vercel.app/api</Text>
              </View>
              <View style={styles.onlineBadge}>
                <Text style={styles.onlineText}>Connected</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} color={colors.danger.DEFAULT} />
          <Text style={styles.logoutText}>Sign Out of Administrator Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate.background,
  },
  content: {
    flex: 1,
  },
  scrollPadding: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate.border,
    ...spacing.shadow.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  profileRole: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
    marginTop: 1,
  },
  profileEmail: {
    fontSize: 11,
    color: colors.slate.muted,
    marginTop: 1,
  },
  menuSection: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate.border,
    ...spacing.shadow.sm,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  menuRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.slate.divider,
  },
  menuIconBox: {
    width: 32,
    alignItems: 'center',
    marginRight: 10,
  },
  menuTextBox: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.slate.ink,
  },
  menuSubtitle: {
    fontSize: 10.5,
    color: colors.slate.muted,
    marginTop: 1,
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  serverTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate.ink,
  },
  serverUrl: {
    fontSize: 10.5,
    color: colors.slate.muted,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  onlineBadge: {
    backgroundColor: colors.primary.subtle,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.danger.subtle,
    borderWidth: 1,
    borderColor: colors.danger.border,
    borderRadius: spacing.borderRadius.lg,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger.DEFAULT,
  },
});
