import express, { Request, Response, NextFunction } from 'express';
import { PetService } from './petService';
import { CreatePetRequest, ActionRequest, ApiResponse } from './types';

const router = express.Router();
const petService = new PetService();

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

// Get all available species
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

// Create a new pet
router.post('/pets', validateCreatePet, (req: Request, res: Response) => {
  try {
    const { name, species } = req.body as CreatePetRequest;
    const pet = petService.createPet(name, species);
    
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

// Get all pets
router.get('/pets', (_req: Request, res: Response) => {
  try {
    const pets = petService.getAllPets();
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
router.get('/pets/:id', validatePetId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pet = petService.getPet(id);
    
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
router.post('/pets/:id/feed', validatePetId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pet = petService.feedPet(id);
    
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
router.post('/pets/:id/play', validatePetId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pet = petService.playWithPet(id);
    
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
router.post('/pets/:id/rest', validatePetId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pet = petService.restPet(id);
    
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
router.delete('/pets/:id', validatePetId, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = petService.deletePet(id);
    
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
