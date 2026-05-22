import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '../src/theme';
import { useBrand } from '../src/contexts/BrandContext';

export default function TermsScreen() {
  const { businessName } = useBrand();

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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: May 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By using this mobile application provided by {businessName}, you agree
          to these Terms of Service. If you do not agree, please do not use the
          app.
        </Text>

        <Text style={styles.sectionTitle}>2. Services</Text>
        <Text style={styles.body}>
          This app allows you to book appointments, view your packages, manage
          your profile, and communicate with {businessName}. All services are
          subject to availability.
        </Text>

        <Text style={styles.sectionTitle}>3. Appointments & Cancellations</Text>
        <Text style={styles.body}>
          Appointments booked through this app are subject to the cancellation
          policy set by {businessName}. Please cancel or reschedule with
          adequate notice as specified by the business. Late cancellations or
          no-shows may result in fees.
        </Text>

        <Text style={styles.sectionTitle}>4. Account & Privacy</Text>
        <Text style={styles.body}>
          You are responsible for maintaining the confidentiality of your
          account. Your personal information is collected and used solely for
          providing services and communication. We do not sell your data to
          third parties.
        </Text>

        <Text style={styles.sectionTitle}>5. Payments</Text>
        <Text style={styles.body}>
          Any deposits or payments processed through this app are handled
          securely. Refund policies are determined by {businessName} and may
          vary by service.
        </Text>

        <Text style={styles.sectionTitle}>6. Communications</Text>
        <Text style={styles.body}>
          By using this app, you consent to receive SMS notifications,
          appointment reminders, and promotional messages from {businessName}.
          You may opt out of promotional messages at any time.
        </Text>

        <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
        <Text style={styles.body}>
          {businessName} is not liable for any indirect, incidental, or
          consequential damages arising from use of this app. The app is
          provided "as is" without warranties of any kind.
        </Text>

        <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
        <Text style={styles.body}>
          We reserve the right to update these terms at any time. Continued use
          of the app after changes constitutes acceptance of the updated terms.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact</Text>
        <Text style={styles.body}>
          If you have questions about these terms, please contact{' '}
          {businessName} directly through the app or by phone.
        </Text>

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
    padding: Spacing.xl,
  },
  updated: {
    ...Typography.bodySm,
    color: Colors.textTertiary,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '700',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
