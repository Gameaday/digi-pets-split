import { Pet } from './types';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from './database';

const SPECIES = ['Agumon', 'Gabumon', 'Patamon', 'Tailmon', 'Tentomon'];
const MAX_STAT = 100;
const MIN_STAT = 0;

export class PetService {
  createPet(userId: string, name: string, species: string): Pet {
    if (!name || name.trim().length === 0) {
      throw new Error('Pet name is required');
    }

    if (!SPECIES.includes(species)) {
      throw new Error(`Invalid species. Must be one of: ${SPECIES.join(', ')}`);
    }

    const db = getDB().getDatabase();
    const petId = uuidv4();
    const now = new Date().toISOString();

    const pet: Pet = {
      id: petId,
      userId,
      name: name.trim(),
      species,
      level: 1,
      experience: 0,
      hunger: 50,
      happiness: 50,
      health: 100,
      energy: 100,
      age: 0,
      createdAt: new Date(now),
      lastFed: new Date(now),
      lastPlayed: new Date(now),
      lastSlept: new Date(now),
    };

    db.prepare(`
      INSERT INTO pets (
        id, user_id, name, species, level, experience,
        hunger, happiness, health, energy, age,
        created_at, last_fed, last_played, last_slept
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pet.id, pet.userId, pet.name, pet.species, pet.level, pet.experience,
      pet.hunger, pet.happiness, pet.health, pet.energy, pet.age,
      now, now, now, now
    );

    return pet;
  }

  getPet(userId: string, id: string): Pet | undefined {
    const db = getDB().getDatabase();
    
    const row = db.prepare(`
      SELECT * FROM pets WHERE id = ? AND user_id = ?
    `).get(id, userId) as any;

    if (!row) {
      return undefined;
    }

    const pet = this.rowToPet(row);
    this.updatePetStats(pet);
    this.savePet(pet);
    return pet;
  }

  getAllPets(userId: string): Pet[] {
    const db = getDB().getDatabase();
    
    const rows = db.prepare(`
      SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as any[];

    return rows.map(row => {
      const pet = this.rowToPet(row);
      this.updatePetStats(pet);
      this.savePet(pet);
      return pet;
    });
  }

  feedPet(userId: string, id: string): Pet {
    const pet = this.getPet(userId, id);
    if (!pet) {
      throw new Error('Pet not found');
    }

    const timeSinceLastFed = Date.now() - pet.lastFed.getTime();
    const cooldown = 2 * 60 * 1000; // 2 minutes (reduced from 5)

    if (timeSinceLastFed < cooldown) {
      throw new Error('Pet is not hungry yet');
    }

    pet.hunger = Math.min(MAX_STAT, pet.hunger + 40); // Increased from 30
    pet.health = Math.min(MAX_STAT, pet.health + 10); // Increased from 5
    pet.lastFed = new Date();
    pet.experience += 10;
    this.checkLevelUp(pet);
    this.savePet(pet);

    return pet;
  }

  playWithPet(userId: string, id: string): Pet {
    const pet = this.getPet(userId, id);
    if (!pet) {
      throw new Error('Pet not found');
    }

    if (pet.energy < 15) { // Reduced from 20 to allow playing at lower energy
      throw new Error('Pet is too tired to play');
    }

    const timeSinceLastPlayed = Date.now() - pet.lastPlayed.getTime();
    const cooldown = 2 * 60 * 1000; // 2 minutes (reduced from 3)

    if (timeSinceLastPlayed < cooldown) {
      throw new Error('Pet needs a break');
    }

    pet.happiness = Math.min(MAX_STAT, pet.happiness + 30); // Increased from 25
    pet.energy = Math.max(MIN_STAT, pet.energy - 10); // Reduced cost from 15
    pet.hunger = Math.max(MIN_STAT, pet.hunger - 5); // Reduced cost from 10
    pet.lastPlayed = new Date();
    pet.experience += 15;
    this.checkLevelUp(pet);
    this.savePet(pet);

    return pet;
  }

  restPet(userId: string, id: string): Pet {
    const pet = this.getPet(userId, id);
    if (!pet) {
      throw new Error('Pet not found');
    }

    const timeSinceLastSlept = Date.now() - pet.lastSlept.getTime();
    const cooldown = 5 * 60 * 1000; // 5 minutes (reduced from 10)

    if (timeSinceLastSlept < cooldown) {
      throw new Error('Pet is not tired yet');
    }

    pet.energy = Math.min(MAX_STAT, pet.energy + 50); // Increased from 40
    pet.health = Math.min(MAX_STAT, pet.health + 15); // Increased from 10
    pet.lastSlept = new Date();
    pet.experience += 5;
    this.checkLevelUp(pet);
    this.savePet(pet);

    return pet;
  }

  deletePet(userId: string, id: string): boolean {
    const db = getDB().getDatabase();
    
    const result = db.prepare(`
      DELETE FROM pets WHERE id = ? AND user_id = ?
    `).run(id, userId);

    return result.changes > 0;
  }

  getAvailableSpecies(): string[] {
    return [...SPECIES];
  }

  private rowToPet(row: any): Pet {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      species: row.species,
      level: row.level,
      experience: row.experience,
      hunger: row.hunger,
      happiness: row.happiness,
      health: row.health,
      energy: row.energy,
      age: row.age,
      createdAt: new Date(row.created_at),
      lastFed: new Date(row.last_fed),
      lastPlayed: new Date(row.last_played),
      lastSlept: new Date(row.last_slept),
    };
  }

  private savePet(pet: Pet): void {
    const db = getDB().getDatabase();
    
    db.prepare(`
      UPDATE pets SET
        level = ?, experience = ?, hunger = ?, happiness = ?,
        health = ?, energy = ?, age = ?,
        last_fed = ?, last_played = ?, last_slept = ?
      WHERE id = ?
    `).run(
      pet.level, pet.experience, pet.hunger, pet.happiness,
      pet.health, pet.energy, pet.age,
      pet.lastFed.toISOString(), pet.lastPlayed.toISOString(), pet.lastSlept.toISOString(),
      pet.id
    );
  }

  private updatePetStats(pet: Pet): void {
    const now = Date.now();
    const hoursSinceLastFed = (now - pet.lastFed.getTime()) / (1000 * 60 * 60);
    const hoursSinceCreation = (now - pet.createdAt.getTime()) / (1000 * 60 * 60);

    // Decrease hunger over time - much slower rate (0.5 per hour = 12 per day)
    // This means pets can go 4+ days without feeding before hunger reaches critical levels
    pet.hunger = Math.max(MIN_STAT, pet.hunger - Math.floor(hoursSinceLastFed * 0.5));

    // Decrease happiness if hungry - but only when very hungry
    if (pet.hunger < 20) {
      pet.happiness = Math.max(MIN_STAT, pet.happiness - Math.floor(hoursSinceLastFed * 0.25));
    }

    // Health only decreases when pet is extremely hungry AND unhappy
    // This prevents death from neglect
    if (pet.hunger < 10 && pet.happiness < 20) {
      pet.health = Math.max(20, pet.health - Math.floor(hoursSinceLastFed * 0.1));
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
