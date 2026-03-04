export interface Pet {
  id: string;
  userId: string;
  name: string;
  species: string;
  level: number;
  experience: number;
  hunger: number;
  happiness: number;
  health: number;
  energy: number;
  age: number;
  gameMode: 'casual' | 'realistic';
  stage: 'egg' | 'baby' | 'adult';
  createdAt: string;
  lastFed: string;
  lastPlayed: string;
  lastSlept: string;
  lastStatUpdate: string;
}

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreatePetRequest {
  name: string;
  species: string;
  gameMode?: 'casual' | 'realistic';
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}
