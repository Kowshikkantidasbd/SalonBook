import { Check, Clock, XCircle, ShieldAlert, CreditCard } from 'lucide-react';

export function AppointmentStatusBadge({
  status,
}: {
  status: 'pending' | 'confirmed' | 'cancelled';
}) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#ECFDF5] text-[#1F6E43] border border-[#1F6E43]/20 whitespace-nowrap">
        <Check className="w-3.5 h-3.5" aria-hidden="true" />
        Confirmed
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#FFF1F2] text-[#9F1239] border border-[#9F1239]/20 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#FEF9EC] text-[#9A7028] border border-[#B5893A]/30 whitespace-nowrap">
      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
      Pending
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: 'unpaid' | 'paid' | 'failed' }) {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#ECFDF5] text-[#1F6E43] border border-[#1F6E43]/20 whitespace-nowrap">
        <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
        Paid
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#FFF1F2] text-[#9F1239] border border-[#9F1239]/20 whitespace-nowrap">
        <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#F3EDE2] text-[#6E6259] border border-[#E5DDD0] whitespace-nowrap">
      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
      Unpaid
    </span>
  );
}

export function ServiceStatusBadge({ status }: { status: 'active' | 'inactive' }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#ECFDF5] text-[#1F6E43] border border-[#1F6E43]/20 whitespace-nowrap">
        <Check className="w-3.5 h-3.5" aria-hidden="true" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#F3EDE2] text-[#6E6259] border border-[#E5DDD0] whitespace-nowrap">
      Inactive
    </span>
  );
}

export function UserBlockBadge({ isBlocked }: { isBlocked: boolean }) {
  if (isBlocked) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#FFF1F2] text-[#9F1239] border border-[#9F1239]/20 whitespace-nowrap">
        <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
        Blocked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#ECFDF5] text-[#1F6E43] border border-[#1F6E43]/20 whitespace-nowrap">
      <Check className="w-3.5 h-3.5" aria-hidden="true" />
      Active
    </span>
  );
}
