import { Pet, ApiResponse, CreatePetRequest } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
  getSpecies: () => fetchAPI<string[]>('/species'),
  
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
  
  deletePet: (id: string) =>
    fetchAPI<{ message: string }>(`/pets/${id}`, {
      method: 'DELETE',
    }),
};
