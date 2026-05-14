import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import { Appointment } from '../types';
import Badge from './Badge';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'error',
  completed: 'info',
  'no-show': 'error',
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onPress,
  onCancel,
  showCancel = false,
}) => {
  const statusVariant = statusVariantMap[appointment.status] || 'default';

  const content = (
    <View style={[styles.container, { borderLeftColor: appointment.service_color }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.serviceName}>{appointment.service_name}</Text>
          <Text style={styles.staffName}>{appointment.staff_name}</Text>
        </View>
        <Badge
          label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          variant={statusVariant}
        />
      </View>
      <View style={styles.details}>
        <Text style={styles.dateTime}>
          {appointment.date_display} {'·'} {appointment.time} - {appointment.ends_at}
        </Text>
        {appointment.deposit_paid && (
          <Text style={styles.deposit}>Deposit paid</Text>
        )}
      </View>
      {showCancel && appointment.can_cancel && onCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Cancel Appointment</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  serviceName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: 2,
  },
  staffName: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTime: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  deposit: {
    ...Typography.bodySm,
    color: Colors.success,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.buttonSm,
    color: Colors.error,
  },
});

export default AppointmentCard;
