import { Response } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { User } from '../models/User'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../config/constants'

// Generate JWT access token
const generateAccessToken = (userId: string, email: string, role: string) => {
  return jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET!, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  })
}

// Generate JWT refresh token
const generateRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  })
}

// Set refresh token cookie
const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new customer
 * @access  Public
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, name, password, phone } = req.body

  // Check if user exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new AppError('Email already registered', 409)
  }

  // Create user
  const user = await User.create({
    email,
    name,
    passwordHash: password, // Will be hashed by pre-save hook
    phone,
    role: 'customer',
  })

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString(), user.email, user.role)
  const refreshToken = generateRefreshToken(user._id.toString())

  // Save refresh token to user
  user.refreshTokens = [refreshToken]
  await user.save()

  // Set refresh token cookie
  setRefreshTokenCookie(res, refreshToken)

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    },
    message: 'Registration successful',
  })
})

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user (customer or admin)
 * @access  Public
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body

  // Find user with password field
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokens')

  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401)
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password)
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401)
  }

  // Update last login
  user.lastLoginAt = new Date()

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString(), user.email, user.role)
  const refreshToken = generateRefreshToken(user._id.toString())

  // Add refresh token to user (limit to 5 active tokens)
  user.refreshTokens = [...(user.refreshTokens || []), refreshToken].slice(-5)
  await user.save()

  // Set refresh token cookie
  setRefreshTokenCookie(res, refreshToken)

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    },
    message: 'Login successful',
  })
})

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.cookies.refreshToken

  if (refreshToken && req.user) {
    // Remove refresh token from user
    const user = await User.findById(req.user.id).select('+refreshTokens')
    if (user) {
      user.refreshTokens = (user.refreshTokens || []).filter((token) => token !== refreshToken)
      await user.save()
    }
  }

  // Clear cookie
  res.clearCookie('refreshToken')

  res.json({
    success: true,
    message: 'Logout successful',
  })
})

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.cookies.refreshToken

  if (!refreshToken) {
    throw new AppError('Refresh token not found', 401)
  }

  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string }

  // Find user with refresh tokens
  const user = await User.findById(decoded.id).select('+refreshTokens')

  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401)
  }

  // Check if refresh token exists in user's tokens
  if (!user.refreshTokens?.includes(refreshToken)) {
    throw new AppError('Invalid refresh token', 401)
  }

  // Generate new access token
  const accessToken = generateAccessToken(user._id.toString(), user.email, user.role)

  res.json({
    success: true,
    data: {
      accessToken,
    },
  })
})

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses,
        ordersCount: user.ordersCount,
        totalSpend: user.totalSpend,
        avgOrderValue: user.avgOrderValue,
        lastActiveAt: user.lastActiveAt,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
      },
    },
  })
})

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body

  const user = await User.findOne({ email })

  // Always return success to prevent user enumeration
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    })
  }

  // Generate reset token (in production, store this in DB with expiry)
  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')

  // TODO: Store resetTokenHash and expiry in user model
  // TODO: Send email with reset link

  console.log('Password reset token:', resetToken)
  console.log('Reset link:', `${process.env.FRONTEND_URL}/reset-password/${resetToken}`)

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent',
  })
})

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token, password } = req.body

  // TODO: Implement actual password reset with stored token
  // For now, just return success

  throw new AppError('Password reset not yet implemented', 501)
})
