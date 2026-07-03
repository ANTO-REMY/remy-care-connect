/**
 * Appointment Service
 * Handles appointment_schedule CRUD for all dashboard roles.
 */

import { apiClient } from '@/lib/apiClient';
import { getFacilityNurseFacilityId } from './nurseWorkflowMode';

export type AppointmentStatus = 'scheduled' | 'completed' | 'canceled' | 'cancelled';

export interface Appointment {
  id: number;
  mother_id: number;
  health_worker_id: number;
  created_by_user_id: number | null;
  mother_name?: string | null;
  hw_name?: string | null;
  creator_name?: string | null;
  creator_role?: string | null;
  scheduled_time: string;      // ISO 8601
  appointment_type: string | null;
  recurrence_rule: string | null;
  recurrence_end: string | null;
  status: AppointmentStatus;
  escalated: boolean;
  escalation_reason: string | null;
  notes: string | null;
  ticket_code?: string | null;
  ticket_status?: 'active' | 'used' | 'canceled' | 'expired' | null;
  validated_at?: string | null;
  validated_by_user_id?: number | null;
  validation_method?: string | null;
  ticket_last_event_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentRequest {
  mother_id?: number;
  mother_phone_number?: string;
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
  include_deleted?: boolean;
  deleted_only?: boolean;
  include_hidden?: boolean;
  hidden_only?: boolean;
}

class AppointmentService {
  /** Create a new appointment */
  async create(data: CreateAppointmentRequest): Promise<Appointment> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const response = await apiClient.post<{ appointment: Appointment }>(`/facilities/${facilityId}/nurse-compat/appointments`, {
        mother_id: data.mother_id,
        mother_phone_number: data.mother_phone_number,
        scheduled_time: data.scheduled_time,
        appointment_type: data.appointment_type,
        notes: data.notes,
        status: data.status,
      });
      return response.appointment;
    }

