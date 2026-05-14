import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '../../src/theme';
import { Button, Input } from '../../src/components';
import { setPassword } from '../../src/api/auth';
import { updateProfile } from '../../src/api/customer';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBrand } from '../../src/contexts/BrandContext';

export default function SetPasswordScreen() {
  const auth = useAuth();
  const brand = useBrand();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
  }, []);

  const validate = (): boolean => {
    let valid = true;
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      valid = false;
    } else {
      setFirstNameError('');
    }
    if (pass && pass.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else if (pass && pass !== confirmPass) {
      setPasswordError('Passwords do not match');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      } as any);

      if (auth.customer) {
        auth.updateCustomer({
          ...auth.customer,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        });
      }

      if (pass.trim()) {
        await setPassword(pass, confirmPass);
      }

      router.replace('/(tabs)/home');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong';
      setPasswordError(msg);
    } finally {
      setLoading(false);
    }
  };

  const themed = brand.themed((c) => ({
    accentText: {
      color: c.primary,
    },
    iconBg: {
      backgroundColor: c.primary + '12',
    },
    tipBg: {
      backgroundColor: c.primary + '08',
      borderColor: c.primary + '20',
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
            <View style={[styles.iconCircle, themed.iconBg]}>
              <Text style={styles.iconEmoji}>👋</Text>
            </View>

            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Tell us your name so we can personalize your experience
            </Text>

            <View style={styles.card}>
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Input
                    label="First Name"
                    value={firstName}
                    onChangeText={(t) => {
                      setFirstName(t);
                      setFirstNameError('');
                    }}
                    placeholder="John"
                    autoCapitalize="words"
                    error={firstNameError}
                  />
                </View>
                <View style={styles.nameFieldRight}>
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Doe"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={[styles.passwordTip, themed.tipBg]}>
                <Text style={styles.passwordTipText}>
                  Set a password for faster login next time (optional)
                </Text>
              </View>

              <Input
                label="Password"
                value={pass}
                onChangeText={(t) => {
                  setPass(t);
                  setPasswordError('');
                }}
                placeholder="At least 6 characters"
                secureTextEntry
                error={!confirmPass ? passwordError : undefined}
              />

              {pass.length > 0 && (
                <Input
                  label="Confirm Password"
                  value={confirmPass}
                  onChangeText={(t) => {
                    setConfirmPass(t);
                    setPasswordError('');
                  }}
                  placeholder="Re-enter password"
                  secureTextEntry
                  error={confirmPass ? passwordError : undefined}
                />
              )}

              <View style={styles.buttonWrapper}>
                <Button
                  title="Get Started"
                  onPress={handleSubmit}
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                  fullWidth
                  size="lg"
                />
              </View>
            </View>

            <Text style={styles.skipNote}>
              You can always set a password later in your profile settings
            </Text>
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
    paddingTop: 48,
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
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  nameField: {
    flex: 1,
  },
  nameFieldRight: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  passwordTip: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  passwordTipText: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  buttonWrapper: {
    marginTop: Spacing.sm,
  },
  skipNote: {
    ...Typography.bodySm,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
