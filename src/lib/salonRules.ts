export const SALON_CATEGORIES = [
  'Haircut & Styling',
  'Hair Coloring',
  'Hair Treatment',
  'Facial & Skincare',
  'Makeup',
  'Manicure & Pedicure',
  'Spa & Massage',
] as const;

export type ServiceCategory = (typeof SALON_CATEGORIES)[number];

export const PREDEFINED_TIME_SLOTS = [
  '09:00 AM',
  '10:30 AM',
  '12:00 PM',
  '01:30 PM',
  '03:00 PM',
  '04:30 PM',
  '06:00 PM',
] as const;

export type UserRole = 'customer' | 'admin';
export type ServiceStatus = 'active' | 'inactive';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';
export type TransactionStatus = 'paid' | 'failed';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  image: string;
  phone?: string;
  role: UserRole;
  isBlocked: boolean;
  authProvider?: 'credentials' | 'google';
  createdAt: string;
}

export type PublicUser = Omit<UserRecord, 'passwordHash'>;

export interface ServiceRecord {
  id: string;
  serviceName: string;
  category: ServiceCategory;
  description: string;
  price: number;
  duration: number;
  image: string;
  status: ServiceStatus;
  createdAt: string;
}

export interface AppointmentRecord {
  id: string;
  serviceId: string;
  serviceName?: string;
  serviceImage?: string;
  customerId: string;
  appointmentDate: string;
  timeSlot: string;
  message: string;
  servicePrice: number;
  paymentStatus: PaymentStatus;
  status: AppointmentStatus;
  stripeSessionId?: string;
  createdAt: string;
}

export interface TransactionRecord {
  id: string;
  appointmentId: string;
  customerId: string;
  amount: number;
  currency: string;
  stripeSessionId: string;
  status: TransactionStatus;
  createdAt: string;
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  return { valid: true };
}

export function validateServiceInput(input: {
  serviceName?: string;
  category?: string;
  description?: string;
  price?: number | string;
  duration?: number | string;
  image?: string;
}): { valid: boolean; message?: string } {
  if (!input.serviceName || !input.serviceName.trim()) {
    return { valid: false, message: 'Service name is required.' };
  }
  if (!input.category || !SALON_CATEGORIES.includes(input.category as ServiceCategory)) {
    return { valid: false, message: 'Please select a valid service category.' };
  }
  const priceNum = Number(input.price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return { valid: false, message: 'Price must be a positive number.' };
  }
  const durationNum = Number(input.duration);
  if (!Number.isFinite(durationNum) || durationNum <= 0) {
    return { valid: false, message: 'Estimated duration must be a positive number.' };
  }
  if (!input.image || !input.image.trim()) {
    return { valid: false, message: 'Service image upload is required.' };
  }
  return { valid: true };
}

export function canCustomerCancelAppointment(
  appointment: AppointmentRecord,
  customerId: string
): boolean {
  return appointment.customerId === customerId && appointment.status === 'pending';
}

export function canCustomerPayAppointment(
  appointment: AppointmentRecord,
  customerId: string
): boolean {
  return (
    appointment.customerId === customerId &&
    appointment.status === 'confirmed' &&
    appointment.paymentStatus === 'unpaid'
  );
}

export function canAdminConfirmAppointment(appointment: AppointmentRecord): boolean {
  return appointment.status === 'pending';
}

export function canAdminCancelAppointment(appointment: AppointmentRecord): boolean {
  return appointment.status === 'pending' || appointment.status === 'confirmed';
}

export function formatCurrency(amount: number, currency = 'usd'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hrs} hr` : `${hrs} hr ${rem} min`;
}

export function filterAndSortServices(
  services: ServiceRecord[],
  options: {
    search?: string;
    category?: string;
    sort?: 'price_asc' | 'price_desc' | 'newest';
    includeInactive?: boolean;
  } = {}
): ServiceRecord[] {
  const { search = '', category = 'All', sort = 'newest', includeInactive = false } = options;
  const normalizedSearch = search.trim().toLowerCase();

  const filtered = services.filter((svc) => {
    if (!includeInactive && svc.status !== 'active') return false;
    if (category && category !== 'All' && svc.category !== category) return false;
    if (normalizedSearch) {
      const haystack = `${svc.serviceName} ${svc.category} ${svc.description}`.toLowerCase();
      if (!haystack.includes(normalizedSearch)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price;
    if (sort === 'price_desc') return b.price - a.price;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function hasBookingConflict(
  appointments: AppointmentRecord[],
  candidate: {
    serviceId: string;
    customerId: string;
    appointmentDate: string;
    timeSlot: string;
  }
): { conflict: boolean; reason?: string } {
  for (const apt of appointments) {
    if (apt.status === 'cancelled') continue;
    if (
      apt.appointmentDate === candidate.appointmentDate &&
      apt.timeSlot === candidate.timeSlot
    ) {
      if (apt.customerId === candidate.customerId) {
        return {
          conflict: true,
          reason: 'You already have an appointment request at this date and time slot.',
        };
      }
      if (apt.serviceId === candidate.serviceId) {
        return {
          conflict: true,
          reason: 'This time slot is already reserved for this service. Please select another slot.',
        };
      }
    }
  }
  return { conflict: false };
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultBookingDate(baseDate: Date = new Date()): string {
  const tomorrow = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + 1
  );
  return getLocalDateString(tomorrow);
}

export function normalizeServiceSort(
  raw: string | null | undefined
): 'newest' | 'price_asc' | 'price_desc' {
  if (raw === 'price_asc' || raw === 'price_desc') return raw;
  return 'newest';
}

export function pickNextAvailableSlot(
  slots: ReadonlyArray<{ timeSlot: string; available: boolean }>,
  currentSlot: string
): string {
  if (slots.some((s) => s.timeSlot === currentSlot && s.available)) {
    return currentSlot;
  }
  const firstOpen = slots.find((s) => s.available);
  return firstOpen ? firstOpen.timeSlot : '';
}

export function resolvePostLoginRedirect(
  role: UserRole,
  redirectTarget: string | null | undefined
): string {
  const defaultPath = role === 'admin' ? '/dashboard/admin' : '/dashboard/customer';
  if (!redirectTarget || !redirectTarget.startsWith('/') || redirectTarget.startsWith('//')) {
    return defaultPath;
  }
  if (
    role === 'admin' &&
    (redirectTarget.startsWith('/dashboard/customer') ||
      redirectTarget.startsWith('/checkout') ||
      redirectTarget.startsWith('/payment'))
  ) {
    return defaultPath;
  }
  if (role === 'customer' && redirectTarget.startsWith('/dashboard/admin')) {
    return defaultPath;
  }
  return redirectTarget;
}


