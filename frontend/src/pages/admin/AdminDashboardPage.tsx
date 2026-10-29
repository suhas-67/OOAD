import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, CheckCircle, TrendingUp, Train, Bus, Map,
  Activity, RefreshCw, Calendar, Tag, Layers, CreditCard,
  FileText, Download, Edit3, Trash2, Plus, ArrowRight, ShieldCheck
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { scheduleApi } from '../../services/scheduleApi';
import type { DashboardStats, Schedule, Route, Train as TrainType, Bus as BusType, AdminBookingRow, AdminUserRow } from '../../types/domain';
import { formatCurrency } from '../../utils/formatters';
import { Spinner, ErrorState, SectionHeader } from '../../components/common/UIComponents';
import {
  UpdateScheduleModal,
  ManagePricingModal,
  SeatInventoryModal,
  ApproveRefundModal,
  GenerateReportModal,
  ModalWrapper
} from '../../components/admin/AdminModals';
import toast from 'react-hot-toast';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trains, setTrains] = useState<TrainType[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state for use-case features
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showUpdateSchedule, setShowUpdateSchedule] = useState(false);
  const [showDeleteSchedule, setShowDeleteSchedule] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showSeatInventory, setShowSeatInventory] = useState(false);
  const [showApproveRefund, setShowApproveRefund] = useState(false);
  const [showGenerateReport, setShowGenerateReport] = useState(false);
  const [showQuickUsers, setShowQuickUsers] = useState(false);

  // Form state for quick add schedule
  const [newRouteId, setNewRouteId] = useState<number>(0);
  const [newVehicleType, setNewVehicleType] = useState<'Train' | 'Bus'>('Train');
  const [newTrainId, setNewTrainId] = useState<number | null>(null);
  const [newBusId, setNewBusId] = useState<number | null>(null);
  const [newDeptTime, setNewDeptTime] = useState('08:00');
  const [newArrTime, setNewArrTime] = useState('12:00');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newFare, setNewFare] = useState(550);
  const [creatingSchedule, setCreatingSchedule] = useState(false);

  // State for delete schedule modal
  const [scheduleToDelete, setScheduleToDelete] = useState<number>(0);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, schedRes, rRes, tRes, bRes, bookRes, userRes] = await Promise.all([
        adminApi.getDashboardStats(),
        scheduleApi.getAll(),
        scheduleApi.getRoutes(),
        scheduleApi.getTrains(),
        scheduleApi.getBuses(),
        adminApi.getBookings(),
        adminApi.getUsers(),
      ]);
      setStats(statsRes.data);
      setSchedules(schedRes.data);
      setRoutes(rRes.data);
      setTrains(tRes.data);
      setBuses(bRes.data);
      setBookings(bookRes.data);
      setUsers(userRes.data);
      if (schedRes.data.length > 0) {
        setScheduleToDelete(schedRes.data[0].scheduleId);
      }
      if (rRes.data.length > 0) {
        setNewRouteId(rRes.data[0].routeId);
      }
      if (tRes.data.length > 0) {
        setNewTrainId(tRes.data[0].trainId);
      }
      if (bRes.data.length > 0) {
        setNewBusId(bRes.data[0].busId);
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleCreateScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteId) {
      toast.error('Please select a route');
      return;
    }
    setCreatingSchedule(true);
    try {
      const res = await scheduleApi.create({
        routeId: newRouteId,
        trainId: newVehicleType === 'Train' ? newTrainId : null,
        busId: newVehicleType === 'Bus' ? newBusId : null,
        departureTime: newDeptTime,
        arrivalTime: newArrTime,
        journeyDate: newDate,
        fare: Number(newFare),
      });
      toast.success('Schedule created successfully');
      setSchedules(prev => [res.data, ...prev]);
      setShowAddSchedule(false);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Failed to create schedule');
    } finally {
      setCreatingSchedule(false);
    }
  };

  const handleDeleteScheduleConfirm = async () => {
    if (!scheduleToDelete) return;
    try {
      await scheduleApi.delete(scheduleToDelete);
      toast.success(`Schedule #${scheduleToDelete} deleted successfully`);
      setSchedules(prev => prev.filter(s => s.scheduleId !== scheduleToDelete));
      setShowDeleteSchedule(false);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Failed to delete schedule');
    }
  };

  const handleUserStatusToggle = async (userId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      await adminApi.updateUserStatus(userId, nextStatus as any);
      toast.success(`User #${userId} status set to ${nextStatus}`);
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, accountStatus: nextStatus as any } : u));
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Failed to update user status');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <ErrorState message={error} onRetry={fetchAllData} />;
  if (!stats) return null;

  const confirmationRate = stats.totalBookings > 0
    ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100)
    : 0;

  const kpiCards = [
    {
      icon: <Users size={19} className="text-brand-700" />,
      label: 'Total Passengers',
      value: stats.totalPassengers.toLocaleString(),
    },
    {
      icon: <BookOpen size={19} className="text-brand-700" />,
      label: 'Total Bookings',
      value: stats.totalBookings.toLocaleString(),
      sub: `${stats.confirmedBookings} confirmed`,
    },
    {
      icon: <CheckCircle size={19} className="text-brand-700" />,
      label: 'Confirmed Bookings',
      value: stats.confirmedBookings.toLocaleString(),
      sub: `${confirmationRate}% confirmation rate`,
    },
    {
      icon: <TrendingUp size={19} className="text-brand-700" />,
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      sub: `${stats.pendingPayments} pending payments`,
      large: true,
    },
    {
      icon: <Activity size={19} className="text-brand-700" />,
      label: 'Active Schedules',
      value: stats.activeSchedules.toLocaleString(),
    },
    {
      icon: <Train size={19} className="text-brand-700" />,
      label: 'Trains',
      value: stats.totalTrains.toLocaleString(),
    },
    {
      icon: <Bus size={19} className="text-brand-700" />,
      label: 'Buses',
      value: stats.totalBuses.toLocaleString(),
    },
    {
      icon: <Map size={19} className="text-brand-700" />,
      label: 'Routes',
      value: stats.totalRoutes.toLocaleString(),
    },
  ];

  return (
    <div className="admin-page page-enter space-y-8">
      {/* Top Header */}
      <SectionHeader
        title="Admin Dashboard"
        subtitle="System overview and key metrics"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenerateReport(true)}
              className="btn-secondary gap-1.5 text-sm"
              title="Generate & download reports"
            >
              <Download size={14} /> Generate Reports
            </button>
            <button onClick={fetchAllData} className="btn-ghost gap-1.5 text-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        }
      />

      {/* KPI Grid */}
      <dl className="grid grid-cols-2 border-l border-t border-slate-200 sm:grid-cols-3 lg:grid-cols-4">
        {kpiCards.map(card => (
          <div key={card.label} className="min-w-0 border-b border-r border-slate-200 px-3 py-4 sm:px-4">
            <dt className="mb-3 flex items-center gap-2 text-sm text-slate-600">
              {card.icon}{card.label}
            </dt>
            <dd className={`tabular-nums font-semibold tracking-tight text-slate-900 ${card.large ? 'text-xl sm:text-2xl' : 'text-2xl'}`}>
              {card.value}
            </dd>
            {card.sub && <dd className="mt-1 text-xs text-slate-600">{card.sub}</dd>}
          </div>
        ))}
      </dl>

      {/* Booking breakdown */}
      <section className="glass-card p-5" aria-label="Booking status breakdown">
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-3">
          {[
            { label: 'Initiated', count: stats.totalBookings - stats.confirmedBookings - stats.cancelledBookings, color: 'text-slate-700', bar: 'bg-slate-600' },
            { label: 'Confirmed', count: stats.confirmedBookings, color: 'text-success-400', bar: 'bg-success-500' },
            { label: 'Cancelled', count: stats.cancelledBookings, color: 'text-danger-400', bar: 'bg-danger-500' },
          ].map(({ label, count, color, bar }) => {
            const pct = stats.totalBookings > 0 ? Math.round((count / stats.totalBookings) * 100) : 0;
            return (
              <div key={label} className="min-w-0 border-l border-slate-200 py-2 pl-4">
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`tabular-nums text-lg font-semibold ${color}`}>{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-500">
                  <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-slate-600">{pct}% of total</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── MODULE 4 USE CASE OPERATIONS SECTION ───────────────────────────── */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-brand-700" size={20} />
              Module 4 — Admin & Schedule Management Operations
            </h2>
            <p className="text-xs text-slate-500">
              Directly interactive features mapped to the Module 4 Use Case Diagram
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 self-start sm:self-auto">
            11 Use Cases Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* 1. Manage Schedule */}
          <div className="glass-card p-5 border border-slate-200 hover:border-brand-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Calendar size={18} />
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Core Use Case</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Manage Schedule</h3>
              <p className="text-xs text-slate-600 mt-1">
                Primary schedule hub with specialized actions for adding, editing, and deleting transit schedules.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              <button
                onClick={() => setShowAddSchedule(true)}
                className="px-2.5 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title="Add Schedule (arrow to Manage Schedule)"
              >
                <Plus size={13} /> Add
              </button>
              <button
                onClick={() => setShowUpdateSchedule(true)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title="Update Schedule (arrow to Manage Schedule)"
              >
                <Edit3 size={13} /> Update
              </button>
              <button
                onClick={() => setShowDeleteSchedule(true)}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title="Delete Schedule (arrow to Manage Schedule)"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>

          {/* 2. Manage Ticket Pricing */}
          <div className="glass-card p-5 border border-slate-200 hover:border-amber-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Tag size={18} />
                </span>
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">«extend»</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Manage Ticket Pricing</h3>
              <p className="text-xs text-slate-600 mt-1">
                Configure base fare, peak-hour rush surges, festival rates, and early bird promotional discounts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowPricingModal(true)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Tag size={14} /> Open Ticket Pricing Controls
              </button>
            </div>
          </div>

          {/* 3. Manage Seat Inventory */}
          <div className="glass-card p-5 border border-slate-200 hover:border-emerald-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Layers size={18} />
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">«include»</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Manage Seat Inventory</h3>
              <p className="text-xs text-slate-600 mt-1">
                Inspect coach seating matrix, real-time booked seats, and allocate VIP or maintenance quota locks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowSeatInventory(true)}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Layers size={14} /> Open Seat Inventory Matrix
              </button>
            </div>
          </div>

          {/* 4. Manage Users */}
          <div className="glass-card p-5 border border-slate-200 hover:border-blue-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Users size={18} />
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Core Use Case</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Manage Users</h3>
              <p className="text-xs text-slate-600 mt-1">
                View registered passengers ({users.filter(u => u.role === 'PASSENGER').length}) and administrators. Toggle Active, Inactive, or Suspended states.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setShowQuickUsers(true)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                Quick Status
              </button>
              <Link
                to="/admin/users"
                className="flex-1 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                Full User List <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* 5. View Bookings & Approve Refund */}
          <div className="glass-card p-5 border border-slate-200 hover:border-indigo-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <CreditCard size={18} />
                </span>
                <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">«include» Approve Refund</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">View Bookings & Approve Refund</h3>
              <p className="text-xs text-slate-600 mt-1">
                Audit passenger reservations and authorize payment gateway refunds on cancelled bookings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
              <Link
                to="/admin/bookings"
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                View Bookings
              </Link>
              <button
                onClick={() => setShowApproveRefund(true)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs"
              >
                Approve Refund
              </button>
            </div>
          </div>

          {/* 6. Generate Reports & View Reports */}
          <div className="glass-card p-5 border border-slate-200 hover:border-cyan-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                  <FileText size={18} />
                </span>
                <span className="text-[11px] font-semibold text-cyan-700 uppercase tracking-wider">«extend» Generate Reports</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Generate Reports & View Reports</h3>
              <p className="text-xs text-slate-600 mt-1">
                Export executive reports (CSV/TXT) or inspect real-time revenue and route occupancy analytics.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setShowGenerateReport(true)}
                className="flex-1 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Download size={13} /> Generate
              </button>
              <Link
                to="/admin/reports"
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                View Reports <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ─── MODALS ─────────────────────────────────────────────────────────── */}

      {/* 1. Add Schedule Modal */}
      {showAddSchedule && (
        <ModalWrapper
          title="Add Schedule (Use Case: Add Schedule)"
          subtitle="Deploy a new train or bus journey schedule to the system"
          onClose={() => setShowAddSchedule(false)}
        >
          <form onSubmit={handleCreateScheduleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Route</label>
              <select
                value={newRouteId}
                onChange={e => setNewRouteId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              >
                {routes.map(r => (
                  <option key={r.routeId} value={r.routeId}>
                    {r.source} → {r.destination} ({r.distance} km)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Transport Vehicle Type</label>
              <div className="grid grid-cols-2 gap-3 mb-2">
                {(['Train', 'Bus'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewVehicleType(type)}
                    className={`py-2 rounded-xl text-sm font-semibold border transition ${
                      newVehicleType === type
                        ? 'border-brand-600 bg-brand-50 text-brand-900'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {type === 'Train' ? '🚂 Train Service' : '🚌 Bus Service'}
                  </button>
                ))}
              </div>

              {newVehicleType === 'Train' ? (
                <select
                  value={newTrainId ?? ''}
                  onChange={e => setNewTrainId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  required
                >
                  {trains.map(t => (
                    <option key={t.trainId} value={t.trainId}>
                      {t.trainName} ({t.totalSeats} seats)
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={newBusId ?? ''}
                  onChange={e => setNewBusId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  required
                >
                  {buses.map(b => (
                    <option key={b.busId} value={b.busId}>
                      {b.busType} ({b.totalSeats} seats)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Departure Time</label>
                <input
                  type="time"
                  value={newDeptTime}
                  onChange={e => setNewDeptTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Arrival Time</label>
                <input
                  type="time"
                  value={newArrTime}
                  onChange={e => setNewArrTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Journey Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Base Fare (₹)</label>
                <input
                  type="number"
                  value={newFare}
                  min={50}
                  step={10}
                  onChange={e => setNewFare(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddSchedule(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingSchedule}
                className="px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5"
              >
                <Plus size={15} />
                {creatingSchedule ? 'Adding...' : 'Add Schedule to System'}
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* 2. Update Schedule Modal */}
      {showUpdateSchedule && (
        <UpdateScheduleModal
          schedules={schedules}
          onClose={() => setShowUpdateSchedule(false)}
          onUpdated={updated => {
            setSchedules(prev => prev.map(s => s.scheduleId === updated.scheduleId ? updated : s));
          }}
        />
      )}

      {/* 3. Delete Schedule Modal */}
      {showDeleteSchedule && (
        <ModalWrapper
          title="Delete Schedule (Use Case: Delete Schedule)"
          subtitle="Permanently remove an existing schedule from operational routes"
          onClose={() => setShowDeleteSchedule(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Select Schedule to Delete</label>
              <select
                value={scheduleToDelete}
                onChange={e => setScheduleToDelete(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {schedules.map(s => (
                  <option key={s.scheduleId} value={s.scheduleId}>
                    Schedule #{s.scheduleId} — {s.journeyDate} ({s.departureTime}) [Status: {s.status}]
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
              <strong>Warning:</strong> Deleting schedule #{scheduleToDelete} will permanently remove it from passenger search results.
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteSchedule(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteScheduleConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5"
              >
                <Trash2 size={15} /> Confirm Delete
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* 4. Ticket Pricing Modal */}
      {showPricingModal && (
        <ManagePricingModal
          schedules={schedules}
          onClose={() => setShowPricingModal(false)}
          onUpdated={updated => {
            setSchedules(prev => prev.map(s => s.scheduleId === updated.scheduleId ? updated : s));
          }}
        />
      )}

      {/* 5. Seat Inventory Modal */}
      {showSeatInventory && (
        <SeatInventoryModal
          schedules={schedules}
          onClose={() => setShowSeatInventory(false)}
        />
      )}

      {/* 6. Approve Refund Modal */}
      {showApproveRefund && (
        <ApproveRefundModal
          bookings={bookings}
          onClose={() => setShowApproveRefund(false)}
          onRefundApproved={bookingId => {
            setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, bookingStatus: 'CANCELLED' } : b));
          }}
        />
      )}

      {/* 7. Generate Reports Modal */}
      {showGenerateReport && (
        <GenerateReportModal
          onClose={() => setShowGenerateReport(false)}
        />
      )}

      {/* 8. Quick Users Modal */}
      {showQuickUsers && (
        <ModalWrapper
          title="Manage Users (Use Case: Manage Users)"
          subtitle="Audit accounts and quickly toggle Active / Suspended statuses"
          onClose={() => setShowQuickUsers(false)}
        >
          <div className="space-y-3">
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {users.map(u => (
                <div key={u.userId} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-slate-900">{u.userName}</span>
                    <span className="text-xs text-slate-500 ml-2">({u.email})</span>
                    <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{u.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      u.accountStatus === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {u.accountStatus ?? 'Active'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUserStatusToggle(u.userId, u.accountStatus ?? 'Active')}
                      className="px-2 py-1 text-xs border border-slate-300 hover:bg-slate-50 rounded font-medium transition"
                    >
                      Toggle
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <Link to="/admin/users" className="text-xs text-brand-700 font-semibold hover:underline">
                Open Full Users Table →
              </Link>
              <button
                type="button"
                onClick={() => setShowQuickUsers(false)}
                className="px-4 py-1.5 bg-brand-700 text-white rounded-lg text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

    </div>
  );
};
