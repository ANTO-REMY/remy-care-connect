import { apiClient } from '@/lib/apiClient';

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
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (unreadOnly) params.set('unread_only', 'true');
    return apiClient.get<NotificationListResponse>(`/notifications?${params.toString()}`);
  }

  async unreadCount(): Promise<NotificationUnreadCountResponse> {
    return apiClient.get<NotificationUnreadCountResponse>('/notifications/unread-count');
  }

  async markRead(id: number): Promise<{ message: string; unread_count: number }> {
    return apiClient.patch<{ message: string; unread_count: number }>(`/notifications/${id}/read`, {});
  }

  async markAllRead(): Promise<{ message: string; unread_count: number }> {
    return apiClient.patch<{ message: string; unread_count: number }>('/notifications/read-all', {});
  }
}

export const notificationService = new NotificationService();
