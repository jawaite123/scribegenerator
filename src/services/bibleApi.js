const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

/**
 * Bible API Service
 * Fetches and parses Bible data from fetch.bible API
 * Ported from generate_bible_workbook.py lines 93-181
 */

class BibleAPI {
    constructor(cacheDir = 'bible_cache') {
        this.cacheDir = cacheDir;
    }

    /**
     * Initialize cache directory
     */
    async initCache() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch (error) {
            // Directory already exists, ignore
        }
    }

    /**
     * Extract clean text from HTML string
     * Ported from: extract_verse_text() lines 136-144
     */
    extractVerseText(htmlString) {
        // Remove all HTML tags
        let text = htmlString.replace(/<[^>]+>/g, '');

        // Remove verse numbers (standalone digits at the start)
        text = text.replace(/^\d+\s*/, '');

        // Remove footnote markers and normalize whitespace
        text = text.replace(/\s+/g, ' ');

        return text.trim();
    }

    /**
     * Fetch entire book from fetch.bible API with caching
     * Ported from: fetch_book_from_api() lines 93-134
     */
    async fetchBook(version, book) {
        await this.initCache();

        const cacheFile = path.join(this.cacheDir, `${version}_${book}.json`);

        // Check cache first
        try {
            const exists = await fs.access(cacheFile).then(() => true).catch(() => false);

            if (exists) {
                console.log(`Loading ${book.toUpperCase()} from cache... ✓`);
                const data = await fs.readFile(cacheFile, 'utf-8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.log(`✗ Cache error: ${error.message}, will re-fetch`);
            try {
                await fs.unlink(cacheFile);
            } catch (e) {
                // Ignore
            }
        }

        // Fetch from API
        const url = `https://v1.fetch.bible/bibles/${version}/html/${book}.json`;
        console.log(`Fetching ${book.toUpperCase()} from API... `);

        try {
            const response = await fetch(url, { timeout: 30000 });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Save to cache
            await fs.writeFile(cacheFile, JSON.stringify(data, null, 2), 'utf-8');

            console.log('✓');
            return data;

        } catch (error) {
            console.log(`✗ Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Parse the fetch.bible format into verses and return chapter info
     * Ported from: parse_book_data() lines 146-181
     */
    parseBookData(data) {
        const allVerses = {};
        const chapterCounts = {};

        const contents = data.contents || [];

        console.log('\nParsing chapters...');

        // Start from index 1 to skip book info
        for (let chapterNum = 1; chapterNum < contents.length; chapterNum++) {
            const chapterData = contents[chapterNum];
            const versesInChapter = {};

            // Start from index 1 to skip chapter info
            for (let verseNum = 1; verseNum < chapterData.length; verseNum++) {
                const verseArray = chapterData[verseNum];
                const verseTextParts = [];

                for (const part of verseArray) {
                    const cleanText = this.extractVerseText(part);
                    if (cleanText) {
                        verseTextParts.push(cleanText);
                    }
                }

                let verseText = verseTextParts.join(' ').trim();

                // Remove any remaining verse numbers at the start
                verseText = verseText.replace(/^\d+\s+/, '');

                if (verseText) {
                    versesInChapter[verseNum] = verseText;
                }
            }

            if (Object.keys(versesInChapter).length > 0) {
                allVerses[chapterNum] = versesInChapter;
                const verseCount = Object.keys(versesInChapter).length;
                chapterCounts[chapterNum] = verseCount;
                console.log(`  ✓ Chapter ${chapterNum}: ${verseCount} verses`);
            }
        }

        return {
            verses: allVerses,
            chapterCounts
        };
    }
}

module.exports = BibleAPI;
