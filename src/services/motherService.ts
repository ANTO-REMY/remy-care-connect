/**
 * Mother Service
 * Handles mother-specific API calls
 */

import { apiClient } from '@/lib/apiClient';

export interface Mother {
  id: number;
  user_id: number;
  name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;  // no longer nullable
  due_date: string;       // no longer nullable
  location: string;       // no longer nullable
  status: string;
  created_at: string;
  assigned_chw?: {
    id: number;
    name: string;
    phone_number: string;
  };
}

export interface CompleteProfileRequest {
  dob: string;           // Changed from date_of_birth to match API
  due_date: string;
  location: string;
}

export interface UpdateProfileRequest {
  full_name?: string;    // Changed from name to match API
  first_name?: string;
  last_name?: string;
  dob?: string;          // Changed from date_of_birth to match API
  due_date?: string;
  location?: string;
}

export interface NextOfKin {
  id: number;
  user_id: number;
  mother_name: string;
  name: string;
  phone: string;
  sex: string;
  relationship: string;
  created_at: string;
}

export interface CreateNextOfKinRequest {
  name: string;
  phone?: string;
  phone_number?: string; // kept for backward compatibility
  sex?: string;
  relationship: string;
}

export interface DailyCheckIn {
  id: number;
  mother_id: number;
  mother_name: string | null;
  response: 'ok' | 'not_ok';
  comment: string | null;
  channel: 'app' | 'whatsapp' | 'sms';
  created_at: string;
}

export interface CreateDailyCheckInRequest {
  response: 'ok' | 'not_ok';
  comment?: string;
  channel?: 'app' | 'whatsapp' | 'sms';
}

// Shape returned by GET /mothers/<mother_id> in the backend
interface MotherApiResponse {
  mother_id: number;
  user_id: number;
  name: string;
  first_name: string;
  last_name: string;
  dob: string;
  due_date: string;
  location: string | null;
  phone: string;
}

class MotherService {
  /**
   * Complete mother profile after registration
   */
  async completeProfile(data: CompleteProfileRequest): Promise<{ mother_id: number; message: string }> {
    return apiClient.post<{ mother_id: number; message: string }>('/mothers/complete-profile', data);
  }

  /**
   * Get mother profile by ID
   */
  async getProfile(motherId: number): Promise<Mother> {
    const data = await apiClient.get<MotherApiResponse>(`/mothers/${motherId}`);
    return {
      id: data.mother_id,
      user_id: data.user_id,
      name: data.name,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone,
      date_of_birth: data.dob,
      due_date: data.due_date,
      location: data.location,
      // These fields are not provided by this endpoint; set sensible defaults
      status: 'active',
      created_at: '',
    };
  }

  /**
   * Get current mother's profile (from /mothers/me)
   */
  async getMyProfile(): Promise<Mother> {
    const data = await apiClient.get<MotherApiResponse>('/mothers/me');
    return {
      id: data.mother_id,
      user_id: data.user_id,
      name: data.name,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone,
      date_of_birth: data.dob,
      due_date: data.due_date,
      location: data.location,
      status: 'active',
      created_at: '',
    };
  }

  /**
   * Get current mother's profile (from auth context)
   */
  async getCurrentProfile(): Promise<Mother> {
    // This would need to be implemented in the backend or we use the user context
    throw new Error('Use profile from auth context instead');
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
    // Backend resolves mother from JWT; motherId is ignored but kept for API compatibility
    const payload = {
      name: data.name,
      phone: data.phone || data.phone_number || "",
      sex: data.sex || "",
      relationship: data.relationship,
    };
    return apiClient.post<NextOfKin>(`/nextofkin`, payload);
  }

  /**
   * Get next of kin for mother
   */
  async getNextOfKin(motherId: number): Promise<NextOfKin[]> {
    return apiClient.get<NextOfKin[]>(`/nextofkin/${motherId}`);
  }

  /**
   * Create daily check-in (uses new /mothers/<id>/checkins endpoint)
   */
  async createDailyCheckIn(motherId: number, data: CreateDailyCheckInRequest): Promise<DailyCheckIn> {
    return apiClient.post<DailyCheckIn>(`/mothers/${motherId}/checkins`, { channel: 'app', ...data });
  }

  /**
   * Get daily check-ins for mother
   */
  async getDailyCheckIns(motherId: number): Promise<DailyCheckIn[]> {
    const resp = await apiClient.get<{ checkins: DailyCheckIn[]; total: number }>(`/mothers/${motherId}/checkins`);
    return resp.checkins;
  }
}

export const motherService = new MotherService();
