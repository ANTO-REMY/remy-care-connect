import { apiClient } from '@/lib/apiClient';

export type TrimesterTag = 'T1' | 'T2' | 'T3';

export interface DietaryRecommendation {
  id: number;
  source_id?: string;
  title: string;
  swahili_name?: string;
  content?: string;
  description?: string;
  target_group?: string;
  target_groups: string[];
  trimester_tags: string[];
  meal_type?: string;
  meal_time?: string;
  key_nutrients: string[];
  health_benefits: string[];
  preparation_tips?: string;
  cautions: string[];
  nutrition_highlight?: string;
  portion_guide?: string;
  image_suggestion?: string;
  tags: string[];
  calories?: number;
  is_featured: boolean;
  source_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionFilters {
  target_group?: string;
  meal_type?: string;
  trimester?: TrimesterTag | string;
  limit?: number;
  daily_plan?: boolean;
}

class NutritionService {
  async list(filters?: NutritionFilters): Promise<DietaryRecommendation[]> {
    const params = new URLSearchParams();

    if (filters?.target_group) params.append('target_group', filters.target_group);
    if (filters?.meal_type) params.append('meal_type', filters.meal_type);
    if (filters?.trimester) params.append('trimester', filters.trimester);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.daily_plan) params.append('daily_plan', 'true');

    return apiClient.get<DietaryRecommendation[]>(
      `/nutrition/recommendations${params.toString() ? `?${params}` : ''}`,
    );
  }
}

const nutritionService = new NutritionService();
export default nutritionService;
