const express = require('express');
const router = express.Router();
const NdaAgreement = require('../models/NdaAgreement');
const { sendInvestorPasscodeEmail } = require('../services/emailService');

// @route   POST /api/investor-gate/request-passcode
// @desc    Validate identity, store NDA agreement, email passcode
// @access  Public
router.post('/request-passcode', async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email) {
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

        // Store NDA agreement
        await NdaAgreement.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Email the passcode
        await sendInvestorPasscodeEmail(email.trim().toLowerCase(), {
            firstName: firstName.trim(),
            passcode: process.env.INVESTOR_PASSCODE
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Investor passcode request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// @route   POST /api/investor-gate/verify
// @desc    Verify investor passcode
// @access  Public
router.post('/verify', async (req, res) => {
    try {
        const { passcode } = req.body;

        if (!passcode) {
            return res.status(400).json({
                success: false,
                message: 'Passcode is required'
            });
        }

        // Check passcode against env var
        if (passcode !== process.env.INVESTOR_PASSCODE) {
            return res.status(401).json({
                success: false,
                message: 'Invalid passcode. Please try again.'
            });
        }

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
