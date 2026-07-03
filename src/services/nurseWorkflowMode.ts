import { featureFlags } from '@/lib/featureFlags';

export interface SessionUserLike {
  role?: string;
  account_role?: string;
  facility_id?: number;
}

function readSessionUser(): SessionUserLike | null {
  const raw = sessionStorage.getItem('user');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUserLike;
  } catch {
    return null;
  }
}

export function isFacilityNurseMode(): boolean {
  if (!featureFlags.facilityNurseInheritance) {
    return false;
  }

  const user = readSessionUser();
  return user?.role === 'facility_staff' && user?.account_role === 'nurse';
}

export function getFacilityNurseFacilityId(): number | null {
  const user = readSessionUser();
  if (user?.role !== 'facility_staff' || user?.account_role !== 'nurse') {
    return null;
  }

  const facilityId = Number(user?.facility_id);
  if (!Number.isFinite(facilityId) || facilityId <= 0) {
    return null;
  }

  return facilityId;
}
