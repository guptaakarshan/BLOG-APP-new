const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../../config');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid or inactive user' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(500).json({ message: 'Authentication error' });
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

// Middleware to check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceUserId) => {
    return (req, res, next) => {
        if (req.user.role === 'admin' || req.user.id === resourceUserId) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied' });
        }
    };
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireOwnershipOrAdmin
};
