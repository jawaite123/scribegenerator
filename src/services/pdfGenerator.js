const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * PDF Workbook Generator using PDFKit
 * Rewritten from generate_bible_workbook.py lines 201-279
 * Uses PDFKit instead of reportlab but maintains same layout and output
 */

class WorkbookGenerator {
    constructor(config) {
        this.config = config;
        // Convert inches to points (72 points = 1 inch)
        this.POINTS_PER_INCH = 72;
    }

    /**
     * Convert inches to points for PDFKit
     */
    toPoints(inches) {
        return inches * this.POINTS_PER_INCH;
    }

    /**
     * Convert hex color to RGB array for PDFKit
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return [
                parseInt(result[1], 16) / 255,
                parseInt(result[2], 16) / 255,
                parseInt(result[3], 16) / 255
            ];
        }
        // Default to gray if parsing fails
        return [0.7, 0.7, 0.7];
    }

    /**
     * Create PDF workbook for transcribing
     * Main method - ported from create_workbook() lines 201-279
     */
    async createWorkbook(verseData, chapterCounts, taskId, bookName) {
        const pdfPath = path.join('generated_pdfs', `${taskId}.pdf`);

        // Parse page size
        let pageSize = [
            this.toPoints(8.5),  // width
            this.toPoints(11)    // height (US Letter default)
        ];

        if (this.config.pageSize === 'a4') {
            pageSize = [this.toPoints(8.27), this.toPoints(11.69)];
        } else if (this.config.pageSize === '6x9') {
            pageSize = [this.toPoints(6), this.toPoints(9)];
        } else if (this.config.pageSize === 'ipad') {
            pageSize = [this.toPoints(7.3), this.toPoints(9.7)];
        } else if (Array.isArray(this.config.pageSize)) {
            pageSize = this.config.pageSize;
        }

        // Create PDF document
        const doc = new PDFDocument({
            size: pageSize,
            margins: {
                top: this.toPoints(this.config.margins.top),
                bottom: this.toPoints(this.config.margins.bottom),
                left: this.toPoints(this.config.margins.left),
                right: this.toPoints(this.config.margins.right)
            }
        });

        // Pipe to file
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // Layout calculations
        const pageWidth = pageSize[0];
        const pageHeight = pageSize[1];
        const leftMargin = this.toPoints(this.config.margins.left);
        const rightMargin = this.toPoints(this.config.margins.right);
        const topMargin = this.toPoints(this.config.margins.top);
        const bottomMargin = this.toPoints(this.config.margins.bottom);
        const lineHeight = this.toPoints(this.config.lineHeight);

        const usableHeight = pageHeight - topMargin - bottomMargin;
        const linesPerPage = Math.floor(usableHeight / lineHeight);

        const verseLabelWidth = this.toPoints(this.config.verseLabelWidth);
        const writingAreaStart = leftMargin + verseLabelWidth;

        let pageNum = 1;
        let lineOnPage = 0;

        let totalLines = 0;
        const lineDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };

        console.log(`\nCreating workbook with ${linesPerPage} lines per page...`);

        // Iterate through chapters and verses
        for (const [chapter, verseCount] of Object.entries(chapterCounts)) {
            for (let verse = 1; verse <= verseCount; verse++) {
                const key = `${chapter}:${verse}`;
                const verseInfo = verseData[key];

                if (!verseInfo) {
                    console.log(`  WARNING: Missing data for ${key}, using default`);
                    var linesNeeded = 2;  // default
                } else {
                    var linesNeeded = verseInfo.linesNeeded;
                }

                totalLines += linesNeeded;
                lineDistribution[linesNeeded] = (lineDistribution[linesNeeded] || 0) + 1;

                // Check if we need a new page
                if (lineOnPage + linesNeeded > linesPerPage) {
                    this.addPageNumber(doc, pageNum, pageWidth, pageHeight);
                    doc.addPage();
                    pageNum++;
                    lineOnPage = 0;
                }

                // Draw verse label and lines
                this.drawVerse(
                    doc,
                    chapter,
                    verse,
                    linesNeeded,
                    lineOnPage,
                    lineHeight,
                    pageHeight,
                    topMargin,
                    leftMargin,
                    writingAreaStart,
                    pageWidth,
                    rightMargin
                );

                lineOnPage += linesNeeded;
            }
        }

