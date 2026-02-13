import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './SettlementPaymentForm.css';

const SettlementPaymentForm = ({ amount, billerName, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);
        setPaymentError(null);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required'
            });

            if (error) {
                setPaymentError(error.message);
                if (onError) onError(error.message);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                if (onSuccess) onSuccess(paymentIntent);
            }
        } catch (err) {
            setPaymentError('An unexpected error occurred.');
            if (onError) onError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="settlement-payment-form-container">
            <div className="settlement-payment-form-summary">
                <div className="settlement-payment-form-amount-label">Payment to {billerName}</div>
                <div className="settlement-payment-form-amount">${Number(amount).toFixed(2)}</div>
            </div>

            <form onSubmit={handleSubmit} className="settlement-payment-form-stripe">
                <PaymentElement />

                {paymentError && (
                    <div className="settlement-payment-form-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                        </svg>
                        {paymentError}
                    </div>
                )}

                <button
                    type="submit"
                    className="settlement-payment-form-submit"
                    disabled={!stripe || isProcessing}
                >
                    {isProcessing ? 'Processing...' : `Pay $${Number(amount).toFixed(2)}`}
                </button>

                <p className="settlement-payment-form-secure-note">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Payments processed securely by Stripe
                </p>
            </form>
        </div>
    );
};

export default SettlementPaymentForm;