    return apiClient.post<Appointment>('/appointments', {
      status: 'scheduled',
      ...data,
    });
  }

  /** List appointments with optional filters */
  async list(filters?: AppointmentFilters): Promise<AppointmentListResponse> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status === 'cancelled' ? 'canceled' : filters.status);
      if (typeof filters?.include_hidden === 'boolean') params.set('include_hidden', String(filters.include_hidden));
      if (typeof filters?.hidden_only === 'boolean') params.set('hidden_only', String(filters.hidden_only));
      const qs = params.toString();
      const response = await apiClient.get<{ appointments: Appointment[]; total: number }>(`/facilities/${facilityId}/nurse-compat/appointments${qs ? `?${qs}` : ''}`);
      return {
        appointments: response.appointments || [],
        total: response.total ?? (response.appointments || []).length,
      };
    }

    const params = new URLSearchParams();
    if (filters?.mother_id)        params.set('mother_id',         String(filters.mother_id));
    if (filters?.health_worker_id) params.set('health_worker_id',  String(filters.health_worker_id));
    if (filters?.status)           params.set('status',            filters.status);
    if (filters?.from)             params.set('from',              filters.from);
    if (filters?.to)               params.set('to',                filters.to);
    if (typeof filters?.include_deleted === 'boolean') params.set('include_deleted', String(filters.include_deleted));
    if (typeof filters?.deleted_only === 'boolean') params.set('deleted_only', String(filters.deleted_only));
    if (typeof filters?.include_hidden === 'boolean') params.set('include_hidden', String(filters.include_hidden));
    if (typeof filters?.hidden_only === 'boolean') params.set('hidden_only', String(filters.hidden_only));
    const qs = params.toString();
    return apiClient.get<AppointmentListResponse>(`/appointments${qs ? `?${qs}` : ''}`);
  }

  /** Get a single appointment */
  async get(id: number): Promise<Appointment> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const response = await apiClient.get<{ appointments: Appointment[] }>(`/facilities/${facilityId}/nurse-compat/appointments?include_hidden=true`);
      const item = (response.appointments || []).find((appt) => appt.id === id);
      if (!item) {
        throw { message: 'Resource not found. The requested item may have been removed.', status: 404 };
      }
      return item;
    }
    return apiClient.get<Appointment>(`/appointments/${id}`);
  }

  /** Update mutable fields */
  async update(id: number, data: Partial<CreateAppointmentRequest>): Promise<Appointment> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const response = await apiClient.patch<{ appointment: Appointment }>(`/facilities/${facilityId}/nurse-compat/appointments/${id}`, data);
      return response.appointment;
    }
    return apiClient.patch<Appointment>(`/appointments/${id}`, data);
  }

  /** Update status only */
  async updateStatus(id: number, status: AppointmentStatus): Promise<Appointment> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const normalizedStatus = status === 'cancelled' ? 'canceled' : status;
      const response = await apiClient.patch<{ appointment: Appointment }>(`/facilities/${facilityId}/nurse-compat/appointments/${id}/status`, { status: normalizedStatus });
      return response.appointment;
    }
    return apiClient.patch<Appointment>(`/appointments/${id}/status`, { status });
  }

  /** Delete an appointment */
  async delete(id: number): Promise<{ message: string }> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const response = await apiClient.delete<{ message: string; appointment: Appointment }>(`/facilities/${facilityId}/nurse-compat/appointments/${id}`);
      return { message: response.message };
    }
    return apiClient.delete<{ message: string }>(`/appointments/${id}`);
  }

  /** Delete appointment from current user's dashboard only (non-destructive) */
  async softDelete(id: number, reason?: string): Promise<{ message: string; appointment_id: number }> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const response = await apiClient.delete<{ message: string; appointment: Appointment }>(`/facilities/${facilityId}/nurse-compat/appointments/${id}`);
      return {
        message: response.message,
        appointment_id: id,
      };
    }
    return apiClient.post<{ message: string; appointment_id: number }>(`/appointments/${id}/delete`, {
      reason,
    });
  }

  /** Restore a previously deleted appointment for current user */
  async restoreDeleted(id: number): Promise<{ message: string; appointment_id: number }> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const response = await apiClient.post<{ message: string; appointment: Appointment }>(`/facilities/${facilityId}/nurse-compat/appointments/${id}/restore`);
      return {
        message: response.message,
        appointment_id: id,
      };
    }
    return apiClient.delete<{ message: string; appointment_id: number }>(`/appointments/${id}/delete`);
  }

  /** Backward-compatible alias */
  async hide(id: number, reason?: string): Promise<{ message: string; appointment_id: number }> {
    return this.softDelete(id, reason);
  }

  /** Backward-compatible alias */
  async unhide(id: number): Promise<{ message: string; appointment_id: number }> {
    return this.restoreDeleted(id);
  }

  /** Convenience: get upcoming appointments for a mother */
  async getUpcomingForMother(motherUserId: number): Promise<AppointmentListResponse> {
    return this.list({
      mother_id: motherUserId,
      status: 'scheduled',
    });
  }

  /** Convenience: get ALL appointments for a mother (any status) */
  async getAllForMother(motherUserId: number): Promise<AppointmentListResponse> {
    return this.list({ mother_id: motherUserId });
  }

  /** Convenience: get all appointments for a health worker (CHW or Nurse) */
  async getForHealthWorker(hwUserId: number, status?: AppointmentStatus): Promise<AppointmentListResponse> {
    return this.list({ health_worker_id: hwUserId, status });
  }

  /** Get appointments scheduled by a specific mother for a health worker */
  async getScheduledByMother(motherUserId: number, hwUserId: number): Promise<AppointmentListResponse> {
    const all = await this.list({ health_worker_id: hwUserId });
    return {
      ...all,
      appointments: all.appointments.filter(a => a.created_by_user_id === motherUserId),
    };
  }

  /** Get appointments scheduled by the health worker (CHW/Nurse) for a mother */
  async getScheduledByHealthWorker(hwUserId: number, motherUserId: number): Promise<AppointmentListResponse> {
    const all = await this.list({ mother_id: motherUserId });
    return {
      ...all,
      appointments: all.appointments.filter(a => a.created_by_user_id === hwUserId),
    };
  }
}

export const appointmentService = new AppointmentService();
