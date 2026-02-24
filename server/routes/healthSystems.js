const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');
const HealthSystem = require('../models/HealthSystem');

// @route   GET /api/health-systems/search?q=baylor
// @desc    Search active health systems by name
// @access  Private
router.get('/search', protect, async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) {
            return res.json({ success: true, data: [] });
        }

        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        const results = await HealthSystem.find({ name: regex, isActive: true })
            .select('name slug city state')
            .limit(20)
            .lean();

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Health system search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching health systems'
        });
    }
});

// @route   PUT /api/health-systems/:id/secret
// @desc    Set encrypted client secret for a health system
// @access  Admin
router.put('/:id/secret', adminProtect, async (req, res) => {
    try {
        const hs = await HealthSystem.findById(req.params.id);
        if (!hs) {
            return res.status(404).json({ success: false, message: 'Health system not found' });
        }

        const { clientSecret, clientSecretNonProd, epicOrgId } = req.body;

        if (clientSecret) {
            hs.setClientSecret(clientSecret);
        }
        if (clientSecretNonProd) {
            hs.setClientSecretNonProd(clientSecretNonProd);
        }
        if (epicOrgId !== undefined) {
            hs.epicOrgId = epicOrgId;
        }
        if (!hs.activatedAt && clientSecret) {
            hs.activatedAt = new Date();
        }

        await hs.save();

        res.json({
            success: true,
            message: 'Health system secret updated',
            data: {
                id: hs._id,
                name: hs.name,
                epicOrgId: hs.epicOrgId,
                hasSecret: !!hs.clientSecret,
                hasSecretNonProd: !!hs.clientSecretNonProd,
                activatedAt: hs.activatedAt
            }
        });
    } catch (error) {
        console.error('Set health system secret error:', error);
        res.status(500).json({ success: false, message: 'Error updating health system secret' });
    }
});

// @route   GET /api/health-systems/:id/has-secret
// @desc    Check whether a health system has a client secret set
// @access  Admin
router.get('/:id/has-secret', adminProtect, async (req, res) => {
    try {
        const hs = await HealthSystem.findById(req.params.id)
            .select('name clientSecret clientSecretNonProd epicOrgId activatedAt');
        if (!hs) {
            return res.status(404).json({ success: false, message: 'Health system not found' });
        }

        res.json({
            success: true,
            data: {
                id: hs._id,
                name: hs.name,
                epicOrgId: hs.epicOrgId || '',
                hasSecret: !!hs.clientSecret,
                hasSecretNonProd: !!hs.clientSecretNonProd,
                activatedAt: hs.activatedAt || null
            }
        });
    } catch (error) {
        console.error('Check health system secret error:', error);
        res.status(500).json({ success: false, message: 'Error checking health system secret' });
    }
});

module.exports = router;
