const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// Async handler wrapper to catch errors
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.logError('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new AppError(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new AppError(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new AppError(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new AppError(message, 401);
    }

    // Prisma errors
    if (err.code === 'P2002') {
        const message = 'Duplicate field value entered';
        error = new AppError(message, 400);
    }

    if (err.code === 'P2025') {
        const message = 'Record not found';
        error = new AppError(message, 404);
    }

    // Default error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(statusCode).json({
        success: false,
        message,
        ...(isDevelopment && { stack: err.stack, error: err })
    });
};

// 404 handler
const notFoundHandler = (req, res, next) => {
    const err = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(err);
};

module.exports = {
    asyncHandler,
    errorHandler,
    notFoundHandler
};

