import { PetService } from './petService';

describe('PetService', () => {
  let petService: PetService;

  beforeEach(() => {
    petService = new PetService();
  });

  describe('createPet', () => {
    it('should create a pet with valid inputs', () => {
      const pet = petService.createPet('Agumon Jr.', 'Agumon');
      
      expect(pet).toBeDefined();
      expect(pet.name).toBe('Agumon Jr.');
      expect(pet.species).toBe('Agumon');
      expect(pet.level).toBe(1);
      expect(pet.health).toBe(100);
    });

    it('should throw error for empty name', () => {
      expect(() => petService.createPet('', 'Agumon')).toThrow('Pet name is required');
    });

    it('should throw error for invalid species', () => {
      expect(() => petService.createPet('Test', 'InvalidSpecies')).toThrow('Invalid species');
    });

    it('should trim pet name', () => {
      const pet = petService.createPet('  Spaced Name  ', 'Agumon');
      expect(pet.name).toBe('Spaced Name');
    });
  });

  describe('getPet', () => {
    it('should return a pet by id', () => {
      const created = petService.createPet('Test', 'Agumon');
      const retrieved = petService.getPet(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return undefined for non-existent id', () => {
      const pet = petService.getPet('non-existent-id');
      expect(pet).toBeUndefined();
    });
  });

  describe('getAllPets', () => {
    it('should return empty array when no pets exist', () => {
      const pets = petService.getAllPets();
      expect(pets).toEqual([]);
    });

    it('should return all pets', () => {
      petService.createPet('Pet 1', 'Agumon');
      petService.createPet('Pet 2', 'Gabumon');
      
      const pets = petService.getAllPets();
      expect(pets).toHaveLength(2);
    });
  });

  describe('feedPet', () => {
    it('should increase hunger when feeding', () => {
      const pet = petService.createPet('Test', 'Agumon');
      const initialHunger = pet.hunger;
      
      // Manually set lastFed to allow feeding
      const petObj = petService.getPet(pet.id);
      if (petObj) {
        petObj.lastFed = new Date(Date.now() - 6 * 60 * 1000); // 6 minutes ago
      }
      
      const fed = petService.feedPet(pet.id);
      expect(fed.hunger).toBeGreaterThan(initialHunger);
    });

    it('should throw error for non-existent pet', () => {
      expect(() => petService.feedPet('non-existent-id')).toThrow('Pet not found');
    });
  });

  describe('playWithPet', () => {
    it('should increase happiness when playing', () => {
      const pet = petService.createPet('Test', 'Agumon');
      const initialHappiness = pet.happiness;
      
      // Manually set lastPlayed to allow playing
      const petObj = petService.getPet(pet.id);
      if (petObj) {
        petObj.lastPlayed = new Date(Date.now() - 4 * 60 * 1000); // 4 minutes ago
      }
      
      const played = petService.playWithPet(pet.id);
      expect(played.happiness).toBeGreaterThan(initialHappiness);
    });

    it('should decrease energy when playing', () => {
      const pet = petService.createPet('Test', 'Agumon');
      
      const petObj = petService.getPet(pet.id);
      if (petObj) {
        petObj.lastPlayed = new Date(Date.now() - 4 * 60 * 1000);
      }
      
      const played = petService.playWithPet(pet.id);
      expect(played.energy).toBeLessThan(100);
    });

    it('should throw error when pet is too tired', () => {
      const pet = petService.createPet('Test', 'Agumon');
      
      const petObj = petService.getPet(pet.id);
      if (petObj) {
        petObj.energy = 10;
        petObj.lastPlayed = new Date(Date.now() - 4 * 60 * 1000);
      }
      
      expect(() => petService.playWithPet(pet.id)).toThrow('Pet is too tired to play');
    });
  });

  describe('restPet', () => {
    it('should increase energy when resting', () => {
      const pet = petService.createPet('Test', 'Agumon');
      
      const petObj = petService.getPet(pet.id);
      if (petObj) {
        petObj.energy = 50;
        petObj.lastSlept = new Date(Date.now() - 11 * 60 * 1000); // 11 minutes ago
      }
      
      const rested = petService.restPet(pet.id);
      expect(rested.energy).toBeGreaterThan(50);
    });
  });

  describe('deletePet', () => {
    it('should delete existing pet', () => {
      const pet = petService.createPet('Test', 'Agumon');
      const deleted = petService.deletePet(pet.id);
      
      expect(deleted).toBe(true);
      expect(petService.getPet(pet.id)).toBeUndefined();
    });

    it('should return false for non-existent pet', () => {
      const deleted = petService.deletePet('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('getAvailableSpecies', () => {
    it('should return array of species', () => {
      const species = petService.getAvailableSpecies();
      
      expect(Array.isArray(species)).toBe(true);
      expect(species.length).toBeGreaterThan(0);
      expect(species).toContain('Agumon');
    });
  });
});
