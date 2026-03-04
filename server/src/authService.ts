import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'digi-pets-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface User {
  id: string;
  username: string;
  createdAt: Date;
}

export interface AuthResult {
  user: User;
  token: string;
}

export class AuthService {
  async register(username: string, password: string): Promise<AuthResult> {
    if (!username || username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const db = getDB().getDatabase();

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, username.trim(), passwordHash, createdAt);

    const user: User = {
      id: userId,
      username: username.trim(),
      createdAt: new Date(createdAt),
    };

    const token = this.generateToken(userId);

    return { user, token };
  }

  async login(username: string, password: string): Promise<AuthResult> {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const db = getDB().getDatabase();

    const row = db.prepare(`
      SELECT id, username, password_hash, created_at
      FROM users
      WHERE username = ?
    `).get(username) as any;

    if (!row) {
      throw new Error('Invalid username or password');
    }

    const isValid = await bcrypt.compare(password, row.password_hash);
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    const user: User = {
      id: row.id,
      username: row.username,
      createdAt: new Date(row.created_at),
    };

    const token = this.generateToken(user.id);

    return { user, token };
  }

  verifyToken(token: string): string {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  getUserById(userId: string): User | null {
    const db = getDB().getDatabase();

    const row = db.prepare(`
      SELECT id, username, created_at
      FROM users
      WHERE id = ?
    `).get(userId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      username: row.username,
      createdAt: new Date(row.created_at),
    };
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  }
}
