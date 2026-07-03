import { apiClient } from '@/lib/apiClient';

export interface FacilityAppointment {
  id: number;
  facility_id: number;
  mother_id?: number;
  mother_name: string;
  scheduled_time: string;
  appointment_type?: string;
  status: 'scheduled' | 'assigned' | 'completed' | 'canceled';
  assigned_staff_account_id?: number;
  assigned_staff_name?: string;
  created_by_account_id?: number;
  notes?: string;
  ticket_code?: string | null;
  ticket_status?: 'active' | 'used' | 'canceled' | 'expired' | null;
  validated_at?: string | null;
  validated_by_account_id?: number | null;
  validation_method?: string | null;
  ticket_last_event_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FacilityDashboardSummary {
  facility: {
    id: number;
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    hours_text?: string;
  };
  stats: {
    staff_count: number;
    appointments_this_month: number;
  };
}

export interface CreateFacilityAppointmentRequest {
  mother_phone_number?: string;
  scheduled_time: string;
  mother_id?: number;
  appointment_type?: string;
  notes?: string;
}

class FacilityAppointmentService {
  async getDashboard(facilityId: number): Promise<FacilityDashboardSummary> {
    return apiClient.get(`/facilities/${facilityId}/dashboard`);
  }

  async listAppointments(facilityId: number, status?: string): Promise<{ facility_id: number; count: number; appointments: FacilityAppointment[] }> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const qs = params.toString();
    return apiClient.get(`/facilities/${facilityId}/appointments${qs ? `?${qs}` : ''}`);
  }

  async createAppointment(facilityId: number, data: CreateFacilityAppointmentRequest): Promise<{ message: string; appointment: FacilityAppointment }> {
    return apiClient.post(`/facilities/${facilityId}/appointments`, data);
  }

  async assignAppointment(facilityId: number, appointmentId: number): Promise<{ message: string; appointment: FacilityAppointment }> {
    return apiClient.post(`/facilities/${facilityId}/appointments/${appointmentId}/assign`);
  }

  async updateAppointmentStatus(facilityId: number, appointmentId: number, status: 'scheduled' | 'assigned' | 'completed' | 'canceled'): Promise<{ message: string; appointment: FacilityAppointment }> {
    return apiClient.patch(`/facilities/${facilityId}/appointments/${appointmentId}/status`, { status });
  }

  async updateSettings(facilityId: number, data: { phone?: string; email?: string; hours_text?: string }) {
    return apiClient.patch(`/facilities/${facilityId}/settings`, data);
  }
}

export const facilityAppointmentService = new FacilityAppointmentService();