        // Final page number
        this.addPageNumber(doc, pageNum, pageWidth, pageHeight);

        // Finalize PDF
        doc.end();

        // Wait for stream to finish
        await new Promise((resolve, reject) => {
            stream.on('finish', () => {
                console.log(`✓ Created workbook: ${pdfPath}`);
                console.log(`  Total pages: ${pageNum}`);
                console.log(`  Total chapters: ${Object.keys(chapterCounts).length}`);
                console.log(`  Total verses: ${Object.values(chapterCounts).reduce((a, b) => a + b, 0)}`);
                console.log(`  Total lines: ${totalLines}`);
                console.log('\nLine distribution:');

                for (const [lines, count] of Object.entries(lineDistribution)) {
                    if (count > 0) {
                        const totalVerses = Object.values(chapterCounts).reduce((a, b) => a + b, 0);
                        const pct = (count / totalVerses * 100).toFixed(1);
                        console.log(`  ${lines} line(s): ${count} verses (${pct}%)`);
                    }
                }

                resolve(pdfPath);
            });
            stream.on('error', reject);
        });

        return pdfPath;
    }

    /**
     * Draw verse label and lines for a single verse
     */
    drawVerse(doc, chapter, verse, linesNeeded, lineOnPage, lineHeight,
              pageHeight, topMargin, leftMargin, writingAreaStart,
              pageWidth, rightMargin) {

        // Calculate y position for first line (from top of page)
        const y = topMargin + (lineOnPage * lineHeight);

        // Draw verse label on first line (right-aligned to prevent wrapping)
        doc.fontSize(this.config.verseLabelSize)
           .font(this.config.verseLabelFont || 'Helvetica-Bold')
           .fillColor('black')
           .text(`${chapter}:${verse}`, leftMargin, y, {
               width: writingAreaStart - leftMargin,
               align: 'right'
           });

        // Parse line color
        let lineColor = [0.7, 0.7, 0.7];  // default gray
        if (typeof this.config.lineColor === 'string') {
            lineColor = this.hexToRgb(this.config.lineColor);
        } else if (Array.isArray(this.config.lineColor)) {
            lineColor = this.config.lineColor;
        }

        // Draw all lines for this verse
        for (let i = 0; i < linesNeeded; i++) {
            const lineY = y + (i * lineHeight) + this.toPoints(0.15);

            doc.strokeColor(lineColor[0] * 255, lineColor[1] * 255, lineColor[2] * 255)
               .lineWidth(this.config.lineWidth || 0.5)
               .moveTo(writingAreaStart, lineY)
               .lineTo(pageWidth - rightMargin, lineY)
               .stroke();
        }
    }

    /**
     * Add page number at bottom center
     */
    addPageNumber(doc, pageNum, pageWidth, pageHeight) {
        // Save current position
        const fontSize = this.config.pageNumberSize || 10;
        const pageNumStr = String(pageNum);

        // Calculate center position
        const textWidth = doc.font(this.config.pageNumberFont || 'Helvetica')
                             .fontSize(fontSize)
                             .widthOfString(pageNumStr);

        const x = (pageWidth - textWidth) / 2;
        const y = pageHeight - this.toPoints(0.5);

        // Draw page number without triggering auto-pagination
        doc.fontSize(fontSize)
           .font(this.config.pageNumberFont || 'Helvetica')
           .fillColor('black')
           .text(pageNumStr, x, y, {
               lineBreak: false
           });
    }
}

module.exports = WorkbookGenerator;
