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
  createdAt: Date;
  lastFed: Date;
  lastPlayed: Date;
  lastSlept: Date;
}

export interface User {
  id: string;
  username: string;
  createdAt: Date;
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

export interface ActionRequest {
  petId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
