import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '../../src/theme';
import {
  AppointmentCard,
  EmptyState,
  LoadingScreen,
} from '../../src/components';
import {
  getAppointments,
  cancelAppointment,
} from '../../src/api/customer';
import { useBrand } from '../../src/contexts/BrandContext';
import { useRefresh } from '../../src/hooks/useRefresh';
import type { Appointment } from '../../src/types';

type FilterTab = 'all' | 'upcoming' | 'past' | 'cancelled';

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function AppointmentsScreen() {
  const { primaryColor } = useBrand();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchAppointments = useCallback(async (pageNum: number = 1) => {
    try {
      const res = await getAppointments(pageNum);
      const payload = res.data.data ?? res.data;
      const items: Appointment[] = Array.isArray(payload)
        ? payload
        : payload.appointments ?? payload.data ?? [];
      const meta = payload.meta ?? payload;
      if (pageNum === 1) {
        setAppointments(items);
      } else {
        setAppointments((prev) => [...prev, ...items]);
      }
      setHasMore(
        meta.current_page
          ? meta.current_page < meta.last_page
          : items.length >= 15
      );
      setPage(pageNum);
    } catch {
      if (pageNum === 1) setAppointments([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments(1);
  }, [fetchAppointments]);

  const refreshAll = useCallback(async () => {
    await fetchAppointments(1);
  }, [fetchAppointments]);

  const [refreshing, onRefresh] = useRefresh(refreshAll);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    fetchAppointments(page + 1);
  }, [hasMore, loadingMore, loading, page, fetchAppointments]);

  const handleCancel = useCallback(
    (apt: Appointment) => {
      Alert.alert(
        'Cancel Appointment',
        `Are you sure you want to cancel your ${apt.service_name} appointment on ${apt.date_display}?`,
        [
          { text: 'Keep It', style: 'cancel' },
          {
            text: 'Cancel Appointment',
            style: 'destructive',
            onPress: async () => {
              setCancellingId(apt.id);
              try {
                await cancelAppointment(apt.id);
                setAppointments((prev) =>
                  prev.map((a) =>
                    a.id === apt.id
                      ? { ...a, status: 'cancelled', can_cancel: false }
                      : a
                  )
                );
              } catch {
                Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
              } finally {
                setCancellingId(null);
              }
            },
          },
        ]
      );
    },
    []
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return appointments;
    if (filter === 'cancelled')
      return appointments.filter(
        (a) => a.status.toLowerCase() === 'cancelled'
      );
    if (filter === 'past')
      return appointments.filter((a) => {
        const s = a.status.toLowerCase();
        return s === 'completed' || s === 'no_show' || s === 'no-show';
      });
    return appointments.filter((a) => {
      const s = a.status.toLowerCase();
      return (
        s === 'confirmed' ||
        s === 'pending' ||
        s === 'checked_in' ||
        s === 'in_progress'
      );
    });
  }, [appointments, filter]);

  if (loading) return <LoadingScreen message="Loading appointments..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>My Appointments</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterTab,
                active && { backgroundColor: primaryColor },
              ]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterLabel,
                  active && styles.filterLabelActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            showCancel={item.can_cancel === true}
            onCancel={() => handleCancel(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={'\u{1F4CB}'}
            title="No appointments yet"
            subtitle={
              filter === 'all'
                ? 'Book your first appointment to get started'
                : `No ${filter} appointments found`
            }
            action={
              filter === 'all'
                ? {
                    title: 'Book Now',
                    onPress: () => router.push('/(tabs)/book'),
                  }
                : undefined
            }
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={primaryColor} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterLabel: {
    ...Typography.bodySm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
  footer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
});
