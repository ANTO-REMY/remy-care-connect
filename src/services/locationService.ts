import {
  NAIROBI_SUB_COUNTIES,
  NAIROBI_WARDS_BY_SUB_COUNTY,
} from "@/data/nairobiLocations";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

export interface SubCounty {
  id: number;
  name: string;
}

export interface Ward {
  id: number;
  name: string;
  sub_county_id: number;
}

/** Return all Nairobi sub-counties ordered alphabetically from the local preload. */
export async function getSubCounties(): Promise<SubCounty[]> {
  return Promise.resolve([...NAIROBI_SUB_COUNTIES]);
}

/** Return the wards that belong to a given sub-county from the local preload. */
export async function getWards(subCountyId: number): Promise<Ward[]> {
  return Promise.resolve([...(NAIROBI_WARDS_BY_SUB_COUNTY[subCountyId] ?? [])]);
}

/** Save the selected ward to the calling user's role-specific profile row. */
export async function saveWard(wardId: number): Promise<void> {
  const token = sessionStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/locations/ward`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ward_id: wardId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error || "Failed to save ward");
  }
}
