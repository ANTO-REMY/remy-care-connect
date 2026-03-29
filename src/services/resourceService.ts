import { apiClient } from '@/lib/apiClient';

export interface Resource {
  id: number;
  title: string;
  description: string;
  category: string;
  target_role: 'mother' | 'chw' | 'nurse';
  content_type: 'article' | 'video' | 'pdf';
  url: string;
  thumbnail: string;
  created_at: string;
}

export interface ResourceFilters {
  role?: 'mother' | 'chw' | 'nurse';
}

class ResourceService {
  async list(filters?: ResourceFilters): Promise<Resource[]> {
    const params = new URLSearchParams();
    if (filters?.role) {
      params.append('role', filters.role);
    }
    
    const response = await apiClient.get<{ data: Resource[]; count: number }>(
      `/resources${params.toString() ? `?${params}` : ''}`
    );
    return response.data;
  }

  async get(id: number): Promise<Resource> {
    return apiClient.get<Resource>(`/resources/${id}`);
  }
}

export default new ResourceService();