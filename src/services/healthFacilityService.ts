/**
 * Health Facility Service
 * API client for health facilities search, discovery, and issue reporting
 */

import { apiClient } from '@/lib/apiClient';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface HealthFacility {
  id: number;
  osm_id: number;
  name: string;
  amenity?: string;  // pharmacy, clinic, hospital, dentist, blood_bank
  healthcare?: string;  // clinic, pharmacy, hospital, laboratory
  specialities?: string[];  // maternity, gynaecology, paediatrics
  operator_type?: string;  // private, government, religious, ngo, cbo
  city?: string;
  address?: string;
  verified?: boolean;
  coordinates: {
    lat: number | null;
    lng: number | null;
  };
  distance_km?: number;  // Only present in nearby searches
  metadata?: Record<string, any>;
  issues?: {
    total: number;
    open: number;
    has_open_issues: boolean;
  };
  link_confidence?: 'high' | 'medium' | 'low';
  link_reason?: WardFacilityMatchMode;
  location_quality_status?: string;
  inference_source?: string;
  inference_confidence?: number | null;
  subcounty_name?: string | null;
  ward_name?: string | null;
  location_match_status?: string;
  location_match_method?: string | null;
  location_matched_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type WardFacilityMatchMode = 'inferred_ward' | 'inferred_subcounty' | 'text_fallback';

export interface FacilityIssue {
  id: number;
  facility_id: number;
  facility_name?: string;
  reported_by: number;
  reporter_name?: string;
  issue_type: 'closed' | 'wrong_location' | 'wrong_name' | 'wrong_info' | 'other';
  description?: string;
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface SearchFilters {
  q?: string;  // Search query (name)
  amenity?: string;  // clinic, hospital, pharmacy
  healthcare?: string;  // clinic, hospital, pharmacy, laboratory
  city?: string;
  operator_type?: string;  // private, government, religious, ngo
  verified?: boolean;
  limit?: number;  // Max 50
}

export interface NearbyFilters {
  lat: number;
  lng: number;
  radius_km?: number;  // Default 10, max 50
  amenity?: string;
  healthcare?: string;
  speciality?: string;  // maternity, gynaecology
  limit?: number;  // Max 50
}

export interface FacilityStats {
  total_facilities: number;
  verified_facilities: number;
  by_amenity: Record<string, number>;
  by_operator: Record<string, number>;
  top_cities: Array<{ city: string; count: number }>;
}

export interface ReportIssueData {
  issue_type: 'closed' | 'wrong_location' | 'wrong_name' | 'wrong_info' | 'other';
  description: string;
}

export interface MotherFacilityAppointment {
  id: number;
  facility_id: number;
  facility_name?: string;
  facility_address?: string | null;
  facility_city?: string | null;
  facility_phone?: string | null;
  facility_email?: string | null;
  facility_hours_text?: string | null;
  mother_id?: number;
  mother_name: string;
  scheduled_time: string;
  appointment_type?: string;
  status: 'scheduled' | 'assigned' | 'completed' | 'canceled';
  assigned_staff_account_id?: number;
  assigned_staff_name?: string;
  notes?: string;
  ticket_code?: string | null;
  ticket_status?: 'active' | 'used' | 'canceled' | 'expired' | null;
  validated_at?: string | null;
  validated_by_account_id?: number | null;
  validation_method?: string | null;
  ticket_last_event_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================
// SERVICE CLASS
// ============================================================

class HealthFacilityService {
  /**
   * Search facilities by name, type, location
   */
  async search(filters: SearchFilters): Promise<{ count: number; facilities: HealthFacility[] }> {
    const params = new URLSearchParams();
    
    if (filters.q) params.append('q', filters.q);
    if (filters.amenity) params.append('amenity', filters.amenity);
    if (filters.healthcare) params.append('healthcare', filters.healthcare);
    if (filters.city) params.append('city', filters.city);
    if (filters.operator_type) params.append('operator_type', filters.operator_type);
    if (filters.verified !== undefined) params.append('verified', String(filters.verified));
    if (filters.limit) params.append('limit', String(filters.limit));

    return apiClient.get<{ count: number; facilities: HealthFacility[] }>(
      `/health-facilities/search?${params.toString()}`
    );
  }

  /**
   * Find facilities near a location
   */
  async nearby(filters: NearbyFilters): Promise<{ 
    count: number; 
    search_center: { lat: number; lng: number };
    radius_km: number;
    facilities: HealthFacility[] 
  }> {
    const params = new URLSearchParams();
    
    params.append('lat', String(filters.lat));
    params.append('lng', String(filters.lng));
    if (filters.radius_km) params.append('radius_km', String(filters.radius_km));
    if (filters.amenity) params.append('amenity', filters.amenity);
    if (filters.healthcare) params.append('healthcare', filters.healthcare);
    if (filters.speciality) params.append('speciality', filters.speciality);
    if (filters.limit) params.append('limit', String(filters.limit));

    return apiClient.get(
      `/health-facilities/nearby?${params.toString()}`
    );
  }

  /**
   * Get detailed information about a facility
   */
  async getDetail(facilityId: number): Promise<HealthFacility> {
    return apiClient.get<HealthFacility>(`/health-facilities/${facilityId}`);
  }

  /**
   * Report an issue with a facility
   */
  async reportIssue(
    facilityId: number,
    data: ReportIssueData
  ): Promise<{ message: string; issue: FacilityIssue }> {
    return apiClient.post(`/health-facilities/${facilityId}/issues`, data);
  }

  /**
   * Get recent facility issues
   */
  async getRecentIssues(filters?: {
    status?: string;
    facility_id?: number;
    limit?: number;
  }): Promise<{ count: number; issues: FacilityIssue[] }> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.facility_id) params.append('facility_id', String(filters.facility_id));
    if (filters?.limit) params.append('limit', String(filters.limit));

    return apiClient.get<{ count: number; issues: FacilityIssue[] }>(
      `/health-facilities/issues/recent?${params.toString()}`
    );
  }

  /**
   * Get details of a specific issue
   */
  async getIssueDetail(issueId: number): Promise<FacilityIssue> {
    return apiClient.get<FacilityIssue>(`/health-facilities/issues/${issueId}`);
  }

  /**
   * Get facility statistics
   */
  async getStats(): Promise<FacilityStats> {
    return apiClient.get<FacilityStats>('/health-facilities/stats');
  }

  /**
   * Get user's current location (browser geolocation API)
   */
  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000  // Cache for 5 minutes
        }
      );
    });
  }

  /**
   * Mother books appointment at selected facility.
   */
  async bookAppointment(
    facilityId: number,
    data: { scheduled_time: string; appointment_type?: string; notes?: string }
  ): Promise<{ message: string; appointment: MotherFacilityAppointment }> {
    return apiClient.post(`/health-facilities/${facilityId}/appointments`, data);
  }

  /**
   * Get current mother's facility bookings.
   */
  async getMyAppointments(): Promise<{ count: number; appointments: MotherFacilityAppointment[] }> {
    return apiClient.get('/health-facilities/appointments/mine');
  }

  /**
   * Mother updates her own facility booking.
   */
  async updateMyAppointment(
    appointmentId: number,
    data: { scheduled_time?: string; appointment_type?: string; notes?: string }
  ): Promise<{ message: string; appointment: MotherFacilityAppointment }> {
    return apiClient.patch(`/health-facilities/appointments/${appointmentId}`, data);
  }

  /**
   * Mother cancels her own facility booking.
   */
  async cancelMyAppointment(
    appointmentId: number
  ): Promise<{ message: string; appointment: MotherFacilityAppointment }> {
    return apiClient.delete(`/health-facilities/appointments/${appointmentId}`);
  }

  /**
   * Mother restores a canceled facility booking.
   */
  async restoreMyAppointment(
    appointmentId: number
  ): Promise<{ message: string; appointment: MotherFacilityAppointment }> {
    return apiClient.post(`/health-facilities/appointments/${appointmentId}/restore`);
  }

  /**
   * Get facilities near a specific ward (for CHW referrals)
   */
  async getFacilitiesByWard(
    wardId: number,
    filters?: { amenity?: string; relevance_profile?: 'maternal_referral' | 'all'; limit?: number }
  ): Promise<{
    ward: { id: number; name: string; sub_county: string };
    filter_profile?: 'maternal_referral' | 'all';
    matched_by?: WardFacilityMatchMode;
    facilities: HealthFacility[];
    count: number;
  }> {
    const params = new URLSearchParams();
    
    if (filters?.amenity) params.append('amenity', filters.amenity);
    if (filters?.relevance_profile) params.append('relevance_profile', filters.relevance_profile);
    if (filters?.limit) params.append('limit', String(filters.limit));

    return apiClient.get(
      `/health-facilities/by-ward/${wardId}?${params.toString()}`
    );
  }

}

// Export singleton instance
export default new HealthFacilityService();
