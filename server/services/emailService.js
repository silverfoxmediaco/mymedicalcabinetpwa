const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (user, verificationToken) => {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const msg = {
        to: user.email,
        from: process.env.EMAIL_FROM,
        subject: 'Verify Your Email - MyMedicalCabinet',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 10px; overflow: hidden;">
                                <!-- Header -->
                                <tr>
                                    <td style="background-color: #017CFF; padding: 32px 40px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">MyMedicalCabinet</h1>
                                    </td>
                                </tr>

                                <!-- Body -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="margin: 0 0 16px 0; color: #5c5c5c; font-size: 22px; font-weight: 600;">
                                            Welcome, ${user.firstName}!
                                        </h2>
                                        <p style="margin: 0 0 24px 0; color: #8c8c8c; font-size: 16px; line-height: 1.6;">
                                            Thanks for signing up. Please verify your email address to get started with MyMedicalCabinet.
                                        </p>

                                        <!-- Button -->
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="center" style="padding: 16px 0;">
                                                    <a href="${verificationUrl}" style="display: inline-block; background-color: #017CFF; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 32px; border-radius: 10px;">
                                                        Verify Email Address
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="margin: 24px 0 0 0; color: #8c8c8c; font-size: 14px; line-height: 1.6;">
                                            This link will expire in 24 hours. If you didn't create an account with MyMedicalCabinet, you can safely ignore this email.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f9f9f9; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                                        <p style="margin: 0; color: #a0a0a0; font-size: 12px;">
                                            &copy; ${new Date().getFullYear()} MyMedicalCabinet. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    };

    try {
        await sgMail.send(msg);
        console.log('Verification email sent to:', user.email);
        return true;
    } catch (error) {
        console.error('SendGrid error:', error.response?.body || error.message);
        throw new Error('Failed to send verification email');
    }
};

module.exports = {
    sendVerificationEmail
};
