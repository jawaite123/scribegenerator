/**
 * Text Analysis Service
 * Analyzes Bible verses to calculate lines needed for transcription
 * Ported from generate_bible_workbook.py lines 183-199
 */

/**
 * Analyze verse to get word count and average word length
 * Ported from: analyze_verse() lines 183-191
 */
function analyzeVerse(text) {
    const words = text.match(/\b\w+\b/g) || [];
    const wordCount = words.length;

    let avgLength = 5.0;
    if (wordCount > 0) {
        const totalLength = words.reduce((sum, word) => sum + word.length, 0);
        avgLength = totalLength / wordCount;
    }

    return {
        wordCount,
        avgWordLength: avgLength
    };
}

/**
 * Calculate lines needed based on word count and average word length
 * Ported from: calculate_lines_needed() lines 193-199
 */
function calculateLinesNeeded(wordCount, avgWordLength, config) {
    const estimatedChars = wordCount * avgWordLength + (wordCount - 1);
    const charsPerLine = config.charsPerLine || 65;
    const wholeWordFactor = config.wholeWordFactor || 0.85;
    const effectiveChars = charsPerLine * wholeWordFactor;

    const lines = Math.floor((estimatedChars + effectiveChars - 1) / effectiveChars);

    // Return between 1 and 8 lines
    return Math.max(1, Math.min(lines, 8));
}

/**
 * Analyze all verses in a book
 * Returns map of verse data: { "chapter:verse": { wordCount, avgWordLength, linesNeeded } }
 */
function analyzeAllVerses(verses, config) {
    const verseData = {};

    for (const [chapter, versesInChapter] of Object.entries(verses)) {
        for (const [verse, text] of Object.entries(versesInChapter)) {
            const { wordCount, avgWordLength } = analyzeVerse(text);
            const linesNeeded = calculateLinesNeeded(wordCount, avgWordLength, config);

            const key = `${chapter}:${verse}`;
            verseData[key] = {
                wordCount,
                avgWordLength,
                linesNeeded
            };
        }
    }

    return verseData;
}

module.exports = {
    analyzeVerse,
    calculateLinesNeeded,
    analyzeAllVerses
};
