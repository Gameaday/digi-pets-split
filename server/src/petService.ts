import { Pet } from './types';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from './database';

const SPECIES = ['Agumon', 'Gabumon', 'Patamon', 'Tailmon', 'Tentomon'];
const MAX_STAT = 100;
const MIN_STAT = 0;
const MAX_NAME_LENGTH = 24;

export class PetService {
  createPet(userId: string, name: string, species: string, gameMode: 'casual' | 'realistic' = 'casual'): Pet {
    if (!name || name.trim().length === 0) {
      throw new Error('Pet name is required');
    }

    if (name.trim().length > MAX_NAME_LENGTH) {
      throw new Error(`Pet name must be at most ${MAX_NAME_LENGTH} characters`);
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
      hunger: 80,
      happiness: 80,
      health: 100,
      energy: 100,
      age: 0,
      gameMode,
      stage: 'baby',
      createdAt: new Date(now),
      lastFed: new Date(now),
      lastPlayed: new Date(now),
      lastSlept: new Date(now),
      lastStatUpdate: new Date(now),
    };

    db.prepare(`
      INSERT INTO pets (
        id, user_id, name, species, level, experience,
        hunger, happiness, health, energy, age, game_mode, stage,
        created_at, last_fed, last_played, last_slept, last_stat_update
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pet.id, pet.userId, pet.name, pet.species, pet.level, pet.experience,
      pet.hunger, pet.happiness, pet.health, pet.energy, pet.age, pet.gameMode, pet.stage,
      now, now, now, now, now
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

    if (pet.stage === 'egg') {
      throw new Error('Your pet is an egg – hatch it first!');
    }

    const timeSinceLastFed = Date.now() - pet.lastFed.getTime();
    const cooldown = 2 * 60 * 1000; // 2 minutes

    if (timeSinceLastFed < cooldown) {
      const remaining = Math.ceil((cooldown - timeSinceLastFed) / 1000);
      throw new Error(`Pet is not hungry yet. Try again in ${remaining}s`);
    }

    pet.hunger = Math.min(MAX_STAT, pet.hunger + 40);
    pet.health = Math.min(MAX_STAT, pet.health + 10);
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

    if (pet.stage === 'egg') {
      throw new Error('Your pet is an egg – hatch it first!');
    }

    if (pet.energy < 15) {
      throw new Error('Pet is too tired to play');
    }

    const timeSinceLastPlayed = Date.now() - pet.lastPlayed.getTime();
    const cooldown = 2 * 60 * 1000; // 2 minutes

    if (timeSinceLastPlayed < cooldown) {
      const remaining = Math.ceil((cooldown - timeSinceLastPlayed) / 1000);
      throw new Error(`Pet needs a break. Try again in ${remaining}s`);
    }

    pet.happiness = Math.min(MAX_STAT, pet.happiness + 30);
    pet.energy = Math.max(MIN_STAT, pet.energy - 10);
    pet.hunger = Math.max(MIN_STAT, pet.hunger - 5);
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

    if (pet.stage === 'egg') {
      throw new Error('Your pet is an egg – hatch it first!');
    }

    const timeSinceLastSlept = Date.now() - pet.lastSlept.getTime();
    const cooldown = 5 * 60 * 1000; // 5 minutes

    if (timeSinceLastSlept < cooldown) {
      const remaining = Math.ceil((cooldown - timeSinceLastSlept) / 1000);
      throw new Error(`Pet is not tired yet. Try again in ${remaining}s`);
    }

    pet.energy = Math.min(MAX_STAT, pet.energy + 50);
    pet.health = Math.min(MAX_STAT, pet.health + 15);
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

  hatchEgg(userId: string, id: string): Pet {
    const pet = this.getPet(userId, id);
    if (!pet) {
      throw new Error('Pet not found');
    }

    if (pet.stage !== 'egg') {
      throw new Error('Pet is not an egg');
    }

    const now = new Date();
    pet.stage = 'baby';
    pet.hunger = 80;
    pet.happiness = 80;
    pet.health = 100;
    pet.energy = 100;
    pet.lastFed = now;
    pet.lastPlayed = now;
    pet.lastSlept = now;
    pet.lastStatUpdate = now;
    this.savePet(pet);

    return pet;
  }

  private rowToPet(row: any): Pet {
    const fallback = new Date().toISOString();
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
      gameMode: row.game_mode || 'casual',
      stage: row.stage || 'baby',
      createdAt: new Date(row.created_at),
      lastFed: new Date(row.last_fed),
      lastPlayed: new Date(row.last_played),
      lastSlept: new Date(row.last_slept),
      lastStatUpdate: new Date(row.last_stat_update || row.created_at || fallback),
    };
  }

  private savePet(pet: Pet): void {
    const db = getDB().getDatabase();
    const now = new Date().toISOString();
    
    db.prepare(`
      UPDATE pets SET
        level = ?, experience = ?, hunger = ?, happiness = ?,
        health = ?, energy = ?, age = ?, stage = ?,
        last_fed = ?, last_played = ?, last_slept = ?, last_stat_update = ?
      WHERE id = ?
    `).run(
      pet.level, pet.experience, pet.hunger, pet.happiness,
      pet.health, pet.energy, pet.age, pet.stage,
      pet.lastFed.toISOString(), pet.lastPlayed.toISOString(),
      pet.lastSlept.toISOString(), now,
      pet.id
    );

    // Keep lastStatUpdate in sync with what was persisted
    pet.lastStatUpdate = new Date(now);
  }

  private updatePetStats(pet: Pet): void {
    const now = Date.now();
    // Use delta since last stat update to avoid double-counting on repeated reads
    const hoursElapsed = (now - pet.lastStatUpdate.getTime()) / (1000 * 60 * 60);
    const hoursSinceLastFed = (now - pet.lastFed.getTime()) / (1000 * 60 * 60);
    const hoursSinceCreation = (now - pet.createdAt.getTime()) / (1000 * 60 * 60);

    // Eggs don't degrade
    if (pet.stage === 'egg') {
      return;
    }

    if (pet.gameMode === 'casual') {
      // Casual: very forgiving, pets never regress to egg
      pet.hunger = Math.max(MIN_STAT, pet.hunger - Math.floor(hoursElapsed * 0.5));
      if (pet.hunger < 20) {
        pet.happiness = Math.max(MIN_STAT, pet.happiness - Math.floor(hoursElapsed * 0.25));
      }
      // Health floor of 20 – pets can never die in casual mode
      if (pet.hunger < 10 && pet.happiness < 20) {
        pet.health = Math.max(20, pet.health - Math.floor(hoursElapsed * 0.1));
      }
    } else {
      // Realistic: faster degradation, egg transformation after 3+ days of neglect
      pet.hunger = Math.max(MIN_STAT, pet.hunger - Math.floor(hoursElapsed * 1));
      if (pet.hunger < 30) {
        pet.happiness = Math.max(MIN_STAT, pet.happiness - Math.floor(hoursElapsed * 0.5));
      }
      if (pet.hunger < 20) {
        pet.health = Math.max(MIN_STAT, pet.health - Math.floor(hoursElapsed * 0.3));
      }

      // Egg transformation: only after 3 days of neglect AND critically low stats
      const daysNeglected = hoursSinceLastFed / 24;
      if (daysNeglected > 3 && pet.hunger < 10 && pet.happiness < 10 && pet.health < 30) {
        pet.stage = 'egg';
        // Stats are preserved frozen in egg; they reset on hatch
      }
    }

    // Update age (in hours since creation)
    pet.age = Math.floor(hoursSinceCreation);

    // Auto-evolve from baby to adult at level 5
    if (pet.stage === 'baby' && pet.level >= 5) {
      pet.stage = 'adult';
    }
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
