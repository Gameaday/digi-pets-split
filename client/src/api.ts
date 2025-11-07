import { Pet, ApiResponse, CreatePetRequest, RegisterRequest, LoginRequest, AuthResult } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

function clearAuthToken(): void {
  localStorage.removeItem('auth_token');
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export const api = {
  // Auth
  register: async (data: RegisterRequest) => {
    const response = await fetchAPI<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success && response.data) {
      setAuthToken(response.data.token);
    }
    return response;
  },

  login: async (data: LoginRequest) => {
    const response = await fetchAPI<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success && response.data) {
      setAuthToken(response.data.token);
    }
    return response;
  },

  logout: () => {
    clearAuthToken();
  },

  isAuthenticated: () => {
    return getAuthToken() !== null;
  },

  getCurrentUser: () => fetchAPI<{ id: string; username: string; createdAt: string }>('/auth/me'),

  // Species
  getSpecies: () => fetchAPI<string[]>('/species'),
  
  // Pets
  getPets: () => fetchAPI<Pet[]>('/pets'),
  
  getPet: (id: string) => fetchAPI<Pet>(`/pets/${id}`),
  
  createPet: (data: CreatePetRequest) =>
    fetchAPI<Pet>('/pets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  feedPet: (id: string) =>
    fetchAPI<Pet>(`/pets/${id}/feed`, {
      method: 'POST',
    }),
  
  playWithPet: (id: string) =>
    fetchAPI<Pet>(`/pets/${id}/play`, {
      method: 'POST',
    }),
  
  restPet: (id: string) =>
    fetchAPI<Pet>(`/pets/${id}/rest`, {
      method: 'POST',
    }),
  
  hatchEgg: (id: string) =>
    fetchAPI<Pet>(`/pets/${id}/hatch`, {
      method: 'POST',
    }),
  
  deletePet: (id: string) =>
    fetchAPI<{ message: string }>(`/pets/${id}`, {
      method: 'DELETE',
    }),
};
