import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '../../src/theme';
import { Button, Input } from '../../src/components';
import { sendCode, login } from '../../src/api/auth';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBrand } from '../../src/contexts/BrandContext';

const { width } = Dimensions.get('window');

type AuthMode = 'otp' | 'password';

export default function LoginScreen() {
  const auth = useAuth();
  const brand = useBrand();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('otp');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

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
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cleanPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('1') && digits.length === 11) {
      return '+' + digits;
    }
    if (digits.length === 10) {
      return '+1' + digits;
    }
    return '+1' + digits;
  };

  const validatePhone = (): boolean => {
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length < 10) {
      setPhoneError('Please enter a valid phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSendCode = async () => {
    if (!validatePhone()) return;
    setLoading(true);
    setPhoneError('');
    try {
      const formatted = cleanPhone(phone);
      const { data } = await sendCode(formatted);
      if (data.success) {
        router.push({
          pathname: '/(auth)/verify',
          params: {
            phone: formatted,
            is_new_customer: data.is_new_customer ? '1' : '0',
            has_password: data.has_password ? '1' : '0',
          },
        });
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send verification code';
      setPhoneError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!validatePhone()) return;
    if (!password.trim()) {
      setPasswordError('Please enter your password');
      return;
    }
    setPasswordError('');
    setLoading(true);
    try {
      const formatted = cleanPhone(phone);
      const { data } = await login(formatted, password);
      if (data.success && data.token && data.customer) {
        await auth.login(data.token, data.customer);
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Invalid credentials';
      setPasswordError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'otp' ? 'password' : 'otp'));
    setPasswordError('');
    setPhoneError('');
  };

  const themed = brand.themed((c) => ({
    accentButton: {
      backgroundColor: c.primary,
    },
    accentText: {
      color: c.primary,
    },
    accentBorder: {
      borderColor: c.primary,
    },
    accentBg: {
      backgroundColor: c.primary + '08',
    },
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
            <View style={[styles.brandGlow, { backgroundColor: brand.primaryColor + '12' }]} />
            <Animated.View
              style={[
                styles.logoContainer,
                { transform: [{ scale: logoScale }] },
              ]}
            >
              {brand.logoUrl ? (
                <Image
                  source={{ uri: brand.logoUrl }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.logoFallback, { backgroundColor: brand.primaryColor }]}>
                  <Text style={styles.logoFallbackText}>R</Text>
                </View>
              )}
            </Animated.View>
            <Text style={styles.businessName}>{brand.businessName}</Text>
            <Text style={styles.tagline}>Welcome back</Text>
          </View>

          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.cardTitle}>
              {mode === 'otp' ? 'Sign in with OTP' : 'Sign in with Password'}
            </Text>

            <View style={styles.phoneRow}>
              <View style={[styles.countryCode, themed.accentBorder]}>
                <Text style={[styles.countryCodeText, themed.accentText]}>+1</Text>
              </View>
              <View style={styles.phoneInput}>
                <Input
                  label="Phone Number"
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    setPhoneError('');
                  }}
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                  error={phoneError}
                />
              </View>
            </View>

            {mode === 'otp' ? (
              <Button
                title="Send Verification Code"
                onPress={handleSendCode}
                variant="primary"
                loading={loading}
                disabled={loading}
                fullWidth
              />
            ) : (
              <>
                <Input
                  label="Password"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setPasswordError('');
                  }}
                  placeholder="Enter your password"
                  secureTextEntry
                  error={passwordError}
                />
                <Button
                  title="Sign In"
                  onPress={handlePasswordLogin}
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                  fullWidth
                />
              </>
            )}

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.toggleButton, themed.accentBg]}
              onPress={toggleMode}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, themed.accentText]}>
                {mode === 'otp'
                  ? 'Sign in with Password'
                  : 'Sign in with OTP'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerText}>
              New customer?{' '}
              <Text style={[styles.registerHighlight, themed.accentText]}>
                Create Account
              </Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text
                style={[styles.footerLink, themed.accentText]}
                onPress={() => router.push('/terms')}
              >
                Terms of Service
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: Spacing.xxxl,
    position: 'relative',
  },
  brandGlow: {
    position: 'absolute',
    top: 20,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  logoContainer: {
    marginBottom: Spacing.lg,
    zIndex: 1,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  logoFallback: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logoFallbackText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.white,
  },
  businessName: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
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
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
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
  countryCodeText: {
    ...Typography.bodyMedium,
  },
  phoneInput: {
    flex: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
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
  toggleText: {
    ...Typography.buttonSm,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  registerLink: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  registerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  registerHighlight: {
    fontWeight: '700',
  },
  footerText: {
    ...Typography.bodySm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  footerLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
