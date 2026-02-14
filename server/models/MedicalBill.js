const mongoose = require('mongoose');

const MedicalBillSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    familyMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        default: null
    },
    biller: {
        name: {
            type: String,
            required: [true, 'Biller name is required']
        },
        address: String,
        phone: String,
        website: String,
        paymentPortalUrl: String
    },
    dateOfService: {
        type: Date
    },
    dateReceived: {
        type: Date
    },
    statementDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    account: {
        guarantorName: String,
        guarantorId: String,
        myChartCode: String
    },
    lineItems: [{
        description: String,
        cptCode: String,
        quantity: { type: Number, default: 1 },
        amountBilled: { type: Number, default: 0 },
        fairPriceEstimate: Number,
        flaggedAsError: { type: Boolean, default: false },
        errorReason: String
    }],
    totals: {
        amountBilled: { type: Number, default: 0 },
        insurancePaid: { type: Number, default: 0 },
        insuranceAdjusted: { type: Number, default: 0 },
        patientResponsibility: { type: Number, default: 0 },
        amountPaid: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['unpaid', 'partially_paid', 'paid', 'disputed', 'in_review', 'resolved'],
        default: 'unpaid'
    },
    documents: [{
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        s3Key: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    aiAnalysis: {
        summary: String,
        errorsFound: [{
            type: String,
            description: String,
            lineItemIndex: Number,
            estimatedOvercharge: Number
        }],
        estimatedSavings: Number,
        disputeLetterText: String,
        analyzedAt: Date
    },
    payments: [{
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        method: {
            type: String,
            enum: ['cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'online_portal', 'money_order', 'other'],
            default: 'other'
        },
        referenceNumber: String,
        notes: String
    }],
    dispute: {
        status: {
            type: String,
            enum: ['none', 'drafting', 'filed', 'in_review', 'resolved', 'denied'],
            default: 'none'
        },
        letterText: String,
        dateFiled: Date,
        resolution: String,
        resolvedAt: Date,
        savedAmount: Number
    },
    notes: String,
    insuranceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Insurance'
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

MedicalBillSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

MedicalBillSchema.index({ userId: 1, status: 1 });
MedicalBillSchema.index({ userId: 1, dateOfService: -1 });

module.exports = mongoose.model('MedicalBill', MedicalBillSchema);
