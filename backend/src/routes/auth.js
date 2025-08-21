const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter, registrationLimiter } = require('../middleware/rateLimit');
const { verifyGoogleToken } = require('../config/google');

const router = express.Router();

// Register new user
router.post('/register', registrationLimiter, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            authMethod: 'local'
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                authMethod: user.authMethod
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// Login user
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user can use password authentication
        if (!user.canUsePassword()) {
            return res.status(401).json({ message: 'This account uses Google authentication' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                authMethod: user.authMethod
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});

// Google authentication
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'Google ID token is required' });
        }

        // Verify Google token
        const googleData = await verifyGoogleToken(idToken);
        
        if (!googleData.emailVerified) {
            return res.status(400).json({ message: 'Google email not verified' });
        }

        // Check if user already exists
        let user = await User.findOne({
            $or: [
                { googleId: googleData.googleId },
                { email: googleData.email }
            ]
        });

        if (user) {
            // Update existing user's Google info if needed
            if (!user.googleId) {
                user.googleId = googleData.googleId;
                user.googleEmail = googleData.email;
                user.googleName = googleData.name;
                user.googlePicture = googleData.picture;
                user.authMethod = 'google';
            }
        } else {
            // Create new user with Google data
            const username = googleData.name.replace(/\s+/g, '').toLowerCase() + Math.random().toString(36).substr(2, 5);
            
            user = new User({
                username,
                email: googleData.email,
                googleId: googleData.googleId,
                googleEmail: googleData.email,
                googleName: googleData.name,
                googlePicture: googleData.picture,
                authMethod: 'google',
                avatar: googleData.picture
            });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Google authentication successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                authMethod: user.authMethod,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Google authentication error:', error);
        res.status(500).json({ message: 'Google authentication failed' });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { username, email, avatar } = req.body;
        const updateData = {};

        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (avatar !== undefined) updateData.avatar = avatar;

        // Check if username or email already exists
        if (username || email) {
            const existingUser = await User.findOne({
                $or: [
                    ...(username ? [{ username }] : []),
                    ...(email ? [{ email }] : [])
                ],
                _id: { $ne: req.user.id }
            });

            if (existingUser) {
                return res.status(400).json({
                    message: existingUser.username === username ? 'Username already taken' : 'Email already registered'
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Profile update failed' });
    }
});

// Change password (only for local auth users)
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required' });
        }

        const user = await User.findById(req.user.id);
        
        if (!user.canUsePassword()) {
            return res.status(400).json({ message: 'Password change not available for Google users' });
        }

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Password change failed' });
    }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

module.exports = router;
