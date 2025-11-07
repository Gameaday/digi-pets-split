import { Pet } from './types';
import { v4 as uuidv4 } from 'uuid';

const SPECIES = ['Agumon', 'Gabumon', 'Patamon', 'Tailmon', 'Tentomon'];
const MAX_STAT = 100;
const MIN_STAT = 0;

export class PetService {
  private pets: Map<string, Pet> = new Map();

  createPet(name: string, species: string): Pet {
    if (!name || name.trim().length === 0) {
      throw new Error('Pet name is required');
    }

    if (!SPECIES.includes(species)) {
      throw new Error(`Invalid species. Must be one of: ${SPECIES.join(', ')}`);
    }

    const pet: Pet = {
      id: uuidv4(),
      name: name.trim(),
      species,
      level: 1,
      experience: 0,
      hunger: 50,
      happiness: 50,
      health: 100,
      energy: 100,
      age: 0,
      createdAt: new Date(),
      lastFed: new Date(),
      lastPlayed: new Date(),
      lastSlept: new Date(),
    };

    this.pets.set(pet.id, pet);
    return pet;
  }

  getPet(id: string): Pet | undefined {
    const pet = this.pets.get(id);
    if (pet) {
      this.updatePetStats(pet);
    }
    return pet;
  }

  getAllPets(): Pet[] {
    return Array.from(this.pets.values()).map(pet => {
      this.updatePetStats(pet);
      return pet;
    });
  }

  feedPet(id: string): Pet {
    const pet = this.getPet(id);
    if (!pet) {
      throw new Error('Pet not found');
    }

    const timeSinceLastFed = Date.now() - pet.lastFed.getTime();
    const cooldown = 5 * 60 * 1000; // 5 minutes

    if (timeSinceLastFed < cooldown) {
      throw new Error('Pet is not hungry yet');
    }

    pet.hunger = Math.min(MAX_STAT, pet.hunger + 30);
    pet.health = Math.min(MAX_STAT, pet.health + 5);
    pet.lastFed = new Date();
    pet.experience += 10;
    this.checkLevelUp(pet);

    return pet;
  }

  playWithPet(id: string): Pet {
    const pet = this.getPet(id);
    if (!pet) {
      throw new Error('Pet not found');
    }

    if (pet.energy < 20) {
      throw new Error('Pet is too tired to play');
    }

    const timeSinceLastPlayed = Date.now() - pet.lastPlayed.getTime();
    const cooldown = 3 * 60 * 1000; // 3 minutes

    if (timeSinceLastPlayed < cooldown) {
      throw new Error('Pet needs a break');
    }

    pet.happiness = Math.min(MAX_STAT, pet.happiness + 25);
    pet.energy = Math.max(MIN_STAT, pet.energy - 15);
    pet.hunger = Math.max(MIN_STAT, pet.hunger - 10);
    pet.lastPlayed = new Date();
    pet.experience += 15;
    this.checkLevelUp(pet);

    return pet;
  }

  restPet(id: string): Pet {
    const pet = this.getPet(id);
    if (!pet) {
      throw new Error('Pet not found');
    }

    const timeSinceLastSlept = Date.now() - pet.lastSlept.getTime();
    const cooldown = 10 * 60 * 1000; // 10 minutes

    if (timeSinceLastSlept < cooldown) {
      throw new Error('Pet is not tired yet');
    }

    pet.energy = Math.min(MAX_STAT, pet.energy + 40);
    pet.health = Math.min(MAX_STAT, pet.health + 10);
    pet.lastSlept = new Date();
    pet.experience += 5;
    this.checkLevelUp(pet);

    return pet;
  }

  deletePet(id: string): boolean {
    return this.pets.delete(id);
  }

  getAvailableSpecies(): string[] {
    return [...SPECIES];
  }

  private updatePetStats(pet: Pet): void {
    const now = Date.now();
    const hoursSinceLastFed = (now - pet.lastFed.getTime()) / (1000 * 60 * 60);
    const hoursSinceCreation = (now - pet.createdAt.getTime()) / (1000 * 60 * 60);

    // Decrease hunger over time
    pet.hunger = Math.max(MIN_STAT, pet.hunger - Math.floor(hoursSinceLastFed * 2));

    // Decrease happiness if hungry
    if (pet.hunger < 30) {
      pet.happiness = Math.max(MIN_STAT, pet.happiness - Math.floor(hoursSinceLastFed));
    }

    // Decrease health if very hungry
    if (pet.hunger < 20) {
      pet.health = Math.max(MIN_STAT, pet.health - Math.floor(hoursSinceLastFed * 0.5));
    }

    // Update age (in hours)
    pet.age = Math.floor(hoursSinceCreation);
  }

  private checkLevelUp(pet: Pet): void {
    const requiredExp = pet.level * 100;
    if (pet.experience >= requiredExp) {
      pet.level += 1;
      pet.experience = pet.experience - requiredExp;
      // Boost stats on level up
      pet.health = Math.min(MAX_STAT, pet.health + 10);
      pet.happiness = Math.min(MAX_STAT, pet.happiness + 10);
    }
  }
}
