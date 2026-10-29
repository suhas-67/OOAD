import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Users, BookOpen, Map, RefreshCw, Download } from 'lucide-react';
import { GenerateReportModal } from '../../components/admin/AdminModals';
import { adminApi, type ReportData } from '../../services/adminApi';
import { formatCurrency } from '../../utils/formatters';
import { Spinner, ErrorState, SectionHeader } from '../../components/common/UIComponents';

export const AdminReportsPage: React.FC = () => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGenerateReport, setShowGenerateReport] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getReports();
      setReport(res.data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <ErrorState message={error} onRetry={fetchReport} />;
  if (!report) return null;

  const totalRevByMethod = report.revenue.byMethod.reduce((sum, method) => sum + method.amount, 0) || 1;

  return (
    <div className="admin-page page-enter space-y-6">
      <SectionHeader
        title="Reports and analytics"
        subtitle="Revenue, booking, passenger, and route performance."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenerateReport(true)}
              className="btn-primary gap-1.5 text-sm"
              title="Generate & download reports («extend» View Bookings)"
            >
              <Download size={14} /> Generate Reports
            </button>
            <button onClick={fetchReport} className="btn-ghost gap-1.5 text-sm">
              <RefreshCw size={14} aria-hidden="true" /> Refresh
            </button>
          </div>
        }
      />

      <section className="glass-card p-5 sm:p-6" aria-labelledby="revenue-title">
        <h2 id="revenue-title" className="mb-5 flex items-center gap-2 text-lg font-semibold text-white">
          <TrendingUp size={17} className="text-brand-700" aria-hidden="true" />Revenue
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-600">Total revenue</p>
            <p className="tabular-nums mt-1 text-3xl font-semibold tracking-tight text-white">{formatCurrency(report.revenue.total)}</p>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-700">By payment method</p>
            {report.revenue.byMethod.map(method => (
              <div key={method.method}>
                <div className="mb-1 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-slate-700">{method.method}</span>
                  <span className="tabular-nums font-medium text-slate-900">
                    {formatCurrency(method.amount)} ({method.count} payments)
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-brand-700" style={{ width: `${(method.amount / totalRevByMethod) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-card p-5 sm:p-6" aria-labelledby="bookings-title">
        <h2 id="bookings-title" className="mb-5 flex items-center gap-2 text-lg font-semibold text-white">
          <BookOpen size={17} className="text-brand-700" aria-hidden="true" />Bookings
        </h2>
        <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {[
            { label: 'Total', count: report.bookings.total },
            { label: 'Confirmed', count: report.bookings.confirmed },
            { label: 'Initiated', count: report.bookings.initiated },
            { label: 'Cancelled', count: report.bookings.cancelled },
          ].map(({ label, count }) => (
            <div key={label} className="border-l border-slate-200 pl-4">
              <dd className="tabular-nums text-2xl font-semibold text-white">{count}</dd>
              <dt className="mt-1 text-sm text-slate-600">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="glass-card p-5 sm:p-6" aria-labelledby="passengers-title">
        <h2 id="passengers-title" className="mb-5 flex items-center gap-2 text-lg font-semibold text-white">
          <Users size={17} className="text-brand-700" aria-hidden="true" />Passengers
        </h2>
        <dl className="grid grid-cols-2 gap-5">
          <div className="border-l border-slate-200 pl-4">
            <dd className="tabular-nums text-2xl font-semibold text-white">{report.passengers.total}</dd>
            <dt className="mt-1 text-sm text-slate-600">Registered</dt>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <dd className="tabular-nums text-2xl font-semibold text-white">{report.passengers.active}</dd>
            <dt className="mt-1 text-sm text-slate-600">Active accounts</dt>
          </div>
        </dl>
      </section>

      {report.routes && report.routes.length > 0 && (
        <section className="glass-card p-5 sm:p-6" aria-labelledby="routes-title">
          <h2 id="routes-title" className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Map size={17} className="text-brand-700" aria-hidden="true" />Route performance
          </h2>
          <div className="overflow-x-auto" role="region" aria-label="Route performance table" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr><th>Route</th><th>Bookings</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {report.routes.map((route, index) => (
                  <tr key={`${route.routeSource}-${route.routeDestination}-${index}`}>
                    <td>{route.routeSource} to {route.routeDestination}</td>
                    <td>{route.bookingCount}</td>
                    <td>{formatCurrency(route.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {report.vehicles && report.vehicles.length > 0 && (
        <section className="glass-card p-5 sm:p-6" aria-labelledby="occupancy-title">
          <h2 id="occupancy-title" className="mb-5 text-lg font-semibold text-white">Vehicle occupancy</h2>
          <div className="space-y-4">
            {report.vehicles.map((vehicle, index) => (
              <div key={`${vehicle.vehicleType}-${vehicle.vehicleId}-${index}`}>
                <div className="mb-1 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-slate-700">{vehicle.vehicleType} #{vehicle.vehicleId}</span>
                  <span className="tabular-nums text-slate-800">
                    {vehicle.bookingCount} bookings, {Math.round(vehicle.occupancyRate)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-brand-700"
                    style={{ width: `${Math.min(100, Math.max(0, vehicle.occupancyRate))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showGenerateReport && (
        <GenerateReportModal
          onClose={() => setShowGenerateReport(false)}
        />
      )}
    </div>
  );
};
