import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Typography } from '../../src/theme';
import { Button } from '../../src/components';
import { verifyCode, sendCode } from '../../src/api/auth';
import { updateProfile } from '../../src/api/customer';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBrand } from '../../src/contexts/BrandContext';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyScreen() {
  const auth = useAuth();
  const brand = useBrand();
  const params = useLocalSearchParams<{
    phone: string;
    is_new_customer: string;
    has_password: string;
    first_name: string;
    last_name: string;
    email: string;
  }>();
  const phone = params.phone || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  const hiddenInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const boxAnims = useRef(
    Array.from({ length: CODE_LENGTH }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    boxAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: 100 + i * 60,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerify = useCallback(
    async (otp: string) => {
      if (otp.length !== CODE_LENGTH) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await verifyCode(phone, otp);
        if (data.success && data.token && data.customer) {
          await auth.login(data.token, data.customer);
          if (params.first_name) {
            try {
              await updateProfile({
                first_name: params.first_name,
                last_name: params.last_name || '',
                email: params.email || '',
              });
            } catch {}
          }
          if (data.needs_profile || !data.customer.first_name) {
            router.replace('/(auth)/set-password');
          } else {
            router.replace('/(tabs)/home');
          }
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Invalid verification code';
        setError(msg);
        setCode('');
      } finally {
        setLoading(false);
      }
    },
    [phone, auth]
  );

  const handleCodeChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError('');
    if (digits.length === CODE_LENGTH) {
      handleVerify(digits);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await sendCode(phone);
      setResendTimer(RESEND_COOLDOWN);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to resend code';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  const focusInput = () => {
    hiddenInputRef.current?.focus();
  };

  const maskedPhone =
    phone.length > 4
      ? phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4)
      : phone;

  const themed = brand.themed((c) => ({
    activeBorder: {
      borderColor: c.primary,
    },
    filledBorder: {
      borderColor: c.primary,
      backgroundColor: c.primary + '08',
    },
    iconBg: {
      backgroundColor: c.primary + '12',
    },
    accentText: {
      color: c.primary,
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
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={[styles.backText, themed.accentText]}>Back</Text>
            </TouchableOpacity>

            <View style={[styles.iconCircle, themed.iconBg]}>
              <Text style={styles.iconEmoji}>🔐</Text>
            </View>

            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
            </Text>

            <View style={styles.card}>
              <TouchableOpacity
                style={styles.otpRow}
                onPress={focusInput}
                activeOpacity={1}
              >
                {Array.from({ length: CODE_LENGTH }).map((_, index) => {
                  const isFilled = index < code.length;
                  const isActive = index === code.length && !loading;
                  const digit = code[index] || '';

                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.otpBox,
                        isFilled && themed.filledBorder,
                        isActive && themed.activeBorder,
                        isActive && styles.otpBoxActive,
                        {
                          opacity: boxAnims[index],
                          transform: [
                            {
                              scale: boxAnims[index].interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.6, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.otpDigit,
                          isFilled && themed.accentText,
                        ]}
                      >
                        {digit}
                      </Text>
                    </Animated.View>
                  );
                })}
              </TouchableOpacity>

              <TextInput
                ref={hiddenInputRef}
                style={styles.hiddenInput}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                autoFocus
                caretHidden
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              {loading && (
                <View style={styles.verifyingRow}>
                  <Text style={styles.verifyingText}>Verifying...</Text>
                </View>
              )}
            </View>

            <View style={styles.resendRow}>
              {resendTimer > 0 ? (
                <Text style={styles.resendCooldown}>
                  Resend code in{' '}
                  <Text style={[styles.resendTimer, themed.accentText]}>
                    {resendTimer}s
                  </Text>
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resending}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.resendLink, themed.accentText]}>
                    {resending ? 'Sending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
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
  content: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  backText: {
    ...Typography.bodyMedium,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xxl,
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxxl,
  },
  phoneHighlight: {
    ...Typography.bodyMedium,
    color: Colors.text,
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
    alignItems: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  otpDigit: {
    ...Typography.h2,
    color: Colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  error: {
    ...Typography.bodySm,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  verifyingRow: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  verifyingText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  resendCooldown: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  resendTimer: {
    ...Typography.bodyMedium,
  },
  resendLink: {
    ...Typography.bodyMedium,
  },
});
