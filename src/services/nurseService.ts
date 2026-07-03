/**
 * Nurse Service
 * Handles nurse-specific API calls
 */

import { apiClient } from '@/lib/apiClient';
import { getFacilityNurseFacilityId, isFacilityNurseMode } from './nurseWorkflowMode';

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

export interface NurseCHW {
  id: number;
  user_id: number;
  name: string;
  phone_number: string;
  location: string;
  assigned_mothers: number;
  active_cases: number;
  performance: number;
  last_active: string;
  avatar: string;
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
    if (isFacilityNurseMode()) {
      const profile = await this.getCurrentProfile();
      if (profile.id === nurseId) return profile;
    }
    return apiClient.get<Nurse>(`/nurses/${nurseId}`);
  }

  /**
   * Get current nurse's profile (uses JWT token)
   */
  async getCurrentProfile(): Promise<Nurse> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const response = await apiClient.get<{
        profile: {
          id: number;
          nurse_name: string;
          role: string;
          location: string | null;
        };
      }>(`/facilities/${facilityId}/nurse-compat/context`);

      return {
        id: response.profile.id,
        user_id: response.profile.id,
        name: response.profile.nurse_name,
        first_name: response.profile.nurse_name.split(' ')[0] || response.profile.nurse_name,
        last_name: response.profile.nurse_name.split(' ').slice(1).join(' '),
        phone_number: '',
        license_number: null,
        location: response.profile.location,
        created_at: new Date().toISOString(),
      };
    }
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

  /**
   * Get CHWs supervised by a specific nurse
   */
  async getSupervisedCHWs(nurseId: number): Promise<NurseCHW[]> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      const response = await apiClient.get<{ chws: NurseCHW[] }>(`/facilities/${facilityId}/nurse-compat/team/chws`);
      return (response.chws || []).map((chw) => ({
        ...chw,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(chw.name || 'CHW')}`,
      }));
    }
    const response = await apiClient.get<{chws: NurseCHW[]}>(`/nurses/${nurseId}/chws`);
    return response.chws;
  }
}

export const nurseService = new NurseService();
