/**
 * Community Health Worker (CHW) Service
 * Handles CHW-specific API calls
 */

import { apiClient } from '@/lib/apiClient';
import type { Mother } from './motherService';

export interface CHW {
  id: number;
  user_id: number;
  name: string;
  phone_number: string;
  license_number: string | null;
  created_at: string;
}

export interface CompleteProfileRequest {
  license_number: string;
}

class CHWService {
  /**
   * Complete CHW profile after registration
   */
  async completeProfile(data: CompleteProfileRequest): Promise<CHW> {
    return apiClient.post<CHW>('/chws/complete-profile', data);
  }

  /**
   * Get CHW profile by ID
   */
  async getProfile(chwId: number): Promise<CHW> {
    return apiClient.get<CHW>(`/chws/${chwId}`);
  }

  /**
   * Get current CHW's profile (uses JWT token)
   */
  async getCurrentProfile(): Promise<CHW> {
    return apiClient.get<CHW>('/chws/profile');
  }

  /**
   * Get all CHWs
   */
  async getAllCHWs(): Promise<CHW[]> {
    return apiClient.get<CHW[]>('/chws');
  }

  /**
   * Get mothers assigned to CHW
   */
  async getAssignedMothers(chwId: number): Promise<Mother[]> {
    return apiClient.get<Mother[]>(`/chws/${chwId}/mothers`);
  }

  /**
   * Assign mother to CHW
   */
  async assignMother(chwId: number, motherId: number): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/assignments', {
      chw_id: chwId,
      mother_id: motherId
    });
  }
}

export const chwService = new CHWService();
