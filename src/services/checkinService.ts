/**
 * checkinService.ts
 * Handles daily check-in CRUD for all roles.
 */

import { apiClient } from '@/lib/apiClient';

export type CheckInResponse = 'ok' | 'not_ok';
export type CheckInChannel  = 'app' | 'whatsapp' | 'sms';

export interface CheckIn {
  id:           number;
  mother_id:    number;
  mother_name:  string | null;
  response:     CheckInResponse;
  comment:      string | null;
  channel:      CheckInChannel;
  created_at:   string;   // ISO 8601
}

export interface CreateCheckInRequest {
  response: CheckInResponse;
  comment?: string;
  channel?: CheckInChannel;
}

export interface CheckInListResponse {
  checkins: CheckIn[];
  total:    number;
}

class CheckinService {
  /** Mother submits a daily check-in. motherId = mothers.id (profile id). */
  async create(motherId: number, data: CreateCheckInRequest): Promise<CheckIn> {
    const body: CreateCheckInRequest = { channel: 'app', ...data };
    const resp = await apiClient.post<CheckIn & { message: string }>(`/mothers/${motherId}/checkins`, body);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { message: _msg, ...checkin } = resp;
    return checkin;
  }

  /** List all check-ins for a mother (newest first). */
  async listForMother(motherId: number, limit = 30): Promise<CheckInListResponse> {
    return apiClient.get<CheckInListResponse>(`/mothers/${motherId}/checkins?limit=${limit}`);
  }

  /** Get the single most-recent check-in for a mother. */
  async latestForMother(motherId: number): Promise<CheckIn | null> {
    const resp = await apiClient.get<{ checkin: CheckIn | null }>(
      `/mothers/${motherId}/checkins/latest`
    );
    return resp.checkin;
  }

  /** Get recent check-ins across all mothers assigned to a CHW. */
  async listForCHW(chwId: number, limit = 50): Promise<CheckInListResponse> {
    return apiClient.get<CheckInListResponse>(`/chws/${chwId}/checkins?limit=${limit}`);
  }
}

export const checkinService = new CheckinService();
