import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '../../src/theme';
import { Card, Badge, EmptyState, LoadingScreen } from '../../src/components';
import { getPackages } from '../../src/api/customer';
import { formatDate } from '../../src/utils/format';
import { useRefresh } from '../../src/hooks/useRefresh';
import type { Package } from '../../src/types';

export default function PackagesScreen() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await getPackages();
      setPackages(res.data?.data ?? res.data ?? []);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const [refreshing, onRefresh] = useRefresh(fetchPackages);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const isExpiringSoon = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const isExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };

  const renderPackage = ({ item }: { item: Package }) => {
    const total = item.total_sessions;
    const remaining = item.remaining_sessions;
    const used = total - remaining;
    const progress = total > 0 ? used / total : 0;
    const active = item.is_active !== false && !isExpired(item.expires_at);
    const expiringSoon = isExpiringSoon(item.expires_at);

    return (
      <Card style={styles.card} variant="elevated">
        <View style={styles.cardHeader}>
          <Text style={styles.serviceName} numberOfLines={2}>
            {item.service_name}
          </Text>
          <Badge
            label={active ? 'Active' : 'Expired'}
            variant={active ? 'success' : 'error'}
          />
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              {remaining} of {total} sessions remaining
            </Text>
            <Text style={styles.progressPercent}>
              {Math.round(progress * 100)}% used
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(progress * 100, 100)}%`,
                  backgroundColor: active ? Colors.primary : Colors.textTertiary,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.sessionGrid}>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionStatValue}>{used}</Text>
            <Text style={styles.sessionStatLabel}>Used</Text>
          </View>
          <View style={[styles.sessionStat, styles.sessionStatCenter]}>
            <Text style={[styles.sessionStatValue, { color: Colors.primary }]}>
              {remaining}
            </Text>
            <Text style={styles.sessionStatLabel}>Remaining</Text>
          </View>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionStatValue}>{total}</Text>
            <Text style={styles.sessionStatLabel}>Total</Text>
          </View>
        </View>

        {item.expires_at && (
          <View
            style={[
              styles.expiryRow,
              expiringSoon && !isExpired(item.expires_at) && styles.expiryWarning,
              isExpired(item.expires_at) && styles.expiryExpired,
            ]}
          >
            <Text style={styles.expiryIcon}>
              {isExpired(item.expires_at)
                ? '⚠️'
                : expiringSoon
                ? '⏳'
                : '📅'}
            </Text>
            <Text
              style={[
                styles.expiryText,
                (expiringSoon || isExpired(item.expires_at)) && {
                  color: isExpired(item.expires_at)
                    ? Colors.error
                    : '#B45309',
                },
              ]}
            >
              {isExpired(item.expires_at)
                ? `Expired ${formatDate(item.expires_at)}`
                : expiringSoon
                ? `Expiring soon · ${formatDate(item.expires_at)}`
                : `Expires ${formatDate(item.expires_at)}`}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading packages..." />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Packages</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={packages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPackage}
        contentContainerStyle={[
          styles.list,
          packages.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={'📦'}
            title="No Packages"
            subtitle="You don't have any service packages yet."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: Colors.text,
    fontWeight: '600',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  listEmpty: {
    flex: 1,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  serviceName: {
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.md,
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  progressPercent: {
    ...Typography.bodySm,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sessionGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  sessionStat: {
    flex: 1,
    alignItems: 'center',
  },
  sessionStatCenter: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  sessionStatValue: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 2,
  },
  sessionStatLabel: {
    ...Typography.bodySm,
    color: Colors.textTertiary,
    fontSize: 11,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  expiryWarning: {
    backgroundColor: Colors.warningLight,
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.lg,
    marginBottom: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 0,
  },
  expiryExpired: {
    backgroundColor: Colors.errorLight,
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.lg,
    marginBottom: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 0,
  },
  expiryIcon: {
    fontSize: 14,
    marginRight: Spacing.sm,
  },
  expiryText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
});
