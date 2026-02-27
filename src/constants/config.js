/**
 * Configuration constants
 * Defines valid options for page sizes, fonts, and book codes
 */

// Page sizes (referenced from generate_bible_workbook.py lines 79-87)
const PAGE_SIZES = {
    letter: [612, 792],     // 8.5" x 11" in points
    a4: [595.44, 841.68],   // 8.27" x 11.69" in points
    '6x9': [432, 648],      // 6" x 9" in points (popular book size)
    ipad: [525.6, 698.4]    // 7.3" x 9.7" in points
};

// Available fonts (PDFKit standard fonts)
const FONTS = [
    'Helvetica',
    'Helvetica-Bold',
    'Helvetica-Oblique',
    'Helvetica-BoldOblique',
    'Times-Roman',
    'Times-Bold',
    'Times-Italic',
    'Times-BoldItalic',
    'Courier',
    'Courier-Bold',
    'Courier-Oblique',
    'Courier-BoldOblique'
];

// Bible book codes (from generate_bible_workbook.py lines 79-87)
const BOOK_CODES = {
    // Old Testament
    gen: 'Genesis',
    exo: 'Exodus',
    lev: 'Leviticus',
    num: 'Numbers',
    deu: 'Deuteronomy',
    jos: 'Joshua',
    jdg: 'Judges',
    rut: 'Ruth',
    '1sa': '1 Samuel',
    '2sa': '2 Samuel',
    '1ki': '1 Kings',
    '2ki': '2 Kings',
    '1ch': '1 Chronicles',
    '2ch': '2 Chronicles',
    ezr: 'Ezra',
    neh: 'Nehemiah',
    est: 'Esther',
    job: 'Job',
    psa: 'Psalms',
    pro: 'Proverbs',
    ecc: 'Ecclesiastes',
    sng: 'Song of Solomon',
    isa: 'Isaiah',
    jer: 'Jeremiah',
    lam: 'Lamentations',
    ezk: 'Ezekiel',
    dan: 'Daniel',
    hos: 'Hosea',
    jol: 'Joel',
    amo: 'Amos',
    oba: 'Obadiah',
    jon: 'Jonah',
    mic: 'Micah',
    nam: 'Nahum',
    hab: 'Habakkuk',
    zep: 'Zephaniah',
    hag: 'Haggai',
    zec: 'Zechariah',
    mal: 'Malachi',

    // New Testament
    mat: 'Matthew',
    mrk: 'Mark',
    luk: 'Luke',
    jhn: 'John',
    act: 'Acts',
    rom: 'Romans',
    '1co': '1 Corinthians',
    '2co': '2 Corinthians',
    gal: 'Galatians',
    eph: 'Ephesians',
    php: 'Philippians',
    col: 'Colossians',
    '1th': '1 Thessalonians',
    '2th': '2 Thessalonians',
    '1ti': '1 Timothy',
    '2ti': '2 Timothy',
    tit: 'Titus',
    phm: 'Philemon',
    heb: 'Hebrews',
    jas: 'James',
    '1pe': '1 Peter',
    '2pe': '2 Peter',
    '1jn': '1 John',
    '2jn': '2 John',
    '3jn': '3 John',
    jud: 'Jude',
    rev: 'Revelation'
};

// Default configuration (from generate_bible_workbook.py lines 30-75)
const DEFAULT_CONFIG = {
    version: 'eng_bsb',  // Berean Standard Bible
    book: 'mat',
    bookName: 'Matthew',
    pageSize: 'letter',
    margins: {
        left: 0.75,
        right: 0.75,
        top: 0.75,
        bottom: 0.75
    },
    lineHeight: 0.30,
    verseLabelFont: 'Helvetica-Bold',
    verseLabelSize: 9,
    pageNumberFont: 'Helvetica',
    pageNumberSize: 10,
    charsPerLine: 65,
    wholeWordFactor: 0.85,
    verseLabelWidth: 0.8,
    lineColor: '#b3b3b3',  // Gray
    lineWidth: 0.5
};

module.exports = {
    PAGE_SIZES,
    FONTS,
    BOOK_CODES,
    DEFAULT_CONFIG
};
