export interface Business {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  timezone: string;
  currency: string;
  website: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  business_hours: any;
  booking_enabled: boolean;
  deposit_required: boolean;
  default_deposit_amount: number;
  cancellation_hours: number;
  voucher_validation_enabled: boolean;
}

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  has_password?: boolean;
  total_visits?: number;
}

export interface Service {
  id: number;
  name: string;
  category: string;
  duration_minutes: number;
  price: number;
  deposit_amount: number;
  color: string;
  description: string;
}

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  avatar_url: string | null;
}

export interface Appointment {
  id: number;
  service_name: string;
  service_color: string;
  staff_name: string;
  date: string;
  date_display: string;
  time: string;
  ends_at: string;
  status: string;
  deposit_paid: boolean;
  deposit_amount: number;
  notes: string;
  confirmed_at: string | null;
  can_cancel?: boolean;
}

export interface Package {
  id: number;
  service_name: string;
  total_sessions: number;
  remaining_sessions: number;
  used_sessions?: number;
  expires_at: string | null;
  is_active?: boolean;
}

export interface Message {
  id: number;
  direction: 'inbound' | 'outbound';
  body: string;
  created_at: string;
}

export interface TimeSlot {
  time: string;
  display: string;
}
