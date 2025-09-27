const nodemailer = require('nodemailer');

// Create transporter based on environment variables
const createTransporter = () => {
    if (process.env.SMTP_HOST) {
        // Use custom SMTP
        return nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else if (process.env.GMAIL_USER) {
        // Use Gmail
        return nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD // Use App Password, not regular password
            }
        });
    } else {
        // Fallback to console log
        return null;
    }
};

exports.sendEmail = async (email, subject, text) => {
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            // Fallback to console log
            console.log(`[EMAIL -> ${email}] ${subject}: ${text}`);
            return { success: true, fallback: true };
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.GMAIL_USER,
            to: email,
            subject: subject,
            text: text,
            html: `<p>${text}</p>` // Simple HTML version
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL -> ${email}] Sent successfully:`, result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error(`[EMAIL -> ${email}] Failed:`, error.message);
        // Fallback to console log if sending fails
        console.log(`[EMAIL FALLBACK -> ${email}] ${subject}: ${text}`);
        return { success: false, error: error.message };
    }
};


