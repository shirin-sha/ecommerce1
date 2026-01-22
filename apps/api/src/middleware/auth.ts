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
