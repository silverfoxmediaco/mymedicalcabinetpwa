const express = require('express');
const router = express.Router();
const NdaAgreement = require('../models/NdaAgreement');

// @route   POST /api/investor-gate/verify
// @desc    Verify investor passcode and store NDA agreement
// @access  Public (no auth required - investors are not logged-in users)
router.post('/verify', async (req, res) => {
    try {
        const { firstName, lastName, email, passcode } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !passcode) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Check passcode against env var
        if (passcode !== process.env.INVESTOR_PASSCODE) {
            return res.status(401).json({
                success: false,
                message: 'Invalid passcode. Please try again.'
            });
        }

        // Passcode correct — store NDA agreement
        await NdaAgreement.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Investor gate error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

module.exports = router;
