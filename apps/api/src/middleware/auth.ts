import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler'
import { UserRole } from '@ecommerce/shared'
import { User } from '../models/User'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: UserRole
  }
}

// Optional auth middleware - sets req.user if token is present, but doesn't fail if missing
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without setting req.user
    return next()
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return next()
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
      role: UserRole
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.id)
    if (user && user.isActive) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      }
      // Debug logging (remove in production)
      console.log('OptionalAuth: User authenticated', { id: req.user.id, email: req.user.email, role: req.user.role })
    } else {
      console.log('OptionalAuth: User not found or inactive', { userId: decoded.id })
    }
    // If user not found or inactive, just continue without setting req.user
  } catch (error) {
    // Invalid or expired token - just continue without setting req.user
    // This allows public access even with invalid tokens
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      console.log('OptionalAuth: Token error (non-fatal):', error.message)
    }
  }

  next()
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401)
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
      role: UserRole
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.id)
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401)
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401))
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401))
    } else {
      next(error)
    }
  }
}

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403))
    }

    next()
  }
}

export const requireAdmin = requireRole(['admin'])
export const requireShopManager = requireRole(['admin', 'shop_manager'])
export const requireStaff = requireRole(['admin', 'shop_manager', 'staff'])
