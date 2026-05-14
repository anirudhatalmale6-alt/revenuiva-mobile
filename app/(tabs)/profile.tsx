import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '../../src/theme';
import {
  Card,
  Button,
  Input,
  Avatar,
  LoadingScreen,
} from '../../src/components';
import {
  getProfile,
  updateProfile,
  updatePassword,
} from '../../src/api/customer';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBrand } from '../../src/contexts/BrandContext';
import { useRefresh } from '../../src/hooks/useRefresh';
import { formatPhone, getInitials } from '../../src/utils/format';
import type { Customer } from '../../src/types';

export default function ProfileScreen() {
  const { customer, business, logout, updateCustomer } = useAuth();
  const { primaryColor, businessName } = useBrand();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [firstName, setFirstName] = useState(customer?.first_name ?? '');
  const [lastName, setLastName] = useState(customer?.last_name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [dob, setDob] = useState(customer?.date_of_birth ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const refreshProfile = useCallback(async () => {
    try {
      const res = await getProfile();
      const data: Customer = res.data.data ?? res.data;
      updateCustomer(data);
      setFirstName(data.first_name);
      setLastName(data.last_name);
      setEmail(data.email);
      setPhone(data.phone);
      setDob(data.date_of_birth ?? '');
      setAddress(data.address ?? '');
    } catch {}
  }, [updateCustomer]);

  const [refreshing, onRefresh] = useRefresh(refreshProfile);

  const startEditing = useCallback(() => {
    setFirstName(customer?.first_name ?? '');
    setLastName(customer?.last_name ?? '');
    setEmail(customer?.email ?? '');
    setPhone(customer?.phone ?? '');
    setDob(customer?.date_of_birth ?? '');
    setAddress(customer?.address ?? '');
    setEditing(true);
  }, [customer]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
  }, []);

  const saveProfile = useCallback(async () => {
    setSaving(true);
    try {
      const res = await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        date_of_birth: dob.trim() || undefined,
        address: address.trim() || undefined,
      });
      const updated: Customer = res.data.data ?? res.data;
      updateCustomer(updated);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Failed to update profile.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, email, phone, dob, address, updateCustomer]);

  const savePassword = useCallback(async () => {
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword({
        current_password: currentPassword || undefined,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      Alert.alert('Success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangingPassword(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Failed to update password.';
      Alert.alert('Error', msg);
    } finally {
      setSavingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }, [logout]);

  if (!customer) return <LoadingScreen message="Loading profile..." />;

  const initials = getInitials(customer.first_name, customer.last_name);
  const fullName = `${customer.first_name} ${customer.last_name}`.trim();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
          />
        }
      >
        <View style={styles.profileHeader}>
          <Avatar name={fullName} size={80} />
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profilePhone}>
            {customer.phone ? formatPhone(customer.phone) : ''}
          </Text>
        </View>

        {editing ? (
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Edit Profile</Text>
            <Input
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              keyboardType="email-address"
            />
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
            <Input
              label="Date of Birth"
              value={dob}
              onChangeText={setDob}
              placeholder="YYYY-MM-DD"
            />
            <Input
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Address"
              multiline
            />
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                onPress={cancelEditing}
                variant="outline"
                size="md"
                fullWidth
              />
              <View style={{ width: Spacing.md }} />
              <Button
                title="Save Changes"
                onPress={saveProfile}
                loading={saving}
                disabled={saving}
                size="md"
                fullWidth
              />
            </View>
          </Card>
        ) : (
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            {[
              { label: 'Email', value: customer.email },
              {
                label: 'Phone',
                value: customer.phone ? formatPhone(customer.phone) : '—',
              },
              {
                label: 'Date of Birth',
                value: customer.date_of_birth || '—',
              },
              {
                label: 'Address',
                value: customer.address || '—',
              },
            ].map((item, idx) => (
              <View key={item.label}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
                {idx < 3 && <View style={styles.divider} />}
              </View>
            ))}
            <View style={styles.editBtnRow}>
              <Button
                title="Edit Profile"
                onPress={startEditing}
                variant="outline"
                size="md"
                fullWidth
              />
            </View>
          </Card>
        )}

        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>Change Password</Text>
          {changingPassword ? (
            <>
              {customer.has_password !== false && (
                <Input
                  label="Current Password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  secureTextEntry
                />
              )}
              <Input
                label="New Password"
                value={newPassword}
                onChangeText={(v) => {
                  setNewPassword(v);
                  setPasswordError('');
                }}
                placeholder="Enter new password"
                secureTextEntry
                error={passwordError || undefined}
              />
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  setPasswordError('');
                }}
                placeholder="Confirm new password"
                secureTextEntry
              />
              <View style={styles.editActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setChangingPassword(false);
                    setPasswordError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  variant="outline"
                  size="md"
                  fullWidth
                />
                <View style={{ width: Spacing.md }} />
                <Button
                  title="Update Password"
                  onPress={savePassword}
                  loading={savingPassword}
                  disabled={savingPassword}
                  size="md"
                  fullWidth
                />
              </View>
            </>
          ) : (
            <Button
              title="Change Password"
              onPress={() => setChangingPassword(true)}
              variant="outline"
              size="md"
              fullWidth
            />
          )}
        </Card>

        {business && (
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Contact Business</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>
                {business.name || businessName}
              </Text>
            </View>
            <View style={styles.divider} />
            {business.phone ? (
              <>
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => Linking.openURL(`tel:${business.phone}`)}
                >
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={[styles.infoValue, { color: primaryColor }]}>
                    {formatPhone(business.phone)}
                  </Text>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            ) : null}
            {business.address ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>
                  {[business.address, business.city, business.state, business.zip]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            ) : null}
          </Card>
        )}

        <View style={styles.logoutWrapper}>
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            size="lg"
            fullWidth
          />
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
  content: {
    padding: Spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  profileName: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  profilePhone: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  card: {
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 0.4,
  },
  infoValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 0.6,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  editBtnRow: {
    marginTop: Spacing.xl,
  },
  editActions: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
  },
  logoutWrapper: {
    marginTop: Spacing.md,
  },
});
