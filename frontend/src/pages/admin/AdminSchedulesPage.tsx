import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Train, Bus, X, CheckCircle, AlertCircle, Tag, Layers, Edit3 } from 'lucide-react';
import { UpdateScheduleModal, ManagePricingModal, SeatInventoryModal } from '../../components/admin/AdminModals';
import { scheduleApi, type CreateSchedulePayload } from '../../services/scheduleApi';
import type { Schedule, Route, Train as TrainType, Bus as BusType } from '../../types/domain';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';
import { SkeletonCard, EmptyState, ErrorState, ConfirmDialog, SectionHeader } from '../../components/common/UIComponents';
import toast from 'react-hot-toast';

type Tab = 'schedules' | 'routes' | 'trains' | 'buses';

export const AdminSchedulesPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('schedules');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trains, setTrains] = useState<TrainType[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [showCreateTrain, setShowCreateTrain] = useState(false);
  const [showCreateBus, setShowCreateBus] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [updateScheduleId, setUpdateScheduleId] = useState<number | null>(null);
  const [pricingScheduleId, setPricingScheduleId] = useState<number | null>(null);
  const [seatScheduleId, setSeatScheduleId] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sRes, rRes, tRes, bRes] = await Promise.all([
        scheduleApi.getAll(),
        scheduleApi.getRoutes(),
        scheduleApi.getTrains(),
        scheduleApi.getBuses(),
      ]);
      setSchedules(sRes.data);
      setRoutes(rRes.data);
      setTrains(tRes.data);
      setBuses(bRes.data);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDeleteSchedule = async () => {
    if (!deleteTarget) return;
    try {
      await scheduleApi.delete(deleteTarget);
      toast.success('Schedule deleted');
      setSchedules(prev => prev.filter(s => s.scheduleId !== deleteTarget));
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Delete failed');
    } finally {
      setDeleteTarget(null);
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'schedules', label: 'Schedules', count: schedules.length },
    { key: 'routes', label: 'Routes', count: routes.length },
    { key: 'trains', label: 'Trains', count: trains.length },
    { key: 'buses', label: 'Buses', count: buses.length },
  ];

  return (
    <div className="admin-page page-enter space-y-6">
      <SectionHeader
        title="Schedule Management"
        subtitle="Manage routes, vehicles, and schedules"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPricingScheduleId(schedules[0]?.scheduleId ?? 0)}
              className="btn-secondary gap-1.5 text-sm"
              title="Manage Ticket Pricing («extend» Manage Schedule)"
            >
              <Tag size={14} /> Ticket Pricing
            </button>
            <button
              onClick={() => setSeatScheduleId(schedules[0]?.scheduleId ?? 0)}
              className="btn-secondary gap-1.5 text-sm"
              title="Manage Seat Inventory («include» Update Schedule)"
            >
              <Layers size={14} /> Seat Inventory
            </button>
            <button
              onClick={() => {
                if (tab === 'schedules') setShowCreateSchedule(true);
                if (tab === 'routes') setShowCreateRoute(true);
                if (tab === 'trains') setShowCreateTrain(true);
                if (tab === 'buses') setShowCreateBus(true);
              }}
              className="btn-primary gap-2 text-sm"
            >
              <Plus size={15} />Add {tab.slice(0, -1).charAt(0).toUpperCase() + tab.slice(0, -1).slice(1)}
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-0" role="group" aria-label="Schedule management sections">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              tab === t.key
                ? 'border-brand-500 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-brand-600/30' : 'bg-surface-500/60'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading && <SkeletonCard lines={5} />}
      {error && <ErrorState message={error} onRetry={fetchAll} />}

      {!loading && !error && (
        <>
          {tab === 'schedules' && (
            <ScheduleTable
              schedules={schedules}
              routes={routes}
              trains={trains}
              buses={buses}
              onDelete={id => setDeleteTarget(id)}
              onEdit={id => setUpdateScheduleId(id)}
              onManagePricing={id => setPricingScheduleId(id)}
              onManageSeats={id => setSeatScheduleId(id)}
            />
          )}
          {tab === 'routes' && <RouteTable routes={routes} />}
          {tab === 'trains' && <TrainTable trains={trains} />}
          {tab === 'buses' && <BusTable buses={buses} />}
        </>
      )}

      {showCreateSchedule && (
        <CreateScheduleModal
          routes={routes} trains={trains} buses={buses}
          onClose={() => setShowCreateSchedule(false)}
          onCreated={(s) => { setSchedules(prev => [...prev, s]); setShowCreateSchedule(false); }}
        />
      )}
      {showCreateRoute && (
        <CreateRouteModal
          onClose={() => setShowCreateRoute(false)}
          onCreated={(r) => { setRoutes(prev => [...prev, r]); setShowCreateRoute(false); }}
        />
      )}
      {showCreateTrain && (
        <CreateTrainModal
          onClose={() => setShowCreateTrain(false)}
          onCreated={(t) => { setTrains(prev => [...prev, t]); setShowCreateTrain(false); }}
        />
      )}
      {showCreateBus && (
        <CreateBusModal
          onClose={() => setShowCreateBus(false)}
          onCreated={(b) => { setBuses(prev => [...prev, b]); setShowCreateBus(false); }}
        />
      )}

      {updateScheduleId !== null && (
        <UpdateScheduleModal
          schedules={schedules}
          initialScheduleId={updateScheduleId}
          onClose={() => setUpdateScheduleId(null)}
          onUpdated={updated => {
            setSchedules(prev => prev.map(s => s.scheduleId === updated.scheduleId ? updated : s));
          }}
        />
      )}
      {pricingScheduleId !== null && (
        <ManagePricingModal
          schedules={schedules}
          initialScheduleId={pricingScheduleId}
          onClose={() => setPricingScheduleId(null)}
          onUpdated={updated => {
            setSchedules(prev => prev.map(s => s.scheduleId === updated.scheduleId ? updated : s));
          }}
        />
      )}
      {seatScheduleId !== null && (
        <SeatInventoryModal
          schedules={schedules}
          initialScheduleId={seatScheduleId}
          onClose={() => setSeatScheduleId(null)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Schedule?"
        message={`This will permanently delete schedule #${deleteTarget}.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteSchedule}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
};

// ─── Tables ───────────────────────────────────────────────────────────────────

const ScheduleTable: React.FC<{
  schedules: Schedule[];
  routes: Route[];
  trains: TrainType[];
  buses: BusType[];
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onManagePricing: (id: number) => void;
  onManageSeats: (id: number) => void;
}> = ({ schedules, routes, trains, buses, onDelete, onEdit, onManagePricing, onManageSeats }) => {
  const routeMap = Object.fromEntries(routes.map(r => [r.routeId, r]));
  const trainMap = Object.fromEntries(trains.map(t => [t.trainId, t]));
  const busMap   = Object.fromEntries(buses.map(b => [b.busId, b]));

  if (schedules.length === 0) return <EmptyState icon={<Train size={40} />} title="No schedules yet" description="Create a schedule to get started" />;

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto" role="region" aria-label="Schedules table" tabIndex={0}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Route</th><th>Vehicle</th><th>Date</th>
              <th>Departure</th><th>Arrival</th><th>Fare</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(s => {
              const route = routeMap[s.routeId];
              const isTrainSchedule = s.trainId != null;
              const vehicle = isTrainSchedule ? trainMap[s.trainId!] : busMap[s.busId!];
              return (
                <tr key={s.scheduleId}>
                  <td className="font-mono text-xs text-slate-500">#{s.scheduleId}</td>
                  <td>
                    {route
                      ? <span className="text-slate-200">{route.source} → {route.destination}</span>
                      : <span className="text-slate-500">Route not available</span>
                    }
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {isTrainSchedule
                        ? <><Train size={13} className="text-info-400" /><span className="text-xs">{(vehicle as TrainType)?.trainName ?? 'Train'}</span></>
                        : <><Bus size={13} className="text-accent-400" /><span className="text-xs">{(vehicle as BusType)?.busType ?? 'Bus'}</span></>
                      }
                    </div>
                  </td>
                  <td className="text-sm">{formatDate(s.journeyDate)}</td>
                  <td className="font-mono text-sm">{formatTime(s.departureTime)}</td>
                  <td className="font-mono text-sm">{formatTime(s.arrivalTime)}</td>
                  <td>{formatCurrency(s.fare)}</td>
                  <td>
                    <span className={`text-xs font-medium ${s.status === 'Active' ? 'text-success-400' : s.status === 'Cancelled' ? 'text-danger-400' : 'text-slate-400'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onManagePricing(s.scheduleId)}
                        title="Manage Ticket Pricing («extend» Manage Schedule)"
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                      >
                        <Tag size={14} />
                      </button>
                      <button
                        onClick={() => onManageSeats(s.scheduleId)}
                        title="Manage Seat Inventory («include» Update Schedule)"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition"
                      >
                        <Layers size={14} />
                      </button>
                      <button
                        onClick={() => onEdit(s.scheduleId)}
                        title="Update Schedule (Use Case: Update Schedule)"
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-md transition"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(s.scheduleId)}
                        title="Delete Schedule (Use Case: Delete Schedule)"
                        className="p-1.5 text-slate-500 hover:text-danger-400 hover:bg-slate-100 rounded-md transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RouteTable: React.FC<{ routes: Route[] }> = ({ routes }) => {
  if (routes.length === 0) return <EmptyState icon={<Bus size={40} />} title="No routes yet" />;
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto" role="region" aria-label="Routes table" tabIndex={0}>
      <table className="data-table">
        <thead><tr><th>ID</th><th>Source</th><th>Destination</th><th>Distance</th></tr></thead>
        <tbody>
          {routes.map(r => (
            <tr key={r.routeId}>
              <td className="font-mono text-xs text-slate-500">#{r.routeId}</td>
              <td>{r.source}</td><td>{r.destination}</td><td>{r.distance} km</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

const TrainTable: React.FC<{ trains: TrainType[] }> = ({ trains }) => {
  if (trains.length === 0) return <EmptyState icon={<Train size={40} />} title="No trains yet" />;
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto" role="region" aria-label="Trains table" tabIndex={0}>
      <table className="data-table">
        <thead><tr><th>ID</th><th>Name</th><th>Total Seats</th><th>Available</th></tr></thead>
        <tbody>
          {trains.map(t => (
            <tr key={t.trainId}>
              <td className="font-mono text-xs text-slate-500">#{t.trainId}</td>
              <td className="font-medium">{t.trainName}</td>
              <td>{t.totalSeats}</td>
              <td className="text-success-400">{t.availableSeats}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

const BusTable: React.FC<{ buses: BusType[] }> = ({ buses }) => {
  if (buses.length === 0) return <EmptyState icon={<Bus size={40} />} title="No buses yet" />;
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto" role="region" aria-label="Buses table" tabIndex={0}>
      <table className="data-table">
        <thead><tr><th>ID</th><th>Type</th><th>Total Seats</th><th>Available</th></tr></thead>
        <tbody>
          {buses.map(b => (
            <tr key={b.busId}>
              <td className="font-mono text-xs text-slate-500">#{b.busId}</td>
              <td className="font-medium">{b.busType}</td>
              <td>{b.totalSeats}</td>
              <td className="text-success-400">{b.availableSeats}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

// ─── Create Modals ────────────────────────────────────────────────────────────

const ModalWrapper: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 id="admin-modal-title" className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label={`Close ${title}`} className="rounded-md p-2 text-slate-600 hover:bg-slate-100">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

// CRITICAL: Schedule must be Train OR Bus — enforced in form
const CreateScheduleModal: React.FC<{
  routes: Route[]; trains: TrainType[]; buses: BusType[];
  onClose: () => void; onCreated: (s: Schedule) => void;
}> = ({ routes, trains, buses, onClose, onCreated }) => {
  const [form, setForm] = useState<CreateSchedulePayload & { vehicleType: 'Train' | 'Bus' }>({
    routeId: routes[0]?.routeId ?? 0,
    vehicleType: 'Train',
    trainId: null,
    busId: null,
    departureTime: '08:00',
    arrivalTime: '12:00',
    journeyDate: new Date().toISOString().split('T')[0],
    fare: 500,
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Enforce: exactly one of trainId or busId must be set
    if (form.vehicleType === 'Train' && !form.trainId) { setErr('Please select a Train'); return; }
    if (form.vehicleType === 'Bus' && !form.busId) { setErr('Please select a Bus'); return; }
    setSubmitting(true);
    setErr('');
    try {
      const payload: CreateSchedulePayload = {
        routeId: form.routeId,
        trainId: form.vehicleType === 'Train' ? form.trainId : null,
        busId:   form.vehicleType === 'Bus'   ? form.busId   : null,
        departureTime: form.departureTime,
        arrivalTime: form.arrivalTime,
        journeyDate: form.journeyDate,
        fare: form.fare,
      };
      const res = await scheduleApi.create(payload);
      toast.success('Schedule created');
      onCreated(res.data);
    } catch (err: unknown) {
      setErr((err as { message?: string })?.message ?? 'Failed to create schedule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper title="Create Schedule" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {err && (
          <div className="flex gap-2 p-3 rounded-xl bg-danger-600/10 border border-danger-500/30">
            <AlertCircle size={14} className="text-danger-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-danger-300">{err}</p>
          </div>
        )}

        <div>
          <label className="input-label" htmlFor="schedule-route">Route</label>
          <select
            id="schedule-route"
            value={form.routeId}
            onChange={e => setForm(f => ({ ...f, routeId: Number(e.target.value) }))}
            className="input-field"
            required
          >
            <option value={0} disabled>Select route</option>
            {routes.map(r => (
              <option key={r.routeId} value={r.routeId}>
                {r.source} → {r.destination} ({r.distance} km)
              </option>
            ))}
          </select>
        </div>

        {/* CRITICAL: Train OR Bus selector */}
        <div>
          <p className="input-label" id="schedule-transport-label">Transport type (choose one)</p>
          <div className="mb-3 flex gap-3" role="group" aria-labelledby="schedule-transport-label">
            {(['Train', 'Bus'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(f => ({ ...f, vehicleType: type, trainId: null, busId: null }))}
                aria-pressed={form.vehicleType === type}
                className={`flex items-center gap-2 flex-1 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  form.vehicleType === type
                    ? type === 'Train'
                      ? 'bg-info-600/20 border-info-500/40 text-info-300'
                      : 'bg-accent-500/20 border-accent-500/40 text-accent-300'
                    : 'bg-surface-600/40 border-white/[0.06] text-slate-400'
                }`}
              >
                {type === 'Train' ? <Train size={16} /> : <Bus size={16} />}
                {type}
                {form.vehicleType === type && <CheckCircle size={13} className="ml-auto" />}
              </button>
            ))}
          </div>

          {form.vehicleType === 'Train' && (
            <>
            <label className="sr-only" htmlFor="schedule-train">Train</label>
            <select
              id="schedule-train"
              value={form.trainId ?? ''}
              onChange={e => setForm(f => ({ ...f, trainId: Number(e.target.value), busId: null }))}
              className="input-field"
              required
            >
              <option value="">Select Train</option>
              {trains.map(t => <option key={t.trainId} value={t.trainId}>{t.trainName} ({t.availableSeats} seats)</option>)}
            </select>
            </>
          )}

          {form.vehicleType === 'Bus' && (
            <>
            <label className="sr-only" htmlFor="schedule-bus">Bus</label>
            <select
              id="schedule-bus"
              value={form.busId ?? ''}
              onChange={e => setForm(f => ({ ...f, busId: Number(e.target.value), trainId: null }))}
              className="input-field"
              required
            >
              <option value="">Select Bus</option>
              {buses.map(b => <option key={b.busId} value={b.busId}>{b.busType} ({b.availableSeats} seats)</option>)}
            </select>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="input-label" htmlFor="schedule-date">Journey date</label>
            <input id="schedule-date" type="date" value={form.journeyDate} onChange={e => setForm(f => ({ ...f, journeyDate: e.target.value }))} className="input-field" min={new Date().toISOString().split('T')[0]} required />
          </div>
          <div>
            <label className="input-label" htmlFor="schedule-departure">Departure</label>
            <input id="schedule-departure" type="time" value={form.departureTime} onChange={e => setForm(f => ({ ...f, departureTime: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="input-label" htmlFor="schedule-arrival">Arrival</label>
            <input id="schedule-arrival" type="time" value={form.arrivalTime} onChange={e => setForm(f => ({ ...f, arrivalTime: e.target.value }))} className="input-field" required />
          </div>
        </div>

        <div>
          <label className="input-label" htmlFor="schedule-fare">Fare (INR)</label>
          <input id="schedule-fare" type="number" value={form.fare} onChange={e => setForm(f => ({ ...f, fare: Number(e.target.value) }))} className="input-field" min={1} required />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Creating…' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

const CreateRouteModal: React.FC<{ onClose: () => void; onCreated: (r: Route) => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ source: '', destination: '', distance: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await scheduleApi.createRoute({ source: form.source, destination: form.destination, distance: Number(form.distance) });
      toast.success('Route created');
      onCreated(res.data);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper title="Create Route" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label" htmlFor="route-source">Source</label>
          <input id="route-source" type="text" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input-field" placeholder="Mumbai" required />
        </div>
        <div>
          <label className="input-label" htmlFor="route-destination">Destination</label>
          <input id="route-destination" type="text" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} className="input-field" placeholder="Pune" required />
        </div>
        <div>
          <label className="input-label" htmlFor="route-distance">Distance (km)</label>
          <input id="route-distance" type="number" value={form.distance} onChange={e => setForm(f => ({ ...f, distance: e.target.value }))} className="input-field" placeholder="150" min={1} required />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? 'Creating…' : 'Create Route'}</button>
        </div>
      </form>
    </ModalWrapper>
  );
};

const CreateTrainModal: React.FC<{ onClose: () => void; onCreated: (t: TrainType) => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ trainName: '', totalSeats: '200' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await scheduleApi.createTrain({ trainName: form.trainName, totalSeats: Number(form.totalSeats) });
      toast.success('Train created');
      onCreated(res.data);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper title="Add Train" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label" htmlFor="train-name">Train name</label>
          <input id="train-name" type="text" value={form.trainName} onChange={e => setForm(f => ({ ...f, trainName: e.target.value }))} className="input-field" placeholder="Rajdhani Express" required />
        </div>
        <div>
          <label className="input-label" htmlFor="train-total-seats">Total seats</label>
          <input id="train-total-seats" type="number" value={form.totalSeats} onChange={e => setForm(f => ({ ...f, totalSeats: e.target.value }))} className="input-field" min={1} required />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? 'Adding…' : 'Add Train'}</button>
        </div>
      </form>
    </ModalWrapper>
  );
};

const CreateBusModal: React.FC<{ onClose: () => void; onCreated: (b: BusType) => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ busType: '', totalSeats: '50' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await scheduleApi.createBus({ busType: form.busType, totalSeats: Number(form.totalSeats) });
      toast.success('Bus added');
      onCreated(res.data);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper title="Add Bus" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label" htmlFor="bus-type">Bus type</label>
          <input id="bus-type" type="text" value={form.busType} onChange={e => setForm(f => ({ ...f, busType: e.target.value }))} className="input-field" placeholder="Volvo AC Sleeper" required />
        </div>
        <div>
          <label className="input-label" htmlFor="bus-total-seats">Total seats</label>
          <input id="bus-total-seats" type="number" value={form.totalSeats} onChange={e => setForm(f => ({ ...f, totalSeats: e.target.value }))} className="input-field" min={1} required />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? 'Adding…' : 'Add Bus'}</button>
        </div>
      </form>
    </ModalWrapper>
  );
};
