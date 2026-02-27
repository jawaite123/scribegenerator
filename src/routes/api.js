const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

const taskManager = require('../services/taskManager');
const { validateConfig } = require('../utils/configValidator');
const { cleanupOldPDFs } = require('../utils/cleanup');

/**
 * POST /api/generate
 * Start background PDF generation
 */
router.post('/generate', async (req, res) => {
    try {
        // Validate configuration
        const config = validateConfig(req.body);

        // Create task
        const taskId = taskManager.createTask();

        // Start generation in background (don't await)
        taskManager.generatePDF(config, taskId).catch(error => {
            console.error(`Background generation error for task ${taskId}:`, error);
        });

        // Return task ID immediately
        res.json({ taskId, status: 'pending' });

    } catch (error) {
        console.error('Generate endpoint error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/status/:taskId
 * Get task status and progress
 */
router.get('/status/:taskId', (req, res) => {
    const { taskId } = req.params;
    const task = taskManager.getTask(taskId);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    // Return task status without internal details
    res.json({
        status: task.status,
        progress: task.progress,
        error: task.error
    });
});

/**
 * GET /api/download/:taskId
 * Download completed PDF
 */
router.get('/download/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const task = taskManager.getTask(taskId);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'complete') {
        return res.status(400).json({ error: 'PDF not ready yet', status: task.status });
    }

    if (!task.pdfPath) {
        return res.status(500).json({ error: 'PDF path not found' });
    }

    try {
        // Check if file exists
        await fs.access(task.pdfPath);

        // Send file
        res.download(task.pdfPath, `Bible_Workbook_${taskId}.pdf`, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download PDF' });
                }
            }
        });

    } catch (error) {
        console.error('File access error:', error);
        res.status(404).json({ error: 'PDF file not found' });
    }
});

/**
 * GET /api/presets/:name
 * Load preset configuration
 */
router.get('/presets/:name', async (req, res) => {
    const { name } = req.params;

    // Validate preset name (prevent path traversal)
    if (!/^[a-z0-9-]+$/.test(name)) {
        return res.status(400).json({ error: 'Invalid preset name' });
    }

    const presetPath = path.join('public', 'presets', `${name}.json`);

    try {
        const data = await fs.readFile(presetPath, 'utf-8');
        const preset = JSON.parse(data);
        res.json(preset);
    } catch (error) {
        console.error('Preset load error:', error);
        res.status(404).json({ error: 'Preset not found' });
    }
});

/**
 * POST /api/cleanup
 * Manual trigger for PDF cleanup
 */
router.post('/cleanup', async (req, res) => {
    try {
        const deletedCount = await cleanupOldPDFs();
        const tasksRemoved = taskManager.cleanupOldTasks();

        res.json({
            message: 'Cleanup complete',
            pdfsDeleted: deletedCount,
            tasksRemoved
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/stats
 * Get task manager statistics (for debugging)
 */
router.get('/stats', (req, res) => {
    const stats = taskManager.getStats();
    res.json(stats);
});

module.exports = router;
