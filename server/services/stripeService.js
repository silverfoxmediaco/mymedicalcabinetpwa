const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PLATFORM_FEE_PERCENT = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT) || 2.9;

/**
 * Create a Stripe Express connected account for the biller
 */
const createConnectAccount = async (billerEmail, billerName) => {
    const account = await stripe.accounts.create({
        type: 'express',
        email: billerEmail,
        capabilities: {
            transfers: { requested: true }
        },
        business_profile: {
            name: billerName
        }
    });

    return account;
};

/**
 * Generate an onboarding link for a connected account
 */
const generateOnboardingLink = async (accountId, returnUrl, refreshUrl) => {
    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding'
    });

    return accountLink;
};

/**
 * Check the status of a connected account
 */
const checkAccountStatus = async (accountId) => {
    const account = await stripe.accounts.retrieve(accountId);
    return {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted
    };
};

/**
 * Create a PaymentIntent with destination charge to connected account
 */
const createPaymentIntent = async (amount, connectedAccountId, metadata = {}) => {
    const amountInCents = Math.round(amount * 100);
    const feeAmount = Math.round(amountInCents * (PLATFORM_FEE_PERCENT / 100));

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        application_fee_amount: feeAmount,
        transfer_data: {
            destination: connectedAccountId
        },
        metadata: {
            ...metadata,
            platformFeePercent: PLATFORM_FEE_PERCENT.toString()
        }
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amountInCents,
        platformFee: feeAmount
    };
};

/**
 * Create a PaymentIntent on the platform account (no connected account destination)
 * Used for direct bill payments when biller has no Stripe Connected Account
 */
const createPlatformPaymentIntent = async (amount, metadata = {}) => {
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
            ...metadata,
            platformPayment: 'true'
        }
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amountInCents
    };
};

/**
 * Confirm the status of a PaymentIntent
 */
const confirmPaymentStatus = async (paymentIntentId) => {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        metadata: paymentIntent.metadata
    };
};

/**
 * Construct and verify a Stripe webhook event
 */
const constructWebhookEvent = (payload, signature) => {
    return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
    );
};

module.exports = {
    createConnectAccount,
    generateOnboardingLink,
    checkAccountStatus,
    createPaymentIntent,
    createPlatformPaymentIntent,
    confirmPaymentStatus,
    constructWebhookEvent
};
