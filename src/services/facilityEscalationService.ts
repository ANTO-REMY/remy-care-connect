import { apiClient } from '@/lib/apiClient';

export type FacilityEscalationStatus = 'received' | 'in_progress' | 'checked_out';
export type FacilityEscalationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface FacilityEscalation {
  id: number;
  facility_id: number;
  mother_id?: number | null;
  mother_user_id?: number | null;
  mother_name: string;
  chw_id?: number | null;
  chw_user_id?: number | null;
  checkin_id?: number | null;
  case_description: string;
  issue_type?: string | null;
  notes?: string | null;
  priority: FacilityEscalationPriority;
  status: FacilityEscalationStatus;
  assigned_staff_account_id?: number | null;
  assigned_staff_name?: string | null;
  assigned_staff_role?: string | null;
  created_at?: string;
  updated_at?: string;
  checked_out_at?: string | null;
  permissions?: {
    can_assign: boolean;
    can_update_status: boolean;
    can_edit: boolean;
    can_comment: boolean;
  };
}

class FacilityEscalationService {
  async listEscalations(
    facilityId: number,
    options?: {
      status?: FacilityEscalationStatus;
      priority?: FacilityEscalationPriority;
      assigned_to_me?: boolean;
    },
  ): Promise<{ facility_id: number; is_admin: boolean; count: number; escalations: FacilityEscalation[] }> {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.priority) params.set('priority', options.priority);
    if (options?.assigned_to_me) params.set('assigned_to_me', 'true');

    const qs = params.toString();
    return apiClient.get(`/facilities/${facilityId}/escalations${qs ? `?${qs}` : ''}`);
  }

  async assignEscalation(
    facilityId: number,
    escalationId: number,
    assignedStaffAccountId: number,
  ): Promise<{ message: string; escalation: FacilityEscalation }> {
    return apiClient.patch(`/facilities/${facilityId}/escalations/${escalationId}/assign`, {
      assigned_staff_account_id: assignedStaffAccountId,
    });
  }

  async updateEscalationStatus(
    facilityId: number,
    escalationId: number,
    status: FacilityEscalationStatus,
    notes?: string,
  ): Promise<{ message: string; escalation: FacilityEscalation }> {
    return apiClient.patch(`/facilities/${facilityId}/escalations/${escalationId}/status`, {
      status,
      notes,
    });
  }
}

export const facilityEscalationService = new FacilityEscalationService();
