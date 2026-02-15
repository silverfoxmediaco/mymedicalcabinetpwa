const User = require('../models/User');
const MedicalHistory = require('../models/MedicalHistory');
const Medication = require('../models/Medication');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Insurance = require('../models/Insurance');
const ShareAccess = require('../models/ShareAccess');
const MedicalBill = require('../models/MedicalBill');
const SettlementOffer = require('../models/SettlementOffer');
const FamilyMember = require('../models/FamilyMember');

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
      totalMedicalBills,
      totalSettlementOffers,
      totalFamilyMembers,
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
      MedicalBill.countDocuments(),
      SettlementOffer.countDocuments(),
      FamilyMember.countDocuments(),
    ]);

    // New feature aggregations
    const [
      billsByStatus,
      billFinancials,
      billsAiAnalyzed,
      billAiSavings,
      offersByStatus,
      settlementFinancials,
      familyByRelationship,
    ] = await Promise.all([
      MedicalBill.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      MedicalBill.aggregate([
        {
          $group: {
            _id: null,
            totalBilled: { $sum: '$totals.amountBilled' },
            totalPaid: { $sum: '$totals.amountPaid' },
            totalPatientOwes: { $sum: '$totals.patientResponsibility' },
          },
        },
      ]),
      MedicalBill.countDocuments({ 'aiAnalysis.analyzedAt': { $exists: true } }),
      MedicalBill.aggregate([
        { $match: { 'aiAnalysis.estimatedSavings': { $gt: 0 } } },
        { $group: { _id: null, totalSavings: { $sum: '$aiAnalysis.estimatedSavings' } } },
      ]),
      SettlementOffer.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      SettlementOffer.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: null,
            totalSettled: { $sum: '$finalAmount' },
            totalOriginal: { $sum: '$originalBillAmount' },
            totalFees: { $sum: '$platformFee' },
          },
        },
      ]),
      FamilyMember.aggregate([{ $group: { _id: '$relationship', count: { $sum: 1 } } }]),
    ]);

    // Transform aggregation arrays into objects
    const billStatusMap = {};
    billsByStatus.forEach((s) => { billStatusMap[s._id] = s.count; });

    const offerStatusMap = {};
    offersByStatus.forEach((s) => { offerStatusMap[s._id] = s.count; });

    const relationshipMap = {};
    familyByRelationship.forEach((r) => { relationshipMap[r._id] = r.count; });

    const billFin = billFinancials[0] || { totalBilled: 0, totalPaid: 0, totalPatientOwes: 0 };
    const settFin = settlementFinancials[0] || { totalSettled: 0, totalOriginal: 0, totalFees: 0 };
    const aiSavingsTotal = billAiSavings[0] ? billAiSavings[0].totalSavings : 0;

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
          medicalBills: totalMedicalBills,
          settlementOffers: totalSettlementOffers,
          familyMembers: totalFamilyMembers,
        },
        medicalBills: {
          total: totalMedicalBills,
          byStatus: billStatusMap,
          financials: {
            totalBilled: billFin.totalBilled,
            totalPaid: billFin.totalPaid,
            totalPatientOwes: billFin.totalPatientOwes,
          },
          aiAnalyzed: billsAiAnalyzed,
          aiEstimatedSavings: aiSavingsTotal,
        },
        settlements: {
          total: totalSettlementOffers,
          byStatus: offerStatusMap,
          paid: {
            totalSettled: settFin.totalSettled,
            totalOriginal: settFin.totalOriginal,
            totalSaved: settFin.totalOriginal - settFin.totalSettled,
            platformFees: settFin.totalFees,
          },
        },
        familyMembers: {
          total: totalFamilyMembers,
          byRelationship: relationshipMap,
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
