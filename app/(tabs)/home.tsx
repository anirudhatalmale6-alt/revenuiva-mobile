import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '../../src/theme';
import { Card, AppointmentCard, LoadingScreen } from '../../src/components';
import { getDashboard } from '../../src/api/customer';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBrand } from '../../src/contexts/BrandContext';
import { useRefresh } from '../../src/hooks/useRefresh';
import { formatDate } from '../../src/utils/format';
import type { Appointment, Package } from '../../src/types';

interface DashboardData {
  upcoming_appointments: Appointment[];
  packages: Package[];
  stats: {
    upcoming_count: number;
    active_packages: number;
    total_visits: number;
  };
}

export default function HomeScreen() {
  const { customer, business } = useAuth();
  const { primaryColor, secondaryColor, logoUrl, businessName } = useBrand();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await getDashboard();
      setData(res.data.data ?? res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [refreshing, onRefresh] = useRefresh(fetchData);

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  const upcomingCount =
    data?.stats?.upcoming_count ?? data?.upcoming_appointments?.length ?? 0;
  const activePackages =
    data?.stats?.active_packages ??
    data?.packages?.filter((p) => p.is_active)?.length ??
    0;
  const totalVisits =
    data?.stats?.total_visits ?? customer?.total_visits ?? 0;
  const appointments = data?.upcoming_appointments?.slice(0, 3) ?? [];
  const packages = data?.packages?.filter((p) => p.is_active) ?? [];

  const quickActions = [
    {
      emoji: '\u{1F4C5}',
      label: 'Book\nAppointment',
      onPress: () => router.push('/(tabs)/book'),
    },
    {
      emoji: '\u{1F4AC}',
      label: 'My\nMessages',
      onPress: () => router.push('/messages'),
    },
    {
      emoji: '\u{1F4E6}',
      label: 'View\nPackages',
      onPress: () => router.push('/packages'),
    },
    {
      emoji: '\u{1F4DE}',
      label: 'Contact\nBusiness',
      onPress: () => {
        if (business?.phone) Linking.openURL(`tel:${business.phone}`);
      },
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              Welcome back, {customer?.first_name ?? 'there'}
            </Text>
            <Text style={styles.date}>{dateString}</Text>
          </View>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[
                styles.logoPlaceholder,
                { backgroundColor: primaryColor + '15' },
              ]}
            >
              <Text style={[styles.logoText, { color: primaryColor }]}>
                {businessName.charAt(0)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          {[
            { value: upcomingCount, label: 'Upcoming', color: primaryColor },
            { value: activePackages, label: 'Packages', color: secondaryColor },
            { value: totalVisits, label: 'Total Visits', color: Colors.warning },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {business?.mobile_app_link_url ? (
          <TouchableOpacity
            style={[styles.dealsBanner, { backgroundColor: primaryColor }]}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(business.mobile_app_link_url!)}
          >
            <Text style={styles.dealsBannerEmoji}>{'\u{1F381}'}</Text>
            <View style={styles.dealsBannerText}>
              <Text style={styles.dealsBannerTitle}>
                {business.mobile_app_link_label || 'Deals & Offers'}
              </Text>
              <Text style={styles.dealsBannerSub}>Tap to view</Text>
            </View>
            <Text style={styles.dealsBannerArrow}>{'\u{2192}'}</Text>
          </TouchableOpacity>
        ) : null}

        {appointments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/appointments')}
              >
                <Text style={[styles.seeAll, { color: primaryColor }]}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            {appointments.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </View>
        )}

        {packages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Packages</Text>
            </View>
            {packages.map((pkg) => {
              const used = pkg.used_sessions ?? pkg.total_sessions - pkg.remaining_sessions;
              const progress =
                pkg.total_sessions > 0
                  ? (used / pkg.total_sessions) * 100
                  : 0;
              return (
                <Card key={pkg.id} variant="elevated" style={styles.packageCard}>
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageName}>{pkg.service_name}</Text>
                    <Text
                      style={[styles.packageCount, { color: primaryColor }]}
                    >
                      {pkg.remaining_sessions}/{pkg.total_sessions}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: primaryColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.packageSub}>
                    {pkg.remaining_sessions} session
                    {pkg.remaining_sessions !== 1 ? 's' : ''} remaining
                    {pkg.expires_at
                      ? ` · Expires ${formatDate(pkg.expires_at)}`
                      : ''}
                  </Text>
                </Card>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                activeOpacity={0.7}
                onPress={action.onPress}
              >
                <Text style={styles.actionEmoji}>{action.emoji}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    marginTop: Spacing.sm,
  },
  headerText: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  greeting: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 4,
  },
  date: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  dealsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  dealsBannerEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  dealsBannerText: {
    flex: 1,
  },
  dealsBannerTitle: {
    ...Typography.h3,
    color: Colors.white,
  },
  dealsBannerSub: {
    ...Typography.bodySm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  dealsBannerArrow: {
    fontSize: 22,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  seeAll: {
    ...Typography.buttonSm,
  },
  packageCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  packageName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
  },
  packageCount: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  packageSub: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
