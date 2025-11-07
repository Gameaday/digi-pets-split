import { Request, Response, NextFunction } from 'express';
import { AuthService } from './authService';
import { ApiResponse } from './types';

const authService = new AuthService();

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please login first.'
    } as ApiResponse<never>);
  }

  try {
    const userId = authService.verifyToken(token);
    req.userId = userId;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token. Please login again.'
    } as ApiResponse<never>);
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const userId = authService.verifyToken(token);
      req.userId = userId;
    } catch (error) {
      // Token invalid but continue anyway
    }
  }

  next();
}
