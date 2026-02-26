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
  first_name: string;
  last_name: string;
  phone_number: string;
  license_number: string | null;
  location: string | null;
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
   * Update CHW profile
   */
  async updateProfile(data: { first_name?: string; last_name?: string; location?: string; license_number?: string }): Promise<CHW> {
    // Get current profile first to get the CHW ID
    const profile = await this.getCurrentProfile();
    return apiClient.put<CHW>(`/chws/${profile.id}`, data);
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
