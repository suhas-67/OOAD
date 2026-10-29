import { apiClient } from './api';
import type { DashboardStats, AdminBookingRow, AdminUserRow } from '../types/domain';
import type { AccountStatus } from '../types/domain';

export interface ReportData {
  revenue: {
    total: number;
    byMethod: { method: string; amount: number; count: number }[];
  };
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    initiated: number;
  };
  passengers: {
    total: number;
    active: number;
  };
  routes?: { routeSource: string; routeDestination: string; bookingCount: number; revenue: number }[];
  vehicles?: { vehicleType: string; vehicleId: number; bookingCount: number; occupancyRate: number }[];
}

export const adminApi = {
  getDashboardStats: () =>
    apiClient.get<{ success: boolean; data: DashboardStats }>('/admin/dashboard-stats').then(r => r.data),

  getBookings: () =>
    apiClient.get<{ success: boolean; count: number; data: AdminBookingRow[] }>('/admin/bookings').then(r => r.data),

  getUsers: () =>
    apiClient.get<{ success: boolean; count: number; data: AdminUserRow[] }>('/admin/users').then(r => r.data),

  updateUserStatus: (userId: number, accountStatus: AccountStatus) =>
    apiClient.patch<{ success: boolean; message: string }>(`/admin/users/${userId}/status`, { accountStatus }).then(r => r.data),

  approveRefund: (bookingId: number) =>
    apiClient.post<{ success: boolean; message: string; bookingId: number; refundStatus: string }>('/admin/refunds/approve', { bookingId }).then(r => r.data),

  getReports: () =>
    apiClient.get<{ success: boolean; data: ReportData }>('/admin/reports').then(r => r.data),
};
