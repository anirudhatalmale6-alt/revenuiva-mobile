import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

const variantColors: Record<
  string,
  { background: string; text: string }
> = {
  success: { background: Colors.successLight, text: Colors.success },
  warning: { background: Colors.warningLight, text: '#B45309' },
  error: { background: Colors.errorLight, text: Colors.error },
  info: { background: '#EFF6FF', text: Colors.primary },
  default: { background: Colors.surfaceVariant, text: Colors.textSecondary },
};

const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const colors = variantColors[variant] || variantColors.default;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.bodySm,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default Badge;
