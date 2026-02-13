const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const SettlementOffer = require('../models/SettlementOffer');
const MedicalBill = require('../models/MedicalBill');
const FamilyMember = require('../models/FamilyMember');
const stripeService = require('../services/stripeService');
const {
    sendSettlementOfferEmail,
    sendSettlementCounterEmail,
    sendSettlementAcceptedEmail,
    sendSettlementPaymentConfirmation
} = require('../services/emailService');

// Helper: validate family member ownership
const validateFamilyMember = async (familyMemberId, userId) => {
    if (!familyMemberId) return true;
    const member = await FamilyMember.findOne({ _id: familyMemberId, userId });
    return !!member;
};

// Helper: validate session token for biller routes
const validateBillerSession = async (req, res) => {
    const { accessCode } = req.params;
    const sessionToken = req.headers['x-session-token'];

    if (!sessionToken) {
        res.status(401).json({ success: false, message: 'Session token required' });
        return null;
    }

    const offer = await SettlementOffer.findOne({ accessCode });
    if (!offer) {
        res.status(404).json({ success: false, message: 'Offer not found' });
        return null;
    }

    if (!offer.validateSession(sessionToken)) {
        res.status(401).json({ success: false, message: 'Session expired. Please verify OTP again.' });
        return null;
    }

    return offer;
};

// Generate a 6-digit OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// =============================================
// PATIENT ROUTES (protected)
// =============================================

