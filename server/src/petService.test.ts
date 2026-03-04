// Use in-memory SQLite for tests – must be set before any module imports that call getDB()
process.env.DB_PATH = ':memory:';

import { PetService } from './petService';
import { getDB, closeDB } from './database';

const TEST_USER_ID = 'test-user-id';
const OTHER_USER_ID = 'other-user-id';

describe('PetService', () => {
  let petService: PetService;

  beforeEach(() => {
    // Each test gets a fresh in-memory database
    closeDB();
    petService = new PetService();

    // Insert test users to satisfy foreign key constraints
    const db = getDB().getDatabase();
    const now = new Date().toISOString();
    db.prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(TEST_USER_ID, 'testuser', 'hash', now);
    db.prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(OTHER_USER_ID, 'otheruser', 'hash', now);
  });

  afterAll(() => {
    closeDB();
  });

  // Helper to bypass a cooldown by back-dating a timestamp column
  function backdate(petId: string, column: string, msAgo: number) {
    const db = getDB().getDatabase();
    const ts = new Date(Date.now() - msAgo).toISOString();
    db.prepare(`UPDATE pets SET ${column} = ? WHERE id = ?`).run(ts, petId);
  }

  describe('createPet', () => {
    it('should create a pet with valid inputs', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Agumon Jr.', 'Agumon');

      expect(pet).toBeDefined();
      expect(pet.name).toBe('Agumon Jr.');
      expect(pet.species).toBe('Agumon');
      expect(pet.level).toBe(1);
      expect(pet.health).toBe(100);
      expect(pet.gameMode).toBe('casual');
      expect(pet.stage).toBe('baby');
    });

    it('should create a pet in realistic mode', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Gabu', 'Gabumon', 'realistic');
      expect(pet.gameMode).toBe('realistic');
    });

    it('should throw for an empty name', () => {
      expect(() => petService.createPet(TEST_USER_ID, '', 'Agumon')).toThrow('Pet name is required');
    });

    it('should throw for a name that is too long', () => {
      expect(() =>
        petService.createPet(TEST_USER_ID, 'A'.repeat(25), 'Agumon')
      ).toThrow('at most 24 characters');
    });

    it('should throw for an invalid species', () => {
      expect(() => petService.createPet(TEST_USER_ID, 'Test', 'InvalidSpecies')).toThrow('Invalid species');
    });

    it('should trim the pet name', () => {
      const pet = petService.createPet(TEST_USER_ID, '  Spaced Name  ', 'Agumon');
      expect(pet.name).toBe('Spaced Name');
    });
  });

  describe('getPet', () => {
    it('should return a pet by id for the correct user', () => {
      const created = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      const retrieved = petService.getPet(TEST_USER_ID, created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return undefined for a non-existent id', () => {
      const pet = petService.getPet(TEST_USER_ID, 'non-existent-id');
      expect(pet).toBeUndefined();
    });

    it('should not return another user\'s pet', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      const retrieved = petService.getPet(OTHER_USER_ID, pet.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAllPets', () => {
    it('should return an empty array when no pets exist', () => {
      expect(petService.getAllPets(TEST_USER_ID)).toEqual([]);
    });

    it('should return all pets for the user', () => {
      petService.createPet(TEST_USER_ID, 'Pet 1', 'Agumon');
      petService.createPet(TEST_USER_ID, 'Pet 2', 'Gabumon');

      const pets = petService.getAllPets(TEST_USER_ID);
      expect(pets).toHaveLength(2);
    });

    it('should only return pets belonging to the requesting user', () => {
      petService.createPet(TEST_USER_ID, 'My Pet', 'Agumon');
      petService.createPet(OTHER_USER_ID, 'Their Pet', 'Gabumon');

      const pets = petService.getAllPets(TEST_USER_ID);
      expect(pets).toHaveLength(1);
      expect(pets[0].name).toBe('My Pet');
    });
  });

  describe('feedPet', () => {
    it('should increase hunger when fed', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      const initialHunger = pet.hunger;

      backdate(pet.id, 'last_fed', 3 * 60 * 1000); // 3 minutes ago

      const fed = petService.feedPet(TEST_USER_ID, pet.id);
      expect(fed.hunger).toBeGreaterThan(initialHunger);
    });

    it('should increase health when fed', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      backdate(pet.id, 'last_fed', 3 * 60 * 1000);

      const fed = petService.feedPet(TEST_USER_ID, pet.id);
      expect(fed.health).toBeGreaterThanOrEqual(pet.health);
    });

    it('should throw when the cooldown has not elapsed', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      expect(() => petService.feedPet(TEST_USER_ID, pet.id)).toThrow('not hungry yet');
    });

    it('should throw for a non-existent pet', () => {
      expect(() => petService.feedPet(TEST_USER_ID, 'non-existent-id')).toThrow('Pet not found');
    });

    it('should throw when pet is an egg', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      getDB().getDatabase().prepare("UPDATE pets SET stage = 'egg' WHERE id = ?").run(pet.id);
      backdate(pet.id, 'last_fed', 3 * 60 * 1000);
      expect(() => petService.feedPet(TEST_USER_ID, pet.id)).toThrow('egg');
    });
  });

  describe('playWithPet', () => {
    it('should increase happiness when playing', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      const initialHappiness = pet.happiness;

      backdate(pet.id, 'last_played', 3 * 60 * 1000);

      const played = petService.playWithPet(TEST_USER_ID, pet.id);
      expect(played.happiness).toBeGreaterThan(initialHappiness);
    });

    it('should decrease energy when playing', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      backdate(pet.id, 'last_played', 3 * 60 * 1000);

      const played = petService.playWithPet(TEST_USER_ID, pet.id);
      expect(played.energy).toBeLessThan(100);
    });

    it('should throw when the cooldown has not elapsed', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      expect(() => petService.playWithPet(TEST_USER_ID, pet.id)).toThrow('needs a break');
    });

    it('should throw when pet has too little energy', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      backdate(pet.id, 'last_played', 3 * 60 * 1000);
      getDB().getDatabase().prepare('UPDATE pets SET energy = 10 WHERE id = ?').run(pet.id);

      expect(() => petService.playWithPet(TEST_USER_ID, pet.id)).toThrow('too tired');
    });

    it('should throw when pet is an egg', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      getDB().getDatabase().prepare("UPDATE pets SET stage = 'egg' WHERE id = ?").run(pet.id);
      backdate(pet.id, 'last_played', 3 * 60 * 1000);
      expect(() => petService.playWithPet(TEST_USER_ID, pet.id)).toThrow('egg');
    });
  });

  describe('restPet', () => {
    it('should increase energy when resting', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      getDB().getDatabase().prepare('UPDATE pets SET energy = 30 WHERE id = ?').run(pet.id);
      backdate(pet.id, 'last_slept', 6 * 60 * 1000); // 6 minutes ago

      const rested = petService.restPet(TEST_USER_ID, pet.id);
      expect(rested.energy).toBeGreaterThan(30);
    });

    it('should throw when cooldown has not elapsed', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      expect(() => petService.restPet(TEST_USER_ID, pet.id)).toThrow('not tired yet');
    });

    it('should throw when pet is an egg', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      getDB().getDatabase().prepare("UPDATE pets SET stage = 'egg' WHERE id = ?").run(pet.id);
      backdate(pet.id, 'last_slept', 6 * 60 * 1000);
      expect(() => petService.restPet(TEST_USER_ID, pet.id)).toThrow('egg');
    });
  });

  describe('deletePet', () => {
    it('should delete an existing pet', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      const deleted = petService.deletePet(TEST_USER_ID, pet.id);

      expect(deleted).toBe(true);
      expect(petService.getPet(TEST_USER_ID, pet.id)).toBeUndefined();
    });

    it('should return false for a non-existent pet', () => {
      expect(petService.deletePet(TEST_USER_ID, 'non-existent-id')).toBe(false);
    });

    it('should not allow deleting another user\'s pet', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      const deleted = petService.deletePet(OTHER_USER_ID, pet.id);
      expect(deleted).toBe(false);
    });
  });

  describe('hatchEgg', () => {
    it('should hatch an egg and reset stats', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      getDB().getDatabase().prepare("UPDATE pets SET stage = 'egg', hunger = 0, happiness = 0, health = 0 WHERE id = ?").run(pet.id);

      const hatched = petService.hatchEgg(TEST_USER_ID, pet.id);
      expect(hatched.stage).toBe('baby');
      expect(hatched.hunger).toBe(80);
      expect(hatched.happiness).toBe(80);
      expect(hatched.health).toBe(100);
    });

    it('should throw when pet is not an egg', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      expect(() => petService.hatchEgg(TEST_USER_ID, pet.id)).toThrow('not an egg');
    });
  });

  describe('getAvailableSpecies', () => {
    it('should return a non-empty array that includes Agumon', () => {
      const species = petService.getAvailableSpecies();
      expect(Array.isArray(species)).toBe(true);
      expect(species.length).toBeGreaterThan(0);
      expect(species).toContain('Agumon');
    });
  });

  describe('stat degradation (double-counting fix)', () => {
    it('should not double-count degradation on repeated reads', () => {
      const pet = petService.createPet(TEST_USER_ID, 'Test', 'Agumon');
      // Simulate 2 hours passing by back-dating last_stat_update
      const db = getDB().getDatabase();
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      db.prepare('UPDATE pets SET last_stat_update = ?, last_fed = ?, last_played = ?, last_slept = ? WHERE id = ?')
        .run(twoHoursAgo, twoHoursAgo, twoHoursAgo, twoHoursAgo, pet.id);

      const first = petService.getPet(TEST_USER_ID, pet.id)!;
      const second = petService.getPet(TEST_USER_ID, pet.id)!;

      // After the first read, last_stat_update is reset to now, so the second
      // read should apply essentially zero additional degradation.
      expect(second.hunger).toBeGreaterThanOrEqual(first.hunger - 1);
    });
  });
});

