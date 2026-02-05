/**
 * Mother Service
 * Handles mother-specific API calls
 */

import { apiClient } from '@/lib/apiClient';

export interface Mother {
  id: number;
  user_id: number;
  name: string;
  phone_number: string;
  date_of_birth: string | null;
  due_date: string | null;
  location: string | null;
  status: string;
  created_at: string;
  assigned_chw?: {
    id: number;
    name: string;
    phone_number: string;
  };
}

export interface CompleteProfileRequest {
  date_of_birth: string;
  due_date: string;
  location: string;
}

export interface UpdateProfileRequest {
  name?: string;
  date_of_birth?: string;
  due_date?: string;
  location?: string;
}

export interface NextOfKin {
  id: number;
  mother_id: number;
  name: string;
  relationship: string;
  phone_number: string;
  created_at: string;
}

export interface CreateNextOfKinRequest {
  name: string;
  relationship: string;
  phone_number: string;
}

export interface DailyCheckIn {
  id: number;
  mother_id: number;
  check_in_date: string;
  feeling: string;
  notes: string | null;
  created_at: string;
}

export interface CreateDailyCheckInRequest {
  feeling: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

class MotherService {
  /**
   * Complete mother profile after registration
   */
  async completeProfile(data: CompleteProfileRequest): Promise<Mother> {
    return apiClient.post<Mother>('/mothers/complete-profile', data);
  }

  /**
   * Get mother profile by ID
   */
  async getProfile(motherId: number): Promise<Mother> {
    return apiClient.get<Mother>(`/mothers/${motherId}`);
  }

  /**
   * Get current mother's profile (uses JWT token)
   */
  async getCurrentProfile(): Promise<Mother> {
    return apiClient.get<Mother>('/mothers/profile');
  }

  /**
   * Update mother profile
   */
  async updateProfile(motherId: number, data: UpdateProfileRequest): Promise<Mother> {
    return apiClient.put<Mother>(`/mothers/${motherId}`, data);
  }

  /**
   * Get all mothers (for CHW/Nurse)
   */
  async getAllMothers(): Promise<Mother[]> {
    return apiClient.get<Mother[]>('/mothers');
  }

  /**
   * Get mothers assigned to CHW
   */
  async getAssignedMothers(chwId: number): Promise<Mother[]> {
    return apiClient.get<Mother[]>(`/chws/${chwId}/mothers`);
  }

  /**
   * Add next of kin
   */
  async addNextOfKin(motherId: number, data: CreateNextOfKinRequest): Promise<NextOfKin> {
    return apiClient.post<NextOfKin>(`/mothers/${motherId}/next-of-kin`, data);
  }

  /**
   * Get next of kin for mother
   */
  async getNextOfKin(motherId: number): Promise<NextOfKin[]> {
    return apiClient.get<NextOfKin[]>(`/mothers/${motherId}/next-of-kin`);
  }

  /**
   * Create daily check-in
   */
  async createDailyCheckIn(motherId: number, data: CreateDailyCheckInRequest): Promise<DailyCheckIn> {
    return apiClient.post<DailyCheckIn>(`/mothers/${motherId}/daily-checkin`, data);
  }

  /**
   * Get daily check-ins for mother
   */
  async getDailyCheckIns(motherId: number): Promise<DailyCheckIn[]> {
    return apiClient.get<DailyCheckIn[]>(`/mothers/${motherId}/daily-checkin`);
  }
}

export const motherService = new MotherService();
