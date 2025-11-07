import express, { Request, Response, NextFunction } from 'express';
import { PetService } from './petService';
import { AuthService } from './authService';
import { authenticateToken } from './authMiddleware';
import { CreatePetRequest, RegisterRequest, LoginRequest, ApiResponse } from './types';

const router = express.Router();
const petService = new PetService();
const authService = new AuthService();

// Middleware for request validation
const validateCreatePet = (req: Request, res: Response, next: NextFunction) => {
  const { name, species } = req.body as CreatePetRequest;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Pet name is required and must be a non-empty string'
    } as ApiResponse<never>);
  }

  if (!species || typeof species !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Species is required and must be a string'
    } as ApiResponse<never>);
  }

  next();
};

const validatePetId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Pet ID is required'
    } as ApiResponse<never>);
  }

  next();
};

// ============================================================================
// Authentication Routes
// ============================================================================

// Register a new user
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as RegisterRequest;
    const result = await authService.register(username, password);
    
    res.status(201).json({
      success: true,
      data: result
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    } as ApiResponse<never>);
  }
});

// Login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as LoginRequest;
    const result = await authService.login(username, password);
    
    res.json({
      success: true,
      data: result
    } as ApiResponse<typeof result>);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    } as ApiResponse<never>);
  }
});

// Get current user info
router.get('/auth/me', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = authService.getUserById(req.userId!);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<never>);
    }

    res.json({
      success: true,
      data: user
    } as ApiResponse<typeof user>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>);
  }
});

// ============================================================================
// Pet Routes (All require authentication)
// ============================================================================

// Get all available species (public)
router.get('/species', (_req: Request, res: Response) => {
  try {
    const species = petService.getAvailableSpecies();
    res.json({
      success: true,
      data: species
    } as ApiResponse<string[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>);
  }
});

// Create a new pet (requires authentication)
router.post('/pets', authenticateToken, validateCreatePet, (req: Request, res: Response) => {
  try {
    const { name, species } = req.body as CreatePetRequest;
    const pet = petService.createPet(req.userId!, name, species);
    
    res.status(201).json({
      success: true,
      data: pet
    } as ApiResponse<typeof pet>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>);
  }
});

// Get all pets for current user
router.get('/pets', authenticateToken, (_req: Request, res: Response) => {
  try {
    const pets = petService.getAllPets(_req.userId!);
    res.json({
      success: true,
      data: pets
    } as ApiResponse<typeof pets>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>);
  }
});

// Get a specific pet
router.get('/pets/:id', authenticateToken, validatePetId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pet = petService.getPet(req.userId!, id);
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      } as ApiResponse<never>);
    }

    res.json({
      success: true,
      data: pet
    } as ApiResponse<typeof pet>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>);
  }
});

// Feed a pet
router.post('/pets/:id/feed', authenticateToken, validatePetId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pet = petService.feedPet(req.userId!, id);
    
    res.json({
      success: true,
      data: pet
    } as ApiResponse<typeof pet>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>);
  }
});

// Play with a pet
router.post('/pets/:id/play', authenticateToken, validatePetId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pet = petService.playWithPet(req.userId!, id);
    
    res.json({
      success: true,
      data: pet
    } as ApiResponse<typeof pet>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>);
  }
});

// Rest a pet
router.post('/pets/:id/rest', authenticateToken, validatePetId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pet = petService.restPet(req.userId!, id);
    
    res.json({
      success: true,
      data: pet
    } as ApiResponse<typeof pet>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>);
  }
});

// Delete a pet
router.delete('/pets/:id', authenticateToken, validatePetId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = petService.deletePet(req.userId!, id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      } as ApiResponse<never>);
    }

    res.json({
      success: true,
      data: { message: 'Pet deleted successfully' }
    } as ApiResponse<{ message: string }>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>);
  }
});

export default router;
