const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'MyMedicalCabinet API is running' });
});

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
});
