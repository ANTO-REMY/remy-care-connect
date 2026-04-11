/**
 * weightService.ts
 * Handles weight log CRUD for mothers.
 */

import { apiClient } from '@/lib/apiClient';

export interface WeightLog {
  id: number;
  mother_id: number;
  weight_kg: number;
  week_number: number | null;
  notes: string | null;
  recorded_by: number | null;
  created_at: string;
}

export interface LogWeightRequest {
  weight_kg: number;
  notes?: string;
}

class WeightService {
  /** Mother logs her own weight. */
  async logWeight(data: LogWeightRequest): Promise<WeightLog> {
    const resp = await apiClient.post<WeightLog & { message: string }>('/mothers/me/weight', data);
    const { message: _msg, ...log } = resp;
    return log;
  }

  /** Mother gets her own weight history. */
  async getMyWeightLogs(): Promise<WeightLog[]> {
    return apiClient.get<WeightLog[]>('/mothers/me/weight');
  }

  /** CHW/Nurse gets a specific mother's weight history. */
  async getMotherWeightLogs(motherId: number): Promise<WeightLog[]> {
    return apiClient.get<WeightLog[]>(`/mothers/${motherId}/weight`);
  }
}

export const weightService = new WeightService();
