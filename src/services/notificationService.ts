import { apiClient } from '@/lib/apiClient';
import { getFacilityNurseFacilityId } from './nurseWorkflowMode';

export interface UserNotification {
  id: number;
  event_type: string;
  title: string;
  message: string;
  url: string | null;
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface NotificationListResponse {
  notifications: UserNotification[];
  unread_count: number;
  total: number;
}

interface NotificationUnreadCountResponse {
  unread_count: number;
}

class NotificationService {
  async list(limit = 20, unreadOnly = false): Promise<NotificationListResponse> {
    const facilityId = getFacilityNurseFacilityId();
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (unreadOnly) params.set('unread_only', 'true');

    if (facilityId) {
      return apiClient.get<NotificationListResponse>(`/facilities/${facilityId}/nurse-compat/notifications?${params.toString()}`);
    }

    return apiClient.get<NotificationListResponse>(`/notifications?${params.toString()}`);
  }

  async unreadCount(): Promise<NotificationUnreadCountResponse> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      return apiClient.get<NotificationUnreadCountResponse>(`/facilities/${facilityId}/nurse-compat/notifications/unread-count`);
    }
    return apiClient.get<NotificationUnreadCountResponse>('/notifications/unread-count');
  }

  async markRead(id: number): Promise<{ message: string; unread_count: number }> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      return apiClient.patch<{ message: string; unread_count: number }>(`/facilities/${facilityId}/nurse-compat/notifications/${id}/read`, {});
    }
    return apiClient.patch<{ message: string; unread_count: number }>(`/notifications/${id}/read`, {});
  }

  async markAllRead(): Promise<{ message: string; unread_count: number }> {
    const facilityId = getFacilityNurseFacilityId();
    if (facilityId) {
      return apiClient.patch<{ message: string; unread_count: number }>(`/facilities/${facilityId}/nurse-compat/notifications/read-all`, {});
    }
    return apiClient.patch<{ message: string; unread_count: number }>('/notifications/read-all', {});
  }
}

export const notificationService = new NotificationService();
