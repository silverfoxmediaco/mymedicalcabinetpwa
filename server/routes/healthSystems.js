const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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

module.exports = router;
