const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const TEMPLATES_DIR = path.join(__dirname, '../emailTemplates');
const FROM_EMAIL = process.env.EMAIL_FROM || 'james@silverfoxmedia.co';
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://mymedicalcabinet.com';

// Load and compile base template
const loadBaseTemplate = () => {
    return fs.readFileSync(path.join(TEMPLATES_DIR, 'base.html'), 'utf8');
};

// Load content template
const loadTemplate = (templateName) => {
    const templatePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
    if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf8');
    }
    return null;
};

// Simple template variable replacement
const compileTemplate = (template, variables) => {
    let compiled = template;

    // Replace simple variables {{variable}}
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        compiled = compiled.replace(regex, variables[key] || '');
    });

    // Handle conditionals {{#if variable}}...{{/if}}
    compiled = compiled.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
        return variables[variable] ? content : '';
    });

    return compiled;
};

// Build full email HTML
const buildEmail = (templateName, variables) => {
    const baseTemplate = loadBaseTemplate();
    const contentTemplate = loadTemplate(templateName);

    if (!contentTemplate) {
        throw new Error(`Email template '${templateName}' not found`);
    }

    // Compile content first
    const content = compileTemplate(contentTemplate, variables);

    // Then compile base with content
    const fullVariables = {
        ...variables,
        content,
        year: new Date().getFullYear()
    };

    return compileTemplate(baseTemplate, fullVariables);
};

// Send email helper
const sendEmail = async (to, subject, templateName, variables) => {
    const html = buildEmail(templateName, { ...variables, email: to, subject });

    const msg = {
        to,
        from: FROM_EMAIL,
        subject,
        html,
        trackingSettings: {
            clickTracking: { enable: false, enableText: false }
        }
    };

    try {
        await sgMail.send(msg);
        console.log(`Email sent: ${templateName} to ${to}`);
        return true;
    } catch (error) {
        console.error('SendGrid error:', error.response?.body || error.message);
        throw new Error(`Failed to send ${templateName} email`);
    }
};

// ============================================
// Email Functions
// ============================================

// Welcome / Verification Email
const sendVerificationEmail = async (user, verificationToken) => {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

    return sendEmail(
        user.email,
        'Verify Your Email - MyMedicalCabinet',
        'welcome',
        {
            firstName: user.firstName,
            verificationUrl
        }
    );
};

// Password Reset Email
const sendPasswordResetEmail = async (user, resetToken) => {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    return sendEmail(
        user.email,
        'Reset Your Password - MyMedicalCabinet',
        'passwordReset',
        {
            firstName: user.firstName,
            resetUrl
        }
    );
};

// Medication Reminder Email
const sendMedicationReminder = async (user, medication, scheduledTime) => {
    // Use user's timezone if set, otherwise default to Central Time
    const timezone = user.timezone || 'America/Chicago';
    const time = new Date(scheduledTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone
    });

    return sendEmail(
        user.email,
        `Medication Reminder: ${medication.name}`,
        'medicationReminder',
        {
            firstName: user.firstName,
            medicationName: medication.name,
            dosage: `${medication.dosage?.amount || ''} ${medication.dosage?.unit || ''}`.trim(),
            time,
            instructions: medication.instructions,
            dashboardUrl: `${FRONTEND_URL}/medications`
        }
    );
};

// Refill Reminder Email
const sendRefillReminder = async (user, medication) => {
    return sendEmail(
        user.email,
        `Refill Reminder: ${medication.name}`,
        'refillReminder',
        {
            firstName: user.firstName,
            medicationName: medication.name,
            refillsRemaining: medication.refillsRemaining || 0,
            pharmacy: medication.pharmacy?.name,
            pharmacyPhone: medication.pharmacy?.phone,
            dashboardUrl: `${FRONTEND_URL}/medications`
        }
    );
};

