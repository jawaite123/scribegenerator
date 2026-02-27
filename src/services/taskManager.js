const { v4: uuidv4 } = require('uuid');
const BibleAPI = require('./bibleApi');
const { analyzeAllVerses } = require('./textAnalysis');
const WorkbookGenerator = require('./pdfGenerator');

/**
 * Task Manager
 * Manages background PDF generation tasks with progress tracking
 */

class TaskManager {
    constructor() {
        this.tasks = new Map();
        this.bibleApi = new BibleAPI();
    }

    /**
     * Create a new task and return task ID
     */
    createTask() {
        const taskId = uuidv4();
        this.tasks.set(taskId, {
            status: 'pending',
            progress: 0,
            createdAt: Date.now()
        });
        return taskId;
    }

    /**
     * Update task with new data
     */
    updateTask(taskId, updates) {
        const task = this.tasks.get(taskId);
        if (task) {
            Object.assign(task, updates);
        }
    }

    /**
     * Get task status
     */
    getTask(taskId) {
        return this.tasks.get(taskId);
    }

    /**
     * Generate PDF in background
     * This is the main async function that orchestrates PDF generation
     */
    async generatePDF(config, taskId) {
        try {
            // Step 1: Fetching Bible data
            this.updateTask(taskId, { status: 'fetching', progress: 10 });
            console.log(`\n[Task ${taskId}] Fetching ${config.bookName}...`);

            const bookData = await this.bibleApi.fetchBook(config.version, config.book);

            if (!bookData) {
                throw new Error('Failed to fetch book data from API');
            }

            // Step 2: Parsing data
            this.updateTask(taskId, { status: 'parsing', progress: 30 });
            console.log(`[Task ${taskId}] Parsing book data...`);

            const { verses, chapterCounts } = this.bibleApi.parseBookData(bookData);

            // Step 3: Analyzing verses
            this.updateTask(taskId, { status: 'analyzing', progress: 50 });
            console.log(`[Task ${taskId}] Analyzing verses...`);

            const verseData = analyzeAllVerses(verses, config);

            console.log(`[Task ${taskId}] Total verses loaded: ${Object.keys(verseData).length}`);
            console.log(`[Task ${taskId}] Total chapters: ${Object.keys(chapterCounts).length}`);

            // Step 4: Generating PDF
            this.updateTask(taskId, { status: 'generating', progress: 70 });
            console.log(`[Task ${taskId}] Generating PDF workbook...`);

            const generator = new WorkbookGenerator(config);
            const pdfPath = await generator.createWorkbook(
                verseData,
                chapterCounts,
                taskId,
                config.bookName
            );

            // Step 5: Complete
            this.updateTask(taskId, {
                status: 'complete',
                progress: 100,
                pdfPath,
                completedAt: Date.now()
            });

            console.log(`[Task ${taskId}] ✓ Generation complete!`);

        } catch (error) {
            console.error(`[Task ${taskId}] ✗ Error:`, error.message);
            this.updateTask(taskId, {
                status: 'error',
                error: error.message,
                failedAt: Date.now()
            });
        }
    }

    /**
     * Clean up completed/failed tasks older than specified time
     * @param {number} maxAgeMs - Max age in milliseconds
     */
    cleanupOldTasks(maxAgeMs = 24 * 60 * 60 * 1000) {
        const now = Date.now();
        let removed = 0;

        for (const [taskId, task] of this.tasks.entries()) {
            const taskAge = now - task.createdAt;
            const isComplete = task.status === 'complete' || task.status === 'error';

            if (isComplete && taskAge > maxAgeMs) {
                this.tasks.delete(taskId);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`Cleaned up ${removed} old task(s) from memory`);
        }

        return removed;
    }

    /**
     * Get statistics about current tasks
     */
    getStats() {
        const stats = {
            total: this.tasks.size,
            pending: 0,
            fetching: 0,
            parsing: 0,
            analyzing: 0,
            generating: 0,
            complete: 0,
            error: 0
        };

        for (const task of this.tasks.values()) {
            stats[task.status]++;
        }

        return stats;
    }
}

// Export singleton instance
module.exports = new TaskManager();
