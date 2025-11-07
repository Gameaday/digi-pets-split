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
  createdAt: Date;
  lastFed: Date;
  lastPlayed: Date;
  lastSlept: Date;
}

export interface User {
  id: string;
  username: string;
  pets: Pet[];
  createdAt: Date;
}

export interface CreatePetRequest {
  name: string;
  species: string;
}

export interface ActionRequest {
  petId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
