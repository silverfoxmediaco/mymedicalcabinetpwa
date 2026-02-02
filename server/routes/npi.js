const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const npiService = require('../services/npiService');

// @route   GET /api/npi/search
// @desc    Search for providers by name
// @access  Private
router.get('/search', protect, async (req, res) => {
    try {
        const { firstName, lastName, state, city, specialty, limit } = req.query;

        if (!lastName && !firstName) {
            return res.status(400).json({
                success: false,
                message: 'At least first name or last name is required'
            });
        }

        const result = await npiService.searchProviders({
            firstName,
            lastName,
            state,
            city,
            specialty,
            limit: limit ? parseInt(limit) : 10
        });

        res.json(result);
    } catch (error) {
        console.error('NPI search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching NPI registry'
        });
    }
});

// @route   GET /api/npi/lookup/:npiNumber
// @desc    Lookup a specific provider by NPI number
// @access  Private
router.get('/lookup/:npiNumber', protect, async (req, res) => {
    try {
        const { npiNumber } = req.params;

        const result = await npiService.lookupByNPI(npiNumber);

        res.json(result);
    } catch (error) {
        console.error('NPI lookup error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error looking up NPI'
        });
    }
});

// @route   POST /api/npi/verify
// @desc    Verify a provider's NPI and optionally match name
// @access  Private
router.post('/verify', protect, async (req, res) => {
    try {
        const { npiNumber, lastName } = req.body;

        if (!npiNumber) {
            return res.status(400).json({
                success: false,
                message: 'NPI number is required'
            });
        }

        const result = await npiService.verifyProvider(npiNumber, lastName);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('NPI verify error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error verifying NPI'
        });
    }
});

module.exports = router;
