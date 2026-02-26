/**
 * Profile Photo Service
 * Wraps POST /api/v1/profile/photo, GET /api/v1/profile/photo, DELETE /api/v1/profile/photo
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

export interface PhotoMeta {
    photo_id: number;
    user_id?: number;
    filename: string;   // mapped from file_name in BE response
    file_url: string;   // full relative URL, e.g. /api/v1/profile/photo/file/<name>
    file_size?: number;
    mime_type?: string;
    uploaded_at: string;
}

// Raw shape the backend returns — mapped to PhotoMeta on the way out
interface RawPhotoResponse {
    photo_id: number;
    user_id?: number;
    file_name: string;
    file_url: string;
    file_size?: number;
    mime_type?: string;
    uploaded_at: string;
    role?: string;
}

function getToken(): string | null {
    return localStorage.getItem('access_token');
}

function authHeaders(): HeadersInit {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Upload or replace the current user's profile photo.
 * @param file  An image File object (jpg / png / webp, max 5 MB enforced by server)
 */
export async function uploadPhoto(file: File): Promise<PhotoMeta> {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch(`${BASE_URL}/profile/photo`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(err.error || err.message || 'Photo upload failed');
    }

    const raw: RawPhotoResponse = await res.json();
    return {
        photo_id: raw.photo_id,
        user_id: raw.user_id,
        filename: raw.file_name,
        file_url: raw.file_url,
        file_size: raw.file_size,
        mime_type: raw.mime_type,
        uploaded_at: raw.uploaded_at,
    };
}

/**
 * Get the current user's active profile photo metadata.
 * Returns null if no photo has been uploaded yet.
 */
export async function getMyPhoto(): Promise<PhotoMeta | null> {
    const res = await fetch(`${BASE_URL}/profile/photo`, {
        method: 'GET',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    });

    if (res.status === 404) return null;

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to fetch photo' }));
        throw new Error(err.error || err.message || 'Failed to fetch photo');
    }

    const raw: RawPhotoResponse = await res.json();
    return {
        photo_id: raw.photo_id,
        user_id: raw.user_id,
        filename: raw.file_name,
        file_url: raw.file_url,
        file_size: raw.file_size,
        mime_type: raw.mime_type,
        uploaded_at: raw.uploaded_at,
    };
}

/**
 * Get any user's active profile photo metadata by userId (no auth required on server).
 */
export async function getUserPhoto(userId: number): Promise<PhotoMeta | null> {
    const res = await fetch(`${BASE_URL}/profile/photo/${userId}`, {
        method: 'GET',
    });

    if (res.status === 404) return null;

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to fetch photo' }));
        throw new Error(err.error || err.message || 'Failed to fetch photo');
    }

    const raw: RawPhotoResponse = await res.json();
    return {
        photo_id: raw.photo_id,
        user_id: raw.user_id,
        filename: raw.file_name,
        file_url: raw.file_url,
        file_size: raw.file_size,
        mime_type: raw.mime_type,
        uploaded_at: raw.uploaded_at,
    };
}

/**
 * Deactivate (soft-delete) the current user's active profile photo.
 */
export async function deletePhoto(): Promise<void> {
    const res = await fetch(`${BASE_URL}/profile/photo`, {
        method: 'DELETE',
        headers: authHeaders(),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Delete failed' }));
        throw new Error(err.message || 'Failed to delete photo');
    }
}

/**
 * Build the absolute URL to serve a photo file from the backend.
 * Accepts either a stored filename OR the full file_url from the backend.
 */
export function getPhotoFileUrl(filenameOrUrl: string): string {
    // If the backend already gave us a full relative path like /api/v1/profile/photo/file/<name>
    if (filenameOrUrl.startsWith('/')) {
        const host = BASE_URL.replace('/api/v1', '');
        return `${host}${filenameOrUrl}`;
    }
    // Otherwise treat it as a bare filename
    return `${BASE_URL}/profile/photo/file/${filenameOrUrl}`;
}
