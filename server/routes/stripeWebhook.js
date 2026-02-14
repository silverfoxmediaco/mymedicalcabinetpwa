const express = require('express');
const router = express.Router();
const SettlementOffer = require('../models/SettlementOffer');
const MedicalBill = require('../models/MedicalBill');
const User = require('../models/User');
const stripeService = require('../services/stripeService');
const { sendSettlementPaymentConfirmation } = require('../services/emailService');

// POST /api/stripe/webhook
// NOTE: This route must use express.raw() body parser, registered BEFORE express.json() in server.js
router.post('/', async (req, res) => {
    let event;

    try {
        const signature = req.headers['stripe-signature'];
        event = stripeService.constructWebhookEvent(req.body, signature);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;

                // Direct bill payment (Make Payment button)
                if (paymentIntent.metadata?.type === 'direct_bill_payment') {
                    const billId = paymentIntent.metadata.billId;
                    const bill = await MedicalBill.findById(billId);
                    if (!bill) {
                        console.error('Webhook: Bill not found for direct payment:', billId);
                        break;
                    }

                    const paidAmount = paymentIntent.amount / 100; // cents to dollars

                    bill.payments.push({
                        date: new Date(),
                        amount: paidAmount,
                        method: 'credit_card',
                        referenceNumber: paymentIntent.id,
                        notes: 'Payment via MyMedicalCabinet'
                    });

                    const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
                    bill.totals.amountPaid = totalPaid;

                    const responsibility = bill.totals.patientResponsibility || bill.totals.amountBilled || 0;
                    if (totalPaid >= responsibility) {
                        bill.status = 'paid';
                    } else if (totalPaid > 0) {
                        bill.status = 'partially_paid';
                    }

                    await bill.save();

                    // Send confirmation email
                    const patient = await User.findById(paymentIntent.metadata.userId);
                    if (patient) {
                        try {
                            await sendSettlementPaymentConfirmation(patient.email, {
                                recipientName: patient.firstName,
                                recipientType: 'patient',
                                billerName: paymentIntent.metadata.billerName || 'Medical Provider',
                                amount: paidAmount.toFixed(2),
                                transactionId: paymentIntent.id,
                                date: new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })
                            });
                        } catch (emailErr) {
                            console.error('Failed to send bill payment confirmation:', emailErr);
                        }
                    }

                    console.log(`[Webhook] Direct bill payment succeeded for bill ${billId}, amount: $${paidAmount}`);
                    break;
                }

                // Settlement offer payment
                const offerId = paymentIntent.metadata?.offerId;

                if (!offerId) break;

                const offer = await SettlementOffer.findById(offerId);
                if (!offer) {
                    console.error('Webhook: Offer not found for payment:', offerId);
                    break;
                }

                offer.status = 'paid';
                offer.stripeTransferId = paymentIntent.latest_charge;
                offer.addHistory('payment_succeeded', 'system', offer.finalAmount, `Payment completed. PaymentIntent: ${paymentIntent.id}`);
                await offer.save();

                // Add payment to medical bill
                const bill = await MedicalBill.findById(offer.billId);
                if (bill) {
                    bill.payments.push({
                        date: new Date(),
                        amount: offer.finalAmount,
                        method: 'credit_card',
                        referenceNumber: paymentIntent.id,
                        notes: `Settlement payment via MyMedicalCabinet (Offer #${offer._id})`
                    });

                    // Recalculate totals
                    const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
                    bill.totals.amountPaid = totalPaid;

                    const responsibility = bill.totals.patientResponsibility || bill.totals.amountBilled || 0;
                    if (totalPaid >= responsibility) {
                        bill.status = 'paid';
                    } else if (totalPaid > 0) {
                        bill.status = 'partially_paid';
                    }

                    await bill.save();
                }

                // Send confirmation emails
                const patient = await User.findById(offer.userId);
                if (patient) {
                    try {
                        await sendSettlementPaymentConfirmation(patient.email, {
                            recipientName: patient.firstName,
                            recipientType: 'patient',
                            billerName: offer.billerName,
                            amount: offer.finalAmount.toFixed(2),
                            transactionId: paymentIntent.id,
                            date: new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            })
                        });
                    } catch (emailErr) {
                        console.error('Failed to send patient confirmation:', emailErr);
                    }
                }

                try {
                    await sendSettlementPaymentConfirmation(offer.billerEmail, {
                        recipientName: offer.billerName,
                        recipientType: 'biller',
                        billerName: offer.billerName,
                        amount: offer.finalAmount.toFixed(2),
                        transactionId: paymentIntent.id,
                        date: new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })
                    });
                } catch (emailErr) {
                    console.error('Failed to send biller confirmation:', emailErr);
                }

                console.log(`[Webhook] Payment succeeded for offer ${offerId}`);
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                const offerId = paymentIntent.metadata?.offerId;

                if (!offerId) break;

                const offer = await SettlementOffer.findById(offerId);
                if (!offer) break;

                offer.status = 'payment_failed';
                const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
                offer.addHistory('payment_failed', 'system', null, failureMessage);
                await offer.save();

                console.log(`[Webhook] Payment failed for offer ${offerId}: ${failureMessage}`);
                break;
            }

            case 'account.updated': {
                const account = event.data.object;
                console.log(`[Webhook] Connected account updated: ${account.id}, charges_enabled: ${account.charges_enabled}`);
                break;
            }

            default:
                // Unhandled event type
                break;
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
    }

    // Always return 200 to acknowledge receipt
    res.json({ received: true });
});

module.exports = router;
