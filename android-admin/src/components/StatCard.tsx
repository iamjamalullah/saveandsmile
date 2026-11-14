import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  tone?: 'primary' | 'accent' | 'danger' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  icon,
  tone = 'primary',
}) => {
  const getToneColors = () => {
    switch (tone) {
      case 'primary':
        return { bg: colors.primary.subtle, text: colors.primary.DEFAULT };
      case 'accent':
        return { bg: colors.accent.subtle, text: colors.accent.dark };
      case 'danger':
        return { bg: colors.danger.subtle, text: colors.danger.DEFAULT };
      case 'info':
        return { bg: colors.info.subtle, text: colors.info.dark };
    }
  };

  const toneColor = getToneColors();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: toneColor.bg }]}>
            {icon}
          </View>
        )}
      </View>
      <Text style={styles.value}>{value}</Text>
      {subValue ? <Text style={styles.subValue}>{subValue}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.slate.border,
    ...spacing.shadow.sm,
    flex: 1,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.slate.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: spacing.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.slate.ink,
    letterSpacing: -0.3,
  },
  subValue: {
    fontSize: 10.5,
    color: colors.slate.muted,
    marginTop: 2,
  },
});
