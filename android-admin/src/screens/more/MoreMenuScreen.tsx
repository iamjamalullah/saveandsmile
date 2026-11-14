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
import { useAdminData } from '../../context/AdminDataContext';
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
  ChevronRight,
  ShieldCheck,
  Server,
  Bell,
  MessageSquare,
  Tag,
  BarChart3,
} from 'lucide-react-native';

export const MoreMenuScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { unreadNotificationCount, inquiries } = useAdminData();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Save & Smile Admin?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const newInquiriesCount = inquiries.filter(i => i.status === 'new').length;

  const menuSections = [
    {
      label: 'Analytics & Alerts',
      items: [
        {
          id: 'Reports',
          label: 'Sales Reports & Analytics',
          subtitle: 'Revenue, fulfillment rate, and KPI charts',
          icon: <BarChart3 size={18} color="#059669" />,
          screen: 'Reports',
        },
        {
          id: 'Notifications',
          label: 'Notification Center',
          subtitle: 'Orders, inventory and inquiry alerts',
          icon: <Bell size={18} color="#d97706" />,
          screen: 'Notifications',
          badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
        },
        {
          id: 'Inquiries',
          label: 'Customer Inquiries & Support',
          subtitle: 'Direct customer contact and WhatsApp chats',
          icon: <MessageSquare size={18} color="#2563eb" />,
          screen: 'Inquiries',
          badge: newInquiriesCount > 0 ? newInquiriesCount : undefined,
        },
      ],
    },
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
        {
          id: 'Coupons',
          label: 'Discounts & Coupons',
          subtitle: 'Promotional codes, discounts and validity',
          icon: <Tag size={18} color="#7c3aed" />,
          screen: 'Coupons',
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
      <Header
        title="More Modules"
        subtitle="Complete administrative console"
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

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
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{user?.name || 'Store Administrator'}</Text>
              <View style={styles.roleBadge}>
                <ShieldCheck size={11} color="#047857" />
                <Text style={styles.roleBadgeText}>{(user?.role || 'admin').toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.profileEmail}>{user?.email || 'admin@saveandsmile.pk'}</Text>
          </View>
        </View>

        {/* Server & Backend Info Card */}
        <View style={styles.serverCard}>
          <Server size={14} color="#059669" />
          <Text style={styles.serverText}>
            Production Sync: <Text style={styles.serverBold}>saveandsmile.vercel.app/api</Text>
          </Text>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>{section.label.toUpperCase()}</Text>
            <View style={styles.sectionBox}>
              {section.items.map((item, iIdx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, iIdx < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconWrap}>{item.icon}</View>
                  <View style={styles.menuTextWrap}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      {item.badge !== undefined && (
                        <View style={styles.badgePill}>
                          <Text style={styles.badgePillText}>{item.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.slate.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={16} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out from Save &amp; Smile Admin</Text>
        </TouchableOpacity>

        <Text style={styles.footerVersion}>Save &amp; Smile Native Admin v1.0.0 (Build 1)</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate.canvas,
  },
  content: {
    flex: 1,
  },
  scrollPadding: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate.border,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate.ink,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    gap: 2,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
  },
  profileEmail: {
    fontSize: 11,
    color: colors.slate.muted,
    marginTop: 2,
  },
  serverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: spacing.lg,
    gap: 6,
  },
  serverText: {
    fontSize: 11,
    color: '#064e3b',
  },
  serverBold: {
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.slate.muted,
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
    letterSpacing: 0.5,
  },
  sectionBox: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.slate.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.slate.light,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.slate.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuTextWrap: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate.ink,
  },
  badgePill: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgePillText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  menuSubtitle: {
    fontSize: 11,
    color: colors.slate.muted,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 12,
    borderRadius: spacing.borderRadius.md,
    gap: 8,
    marginTop: spacing.md,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  footerVersion: {
    textAlign: 'center',
    fontSize: 10,
    color: colors.slate.muted,
    marginTop: spacing.lg,
  },
});
