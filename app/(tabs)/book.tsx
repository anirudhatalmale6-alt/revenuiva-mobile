import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors, Spacing, Typography } from '../../src/theme';
import { Card, Button, LoadingScreen } from '../../src/components';
import { getServices, getStaff, getSlots, book } from '../../src/api/booking';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBrand } from '../../src/contexts/BrandContext';
import { formatCurrency } from '../../src/utils/format';
import type { Service, StaffMember, TimeSlot } from '../../src/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STEP_LABELS = ['Service', 'Staff', 'Date & Time', 'Confirm'];

function getNext14Days(): { date: string; day: string; dayNum: number; month: string; isToday: boolean }[] {
  const days: { date: string; day: string; dayNum: number; month: string; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push({
      date: `${yyyy}-${mm}-${dd}`,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: i === 0,
    });
  }
  return days;
}

export default function BookScreen() {
  const { customer } = useAuth();
  const { primaryColor } = useBrand();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [anyStaff, setAnyStaff] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const dates = getNext14Days();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getServices();
        const payload = res.data.data ?? res.data;
        setServices(Array.isArray(payload) ? payload : payload.services ?? []);
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };
    load();
  }, []);

  const animateStep = useCallback(
    (next: number) => {
      const direction = next > step ? 1 : -1;
      slideAnim.setValue(direction * SCREEN_WIDTH);
      setStep(next);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    },
    [step, slideAnim]
  );

  const goToStaff = useCallback(
    async (service: Service) => {
      setSelectedService(service);
      setLoadingStaff(true);
      animateStep(2);
      try {
        const res = await getStaff();
        const payload = res.data.data ?? res.data;
        setStaffList(Array.isArray(payload) ? payload : payload.staff ?? []);
      } catch {
        setStaffList([]);
      } finally {
        setLoadingStaff(false);
      }
    },
    [animateStep]
  );

  const goToDateTime = useCallback(
    (staff: StaffMember | null, isAny: boolean) => {
      setSelectedStaff(staff);
      setAnyStaff(isAny);
      setSelectedDate(dates[0].date);
      setSlots([]);
      setSelectedSlot(null);
      animateStep(3);
    },
    [animateStep, dates]
  );

  const fetchSlots = useCallback(
    async (date: string) => {
      if (!selectedService) return;
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const params: { date: string; service_id: number; staff_member_id?: number } = {
          date,
          service_id: selectedService.id,
        };
        if (selectedStaff && !anyStaff) {
          params.staff_member_id = selectedStaff.id;
        }
        const res = await getSlots(params as any);
        const payload = res.data.data ?? res.data;
        setSlots(payload.slots ?? payload ?? []);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [selectedService, selectedStaff, anyStaff]
  );

  useEffect(() => {
    if (step === 3 && selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [step, selectedDate, fetchSlots]);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const goToConfirm = useCallback(() => {
    if (!selectedSlot) return;
    animateStep(4);
  }, [selectedSlot, animateStep]);

  const goBack = useCallback(() => {
    if (step <= 1) return;
    animateStep(step - 1);
  }, [step, animateStep]);

  const handleBook = useCallback(async () => {
    if (!selectedService || !selectedSlot || !selectedDate) return;
    setBooking(true);
    try {
      const payload: any = {
        service_id: selectedService.id,
        date: selectedDate,
        time: selectedSlot.time,
      };
      if (selectedStaff && !anyStaff) {
        payload.staff_member_id = selectedStaff.id;
      }
      await book(payload);
      Alert.alert(
        'Booking Confirmed',
        `Your ${selectedService.name} appointment has been booked successfully.`,
        [{ text: 'Great', style: 'default' }]
      );
      setStep(1);
      setSelectedService(null);
      setSelectedStaff(null);
      setAnyStaff(false);
      setSelectedDate('');
      setSelectedSlot(null);
      setSlots([]);
      slideAnim.setValue(0);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Failed to book appointment. Please try again.';
      Alert.alert('Booking Failed', msg);
    } finally {
      setBooking(false);
    }
  }, [selectedService, selectedStaff, anyStaff, selectedDate, selectedSlot, slideAnim]);

  const categories = services.reduce<Record<string, Service[]>>((acc, s) => {
    const cat = s.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  if (loadingServices) return <LoadingScreen message="Loading services..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          {step > 1 && (
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Text style={styles.backText}>{'←'}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Book Appointment</Text>
        </View>

        <View style={styles.stepper}>
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const active = step >= stepNum;
            return (
              <View key={label} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    active && { backgroundColor: primaryColor, borderColor: primaryColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepDotText,
                      active && styles.stepDotTextActive,
                    ]}
                  >
                    {step > stepNum ? '✓' : String(stepNum)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    active && { color: primaryColor },
                  ]}
                >
                  {label}
                </Text>
                {i < STEP_LABELS.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      step > stepNum && { backgroundColor: primaryColor },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>

      <Animated.View
        style={[styles.stepContent, { transform: [{ translateX: slideAnim }] }]}
      >
        {step === 1 && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {Object.entries(categories).map(([cat, items]) => (
              <View key={cat} style={styles.categoryBlock}>
                <Text style={styles.categoryTitle}>{cat}</Text>
                {items.map((svc) => (
                  <TouchableOpacity
                    key={svc.id}
                    activeOpacity={0.7}
                    onPress={() => goToStaff(svc)}
                  >
                    <Card variant="elevated" style={styles.serviceCard}>
                      <View style={styles.serviceRow}>
                        <View
                          style={[
                            styles.serviceColor,
                            { backgroundColor: svc.color || primaryColor },
                          ]}
                        />
                        <View style={styles.serviceInfo}>
                          <Text style={styles.serviceName}>{svc.name}</Text>
                          <Text style={styles.serviceMeta}>
                            {svc.duration_minutes} min{' · '}
                            {formatCurrency(svc.price)}
                          </Text>
                          {svc.description ? (
                            <Text style={styles.serviceDesc} numberOfLines={2}>
                              {svc.description}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.serviceArrow}>{'›'}</Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        )}

        {step === 2 && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {loadingStaff ? (
              <ActivityIndicator
                size="large"
                color={primaryColor}
                style={styles.centered}
              />
            ) : (
              <>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => goToDateTime(null, true)}
                >
                  <Card variant="elevated" style={styles.staffCard}>
                    <View style={styles.staffRow}>
                      <View style={[styles.staffAvatar, { backgroundColor: primaryColor + '20' }]}>
                        <Text style={[styles.staffAvatarText, { color: primaryColor }]}>
                          {'✱'}
                        </Text>
                      </View>
                      <View style={styles.staffInfo}>
                        <Text style={styles.staffName}>Any Available</Text>
                        <Text style={styles.staffRole}>
                          First available staff member
                        </Text>
                      </View>
                      <Text style={styles.serviceArrow}>{'›'}</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
                {staffList.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    activeOpacity={0.7}
                    onPress={() => goToDateTime(s, false)}
                  >
                    <Card variant="elevated" style={styles.staffCard}>
                      <View style={styles.staffRow}>
                        <View
                          style={[
                            styles.staffAvatar,
                            { backgroundColor: primaryColor + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.staffAvatarText,
                              { color: primaryColor },
                            ]}
                          >
                            {s.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.staffInfo}>
                          <Text style={styles.staffName}>{s.name}</Text>
                          {s.role ? (
                            <Text style={styles.staffRole}>{s.role}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.serviceArrow}>{'›'}</Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        )}

        {step === 3 && (
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateSection}>
              <Text style={styles.subHeading}>Select Date</Text>
              <FlatList
                data={dates}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.date}
                contentContainerStyle={styles.datePills}
                renderItem={({ item }) => {
                  const selected = item.date === selectedDate;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.datePill,
                        selected && { backgroundColor: primaryColor, borderColor: primaryColor },
                        item.isToday && !selected && styles.datePillToday,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => selectDate(item.date)}
                    >
                      <Text
                        style={[
                          styles.datePillDay,
                          selected && styles.datePillTextActive,
                        ]}
                      >
                        {item.day}
                      </Text>
                      <Text
                        style={[
                          styles.datePillNum,
                          selected && styles.datePillTextActive,
                        ]}
                      >
                        {item.dayNum}
                      </Text>
                      <Text
                        style={[
                          styles.datePillMonth,
                          selected && styles.datePillTextActive,
                        ]}
                      >
                        {item.month}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            <View style={styles.slotsSection}>
              <Text style={styles.subHeading}>Available Times</Text>
              {loadingSlots ? (
                <ActivityIndicator
                  size="large"
                  color={primaryColor}
                  style={styles.centered}
                />
              ) : slots.length === 0 ? (
                <View style={styles.noSlots}>
                  <Text style={styles.noSlotsEmoji}>{'\u{1F4AD}'}</Text>
                  <Text style={styles.noSlotsText}>
                    No available time slots for this date
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={slots}
                  numColumns={3}
                  keyExtractor={(item) => item.time}
                  columnWrapperStyle={styles.slotRow}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.slotsGrid}
                  renderItem={({ item }) => {
                    const selected = selectedSlot?.time === item.time;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.slotChip,
                          selected && {
                            backgroundColor: primaryColor,
                            borderColor: primaryColor,
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => setSelectedSlot(item)}
                      >
                        <Text
                          style={[
                            styles.slotText,
                            selected && styles.slotTextActive,
                          ]}
                        >
                          {item.display}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>

            {selectedSlot && (
              <View style={styles.nextBtnWrapper}>
                <Button
                  title="Continue"
                  onPress={goToConfirm}
                  fullWidth
                  size="lg"
                />
              </View>
            )}
          </View>
        )}

        {step === 4 && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Card variant="elevated" style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Booking Summary</Text>

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Service</Text>
                <Text style={styles.confirmValue}>
                  {selectedService?.name}
                </Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Staff</Text>
                <Text style={styles.confirmValue}>
                  {anyStaff ? 'Any Available' : selectedStaff?.name}
                </Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Date</Text>
                <Text style={styles.confirmValue}>
                  {selectedDate
                    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString(
                        'en-US',
                        { weekday: 'long', month: 'long', day: 'numeric' }
                      )
                    : ''}
                </Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Time</Text>
                <Text style={styles.confirmValue}>
                  {selectedSlot?.display}
                </Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Duration</Text>
                <Text style={styles.confirmValue}>
                  {selectedService?.duration_minutes} min
                </Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Price</Text>
                <Text style={[styles.confirmValue, { color: primaryColor, fontWeight: '700' }]}>
                  {formatCurrency(selectedService?.price ?? 0)}
                </Text>
              </View>

              {selectedService?.deposit_amount ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Deposit</Text>
                    <Text style={styles.confirmValue}>
                      {formatCurrency(selectedService.deposit_amount)}
                    </Text>
                  </View>
                </>
              ) : null}
            </Card>

            <View style={styles.confirmBtnWrapper}>
              <Button
                title="Confirm Booking"
                onPress={handleBook}
                loading={booking}
                disabled={booking}
                fullWidth
                size="lg"
              />
            </View>
          </ScrollView>
        )}
      </Animated.View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backBtn: {
    marginRight: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 20,
    color: Colors.text,
    marginTop: -2,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
  },
  stepDotTextActive: {
    color: Colors.white,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  stepLine: {
    position: 'absolute',
    top: 13,
    right: -SCREEN_WIDTH * 0.06,
    width: SCREEN_WIDTH * 0.12,
    height: 2,
    backgroundColor: Colors.border,
  },
  stepContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  categoryBlock: {
    marginBottom: Spacing.xl,
  },
  categoryTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  serviceCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceColor: {
    width: 6,
    height: 40,
    borderRadius: 3,
    marginRight: Spacing.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: 2,
  },
  serviceMeta: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  serviceDesc: {
    ...Typography.bodySm,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  serviceArrow: {
    fontSize: 24,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
  },
  staffCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  staffAvatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginBottom: 2,
  },
  staffRole: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  centered: {
    marginTop: 60,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  subHeading: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  datePills: {
    gap: Spacing.sm,
  },
  datePill: {
    width: 64,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  datePillToday: {
    borderColor: Colors.textTertiary,
  },
  datePillDay: {
    ...Typography.bodySm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  datePillNum: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  datePillMonth: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  datePillTextActive: {
    color: Colors.white,
  },
  slotsSection: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  slotsGrid: {
    paddingBottom: Spacing.xxxl,
  },
  slotRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  slotChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  slotText: {
    ...Typography.bodySm,
    fontWeight: '600',
    color: Colors.text,
  },
  slotTextActive: {
    color: Colors.white,
  },
  noSlots: {
    alignItems: 'center',
    marginTop: 40,
  },
  noSlotsEmoji: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  noSlotsText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  nextBtnWrapper: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  confirmCard: {
    padding: Spacing.xl,
    marginTop: Spacing.md,
  },
  confirmTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  confirmLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  confirmValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  confirmBtnWrapper: {
    marginTop: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
});
