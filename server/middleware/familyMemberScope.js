const FamilyMember = require('../models/FamilyMember');

/**
 * Build a query filter that scopes data to a specific family member (or the primary user).
 * Validates that the family member belongs to the requesting user.
 *
 * @param {string} userId - The authenticated user's ID
 * @param {string|null} familyMemberId - The family member ID (null = primary user)
 * @returns {object} Filter object to spread into queries
 */
const getFamilyMemberFilter = async (userId, familyMemberId) => {
    if (!familyMemberId || familyMemberId === 'null' || familyMemberId === 'undefined') {
        return { familyMemberId: null };
    }

    // Validate family member belongs to this user
    const familyMember = await FamilyMember.findOne({
        _id: familyMemberId,
        userId: userId,
        isActive: true
    });

    if (!familyMember) {
        const error = new Error('Family member not found or does not belong to this user');
        error.statusCode = 404;
        throw error;
    }

    return { familyMemberId: familyMemberId };
};

module.exports = { getFamilyMemberFilter };
