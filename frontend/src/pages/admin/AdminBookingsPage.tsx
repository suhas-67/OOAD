import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Download, CreditCard } from 'lucide-react';
import { ApproveRefundModal, GenerateReportModal } from '../../components/admin/AdminModals';
import { adminApi } from '../../services/adminApi';
import type { AdminBookingRow } from '../../types/domain';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { SkeletonRow, EmptyState, ErrorState, BookingStatusBadge, VehicleTypeBadge, SectionHeader } from '../../components/common/UIComponents';

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showApproveRefund, setShowApproveRefund] = useState(false);
  const [showGenerateReport, setShowGenerateReport] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getBookings();
      setBookings(res.data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = bookings.filter(b =>
    !search.trim() ||
    b.passengerName.toLowerCase().includes(search.toLowerCase()) ||
    b.passengerEmail.toLowerCase().includes(search.toLowerCase()) ||
    String(b.bookingId).includes(search) ||
    b.routeSource.toLowerCase().includes(search.toLowerCase()) ||
    b.routeDestination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page page-enter space-y-6">
      <SectionHeader
        title="Bookings Overview"
        subtitle={`${bookings.length} total bookings`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenerateReport(true)}
              className="btn-secondary gap-1.5 text-sm"
              title="Generate Reports («extend» View Bookings)"
            >
              <Download size={14} /> Generate Reports
            </button>
            <button
              onClick={() => setShowApproveRefund(true)}
              className="btn-primary gap-1.5 text-sm"
              title="Approve Refund («include» View Bookings)"
            >
              <CreditCard size={14} /> Approve Refund
            </button>
            <button onClick={fetchBookings} className="btn-ghost gap-1.5 text-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <label className="sr-only" htmlFor="admin-booking-search">Search bookings</label>
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          id="admin-booking-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search passenger, route, booking ID…"
          className="input-field pl-9 py-2.5 text-sm"
        />
      </div>

      {error && <ErrorState message={error} onRetry={fetchBookings} />}

      {!error && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto" role="region" aria-label="Bookings table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Passenger</th>
                  <th>Route</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={9}>
                        <EmptyState icon={<Search size={36} />} title="No bookings found" />
                      </td>
                    </tr>
                  )
                  : filtered.map(b => (
                    <tr key={b.bookingId}>
                      <td className="font-mono text-xs text-slate-500">#{b.bookingId}</td>
                      <td>
                        <p className="font-medium text-slate-200">{b.passengerName}</p>
                        <p className="text-xs text-slate-500">{b.passengerEmail}</p>
                      </td>
                      <td>
                        <p className="text-sm">{b.routeSource} → {b.routeDestination}</p>
                      </td>
                      <td><VehicleTypeBadge type={b.vehicleType} /></td>
                      <td className="text-sm">{formatDate(b.journeyDate)}</td>
                      <td className="text-sm">{b.passengerDetails.length} seat(s)</td>
                      <td>{b.amount != null ? formatCurrency(b.amount) : 'Not available'}</td>
                      <td><BookingStatusBadge status={b.bookingStatus} /></td>
                      <td className="text-right">
                        {b.bookingStatus === 'CANCELLED' ? (
                          <button
                            onClick={() => setShowApproveRefund(true)}
                            className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition shadow-xs"
                            title="Approve Refund for cancelled booking"
                          >
                            Approve Refund
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showApproveRefund && (
        <ApproveRefundModal
          bookings={bookings}
          onClose={() => setShowApproveRefund(false)}
          onRefundApproved={() => fetchBookings()}
        />
      )}

      {showGenerateReport && (
        <GenerateReportModal
          onClose={() => setShowGenerateReport(false)}
        />
      )}
    </div>
  );
};
