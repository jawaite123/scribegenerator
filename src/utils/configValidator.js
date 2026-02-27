const { PAGE_SIZES, FONTS, BOOK_CODES, DEFAULT_CONFIG } = require('../constants/config');

/**
 * Configuration Validator
 * Validates and normalizes form input data into proper config format
 */

/**
 * Validate and transform form data into CONFIG object
 */
function validateConfig(formData) {
    const config = { ...DEFAULT_CONFIG };

    // Bible selection
    if (formData.book && BOOK_CODES[formData.book]) {
        config.book = formData.book;
        config.bookName = formData.bookName || BOOK_CODES[formData.book];
    }

    // Version (always BSB for now)
    config.version = formData.version || 'eng_bsb';

    // Page size
    if (formData.pageSize && PAGE_SIZES[formData.pageSize]) {
        config.pageSize = formData.pageSize;
    }

    // Margins (validate as numbers between 0.25 and 2.0 inches)
    const validateMargin = (value, defaultValue) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0.25 || num > 2.0) {
            return defaultValue;
        }
        return num;
    };

    config.margins = {
        left: validateMargin(formData.marginLeft, DEFAULT_CONFIG.margins.left),
        right: validateMargin(formData.marginRight, DEFAULT_CONFIG.margins.right),
        top: validateMargin(formData.marginTop, DEFAULT_CONFIG.margins.top),
        bottom: validateMargin(formData.marginBottom, DEFAULT_CONFIG.margins.bottom)
    };

    // Line height (0.2 to 0.6 inches)
    const lineHeight = parseFloat(formData.lineHeight);
    if (!isNaN(lineHeight) && lineHeight >= 0.2 && lineHeight <= 0.6) {
        config.lineHeight = lineHeight;
    }

    // Font settings
    if (formData.verseLabelFont && FONTS.includes(formData.verseLabelFont)) {
        config.verseLabelFont = formData.verseLabelFont;
    }

    const verseLabelSize = parseInt(formData.verseLabelSize);
    if (!isNaN(verseLabelSize) && verseLabelSize >= 6 && verseLabelSize <= 14) {
        config.verseLabelSize = verseLabelSize;
    }

    if (formData.pageNumberFont && FONTS.includes(formData.pageNumberFont)) {
        config.pageNumberFont = formData.pageNumberFont;
    }

    const pageNumberSize = parseInt(formData.pageNumberSize);
    if (!isNaN(pageNumberSize) && pageNumberSize >= 6 && pageNumberSize <= 14) {
        config.pageNumberSize = pageNumberSize;
    }

    // Characters per line (45 to 85)
    const charsPerLine = parseInt(formData.charsPerLine);
    if (!isNaN(charsPerLine) && charsPerLine >= 45 && charsPerLine <= 85) {
        config.charsPerLine = charsPerLine;
    }

    // Whole word factor (0.70 to 0.95)
    const wholeWordFactor = parseFloat(formData.wholeWordFactor);
    if (!isNaN(wholeWordFactor) && wholeWordFactor >= 0.70 && wholeWordFactor <= 0.95) {
        config.wholeWordFactor = wholeWordFactor;
    }

    // Verse label width (0.3 to 1.5 inches)
    const verseLabelWidth = parseFloat(formData.verseLabelWidth);
    if (!isNaN(verseLabelWidth) && verseLabelWidth >= 0.3 && verseLabelWidth <= 1.5) {
        config.verseLabelWidth = verseLabelWidth;
    }

    // Line color (hex string)
    if (formData.lineColor && /^#[0-9A-F]{6}$/i.test(formData.lineColor)) {
        config.lineColor = formData.lineColor;
    }

    // Line width (0.1 to 2.0 points)
    const lineWidth = parseFloat(formData.lineWidth);
    if (!isNaN(lineWidth) && lineWidth >= 0.1 && lineWidth <= 2.0) {
        config.lineWidth = lineWidth;
    }

    return config;
}

module.exports = {
    validateConfig
};
