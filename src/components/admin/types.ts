import type {
  AppointmentRecord,
  PublicUser,
  ServiceRecord,
  TransactionRecord,
} from '@/lib/salonRules';

export interface AdminStats {
  totalCustomers: number;
  totalActiveServices: number;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  totalSuccessfulPayments: number;
  totalRevenue: number;
}

export interface AdminAppointment extends AppointmentRecord {
  service: ServiceRecord | null;
  customer: PublicUser | null;
}

export interface AdminCustomer extends PublicUser {
  appointmentCount: number;
}

export interface AdminTransaction extends TransactionRecord {
  customer: PublicUser | null;
  appointment: AppointmentRecord | null;
  service: ServiceRecord | null;
}
