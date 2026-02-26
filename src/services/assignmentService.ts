/**
 * Assignment Service
 * Handles mother-CHW assignment CRUD.
 */

import { apiClient } from '@/lib/apiClient';

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
  mother_id: number;
  name: string;
  phone: string | null;
  location: string | null;
  status: AssignmentStatus;
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

class AssignmentService {
  /**
   * Get all mothers assigned to a CHW.
   * Optional status filter: 'active' | 'inactive'
   */
  async getMothersForCHW(chwId: number, status?: AssignmentStatus): Promise<AssignedMothersResponse> {
    const qs = status ? `?status=${status}` : '';
    return apiClient.get<AssignedMothersResponse>(`/chws/${chwId}/mothers${qs}`);
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
}

export const assignmentService = new AssignmentService();
