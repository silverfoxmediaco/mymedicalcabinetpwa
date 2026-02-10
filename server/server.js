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

// Security headers (OWASP: Security Misconfiguration, XSS, Clickjacking, MIME sniffing)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:", "https://maps.gstatic.com", "https://maps.googleapis.com"],
            connectSrc: ["'self'", "https://mymedicalcabinet.com", "https://*.amazonaws.com", "https://maps.googleapis.com", "https://rxnav.nlm.nih.gov", "https://api.fda.gov", "https://clinicaltables.nlm.nih.gov"]
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
});
