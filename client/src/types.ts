export interface Pet {
  id: string;
  name: string;
  species: string;
  level: number;
  experience: number;
  hunger: number;
  happiness: number;
  health: number;
  energy: number;
  age: number;
  createdAt: string;
  lastFed: string;
  lastPlayed: string;
  lastSlept: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreatePetRequest {
  name: string;
  species: string;
}
