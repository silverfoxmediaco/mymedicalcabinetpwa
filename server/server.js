const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const hpp = require('hpp');
const cron = require('node-cron');
const connectDB = require('./config/db');
const reminderService = require('./services/reminderService');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Trust proxy for Render/Heroku/etc (needed for rate limiting with X-Forwarded-For)
app.set('trust proxy', 1);

// Rate limiting - prevent abuse
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 auth attempts per window
    message: { success: false, message: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 OTP attempts per window
    message: { success: false, message: 'Too many OTP verification attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

// AI-specific rate limiter (expensive API calls)
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 AI explanations per hour per user
    message: { success: false, message: 'Explanation limit reached. Try again in an hour.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Middleware
app.use(cors());

// Stripe webhook route MUST be registered BEFORE express.json() body parser
// It needs the raw body for signature verification
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), require('./routes/stripeWebhook'));

// Security headers (OWASP: Security Misconfiguration, XSS, Clickjacking, MIME sniffing)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://js.stripe.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            frameSrc: ["'self'", "https://js.stripe.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:", "https://maps.gstatic.com", "https://maps.googleapis.com"],
            connectSrc: ["'self'", "https://mymedicalcabinet.com", "https://*.amazonaws.com", "https://maps.googleapis.com", "https://rxnav.nlm.nih.gov", "https://api.fda.gov", "https://clinicaltables.nlm.nih.gov", "https://api.stripe.com"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// NoSQL injection sanitization (OWASP: Injection)
app.use(mongoSanitize());

// HTTP parameter pollution protection
app.use(hpp());

// Request logging for security event detection
app.use(morgan('combined'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'MyMedicalCabinet API is running' });
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/share/verify-otp', otpLimiter);
app.use('/api/settlement-offers/biller/verify-otp', otpLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/forgot-username', authLimiter);
app.use('/api/admin/auth/login', authLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/medical-history', require('./routes/medicalHistory'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/insurance', require('./routes/insurance'));
app.use('/api/share', require('./routes/share'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/npi', require('./routes/npi'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/ai', aiLimiter, require('./routes/ai'));
app.use('/api/family-members', require('./routes/familyMembers'));
app.use('/api/medical-bills', require('./routes/medicalBills'));
app.use('/api/settlement-offers', require('./routes/settlementOffers'));

// Admin routes (completely separate auth system)
app.use('/api/admin/auth', require('./routes/adminAuth.routes'));
app.use('/api/admin/users', require('./routes/adminUsers.routes'));
app.use('/api/admin/stats', require('./routes/adminStats.routes'));
app.use('/api/admin/management', require('./routes/adminManagement.routes'));


// Serve static landing pages from /articles
app.use('/articles', express.static(path.join(__dirname, '../articles')));

// Handle /articles routes - serve index.html for each landing page
app.get('/articles/:slug', (req, res) => {
    const articlePath = path.join(__dirname, '../articles', req.params.slug, 'index.html');
    res.sendFile(articlePath, (err) => {
        if (err) {
            res.status(404).send('Article not found');
        }
    });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
    // Static HTML pages for SEO (served before catch-all)
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'home.html'));
    });
    app.get('/about', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'about.html'));
    });
    app.get('/contact', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'contact.html'));
    });
    app.get('/features', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'features.html'));
    });
    app.get('/terms', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'terms.html'));
    });
    app.get('/privacy', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'privacy.html'));
    });
    app.get('/security', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'security.html'));
    });

    app.get('/resources', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'resources.html'));
    });

    // Feature landing pages (SEO)
    app.get('/features/ai-bill-analysis', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'ai-bill-analysis.html'));
    });
    app.get('/features/settlement-negotiation', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'settlement-negotiation.html'));
    });
    app.get('/features/insurance-ai-explain', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'insurance-ai-explain.html'));
    });
    app.get('/features/share-records', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'share-records.html'));
    });
    app.get('/features/doctors-medications', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'doctors-medications.html'));
    });
    app.get('/features/family-members', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'family-members.html'));
    });

    app.use(express.static(path.join(__dirname, '../client/build')));

    // Handle React routing - return index.html for all non-API routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Schedule reminder processing every 15 minutes
    // Cron pattern: minute hour day-of-month month day-of-week
    // '*/15 * * * *' = every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        console.log('[Cron] Running scheduled reminder processing...');
        try {
            await reminderService.processAllReminders();
        } catch (error) {
            console.error('[Cron] Reminder processing failed:', error);
        }
    });

    console.log('[Cron] Reminder scheduler initialized - runs every 15 minutes');

    // Expire stale settlement offers daily at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Checking for expired settlement offers...');
        try {
            const SettlementOffer = require('./models/SettlementOffer');
            const result = await SettlementOffer.updateMany(
                {
                    status: 'pending_biller',
                    expiresAt: { $lt: new Date() }
                },
                {
                    $set: { status: 'expired', updatedAt: new Date() },
                    $push: {
                        history: {
                            action: 'auto_expired',
                            actor: 'system',
                            note: 'Offer expired after 7 days',
                            timestamp: new Date()
                        }
                    }
                }
            );
            if (result.modifiedCount > 0) {
                console.log(`[Cron] Expired ${result.modifiedCount} settlement offers`);
            }
        } catch (error) {
            console.error('[Cron] Settlement expiration failed:', error);
        }
    });

    console.log('[Cron] Settlement expiration scheduler initialized - runs daily at midnight');
});
