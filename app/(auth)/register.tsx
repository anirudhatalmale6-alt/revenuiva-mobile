import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '../../src/theme';
import { Button, Input } from '../../src/components';
import { sendCode } from '../../src/api/auth';
import { useBrand } from '../../src/contexts/BrandContext';

export default function RegisterScreen() {
  const brand = useBrand();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cleanPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('1') && digits.length === 11) return '+' + digits;
    if (digits.length === 10) return '+1' + digits;
    return '+1' + digits;
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length < 10) e.phone = 'Please enter a valid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const formatted = cleanPhone(phone);
      const { data } = await sendCode(formatted);
      if (data.success) {
        router.push({
          pathname: '/(auth)/verify',
          params: {
            phone: formatted,
            is_new_customer: '1',
            has_password: '0',
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
          },
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send verification code';
      setErrors({ phone: msg });
    } finally {
      setLoading(false);
    }
  };

  const themed = brand.themed((c) => ({
    accentText: { color: c.primary },
    accentBg: { backgroundColor: c.primary + '08' },
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <Text style={styles.businessName}>{brand.businessName}</Text>
            <Text style={styles.tagline}>Create your account</Text>
          </View>

          <Animated.View
            style={[
              styles.card,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.cardTitle}>New Customer</Text>

            <Input
              label="First Name"
              value={firstName}
              onChangeText={(t) => { setFirstName(t); setErrors((e) => ({ ...e, firstName: '' })); }}
              placeholder="Your first name"
              error={errors.firstName}
            />

            <Input
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Your last name (optional)"
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com (optional)"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.phoneRow}>
              <View style={[styles.countryCode, { borderColor: brand.primaryColor }]}>
                <Text style={[styles.countryCodeText, themed.accentText]}>+1</Text>
              </View>
              <View style={styles.phoneInput}>
                <Input
                  label="Phone Number"
                  value={phone}
                  onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: '' })); }}
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                  error={errors.phone}
                />
              </View>
            </View>

            <Button
              title="Create Account"
              onPress={handleRegister}
              variant="primary"
              loading={loading}
              disabled={loading}
              fullWidth
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.toggleButton, themed.accentBg]}
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, themed.accentText]}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: Spacing.xxl,
  },
  businessName: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.xs },
  tagline: { ...Typography.body, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
  },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start' },
  countryCode: {
    height: 50,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    marginTop: 26,
  },
  countryCodeText: { ...Typography.bodyMedium },
  phoneInput: { flex: 1 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xxl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    ...Typography.bodySm,
    color: Colors.textTertiary,
    marginHorizontal: Spacing.lg,
    fontWeight: '600',
  },
  toggleButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleText: { ...Typography.buttonSm },
});
