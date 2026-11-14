import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus } from '../types';
import { colors } from '../theme/colors';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Pending':
        return colors.badge.pending;
      case 'Processing':
        return colors.badge.processing;
      case 'Shipped':
        return colors.badge.shipped;
      case 'Delivered':
        return colors.badge.delivered;
      case 'Cancelled':
        return colors.badge.cancelled;
      default:
        return colors.badge.pending;
    }
  };

  const badgeTheme = getBadgeStyle();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeTheme.bg,
          borderColor: badgeTheme.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 6 : 8,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: badgeTheme.text }]} />
      <Text
        style={[
          styles.text,
          {
            color: badgeTheme.text,
            fontSize: isSmall ? 10 : 11.5,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
