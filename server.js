require('dotenv').config();
const express = require('express');
const path = require('path');

const apiRoutes = require('./src/routes/api');
const indexRoutes = require('./src/routes/index');
const { startPeriodicCleanup } = require('./src/utils/cleanup');
const taskManager = require('./src/services/taskManager');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api', apiRoutes);
app.use('/', indexRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start periodic cleanup
const cleanupHours = parseInt(process.env.PDF_CLEANUP_HOURS) || 24;
startPeriodicCleanup(cleanupHours);

// Cleanup old tasks every hour
setInterval(() => {
    taskManager.cleanupOldTasks(24 * 60 * 60 * 1000);
}, 60 * 60 * 1000);

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(70));
    console.log('Bible Workbook Generator - Web Server');
    console.log('='.repeat(70));
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`PDF cleanup interval: ${cleanupHours} hours`);
    console.log('='.repeat(70));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});
