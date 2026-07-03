/**
 * Assignment Service
 * Handles mother-CHW assignment CRUD.
 */

import { apiClient } from '@/lib/apiClient';
import { getFacilityNurseFacilityId } from './nurseWorkflowMode';

export type AssignmentStatus = 'active' | 'inactive';

export interface Assignment {
  id: number;
  mother_id: number;
  mother_name: string;
  chw_id: number;
  chw_name: string;
  assigned_at: string;
  status: AssignmentStatus;
}

export interface AssignedMother {
  assignment_id: number;
  mother_id: number;       // Mother profile ID (mothers table)
  user_id: number;         // User ID (users table) — used for appointment creation
  name: string;
  phone_number: string | null;
  location: string | null;
  status: AssignmentStatus;
  checkin_status?: 'ok' | 'not_ok' | null;
  last_check_in_at?: string | null;
  due_date?: string | null;
  weeks_pregnant?: number | null;
  risk_level?: 'low' | 'medium' | 'high' | null;
  last_ultrasound_at?: string | null;
  assigned_at: string;
}

export interface AssignmentListResponse {
  assignments: Assignment[];
  total: number;
}

export interface AssignedMothersResponse {
  mothers: AssignedMother[];
  total: number;
}

export interface MotherUltrasoundSummary {
  mother_id: number;
  last_ultrasound_at: string | null;
  last_ultrasound_week: number | null;
}

export interface MotherUltrasoundSummaryResponse {
  summaries: MotherUltrasoundSummary[];
  total: number;
}

class AssignmentService {
  /**
   * Get all mothers assigned to a CHW.
   * Optional status filter: 'active' | 'inactive'
   */
  async getMothersForCHW(chwId: number, status?: AssignmentStatus): Promise<AssignedMothersResponse> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const response = await apiClient.get<AssignedMothersResponse>(`/facilities/${facilityId}/nurse-compat/chws/${chwId}/mothers`);
      if (!status) return response;
      return {
        mothers: (response.mothers || []).filter((mother) => mother.status === status),
        total: (response.mothers || []).filter((mother) => mother.status === status).length,
      };
    }

    const qs = status ? `?status=${status}` : '';
    return apiClient.get<AssignedMothersResponse>(`/chws/${chwId}/mothers${qs}`);
  }

  /**
   * Get latest ultrasound summary rows for all active assigned mothers.
   */
  async getLatestUltrasoundSummariesForCHW(chwId: number): Promise<MotherUltrasoundSummaryResponse> {
    return apiClient.get<MotherUltrasoundSummaryResponse>(`/chws/${chwId}/mothers/latest-ultrasounds`);
  }

  /**
   * Assign a mother to a CHW.
   */
  async assignMother(chwId: number, motherId: number): Promise<Assignment & { message: string }> {
    return apiClient.post(`/chws/${chwId}/assign_mother`, { mother_id: motherId });
  }

  /**
   * Update the status of an assignment (activate / deactivate).
   */
  async updateStatus(assignmentId: number, status: AssignmentStatus): Promise<Assignment & { message: string }> {
    return apiClient.patch(`/assignments/${assignmentId}/status`, { status });
  }

  /**
   * Permanently delete an assignment record.
   */
  async delete(assignmentId: number): Promise<{ message: string }> {
    return apiClient.delete(`/assignments/${assignmentId}`);
  }

  /**
   * List assignments visible to a nurse (same ward).
   */
  async getAssignmentsForNurse(nurseId: number, status?: AssignmentStatus): Promise<AssignmentListResponse> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const chwsResponse = await apiClient.get<{ chws: Array<{ id: number; name: string }> }>(`/facilities/${facilityId}/nurse-compat/team/chws`);
      const chws = chwsResponse.chws || [];

      const mothersByChw = await Promise.all(
        chws.map(async (chw) => {
          const mothersResponse = await apiClient.get<AssignedMothersResponse>(`/facilities/${facilityId}/nurse-compat/chws/${chw.id}/mothers`);
          return { chw, mothers: mothersResponse.mothers || [] };
        }),
      );

      const assignments: Assignment[] = mothersByChw.flatMap(({ chw, mothers }) => {
        return mothers.map((mother) => ({
          id: mother.assignment_id,
          mother_id: mother.mother_id,
          mother_name: mother.name,
          chw_id: chw.id,
          chw_name: chw.name,
          assigned_at: mother.assigned_at,
          status: mother.status,
        }));
      });

      const filtered = status ? assignments.filter((assignment) => assignment.status === status) : assignments;
      return {
        assignments: filtered,
        total: filtered.length,
      };
    }

    const qs = status ? `?status=${status}` : '';
    return apiClient.get<AssignmentListResponse>(`/nurses/${nurseId}/assignments${qs}`);
  }

  /**
   * List all assignments with optional filters.
   */
  async list(filters?: { chw_id?: number; mother_id?: number; status?: AssignmentStatus }): Promise<AssignmentListResponse> {
    const params = new URLSearchParams();
    if (filters?.chw_id)    params.set('chw_id',    String(filters.chw_id));
    if (filters?.mother_id) params.set('mother_id', String(filters.mother_id));
    if (filters?.status)    params.set('status',    filters.status);
    const qs = params.toString();
    return apiClient.get<AssignmentListResponse>(`/assignments${qs ? `?${qs}` : ''}`);
  }

  /**
   * Get the assigned CHW for a mother (by mother's user_id).
   */
  async getAssignedCHWForMother(motherUserId: number): Promise<{
    assigned: boolean;
    chw?: {
      user_id: number;
      profile_id: number;
      name: string;
      phone_number: string | null;
      location: string | null;
    };
    assignment_id?: number;
    assigned_at?: string | null;
    message?: string;
  }> {
    return apiClient.get(`/mothers/${motherUserId}/assigned_chw`);
  }
}

export const assignmentService = new AssignmentService();
