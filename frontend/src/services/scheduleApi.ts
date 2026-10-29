import { apiClient } from './api';
import type { Schedule, Route, Train, Bus } from '../types/domain';

export interface CreateSchedulePayload {
  routeId: number;
  trainId?: number | null;
  busId?: number | null;
  departureTime: string;
  arrivalTime: string;
  journeyDate: string;
  fare: number;
  status?: string;
}

export const scheduleApi = {
  // Schedules
  getAll: () =>
    apiClient.get<{ success: boolean; data: Schedule[] }>('/schedule').then(r => r.data),

  getById: (id: number) =>
    apiClient.get<{ success: boolean; data: Schedule }>(`/schedule/${id}`).then(r => r.data),

  create: (payload: CreateSchedulePayload) =>
    apiClient.post<{ success: boolean; data: Schedule }>('/schedule', payload).then(r => r.data),

  update: (id: number, payload: Partial<CreateSchedulePayload>) =>
    apiClient.put<{ success: boolean; data: Schedule }>(`/schedule/${id}`, payload).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`/schedule/${id}`).then(r => r.data),

  // Routes
  getRoutes: () =>
    apiClient.get<{ success: boolean; data: Route[] }>('/schedule/routes').then(r => r.data),

  createRoute: (payload: { source: string; destination: string; distance: number }) =>
    apiClient.post<{ success: boolean; data: Route }>('/schedule/routes', payload).then(r => r.data),

  // Trains
  getTrains: () =>
    apiClient.get<{ success: boolean; data: Train[] }>('/schedule/trains').then(r => r.data),

  createTrain: (payload: { trainName: string; totalSeats: number }) =>
    apiClient.post<{ success: boolean; data: Train }>('/schedule/trains', payload).then(r => r.data),

  // Buses
  getBuses: () =>
    apiClient.get<{ success: boolean; data: Bus[] }>('/schedule/buses').then(r => r.data),

  createBus: (payload: { busType: string; totalSeats: number }) =>
    apiClient.post<{ success: boolean; data: Bus }>('/schedule/buses', payload).then(r => r.data),
};