// POST /api/settlement-offers - Create a new settlement offer
router.post('/', protect, async (req, res) => {
    try {
        const { billId, billerEmail, billerName, offerAmount, patientMessage, familyMemberId } = req.body;

        if (!billId || !billerEmail || !billerName || !offerAmount) {
            return res.status(400).json({
                success: false,
                message: 'Bill ID, biller email, biller name, and offer amount are required'
            });
        }

        // Validate bill ownership
        const bill = await MedicalBill.findOne({ _id: billId, userId: req.user._id });
        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }

        // Validate family member if provided
        if (familyMemberId) {
            const valid = await validateFamilyMember(familyMemberId, req.user._id);
            if (!valid) {
                return res.status(403).json({ success: false, message: 'Family member not found' });
            }
        }

        // Check for existing active offer on this bill
        const existingOffer = await SettlementOffer.findOne({
            billId,
            status: { $in: ['pending_biller', 'countered', 'accepted', 'payment_pending', 'payment_processing'] }
        });
        if (existingOffer) {
            return res.status(400).json({
                success: false,
                message: 'An active settlement offer already exists for this bill'
            });
        }

        const offer = new SettlementOffer({
            billId,
            userId: req.user._id,
            familyMemberId: familyMemberId || null,
            billerEmail,
            billerName,
            originalBillAmount: bill.totals?.patientResponsibility || bill.totals?.amountBilled || 0,
            offerAmount: Number(offerAmount),
            patientMessage,
            history: [{
                action: 'offer_created',
                actor: 'patient',
                amount: Number(offerAmount),
                note: patientMessage || 'Settlement offer sent'
            }]
        });

        await offer.save();

        // Generate OTP and send email
        const otp = generateOtp();
        await offer.setOtp(otp);

        const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://mymedicalcabinet.com';
        const accessUrl = `${frontendUrl}/settlement/${offer.accessCode}`;

        try {
            await sendSettlementOfferEmail(billerEmail, {
                billerName,
                patientName: `${req.user.firstName} ${req.user.lastName}`,
                offerAmount: Number(offerAmount).toFixed(2),
                originalAmount: offer.originalBillAmount.toFixed(2),
                patientMessage,
                accessUrl,
                otp,
                expiresAt: offer.expiresAt
            });
        } catch (emailErr) {
            console.error('Failed to send settlement offer email:', emailErr);
        }

        res.status(201).json({
            success: true,
            data: offer
        });
    } catch (error) {
        console.error('Create settlement offer error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/settlement-offers/bill/:billId - Get all offers for a bill
router.get('/bill/:billId', protect, async (req, res) => {
    try {
        const bill = await MedicalBill.findOne({ _id: req.params.billId, userId: req.user._id });
        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }

        const offers = await SettlementOffer.find({ billId: req.params.billId, userId: req.user._id })
            .sort({ createdAt: -1 });

        res.json({ success: true, data: offers });
    } catch (error) {
        console.error('Get offers error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/settlement-offers/:id - Get single offer (patient)
router.get('/:id', protect, async (req, res) => {
    try {
        const offer = await SettlementOffer.findOne({ _id: req.params.id, userId: req.user._id });
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        res.json({ success: true, data: offer });
    } catch (error) {
        console.error('Get offer error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/settlement-offers/:id/withdraw - Patient withdraws offer
router.put('/:id/withdraw', protect, async (req, res) => {
    try {
        const offer = await SettlementOffer.findOne({ _id: req.params.id, userId: req.user._id });
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (!['pending_biller', 'countered'].includes(offer.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot withdraw offer in current status'
            });
        }

        offer.status = 'withdrawn';
        offer.addHistory('offer_withdrawn', 'patient', null, 'Patient withdrew the offer');
        await offer.save();

        res.json({ success: true, data: offer });
    } catch (error) {
        console.error('Withdraw offer error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/settlement-offers/:id/accept-counter - Patient accepts counter
router.put('/:id/accept-counter', protect, async (req, res) => {
    try {
        const offer = await SettlementOffer.findOne({ _id: req.params.id, userId: req.user._id });
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (offer.status !== 'countered') {
            return res.status(400).json({
                success: false,
                message: 'No counter-offer to accept'
            });
        }

        offer.status = 'accepted';
        offer.finalAmount = offer.counterAmount;
        offer.addHistory('counter_accepted', 'patient', offer.counterAmount, 'Patient accepted counter-offer');
        await offer.save();

        res.json({ success: true, data: offer });
    } catch (error) {
        console.error('Accept counter error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/settlement-offers/:id/reject-counter - Patient rejects counter
router.put('/:id/reject-counter', protect, async (req, res) => {
    try {
        const offer = await SettlementOffer.findOne({ _id: req.params.id, userId: req.user._id });
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (offer.status !== 'countered') {
            return res.status(400).json({
                success: false,
                message: 'No counter-offer to reject'
            });
        }

        offer.status = 'rejected';
        offer.addHistory('counter_rejected', 'patient', null, 'Patient rejected counter-offer');
        await offer.save();

        res.json({ success: true, data: offer });
    } catch (error) {
        console.error('Reject counter error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/settlement-offers/:id/payment-intent - Create Stripe PaymentIntent
router.post('/:id/payment-intent', protect, async (req, res) => {
    try {
        const offer = await SettlementOffer.findOne({ _id: req.params.id, userId: req.user._id });
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (offer.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Offer must be accepted before payment'
            });
        }

        if (!offer.billerStripeAccountId) {
            return res.status(400).json({
                success: false,
                message: 'Biller has not completed Stripe onboarding'
            });
        }

        // Verify the connected account is ready
        const accountStatus = await stripeService.checkAccountStatus(offer.billerStripeAccountId);
        if (!accountStatus.chargesEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Biller account is not yet ready to receive payments'
            });
        }

        const paymentResult = await stripeService.createPaymentIntent(
            offer.finalAmount,
            offer.billerStripeAccountId,
            {
                offerId: offer._id.toString(),
                billId: offer.billId.toString(),
                patientUserId: offer.userId.toString()
            }
        );

        offer.status = 'payment_pending';
        offer.stripePaymentIntentId = paymentResult.paymentIntentId;
        offer.platformFee = paymentResult.platformFee / 100; // Store in dollars
        offer.addHistory('payment_intent_created', 'system', offer.finalAmount, 'Payment intent created');
        await offer.save();

        res.json({
            success: true,
            data: {
                clientSecret: paymentResult.clientSecret,
                amount: offer.finalAmount,
                platformFee: offer.platformFee
            }
        });
    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment' });
    }
});

// POST /api/settlement-offers/:id/resend-otp - Resend OTP to biller
router.post('/:id/resend-otp', protect, async (req, res) => {
    try {
        const offer = await SettlementOffer.findOne({ _id: req.params.id, userId: req.user._id });
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (!['pending_biller', 'countered', 'accepted'].includes(offer.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot resend OTP for offer in current status'
            });
        }

        const otp = generateOtp();
        offer.otpVerified = false;
        offer.otpAttempts = 0;
        offer.otpLockedUntil = null;
        offer.sessionToken = null;
        offer.sessionExpiresAt = null;
        await offer.setOtp(otp);

        const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://mymedicalcabinet.com';
        const accessUrl = `${frontendUrl}/settlement/${offer.accessCode}`;

        try {
            await sendSettlementOfferEmail(offer.billerEmail, {
                billerName: offer.billerName,
                patientName: `${req.user.firstName} ${req.user.lastName}`,
                offerAmount: offer.offerAmount.toFixed(2),
                originalAmount: offer.originalBillAmount.toFixed(2),
                patientMessage: offer.patientMessage,
                accessUrl,
                otp,
                expiresAt: offer.expiresAt
            });
        } catch (emailErr) {
            console.error('Failed to resend OTP email:', emailErr);
        }

        offer.addHistory('otp_resent', 'patient', null, 'OTP resent to biller');
        await offer.save();

        res.json({ success: true, message: 'OTP resent to biller' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// =============================================
// BILLER ROUTES (public with OTP/session)
// =============================================

// GET /api/settlement-offers/biller/status/:accessCode - Check offer status
router.get('/biller/status/:accessCode', async (req, res) => {
    try {
        const offer = await SettlementOffer.findOne({ accessCode: req.params.accessCode });
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (offer.expiresAt && new Date() > offer.expiresAt && offer.status === 'pending_biller') {
            offer.status = 'expired';
            await offer.save();
        }

        res.json({
            success: true,
            data: {
                status: offer.status,
                otpVerified: offer.otpVerified,
                billerName: offer.billerName,
                isExpired: offer.status === 'expired'
            }
        });
    } catch (error) {
        console.error('Check offer status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/settlement-offers/biller/verify-otp/:accessCode - Verify OTP
router.post('/biller/verify-otp/:accessCode', async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json({ success: false, message: 'OTP is required' });
        }

        const offer = await SettlementOffer.findOne({ accessCode: req.params.accessCode });
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (offer.status === 'expired') {
            return res.status(400).json({ success: false, message: 'This offer has expired' });
        }

        await offer.verifyOtp(otp);
        const sessionToken = await offer.generateSessionToken();

        offer.addHistory('otp_verified', 'biller', null, 'Biller verified OTP');
        await offer.save();

        res.json({
            success: true,
            data: { sessionToken }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// GET /api/settlement-offers/biller/offer/:accessCode - View offer details
router.get('/biller/offer/:accessCode', async (req, res) => {
    try {
        const offer = await validateBillerSession(req, res);
        if (!offer) return;

        res.json({
            success: true,
            data: {
                _id: offer._id,
                billerName: offer.billerName,
                status: offer.status,
                originalBillAmount: offer.originalBillAmount,
                offerAmount: offer.offerAmount,
                counterAmount: offer.counterAmount,
                finalAmount: offer.finalAmount,
                patientMessage: offer.patientMessage,
                billerMessage: offer.billerMessage,
                history: offer.history,
                expiresAt: offer.expiresAt,
                createdAt: offer.createdAt
            }
        });
    } catch (error) {
        console.error('Get biller offer error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/settlement-offers/biller/accept/:accessCode - Biller accepts
router.put('/biller/accept/:accessCode', async (req, res) => {
    try {
        const offer = await validateBillerSession(req, res);
        if (!offer) return;

        if (offer.status !== 'pending_biller') {
            return res.status(400).json({
                success: false,
                message: 'Cannot accept offer in current status'
            });
        }

        offer.status = 'accepted';
        offer.finalAmount = offer.offerAmount;
        offer.addHistory('offer_accepted', 'biller', offer.offerAmount, 'Biller accepted the offer');
        await offer.save();

        // Notify patient
        const User = require('../models/User');
        const patient = await User.findById(offer.userId);
        if (patient) {
            try {
                await sendSettlementAcceptedEmail(patient.email, {
                    patientName: patient.firstName,
                    billerName: offer.billerName,
                    finalAmount: offer.finalAmount.toFixed(2),
                    originalAmount: offer.originalBillAmount.toFixed(2)
                });
            } catch (emailErr) {
                console.error('Failed to send acceptance email:', emailErr);
            }
        }

        res.json({ success: true, data: offer });
    } catch (error) {
        console.error('Biller accept error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/settlement-offers/biller/reject/:accessCode - Biller rejects
router.put('/biller/reject/:accessCode', async (req, res) => {
    try {
        const offer = await validateBillerSession(req, res);
        if (!offer) return;

        if (offer.status !== 'pending_biller') {
            return res.status(400).json({
                success: false,
                message: 'Cannot reject offer in current status'
            });
        }

        offer.status = 'rejected';
        offer.billerMessage = req.body.message || '';
        offer.addHistory('offer_rejected', 'biller', null, req.body.message || 'Biller rejected the offer');
        await offer.save();

        res.json({ success: true, data: offer });
    } catch (error) {
        console.error('Biller reject error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/settlement-offers/biller/counter/:accessCode - Biller counters
router.put('/biller/counter/:accessCode', async (req, res) => {
    try {
        const offer = await validateBillerSession(req, res);
        if (!offer) return;

        if (offer.status !== 'pending_biller') {
            return res.status(400).json({
                success: false,
                message: 'Cannot counter offer in current status'
            });
        }

        const { counterAmount, message } = req.body;
        if (!counterAmount || Number(counterAmount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid counter amount is required'
            });
        }

        offer.status = 'countered';
        offer.counterAmount = Number(counterAmount);
        offer.billerMessage = message || '';
        offer.addHistory('counter_offered', 'biller', Number(counterAmount), message || 'Biller made a counter-offer');
        await offer.save();

        // Notify patient
        const User = require('../models/User');
        const patient = await User.findById(offer.userId);
        if (patient) {
            try {
                await sendSettlementCounterEmail(patient.email, {
                    patientName: patient.firstName,
                    billerName: offer.billerName,
                    originalOffer: offer.offerAmount.toFixed(2),
                    counterAmount: Number(counterAmount).toFixed(2),
                    billerMessage: message
                });
            } catch (emailErr) {
                console.error('Failed to send counter email:', emailErr);
            }
        }

        res.json({ success: true, data: offer });
    } catch (error) {
        console.error('Biller counter error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/settlement-offers/biller/onboarding/:accessCode - Get Stripe onboarding link
router.get('/biller/onboarding/:accessCode', async (req, res) => {
    try {
        const offer = await validateBillerSession(req, res);
        if (!offer) return;

        if (!['accepted', 'payment_pending'].includes(offer.status)) {
            return res.status(400).json({
                success: false,
                message: 'Offer must be accepted before onboarding'
            });
        }

        let accountId = offer.billerStripeAccountId;

        // Create account if not exists
        if (!accountId) {
            const account = await stripeService.createConnectAccount(offer.billerEmail, offer.billerName);
            accountId = account.id;
            offer.billerStripeAccountId = accountId;
            offer.addHistory('stripe_account_created', 'system', null, 'Stripe Connect account created');
            await offer.save();
        }

        // Check if account is already set up
        const status = await stripeService.checkAccountStatus(accountId);
        if (status.chargesEnabled && status.payoutsEnabled) {
            return res.json({
                success: true,
                data: {
                    accountReady: true,
                    accountId
                }
            });
        }

        const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://mymedicalcabinet.com';
        const returnUrl = `${frontendUrl}/settlement/${offer.accessCode}?onboarding=complete`;
        const refreshUrl = `${frontendUrl}/settlement/${offer.accessCode}?onboarding=refresh`;

        const accountLink = await stripeService.generateOnboardingLink(accountId, returnUrl, refreshUrl);

        res.json({
            success: true,
            data: {
                accountReady: false,
                onboardingUrl: accountLink.url
            }
        });
    } catch (error) {
        console.error('Biller onboarding error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
