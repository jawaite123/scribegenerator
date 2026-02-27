const express = require('express');
const path = require('path');
const router = express.Router();

/**
 * GET /
 * Serve main HTML page
 */
router.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

module.exports = router;
