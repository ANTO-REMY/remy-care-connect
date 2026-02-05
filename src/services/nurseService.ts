/**
 * Nurse Service
 * Handles nurse-specific API calls
 */

import { apiClient } from '@/lib/apiClient';

export interface Nurse {
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
   * Get all nurses
   */
  async getAllNurses(): Promise<Nurse[]> {
    return apiClient.get<Nurse[]>('/nurses');
  }
}

export const nurseService = new NurseService();
