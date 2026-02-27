const fs = require('fs').promises;
const path = require('path');

/**
 * PDF Cleanup Utility
 * Deletes old generated PDFs to save disk space
 */

/**
 * Delete PDFs older than specified hours
 * @param {string} directory - Directory containing PDFs
 * @param {number} maxAgeHours - Max age in hours before deletion
 */
async function cleanupOldPDFs(directory, maxAgeHours = 24) {
    // Use /tmp on Vercel (serverless), local directory otherwise
    if (!directory) {
        directory = process.env.VERCEL ? '/tmp/generated_pdfs' : 'generated_pdfs';
    }
    try {
        const now = Date.now();
        const cutoff = now - (maxAgeHours * 60 * 60 * 1000);

        const files = await fs.readdir(directory);

        let deletedCount = 0;

        for (const file of files) {
            // Skip .gitkeep and non-PDF files
            if (file === '.gitkeep' || !file.endsWith('.pdf')) {
                continue;
            }

            const filePath = path.join(directory, file);

            try {
                const stats = await fs.stat(filePath);

                if (stats.mtimeMs < cutoff) {
                    await fs.unlink(filePath);
                    deletedCount++;
                    console.log(`Deleted old PDF: ${file}`);
                }
            } catch (error) {
                console.error(`Error processing ${file}:`, error.message);
            }
        }

        if (deletedCount > 0) {
            console.log(`Cleanup complete: deleted ${deletedCount} old PDF(s)`);
        }

        return deletedCount;
    } catch (error) {
        console.error('Cleanup error:', error.message);
        return 0;
    }
}

/**
 * Start periodic cleanup (runs every hour)
 * @param {number} maxAgeHours - Max age in hours before deletion
 */
function startPeriodicCleanup(maxAgeHours = 24) {
    // Use /tmp on Vercel (serverless), local directory otherwise
    const pdfDir = process.env.VERCEL ? '/tmp/generated_pdfs' : 'generated_pdfs';

    const intervalMs = 60 * 60 * 1000;  // 1 hour

    // Run immediately
    cleanupOldPDFs(pdfDir, maxAgeHours);

    // Then run every hour
    setInterval(() => {
        cleanupOldPDFs(pdfDir, maxAgeHours);
    }, intervalMs);

    console.log(`Started periodic PDF cleanup (every 1 hour, max age: ${maxAgeHours} hours)`);
}

module.exports = {
    cleanupOldPDFs,
    startPeriodicCleanup
};
