/**
 * locationService.ts — Nairobi County administrative location API calls.
 *
 * Endpoints used:
 *   GET /locations/sub-counties              → list all sub-counties
 *   GET /locations/sub-counties/:id/wards    → wards for a sub-county
 *   PATCH /locations/ward                    → save ward_id to the caller's profile
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

export interface SubCounty {
    id: number;
    name: string;
}

export interface Ward {
    id: number;
    name: string;
    sub_county_id: number;
}

/** Return all Nairobi sub-counties ordered alphabetically. */
export async function getSubCounties(): Promise<SubCounty[]> {
    const res = await fetch(`${API_BASE}/locations/sub-counties`);
    if (!res.ok) throw new Error('Failed to load sub-counties');
    return res.json();
}

/** Return the wards that belong to a given sub-county. */
export async function getWards(subCountyId: number): Promise<Ward[]> {
    const res = await fetch(`${API_BASE}/locations/sub-counties/${subCountyId}/wards`);
    if (!res.ok) throw new Error('Failed to load wards');
    return res.json();
}

/** Save the selected ward to the calling user's role-specific profile row. */
export async function saveWard(wardId: number): Promise<void> {
    const token = sessionStorage.getItem('access_token');
    const res = await fetch(`${API_BASE}/locations/ward`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ward_id: wardId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || 'Failed to save ward');
    }
}
