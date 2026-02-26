/**
 * Nurse Service
 * Handles nurse-specific API calls
 */

import { apiClient } from '@/lib/apiClient';

export interface Nurse {
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

class NurseService {
  /**
   * Complete nurse profile after registration
   */
  async completeProfile(data: CompleteProfileRequest): Promise<Nurse> {
    return apiClient.post<Nurse>('/nurses/complete-profile', data);
  }

  /**
   * Get nurse profile by ID
   */
  async getProfile(nurseId: number): Promise<Nurse> {
    return apiClient.get<Nurse>(`/nurses/${nurseId}`);
  }

  /**
   * Get current nurse's profile (uses JWT token)
   */
  async getCurrentProfile(): Promise<Nurse> {
    return apiClient.get<Nurse>('/nurses/profile');
  }

  /**
   * Update nurse profile
   */
  async updateProfile(data: { first_name?: string; last_name?: string; location?: string; license_number?: string }): Promise<Nurse> {
    // Get current profile first to get the Nurse ID
    const profile = await this.getCurrentProfile();
    return apiClient.put<Nurse>(`/nurses/${profile.id}`, data);
  }

  /**
   * Get all nurses
   */
  async getAllNurses(): Promise<Nurse[]> {
    return apiClient.get<Nurse[]>('/nurses');
  }
}

export const nurseService = new NurseService();
