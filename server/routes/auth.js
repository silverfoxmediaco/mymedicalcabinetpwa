const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const MedicalHistory = require('../models/MedicalHistory');
const { generateToken, protect } = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/emailService');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
    body('firstName').notEmpty().withMessage('First name is required').trim().escape(),
    body('lastName').notEmpty().withMessage('Last name is required').trim().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { email, password, firstName, lastName, dateOfBirth, phone } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Create user
        user = await User.create({
            email,
            password,
            firstName,
            lastName,
            dateOfBirth,
            phone,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires
        });

        // Create empty medical history for the user
        await MedicalHistory.create({ userId: user._id });

        // Send verification email
        try {
            await sendVerificationEmail(user, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Continue with registration even if email fails
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Account created successfully. Please check your email to verify your account.',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating account'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { email, password } = req.body;

    try {
        // Find user and include password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in'
        });
    }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login/register
// @access  Public
router.post('/google', async (req, res) => {
    const { googleId, email, firstName, lastName, profileImage } = req.body;

    try {
        let user = await User.findOne({
            $or: [{ googleId }, { email }]
        });

        if (user) {
            // Update Google ID if not set
            if (!user.googleId) {
                user.googleId = googleId;
            }
            user.lastLogin = Date.now();
            await user.save();
        } else {
            // Create new user
            user = await User.create({
                googleId,
                email,
                firstName,
                lastName,
                profileImage
            });

            // Create empty medical history
            await MedicalHistory.create({ userId: user._id });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: user.createdAt === user.updatedAt ? 'Account created successfully' : 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Error with Google authentication'
        });
    }
});

// @route   POST /api/auth/apple
// @desc    Apple OAuth login/register
// @access  Public
router.post('/apple', async (req, res) => {
    const { appleId, email, firstName, lastName } = req.body;

    try {
        let user = await User.findOne({
            $or: [{ appleId }, { email }]
        });

        if (user) {
            if (!user.appleId) {
                user.appleId = appleId;
            }
            user.lastLogin = Date.now();
            await user.save();
        } else {
            user = await User.create({
                appleId,
                email,
                firstName: firstName || 'User',
                lastName: lastName || ''
            });

            await MedicalHistory.create({ userId: user._id });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Authentication successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Apple auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Error with Apple authentication'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            role: req.user.role,
            phone: req.user.phone,
            dateOfBirth: req.user.dateOfBirth,
            ssnLast4: req.user.ssnLast4,
            backupEmail: req.user.backupEmail,
            address: req.user.address,
            emergencyContact: req.user.emergencyContact,
            pharmacies: req.user.pharmacies,
            profileImage: req.user.profileImage,
            gender: req.user.gender,
            preferredLanguage: req.user.preferredLanguage,
            race: req.user.race,
            ethnicity: req.user.ethnicity,
            maritalStatus: req.user.maritalStatus,
            occupation: req.user.occupation,
            employer: req.user.employer,
            advanceDirectives: req.user.advanceDirectives
        }
    });
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', protect, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify user email
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            emailVerificationToken: req.params.token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification link'
            });
        }

        // Mark email as verified
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully. You can now log in.'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email'
        });
    }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Private
router.post('/resend-verification', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        // Send verification email
        await sendVerificationEmail(user, verificationToken);

        res.json({
            success: true,
            message: 'Verification email sent'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending verification email'
        });
    }
});

// @route   POST /api/auth/resend-verification-by-email
// @desc    Resend verification email by email address (public)
// @access  Public
router.post('/resend-verification-by-email', [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            // Don't reveal if email exists or not for security
            return res.json({
                success: true,
                message: 'If an account exists with this email, a verification link has been sent.'
            });
        }

        if (user.isEmailVerified) {
            return res.json({
                success: true,
                message: 'If an account exists with this email, a verification link has been sent.'
            });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        // Send verification email
        await sendVerificationEmail(user, verificationToken);
        console.log('Resent verification email to:', user.email);

        res.json({
            success: true,
            message: 'If an account exists with this email, a verification link has been sent.'
        });
    } catch (error) {
        console.error('Resend verification by email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending verification email'
        });
    }
});

module.exports = router;
