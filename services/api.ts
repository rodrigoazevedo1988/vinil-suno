/**
 * Vinil Suno — API Service
 * Camada de abstração entre o Frontend e o Backend.
 * Substitui o localStorage por chamadas HTTP à API.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${url}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

// ─── Songs API ────────────────────────────────────

export interface SongPayload {
    title: string;
    artist: string;
    album?: string;
    coverUrl?: string;
    audioUrl?: string;
    duration?: number;
    isFavorite?: boolean;
    dateAdded?: string;
    mood?: {
        energy: number;
        valence: number;
        tempo: number;
    };
    genre?: string;
    lyrics?: string;
}

export const songsApi = {
    getAll: () => request<any[]>('/songs'),

    getById: (id: string) => request<any>(`/songs/${id}`),

    create: (data: SongPayload) => request<any>('/songs', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id: string, data: Partial<SongPayload>) => request<any>(`/songs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    toggleFavorite: (id: string) => request<any>(`/songs/${id}/favorite`, {
        method: 'PATCH',
    }),

    delete: (id: string) => request<{ success: boolean }>(`/songs/${id}`, {
        method: 'DELETE',
    }),
};

// ─── Playlists API ────────────────────────────────

export interface PlaylistPayload {
    name: string;
    description?: string;
    coverUrl?: string;
    songIds?: string[];
    ownerId?: string;
    isPublic?: boolean;
}

export const playlistsApi = {
    getAll: (userId?: string) => request<any[]>(userId ? `/playlists?userId=${userId}` : '/playlists'),

    getById: (id: string) => request<any>(`/playlists/${id}`),

    create: (data: PlaylistPayload) => request<any>('/playlists', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    update: (id: string, data: Partial<PlaylistPayload>) => request<any>(`/playlists/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id: string) => request<{ success: boolean }>(`/playlists/${id}`, {
        method: 'DELETE',
    }),
};

// ─── Upload API ───────────────────────────────────

export const uploadApi = {
    audio: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/upload/audio`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Falha no upload do áudio');
        }

        return response.json();
    },

    image: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/upload/image`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Falha no upload da imagem');
        }

        return response.json();
    },
};

// ─── Health Check ─────────────────────────────────

export const healthApi = {
    check: () => request<{ status: string; version: string }>('/health'),
};
