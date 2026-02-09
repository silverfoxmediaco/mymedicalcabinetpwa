const User = require('../models/User');
const MedicalHistory = require('../models/MedicalHistory');
const Medication = require('../models/Medication');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Insurance = require('../models/Insurance');
const ShareAccess = require('../models/ShareAccess');

// @desc    Get platform-wide system statistics
// @route   GET /api/admin/stats
// @access  Admin (canViewAnalytics)
const getSystemStats = async (req, res) => {
  try {
    // User counts
    const [
      totalUsers,
      roleBreakdown,
      activeUsers,
      inactiveUsers,
      verifiedUsers,
      unverifiedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({ isEmailVerified: false }),
    ]);

    const roles = {};
    roleBreakdown.forEach((r) => {
      roles[r._id] = r.count;
    });

    // Registration trends (last 30 days, daily counts)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const registrationTrends = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Users by last login activity
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoLogin = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

    const [active24h, active7d, active30d, active90d] = await Promise.all([
      User.countDocuments({ lastLogin: { $gte: oneDayAgo } }),
      User.countDocuments({ lastLogin: { $gte: sevenDaysAgo } }),
      User.countDocuments({ lastLogin: { $gte: thirtyDaysAgoLogin } }),
      User.countDocuments({ lastLogin: { $gte: ninetyDaysAgo } }),
    ]);

    const inactive90d = totalUsers - active90d;

    // Data volume stats
    const [
      totalConditions,
      totalMedications,
      totalAppointments,
      totalDoctors,
      totalInsurance,
      totalShareAccesses,
    ] = await Promise.all([
      MedicalHistory.aggregate([
        { $project: { count: { $size: { $ifNull: ['$conditions', []] } } } },
        { $group: { _id: null, total: { $sum: '$count' } } },
      ]),
      Medication.countDocuments(),
      Appointment.countDocuments(),
      Doctor.countDocuments(),
      Insurance.countDocuments(),
      ShareAccess.countDocuments(),
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          byRole: roles,
          active: activeUsers,
          inactive: inactiveUsers,
          verified: verifiedUsers,
          unverified: unverifiedUsers,
        },
        registrationTrends,
        activity: {
          last24h: active24h,
          last7d: active7d,
          last30d: active30d,
          last90d: active90d,
          inactive90dPlus: inactive90d,
        },
        dataVolume: {
          conditions: totalConditions[0] ? totalConditions[0].total : 0,
          medications: totalMedications,
          appointments: totalAppointments,
          doctors: totalDoctors,
          insurancePlans: totalInsurance,
          shareAccesses: totalShareAccesses,
        },
      },
    });
  } catch (error) {
    console.error('Admin getSystemStats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get last 20 recent registrations
// @route   GET /api/admin/stats/recent-registrations
// @access  Admin (canViewAnalytics)
const getRecentRegistrations = async (req, res) => {
  try {
    const recentUsers = await User.find()
      .select('firstName lastName email role createdAt isEmailVerified isActive')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      users: recentUsers,
    });
  } catch (error) {
    console.error('Admin getRecentRegistrations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getSystemStats,
  getRecentRegistrations,
};
