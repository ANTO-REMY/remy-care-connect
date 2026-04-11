import { apiClient } from '@/lib/apiClient';

export interface Reminder {
  id: number | string; // Can be string if combined with appt
  title: string;
  time: string;
  completed: boolean;
  type: string;
  icon: string;
  internal_id: string;
}

export interface ReminderResponse {
  reminders: Reminder[];
}

class ReminderService {
  async list(): Promise<ReminderResponse> {
    return apiClient.get<ReminderResponse>('/reminders');
  }

  async create(data: { title: string; time: string; type?: string; frequency?: string; icon?: string }): Promise<{ id: number; message: string }> {
    return apiClient.post<{ id: number; message: string }>('/reminders', data);
  }

  async update(id: number, data: { title?: string; time?: string }): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`/reminders/${id}`, data);
  }

  async toggle(id: number): Promise<{ message: string; completed: boolean }> {
    return apiClient.patch<{ message: string; completed: boolean }>(`/reminders/${id}/toggle`, {});
  }

  async delete(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/reminders/${id}`);
  }
}

export const reminderService = new ReminderService();
