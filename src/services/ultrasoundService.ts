/**
 * ultrasoundService.ts
 * Handles ultrasound record CRUD.
 */

import { apiClient } from '@/lib/apiClient';
import { getFacilityNurseFacilityId } from './nurseWorkflowMode';

export interface UltrasoundRecord {
  id: number;
  mother_id: number;
  week_number: number;
  fetal_weight_grams: number | null;
  fetal_length_cm: number | null;
  heart_rate_bpm: number | null;
  notes: string | null;
  recorded_by: number;
  scan_date: string;
  created_at: string;
}

export interface CreateUltrasoundRequest {
  week_number: number;
  scan_date: string;           // YYYY-MM-DD
  fetal_weight_grams?: number;
  fetal_length_cm?: number;
  heart_rate_bpm?: number;
  notes?: string;
}

class UltrasoundService {
  /** CHW/Nurse records ultrasound data for a mother. */
  async create(motherId: number, data: CreateUltrasoundRequest): Promise<UltrasoundRecord> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const resp = await apiClient.post<UltrasoundRecord & { message: string }>(
        `/facilities/${facilityId}/nurse-compat/mothers/${motherId}/ultrasound`,
        data,
      );
      const { message: _msg, ...record } = resp;
      return record;
    }

    const resp = await apiClient.post<UltrasoundRecord & { message: string }>(
      `/mothers/${motherId}/ultrasound`,
      data
    );
    const { message: _msg, ...record } = resp;
    return record;
  }

  /** Mother views her own ultrasound history. */
  async getMyRecords(): Promise<UltrasoundRecord[]> {
    return apiClient.get<UltrasoundRecord[]>('/mothers/me/ultrasound');
  }

  /** CHW/Nurse views a mother's ultrasound history. */
  async getMotherRecords(motherId: number): Promise<UltrasoundRecord[]> {
    return apiClient.get<UltrasoundRecord[]>(`/mothers/${motherId}/ultrasound`);
  }
}

export const ultrasoundService = new UltrasoundService();
