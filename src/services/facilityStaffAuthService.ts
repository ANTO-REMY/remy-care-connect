import { apiClient } from '@/lib/apiClient';

export interface RegisterFacilityAdminRequest {
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  pin: string;
  facility_id: number;
}

export interface FacilityStaffInviteRequest {
  facility_id: number;
  invited_role: 'doctor' | 'nurse';
  invitation_phone?: string;
  invitation_email?: string;
}

export interface FacilityStaffOTPLoginRequest {
  otp_code: string;
  phone_number?: string;
  email?: string;
}

export interface FacilityStaffOTPRequest {
  phone_number?: string;
  email?: string;
}

export interface FacilityStaffProfileCompleteRequest {
  first_name: string;
  last_name: string;
  email?: string;
  updated_phone_number?: string;
  pin?: string;
}

export interface FacilityStaffPinLoginRequest {
  pin: string;
  otp_code?: string;
  phone_number?: string;
  email?: string;
}

export interface FacilityAuthUser {
  id: number;
  phone_number?: string;
  email?: string;
  first_name: string;
  last_name: string;
  name: string;
  role: 'facility_staff';
  account_role?: string;
  profile_completed?: boolean;
  facility_id?: number;
}

export interface FacilityOTPRequestResponse {
  message: string;
  delivery_status: string;
  delivery_method: string;
  expires_at?: string;
}

export interface FacilityOTPLoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  requires_profile_completion?: boolean;
  created_new_user?: boolean;
  membership?: FacilityStaffRecord;
  user: FacilityAuthUser;
}

export interface FacilityPinLoginResponse {
  message: string;
  requires_otp?: boolean;
  requires_profile_completion?: boolean;
  expires_in?: string;
  otp_delivery_status?: string;
  access_token?: string;
  refresh_token?: string;
  user?: FacilityAuthUser;
  membership?: FacilityStaffRecord;
}

export interface FacilityProfileCompleteResponse {
  message: string;
  user: FacilityAuthUser;
  membership?: FacilityStaffRecord;
  pin_set?: boolean;
  invited_phone_number?: string;
}

export interface FacilityInviteResponse {
  message: string;
  invitation_id: number;
  staff_row_id?: number;
  facility_id: number;
  delivery_status: string;
  delivery_method: string;
  expires_at?: string;
}

export interface FacilityStaffRecord {
  id: number;
  facility_id: number;
  account_id: number | null;
  user_name?: string;
  phone_number?: string;
  role: string;
  specialty?: string;
  status: 'pending_verification' | 'active' | 'inactive' | 'removed';
  added_by?: number;
  added_at?: string;
}

export interface FacilityClaimFilters {
  sub_county_id: number;
  ward_id: number;
  amenity?: string;
  healthcare?: string;
  relevance_profile?: 'maternal_referral' | 'all';
  q?: string;
  lat?: number;
  lng?: number;
  limit?: number;
  include_claimed?: boolean;
}

export interface ClaimableFacility {
  id: number;
  name: string;
  amenity?: string;
  healthcare?: string;
  city?: string;
  address?: string;
  verified?: boolean;
  subcounty_name?: string | null;
  ward_name?: string | null;
  location_match_status?: string;
  location_match_method?: string | null;
  distance_km?: number;
  coordinates: {
    lat: number | null;
    lng: number | null;
  };
}

export interface FacilityClaimResponse {
  sub_county: { id: number; name: string };
  ward: { id: number; name: string };
  matched_by: 'saved_admin_scope';
  filter_profile: 'maternal_referral' | 'all';
  applied_filters?: {
    include_claimed: boolean;
    amenity: string[];
    healthcare: string[];
    q: string | null;
    has_coordinates: boolean;
  };
  empty_state?: {
    title: string;
    message: string;
  } | null;
  count: number;
  facilities: ClaimableFacility[];
}

class FacilityStaffAuthService {
  async listClaimableFacilities(filters: FacilityClaimFilters): Promise<FacilityClaimResponse> {
    const params = new URLSearchParams();
    params.append('sub_county_id', String(filters.sub_county_id));
    params.append('ward_id', String(filters.ward_id));

    if (filters.amenity) params.append('amenity', filters.amenity);
    if (filters.healthcare) params.append('healthcare', filters.healthcare);
    if (filters.relevance_profile) params.append('relevance_profile', filters.relevance_profile);
    if (filters.q) params.append('q', filters.q);
    if (filters.lat !== undefined) params.append('lat', String(filters.lat));
    if (filters.lng !== undefined) params.append('lng', String(filters.lng));
    if (filters.limit !== undefined) params.append('limit', String(filters.limit));
    if (filters.include_claimed !== undefined) params.append('include_claimed', String(filters.include_claimed));

    return apiClient.get(`/facilities/claim/facilities?${params.toString()}`);
  }

  async registerFacilityAdmin(data: RegisterFacilityAdminRequest): Promise<{
    message: string;
    access_token: string;
    refresh_token: string;
    facility: { id: number; name: string; claimed: boolean };
    user: FacilityAuthUser;
  }> {
    return apiClient.post('/facilities/admin/register', data);
  }

  async inviteStaff(data: FacilityStaffInviteRequest): Promise<FacilityInviteResponse> {
    return apiClient.post('/facilities/staff/invite', data);
  }

  async requestOTP(data: FacilityStaffOTPRequest): Promise<FacilityOTPRequestResponse> {
    return apiClient.post('/facilities/staff/otp-request', data);
  }

  async otpLogin(data: FacilityStaffOTPLoginRequest): Promise<FacilityOTPLoginResponse> {
    return apiClient.post('/facilities/staff/otp-login', data);
  }

  async pinLogin(data: FacilityStaffPinLoginRequest): Promise<FacilityPinLoginResponse> {
    return apiClient.post('/facilities/staff/pin-login', data);
  }

  async adminPinLogin(data: FacilityStaffPinLoginRequest): Promise<FacilityPinLoginResponse> {
    return apiClient.post('/facilities/admin/login', data);
  }

  async completeProfile(data: FacilityStaffProfileCompleteRequest): Promise<FacilityProfileCompleteResponse> {
    return apiClient.post('/facilities/staff/profile-complete', data);
  }

  async listStaff(facilityId?: number): Promise<{
    facility_id: number;
    is_admin: boolean;
    count: number;
    staff: FacilityStaffRecord[];
  }> {
    const params = new URLSearchParams();
    if (facilityId) params.append('facility_id', String(facilityId));
    return apiClient.get(`/facilities/staff?${params.toString()}`);
  }

  async updateStaff(
    staffId: number,
    data: Partial<Pick<FacilityStaffRecord, 'role' | 'status' | 'specialty'>>,
  ): Promise<{ message: string; staff: FacilityStaffRecord }> {
    return apiClient.patch(`/facilities/staff/${staffId}`, data);
  }
}

export const facilityStaffAuthService = new FacilityStaffAuthService();
