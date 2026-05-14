import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Typography } from '../../src/theme';
import { Badge, Avatar, Button, LoadingScreen } from '../../src/components';
import { getAppointments, cancelAppointment } from '../../src/api/customer';
import { formatDate, formatCurrency, getStatusLabel } from '../../src/utils/format';
import type { Appointment } from '../../src/types';

const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'error',
  completed: 'info',
  no_show: 'error',
  checked_in: 'info',
  in_progress: 'info',
};

export default function AppointmentDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    service_name?: string;
    staff_name?: string;
    date_display?: string;
    time?: string;
    ends_at?: string;
    status?: string;
    service_color?: string;
    deposit_paid?: string;
    deposit_amount?: string;
    notes?: string;
    can_cancel?: string;
    date?: string;
    confirmed_at?: string;
  }>();

  const appointmentId = Number(params.id);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const buildFromParams = useCallback((): Appointment | null => {
    if (!params.service_name) return null;
    return {
      id: appointmentId,
      service_name: params.service_name,
      staff_name: params.staff_name ?? '',
      date: params.date ?? '',
      date_display: params.date_display ?? '',
      time: params.time ?? '',
      ends_at: params.ends_at ?? '',
      status: params.status ?? 'confirmed',
      service_color: params.service_color ?? Colors.primary,
      deposit_paid: params.deposit_paid === 'true',
      deposit_amount: Number(params.deposit_amount) || 0,
      notes: params.notes ?? '',
      confirmed_at: params.confirmed_at ?? null,
      can_cancel: params.can_cancel === 'true',
    };
  }, [params, appointmentId]);

  const fetchAppointment = useCallback(async () => {
    const fromParams = buildFromParams();
    if (fromParams) {
      setAppointment(fromParams);
      setLoading(false);
      return;
    }

    try {
      const res = await getAppointments();
      const list: Appointment[] = res.data?.data ?? res.data ?? [];
      const found = list.find((a) => a.id === appointmentId);
      setAppointment(found ?? null);
    } catch {
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [appointmentId, buildFromParams]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? This action cannot be undone.',
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelAppointment(appointmentId);
              Alert.alert('Cancelled', 'Your appointment has been cancelled.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert('Error', 'Could not cancel the appointment. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading appointment..." />;
  }

  if (!appointment) {
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
          <Text style={styles.headerTitle}>Appointment</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>{'😕'}</Text>
          <Text style={styles.errorTitle}>Appointment Not Found</Text>
          <Text style={styles.errorSubtitle}>
            This appointment may have been removed or is no longer available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const serviceColor = appointment.service_color || Colors.primary;
  const statusVariant = statusVariantMap[appointment.status] || 'default';

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
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.colorStrip, { backgroundColor: serviceColor }]} />

        <View style={styles.mainCard}>
          <View style={styles.serviceSection}>
            <Text style={styles.serviceName}>{appointment.service_name}</Text>
            <Badge
              label={getStatusLabel(appointment.status)}
              variant={statusVariant}
            />
          </View>

          <View style={styles.staffRow}>
            <Avatar name={appointment.staff_name} size={44} />
            <View style={styles.staffInfo}>
              <Text style={styles.staffLabel}>Staff Member</Text>
              <Text style={styles.staffName}>{appointment.staff_name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>{'📅'}</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {appointment.date_display || formatDate(appointment.date)}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>{'🕐'}</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {appointment.time} {appointment.ends_at ? `- ${appointment.ends_at}` : ''}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.depositSection}>
            <View style={styles.depositRow}>
              <Text style={styles.depositLabel}>Deposit</Text>
              <View style={styles.depositRight}>
                {appointment.deposit_amount > 0 && (
                  <Text style={styles.depositAmount}>
                    {formatCurrency(appointment.deposit_amount)}
                  </Text>
                )}
                <Badge
                  label={appointment.deposit_paid ? 'Paid' : 'Unpaid'}
                  variant={appointment.deposit_paid ? 'success' : 'warning'}
                />
              </View>
            </View>
          </View>

          {appointment.confirmed_at && (
            <>
              <View style={styles.divider} />
              <View style={styles.confirmedRow}>
                <Text style={styles.confirmedIcon}>{'✓'}</Text>
                <Text style={styles.confirmedText}>
                  Confirmed {formatDate(appointment.confirmed_at)}
                </Text>
              </View>
            </>
          )}

          {appointment.notes ? (
            <>
              <View style={styles.divider} />
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes</Text>
                <View style={styles.notesCard}>
                  <Text style={styles.notesText}>{appointment.notes}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {appointment.can_cancel && appointment.status !== 'cancelled' && (
          <View style={styles.cancelSection}>
            <Button
              title={cancelling ? 'Cancelling...' : 'Cancel Appointment'}
              onPress={handleCancel}
              variant="outline"
              fullWidth
              loading={cancelling}
              disabled={cancelling}
            />
          </View>
        )}
      </ScrollView>
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
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  colorStrip: {
    height: 6,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  mainCard: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: Spacing.xl,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.borderLight,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  serviceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  serviceName: {
    ...Typography.h2,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.md,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  staffInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  staffLabel: {
    ...Typography.bodySm,
    color: Colors.textTertiary,
    fontSize: 11,
    marginBottom: 1,
  },
  staffName: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.lg,
  },
  detailsGrid: {
    gap: Spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  detailContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  detailLabel: {
    ...Typography.bodySm,
    color: Colors.textTertiary,
    fontSize: 11,
    marginBottom: 1,
  },
  detailValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  depositSection: {},
  depositRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  depositLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  depositRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  depositAmount: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  confirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmedIcon: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  confirmedText: {
    ...Typography.bodySm,
    color: Colors.success,
  },
  notesSection: {},
  notesLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  notesCard: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: Spacing.lg,
  },
  notesText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  cancelSection: {
    marginTop: Spacing.xxl,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
