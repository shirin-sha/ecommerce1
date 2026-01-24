"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const database_1 = require("../src/config/database");
const errorHandler_1 = require("../src/middleware/errorHandler");
const auth_1 = __importDefault(require("../src/routes/auth"));
const products_1 = __importDefault(require("../src/routes/products"));
const categories_1 = __importDefault(require("../src/routes/categories"));
const tags_1 = __importDefault(require("../src/routes/tags"));
const attributes_1 = __importDefault(require("../src/routes/attributes"));
const cart_1 = __importDefault(require("../src/routes/cart"));
const checkout_1 = __importDefault(require("../src/routes/checkout"));
const orders_1 = __importDefault(require("../src/routes/orders"));
const customers_1 = __importDefault(require("../src/routes/customers"));
const coupons_1 = __importDefault(require("../src/routes/coupons"));
const reviews_1 = __importDefault(require("../src/routes/reviews"));
const settings_1 = __importDefault(require("../src/routes/settings"));
const analytics_1 = __importDefault(require("../src/routes/analytics"));
const reports_1 = __importDefault(require("../src/routes/reports"));
const app = (0, express_1.default)();
// Get allowed origins from environment
const getAllowedOrigins = () => {
    const origins = [
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
        process.env.STOREFRONT_URL,
    ];
    // Add Vercel preview URLs if available
    if (process.env.VERCEL_URL) {
        origins.push(`https://${process.env.VERCEL_URL}`);
    }
    if (process.env.VERCEL_BRANCH_URL) {
        origins.push(`https://${process.env.VERCEL_BRANCH_URL}`);
    }
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production') {
        origins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000');
    }
    const filtered = origins.filter(Boolean);
    // Log CORS origins in development for debugging
    if (process.env.NODE_ENV !== 'production') {
        console.log('Allowed CORS origins:', filtered);
    }
    return filtered;
};
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }
        // If no allowed origins configured, reject in production
        if (allowedOrigins.length === 0) {
            if (process.env.NODE_ENV === 'production') {
                console.error('❌ No CORS origins configured in production!');
                return callback(new Error('CORS not configured'));
            }
            // Allow in development only
            console.warn('⚠️ No CORS origins configured, allowing all origins (development only)');
            return callback(null, true);
        }
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            // Log blocked origin for debugging
            if (process.env.NODE_ENV !== 'production') {
                console.warn('❌ CORS blocked origin:', origin);
                console.warn('   Allowed origins:', allowedOrigins);
            }
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Debug endpoint to check environment variables (development only)
if (process.env.NODE_ENV !== 'production') {
    app.get('/debug/env', (req, res) => {
        // Don't expose sensitive values, just check if they exist
        res.json({
            hasMONGO_URI: !!process.env.MONGO_URI,
            hasJWT_SECRET: !!process.env.JWT_SECRET,
            hasJWT_REFRESH_SECRET: !!process.env.JWT_REFRESH_SECRET,
            NODE_ENV: process.env.NODE_ENV,
            hasADMIN_URL: !!process.env.ADMIN_URL,
            hasSTOREFRONT_URL: !!process.env.STOREFRONT_URL,
            // Show first few chars of MONGO_URI for debugging (safe)
            MONGO_URI_preview: process.env.MONGO_URI ?
                `${process.env.MONGO_URI.substring(0, 20)}...` : 'NOT SET',
            timestamp: new Date().toISOString()
        });
    });
}
// API routes
app.get('/api/v1', (req, res) => {
    res.json({
        message: 'E-Commerce API',
        version: '1.0.0',
    });
});
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/products', products_1.default);
app.use('/api/v1/categories', categories_1.default);
app.use('/api/v1/tags', tags_1.default);
app.use('/api/v1/attributes', attributes_1.default);
app.use('/api/v1/cart', cart_1.default);
app.use('/api/v1/checkout', checkout_1.default);
app.use('/api/v1/orders', orders_1.default);
app.use('/api/v1/customers', customers_1.default);
app.use('/api/v1/coupons', coupons_1.default);
app.use('/api/v1/reviews', reviews_1.default);
app.use('/api/v1/settings', settings_1.default);
app.use('/api/v1/analytics', analytics_1.default);
app.use('/api/v1/reports', reports_1.default);
// Error handler
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});
// Initialize database connection (cached for serverless)
let dbConnected = false;
const connectDB = async () => {
    if (!dbConnected) {
        try {
            await (0, database_1.connectDatabase)();
            dbConnected = true;
            console.log('Database connection established');
        }
        catch (error) {
            console.error('Database connection failed:', error);
            // Reset flag to retry on next request
            dbConnected = false;
            // Don't throw - let the request proceed (health check should work)
        }
    }
};
// Vercel serverless function handler
exports.default = async (req, res) => {
    try {
        // Log environment variable status on first request (development only)
        if (!process.env._ENV_LOGGED && process.env.NODE_ENV !== 'production') {
            console.log('=== Environment Variables Check ===');
            console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
            console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
            console.log('JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET);
            console.log('NODE_ENV:', process.env.NODE_ENV);
            console.log('ADMIN_URL exists:', !!process.env.ADMIN_URL);
            console.log('STOREFRONT_URL exists:', !!process.env.STOREFRONT_URL);
            console.log('===================================');
            process.env._ENV_LOGGED = 'true';
        }
        try {
            // Connect to database (non-blocking - won't fail the request if DB is down)
            await connectDB();
        }
        catch (error) {
            // Log error but don't block the request
            // Health check should still work even if DB is down
            console.error('Database connection warning:', error);
        }
        // Handle the request
        return app(req, res);
    }
    catch (error) {
        // Catch any unexpected errors and return a proper response
        console.error('❌ Serverless function error:', error);
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error stack:', error?.stack);
        }
        // Return error response instead of crashing
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'production'
                    ? 'An error occurred'
                    : error?.message || 'Unknown error',
                ...(process.env.NODE_ENV !== 'production' && { stack: error?.stack })
            });
        }
    }
};
