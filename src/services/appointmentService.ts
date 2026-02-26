/**
 * Appointment Service
 * Handles appointment_schedule CRUD for all dashboard roles.
 */

import { apiClient } from '@/lib/apiClient';

export type AppointmentStatus = 'scheduled' | 'completed' | 'canceled' | 'cancelled' | 'rescheduled';

export interface Appointment {
  id: number;
  mother_id: number;
  health_worker_id: number;
  scheduled_time: string;      // ISO 8601
  appointment_type: string | null;
  recurrence_rule: string | null;
  recurrence_end: string | null;
  status: AppointmentStatus;
  escalated: boolean;
  escalation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentRequest {
  mother_id: number;
  health_worker_id: number;
  scheduled_time: string;      // ISO 8601
  appointment_type?: string;
  status?: AppointmentStatus;
  recurrence_rule?: string;
  recurrence_end?: string;
  notes?: string;
  escalated?: boolean;
  escalation_reason?: string;
}

export interface AppointmentListResponse {
  appointments: Appointment[];
  total: number;
}

export interface AppointmentFilters {
  mother_id?: number;
  health_worker_id?: number;
  status?: AppointmentStatus;
  from?: string;   // ISO 8601
  to?: string;     // ISO 8601
}

class AppointmentService {
  /** Create a new appointment */
  async create(data: CreateAppointmentRequest): Promise<Appointment> {
    return apiClient.post<Appointment>('/appointments', {
      status: 'scheduled',
      ...data,
    });
  }

  /** List appointments with optional filters */
  async list(filters?: AppointmentFilters): Promise<AppointmentListResponse> {
    const params = new URLSearchParams();
    if (filters?.mother_id)        params.set('mother_id',         String(filters.mother_id));
    if (filters?.health_worker_id) params.set('health_worker_id',  String(filters.health_worker_id));
    if (filters?.status)           params.set('status',            filters.status);
    if (filters?.from)             params.set('from',              filters.from);
    if (filters?.to)               params.set('to',                filters.to);
    const qs = params.toString();
    return apiClient.get<AppointmentListResponse>(`/appointments${qs ? `?${qs}` : ''}`);
  }

  /** Get a single appointment */
  async get(id: number): Promise<Appointment> {
    return apiClient.get<Appointment>(`/appointments/${id}`);
  }

  /** Update mutable fields */
  async update(id: number, data: Partial<CreateAppointmentRequest>): Promise<Appointment> {
    return apiClient.patch<Appointment>(`/appointments/${id}`, data);
  }

  /** Update status only */
  async updateStatus(id: number, status: AppointmentStatus): Promise<Appointment> {
    return apiClient.patch<Appointment>(`/appointments/${id}/status`, { status });
  }

  /** Delete an appointment */
  async delete(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/appointments/${id}`);
  }

  /** Convenience: get upcoming appointments for a mother */
  async getUpcomingForMother(motherUserId: number): Promise<AppointmentListResponse> {
    return this.list({
      mother_id: motherUserId,
      status: 'scheduled',
      from: new Date().toISOString(),
    });
  }

  /** Convenience: get all appointments for a health worker (CHW or Nurse) */
  async getForHealthWorker(hwUserId: number, status?: AppointmentStatus): Promise<AppointmentListResponse> {
    return this.list({ health_worker_id: hwUserId, status });
  }
}

export const appointmentService = new AppointmentService();
