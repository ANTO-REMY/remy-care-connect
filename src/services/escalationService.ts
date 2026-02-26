/**
 * Escalation Service
 * Handles escalation CRUD between CHW and Nurse dashboards.
 */

import { apiClient } from '@/lib/apiClient';

export type EscalationStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';
export type EscalationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Escalation {
  id: number;
  chw_id: number;
  chw_name: string;
  nurse_id: number;
  nurse_name: string;
  mother_id: number | null;
  mother_name: string;
  case_description: string;
  issue_type: string | null;
  notes: string | null;
  priority: EscalationPriority;
  status: EscalationStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface CreateEscalationRequest {
  chw_id: number;
  nurse_id: number;
  mother_id: number;
  case_description: string;
  issue_type?: string;
  notes?: string;
  priority?: EscalationPriority;
}

export interface EscalationListResponse {
  escalations: Escalation[];
  total: number;
}

export interface EscalationFilters {
  nurse_id?: number;
  chw_id?: number;
  mother_id?: number;
  status?: EscalationStatus;
  priority?: EscalationPriority;
}

class EscalationService {
  /** Create a new escalation (called by CHW) */
  async create(data: CreateEscalationRequest): Promise<Escalation> {
    return apiClient.post<Escalation>('/escalations', data);
  }

  /** List escalations with optional filters */
  async list(filters?: EscalationFilters): Promise<EscalationListResponse> {
    const params = new URLSearchParams();
    if (filters?.nurse_id)   params.set('nurse_id',   String(filters.nurse_id));
    if (filters?.chw_id)     params.set('chw_id',     String(filters.chw_id));
    if (filters?.mother_id)  params.set('mother_id',  String(filters.mother_id));
    if (filters?.status)     params.set('status',     filters.status);
    if (filters?.priority)   params.set('priority',   filters.priority);
    const qs = params.toString();
    return apiClient.get<EscalationListResponse>(`/escalations${qs ? `?${qs}` : ''}`);
  }

  /** Get a single escalation */
  async get(id: number): Promise<Escalation> {
    return apiClient.get<Escalation>(`/escalations/${id}`);
  }

  /** Update status (nurse action) */
  async updateStatus(id: number, status: EscalationStatus, notes?: string): Promise<Escalation> {
    return apiClient.patch<Escalation>(`/escalations/${id}/status`, { status, notes });
  }

  /** Update other fields (notes, priority, issue_type, case_description) */
  async update(id: number, data: Partial<Pick<Escalation, 'notes' | 'priority' | 'issue_type' | 'case_description'>>): Promise<Escalation> {
    return apiClient.patch<Escalation>(`/escalations/${id}`, data);
  }

  /** Delete an escalation */
  async delete(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/escalations/${id}`);
  }
}

export const escalationService = new EscalationService();