// Appointment Reminder Email
const sendAppointmentReminder = async (user, appointment) => {
    const appointmentDate = new Date(appointment.dateTime);
    // Use user's timezone if set, otherwise default to Central Time
    const timezone = user.timezone || 'America/Chicago';
    const date = appointmentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: timezone
    });
    const time = appointmentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone
    });

    return sendEmail(
        user.email,
        `Appointment Reminder: ${appointment.title}`,
        'appointmentReminder',
        {
            firstName: user.firstName,
            appointmentTitle: appointment.title,
            date,
            time,
            duration: appointment.duration || 30,
            doctorName: appointment.doctorName,
            location: appointment.location,
            notes: appointment.notes,
            dashboardUrl: `${FRONTEND_URL}/appointments`
        }
    );
};

// Access Notification Email
const sendAccessNotification = async (user, accessDetails) => {
    // Use user's timezone if set, otherwise default to Central Time
    const timezone = user.timezone || 'America/Chicago';
    const accessDate = new Date(accessDetails.accessedAt).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone
    });

    return sendEmail(
        user.email,
        'Your Medical Records Were Accessed - MyMedicalCabinet',
        'accessNotification',
        {
            firstName: user.firstName,
            accessedBy: accessDetails.accessedBy || 'Unknown',
            accessDate,
            dataAccessed: accessDetails.dataAccessed || 'Medical records',
            manageAccessUrl: `${FRONTEND_URL}/share`
        }
    );
};

// Share Invitation Email with OTP
const sendShareInvitation = async (recipientEmail, data) => {
    const { patientName, recipientName, accessUrl, otp, expiresAt } = data;

    const expiresAtFormatted = new Date(expiresAt).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return sendEmail(
        recipientEmail,
        `${patientName} has shared their medical records with you`,
        'shareInvitation',
        {
            patientName,
            recipientName,
            accessUrl,
            otp: otp.toString(),
            expiresAt: expiresAtFormatted
        }
    );
};

// Settlement Offer Email to Biller
const sendSettlementOfferEmail = async (billerEmail, data) => {
    const { billerName, patientName, offerAmount, originalAmount, patientMessage, accessUrl, otp, expiresAt } = data;

    const expiresAtFormatted = new Date(expiresAt).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return sendEmail(
        billerEmail,
        `Settlement Offer from ${patientName} - MyMedicalCabinet`,
        'settlementOfferToBiller',
        {
            billerName,
            patientName,
            offerAmount,
            originalAmount,
            patientMessage,
            accessUrl,
            otp: otp.toString(),
            expiresAt: expiresAtFormatted
        }
    );
};

// Settlement Counter Email to Patient
const sendSettlementCounterEmail = async (patientEmail, data) => {
    const { patientName, billerName, originalOffer, counterAmount, billerMessage } = data;

    return sendEmail(
        patientEmail,
        `Counter-Offer from ${billerName} - MyMedicalCabinet`,
        'settlementCounterToPatient',
        {
            patientName,
            billerName,
            originalOffer,
            counterAmount,
            billerMessage,
            dashboardUrl: `${FRONTEND_URL}/medical-bills`
        }
    );
};

// Settlement Accepted Email to Patient
const sendSettlementAcceptedEmail = async (patientEmail, data) => {
    const { patientName, billerName, finalAmount, originalAmount } = data;

    return sendEmail(
        patientEmail,
        `Settlement Accepted by ${billerName} - MyMedicalCabinet`,
        'settlementAcceptedToPatient',
        {
            patientName,
            billerName,
            finalAmount,
            originalAmount,
            dashboardUrl: `${FRONTEND_URL}/medical-bills`
        }
    );
};

// Settlement Payment Confirmation (sent to both parties)
const sendSettlementPaymentConfirmation = async (recipientEmail, data) => {
    const { recipientName, recipientType, billerName, amount, transactionId, date } = data;

    return sendEmail(
        recipientEmail,
        `Payment Confirmation - MyMedicalCabinet`,
        'settlementPaymentConfirmation',
        {
            recipientName,
            billerName,
            amount,
            transactionId,
            date,
            isPatient: recipientType === 'patient',
            isBiller: recipientType === 'biller'
        }
    );
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendMedicationReminder,
    sendRefillReminder,
    sendAppointmentReminder,
    sendAccessNotification,
    sendShareInvitation,
    sendSettlementOfferEmail,
    sendSettlementCounterEmail,
    sendSettlementAcceptedEmail,
    sendSettlementPaymentConfirmation
};
