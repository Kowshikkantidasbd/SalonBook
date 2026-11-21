'use client';

import { SalonLoader } from '@/components/SalonLoader';
import { PaymentStatusBadge } from '@/components/StatusBadge';
import { formatCurrency } from '@/lib/salonRules';
import type { AdminTransaction } from './types';

export function AdminTransactionsTab({
  loading,
  transactions,
}: {
  loading: boolean;
  transactions: AdminTransaction[];
}) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E5DDD0] rounded-xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(35,26,22,0.04)]">
      <div className="px-4 sm:px-6 py-5 border-b border-[#E5DDD0]/80">
        <h2 className="font-display text-2xl font-semibold text-[#231A16]">
          Payment Transactions
        </h2>
        <p className="text-xs text-[#6E6259] mt-0.5">
          Read-only ledger recorded exclusively from verified Stripe webhook events.
        </p>
      </div>

      {loading ? (
        <SalonLoader size="sm" label="Loading transactions..." className="py-12" />
      ) : transactions.length === 0 ? (
        <div className="p-10 text-center text-sm text-[#6E6259]">
          No payment transactions recorded yet.
        </div>
      ) : (
        <>
          <div className="xl:hidden divide-y divide-[#E5DDD0]/70 md:divide-y-0 md:grid md:grid-cols-2 md:gap-4 md:p-5">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="p-4 sm:p-5 space-y-2.5 md:rounded-xl md:border md:border-[#E5DDD0] md:bg-[#FBF8F3]/45 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#231A16] truncate">
                        {txn.service?.serviceName || txn.appointment?.serviceName || 'Salon Service'}
                      </p>
                      <p className="text-xs text-[#6E6259] truncate mt-0.5">
                        {txn.customer?.name || 'Guest'} · {txn.customer?.email || '—'}
                      </p>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <p className="text-sm font-semibold text-[#231A16]">
                        {formatCurrency(txn.amount, txn.currency)}{' '}
                        <span className="text-[11px] font-normal text-[#6E6259] uppercase">
                          {txn.currency}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6259] tabular-nums">
                      <span>Appt: {txn.appointment?.appointmentDate || '—'}</span>
                      <span>·</span>
                      <span>Paid: {new Date(txn.createdAt).toLocaleDateString()}</span>
                    </div>
                    <PaymentStatusBadge status={txn.status} />
                  </div>
                </div>

                <p className="font-mono text-[11px] text-[#6E6259] truncate pt-2 border-t border-[#E5DDD0]/60">
                  Stripe Session: {txn.stripeSessionId}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden xl:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DDD0] bg-[#F3EDE2]/70 text-xs font-semibold text-[#6E6259]">
                  <th className="py-3 pl-4 pr-2.5">Customer</th>
                  <th className="py-3 px-2.5">Service</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Appt Date</th>
                  <th className="py-3 px-2.5">Amount</th>
                  <th className="py-3 px-2.5 whitespace-nowrap">Session</th>
                  <th className="py-3 px-2.5">Status</th>
                  <th className="py-3 pl-2.5 pr-4 whitespace-nowrap">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD0]/70 text-sm">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-[#F3EDE2]/35 transition-colors">
                    <td className="py-3.5 pl-4 pr-2.5">
                      <p className="font-semibold text-[#231A16] max-w-[155px] truncate">
                        {txn.customer?.name || 'Guest'}
                      </p>
                      <p className="text-xs text-[#6E6259] max-w-[155px] truncate">
                        {txn.customer?.email || '—'}
                      </p>
                    </td>
                    <td className="py-3.5 px-2.5 max-w-[155px] truncate text-[#231A16]">
                      {txn.service?.serviceName || txn.appointment?.serviceName || 'Salon Service'}
                    </td>
                    <td className="py-3.5 px-2.5 text-xs text-[#6E6259] tabular-nums whitespace-nowrap">
                      {txn.appointment?.appointmentDate || '—'}
                    </td>
                    <td className="py-3.5 px-2.5 font-semibold text-[#231A16] tabular-nums whitespace-nowrap">
                      {formatCurrency(txn.amount, txn.currency)}{' '}
                      <span className="text-[11px] font-normal text-[#6E6259] uppercase">
                        {txn.currency}
                      </span>
                    </td>
                    <td
                      className="py-3.5 px-2.5 font-mono text-xs text-[#6E6259] whitespace-nowrap"
                      title={txn.stripeSessionId}
                    >
                      {txn.stripeSessionId.length > 14
                        ? `${txn.stripeSessionId.slice(0, 12)}…`
                        : txn.stripeSessionId}
                    </td>
                    <td className="py-3.5 px-2.5 whitespace-nowrap">
                      <PaymentStatusBadge status={txn.status} />
                    </td>
                    <td className="py-3.5 pl-2.5 pr-4 text-xs text-[#6E6259] tabular-nums whitespace-nowrap">
                      {new Date(txn.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
