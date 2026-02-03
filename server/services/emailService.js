import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Cache for compiled templates
const templateCache = {};

/**
 * Load and compile an email template
 * @param {string} templateName - Name of the template file (without extension)
 * @returns {Function} Compiled Handlebars template
 */
const loadTemplate = (templateName) => {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  const templatePath = path.join(__dirname, '../emailTemplates', `${templateName}.html`);
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  const compiledTemplate = Handlebars.compile(templateContent);

  templateCache[templateName] = compiledTemplate;
  return compiledTemplate;
};

/**
 * Format a date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

/**
 * Space out OTP digits for display
 * @param {string|number} otp - The OTP code
 * @returns {string} Spaced OTP string
 */
const spaceOtp = (otp) => {
  return otp.toString().split('').join(' ');
};

/**
 * Send a share invitation email with OTP
 * @param {string} recipientEmail - Email address to send to
 * @param {Object} data - Email data
 * @param {string} data.patientName - Name of the patient sharing records
 * @param {string} data.recipientName - Name of the recipient (optional)
 * @param {string} data.accessUrl - URL to access the shared records
 * @param {string|number} data.otp - The 6-digit OTP
 * @param {Date} data.expiresAt - Expiration date/time
 * @returns {Promise<Object>} SendGrid response
 */
export const sendShareInvitation = async (recipientEmail, data) => {
  try {
    const { patientName, recipientName, accessUrl, otp, expiresAt } = data;

    const template = loadTemplate('shareInvitation');

    const htmlContent = template({
      patientName,
      recipientName,
      accessUrl,
      otp: otp.toString(),
      otpSpaced: spaceOtp(otp),
      expiresAt: expiresAt.toISOString(),
      expiresAtFormatted: formatDate(expiresAt),
      logoUrl: process.env.LOGO_URL || `${process.env.SITE_URL}/vistamdlogo.png`,
      siteUrl: process.env.SITE_URL || 'https://vistarxmd.com'
    });

    const msg = {
      to: recipientEmail,
      from: {
        email: process.env.FROM_EMAIL || 'noreply@vistarxmd.com',
        name: 'Vista RX MD'
      },
      subject: `${patientName} has shared their medical records with you`,
      html: htmlContent,
      text: `
${patientName} has shared their medical records with you.

Your Verification Code: ${otp}

Access the records here: ${accessUrl}

This access link expires in 24 hours (${formatDate(expiresAt)}).

SECURITY NOTICE: This code is confidential. Do not share it with anyone.

- Vista RX MD
      `.trim()
    };

    const response = await sgMail.send(msg);

    logger.info(`Share invitation email sent to ${recipientEmail} for patient ${patientName}`);

    return response;
  } catch (error) {
    logger.error('Error sending share invitation email:', error);
    throw error;
  }
};

/**
 * Send access notification to patient
 * @param {string} patientEmail - Patient's email address
 * @param {Object} data - Notification data
 * @param {string} data.patientName - Patient's name
 * @param {string} data.recipientEmail - Who accessed the records
 * @param {string} data.recipientName - Name of accessor (optional)
 * @param {Date} data.accessTime - When access occurred
 * @param {string} data.ipAddress - IP address of accessor
 * @returns {Promise<Object>} SendGrid response
 */
export const sendAccessNotification = async (patientEmail, data) => {
  try {
    const { patientName, recipientEmail, recipientName, accessTime, ipAddress } = data;

    const accessorDisplay = recipientName || recipientEmail;

    const msg = {
      to: patientEmail,
      from: {
        email: process.env.FROM_EMAIL || 'noreply@vistarxmd.com',
        name: 'Vista RX MD'
      },
      subject: 'Your medical records were accessed',
      html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 25px; }
        .info-box { background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { margin: 10px 0; }
        .label { font-weight: 600; color: #0369a1; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Medical Records Access Notification</h2>
        </div>
        <p>Hello ${patientName},</p>
        <p>Your medical records were accessed by someone you authorized.</p>
        <div class="info-box">
            <div class="info-row"><span class="label">Accessed by:</span> ${accessorDisplay}</div>
            <div class="info-row"><span class="label">Time:</span> ${formatDate(accessTime)}</div>
            <div class="info-row"><span class="label">IP Address:</span> ${ipAddress || 'Unknown'}</div>
        </div>
        <p>If you did not authorize this access, please log in to your account and revoke all shared access immediately.</p>
        <div class="footer">
            <p>Vista RX MD - Secure Medical Records</p>
        </div>
    </div>
</body>
</html>
      `,
      text: `
Medical Records Access Notification

Hello ${patientName},

Your medical records were accessed by someone you authorized.

Accessed by: ${accessorDisplay}
Time: ${formatDate(accessTime)}
IP Address: ${ipAddress || 'Unknown'}

If you did not authorize this access, please log in to your account and revoke all shared access immediately.

- Vista RX MD
      `.trim()
    };

    const response = await sgMail.send(msg);

    logger.info(`Access notification sent to ${patientEmail}`);

    return response;
  } catch (error) {
    logger.error('Error sending access notification:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} recipientEmail - User's email
 * @param {Object} data - Reset data
 * @param {string} data.userName - User's name
 * @param {string} data.resetUrl - Password reset URL
 * @returns {Promise<Object>} SendGrid response
 */
export const sendPasswordReset = async (recipientEmail, data) => {
  try {
    const { userName, resetUrl } = data;

    const msg = {
      to: recipientEmail,
      from: {
        email: process.env.FROM_EMAIL || 'noreply@vistarxmd.com',
        name: 'Vista RX MD'
      },
      subject: 'Reset Your Password - Vista RX MD',
      html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #4DACF2; color: #fff !important; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <div class="footer">
            <p>Vista RX MD</p>
        </div>
    </div>
</body>
</html>
      `,
      text: `
Password Reset Request

Hello ${userName},

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

- Vista RX MD
      `.trim()
    };

    const response = await sgMail.send(msg);
    logger.info(`Password reset email sent to ${recipientEmail}`);
    return response;
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send email verification
 * @param {string} recipientEmail - User's email
 * @param {Object} data - Verification data
 * @param {string} data.userName - User's name
 * @param {string} data.verifyUrl - Email verification URL
 * @returns {Promise<Object>} SendGrid response
 */
export const sendEmailVerification = async (recipientEmail, data) => {
  try {
    const { userName, verifyUrl } = data;

    const msg = {
      to: recipientEmail,
      from: {
        email: process.env.FROM_EMAIL || 'noreply@vistarxmd.com',
        name: 'Vista RX MD'
      },
      subject: 'Verify Your Email - Vista RX MD',
      html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #4DACF2; color: #fff !important; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Welcome to Vista RX MD!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for registering. Please verify your email address to complete your account setup:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" class="button">Verify Email</a>
        </p>
        <p>This link will expire in 24 hours.</p>
        <div class="footer">
            <p>Vista RX MD</p>
        </div>
    </div>
</body>
</html>
      `,
      text: `
Welcome to Vista RX MD!

Hello ${userName},

Thank you for registering. Please verify your email address by clicking the link below:

${verifyUrl}

This link will expire in 24 hours.

- Vista RX MD
      `.trim()
    };

    const response = await sgMail.send(msg);
    logger.info(`Email verification sent to ${recipientEmail}`);
    return response;
  } catch (error) {
    logger.error('Error sending email verification:', error);
    throw error;
  }
};

export default {
  sendShareInvitation,
  sendAccessNotification,
  sendPasswordReset,
  sendEmailVerification
};
