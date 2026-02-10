MODULAR BIBLE TRANSCRIPTION WORKBOOK GENERATOR
==============================================

This script generates custom handwriting transcription workbooks for any book
of the Bible using the fetch.bible API.

QUICK START
-----------
1. Install requirements:
   pip install requests reportlab

2. Run the script:
   python3 generate_bible_workbook.py

3. Your PDF will be created!

CUSTOMIZATION
-------------
All settings are in the CONFIG dictionary at the top of the script.
Edit these values to customize your workbook:

┌─────────────────────────────────────────────────────────────────┐
│ CHANGING THE BOOK                                               │
└─────────────────────────────────────────────────────────────────┘

'book': 'luk',           # 3-letter book code
'book_name': 'Luke',     # Full name for display

Common book codes:
  Old Testament: gen, exo, lev, num, deu, psa, pro, isa, jer, dan
  Gospels: mat, mrk, luk, jhn
  Acts & Letters: act, rom, 1co, 2co, gal, eph, php, col, heb, jas
  Revelation: rev

'chapters': {...}        # Update chapter/verse counts for your book
                         # You can find these online or the script will
                         # auto-detect them from the downloaded data

┌─────────────────────────────────────────────────────────────────┐
│ CHANGING LINE SPACING                                           │
└─────────────────────────────────────────────────────────────────┘

'line_height': 0.30 * inch,

Examples:
  - Tight spacing:  0.25 * inch  (more lines per page)
  - Normal spacing: 0.30 * inch  (default)
  - Loose spacing:  0.35 * inch  (easier to write)
  - Extra loose:    0.40 * inch  (very spacious)

┌─────────────────────────────────────────────────────────────────┐
│ CHANGING FONTS                                                  │
└─────────────────────────────────────────────────────────────────┘

'fonts': {
    'verse_label': {
        'name': 'Helvetica-Bold',
        'size': 9
    },
    'page_number': {
        'name': 'Helvetica',
        'size': 10
    }
}

Available fonts:
  - Helvetica (clean, modern)
  - Helvetica-Bold
  - Times-Roman (traditional, serif)
  - Times-Bold
  - Courier (monospace, typewriter style)
  - Courier-Bold

Try different sizes: 8, 9, 10, 11, 12

┌─────────────────────────────────────────────────────────────────┐
│ CHANGING PAGE SIZE                                              │
└─────────────────────────────────────────────────────────────────┘

'page_size': letter,

Options:
  - letter: US Letter (8.5" × 11")
  - (8.27 * inch, 11.69 * inch): A4 (European)
  - (5.5 * inch, 8.5 * inch): Half-letter / Statement

┌─────────────────────────────────────────────────────────────────┐
│ CHANGING MARGINS                                                │
└─────────────────────────────────────────────────────────────────┘

'margins': {
    'left': 0.75 * inch,
    'right': 0.75 * inch,
    'top': 0.75 * inch,
    'bottom': 0.75 * inch
}

Try: 0.5 inch (narrow), 0.75 inch (normal), 1.0 inch (wide)

┌─────────────────────────────────────────────────────────────────┐
│ CHANGING LINE APPEARANCE                                        │
└─────────────────────────────────────────────────────────────────┘

'line_color': (0.7, 0.7, 0.7),  # RGB values (0.0 to 1.0)
'line_width': 0.5,               # Thickness in points

Color examples:
  - (0.7, 0.7, 0.7): Light gray (default)
  - (0.5, 0.5, 0.5): Medium gray
  - (0.0, 0.0, 0.0): Black
  - (0.0, 0.0, 1.0): Blue
  - (1.0, 0.0, 0.0): Red

Line width:
  - 0.3: Very thin
  - 0.5: Normal (default)
  - 0.8: Thick
  - 1.0: Very thick

┌─────────────────────────────────────────────────────────────────┐
│ CHANGING VERSE LABEL WIDTH                                      │
└─────────────────────────────────────────────────────────────────┘

'verse_label_width': 0.8 * inch,

This is the space on the left for "1:1", "1:2", etc.
Try: 0.6 inch (narrow), 0.8 inch (normal), 1.0 inch (wide)

┌─────────────────────────────────────────────────────────────────┐
│ CHANGING CHARACTERS PER LINE                                    │
└─────────────────────────────────────────────────────────────────┘

'chars_per_line': 65,

Affects how many lines are calculated for each verse.
- Lower number = more lines per verse (more space)
- Higher number = fewer lines per verse (tighter)

Try: 55 (loose), 65 (normal), 75 (tight)

┌─────────────────────────────────────────────────────────────────┐
│ EXAMPLE CONFIGURATIONS                                          │
└─────────────────────────────────────────────────────────────────┘

# Tight Workbook (for small handwriting)
'line_height': 0.25 * inch,
'chars_per_line': 75,
'fonts': {'verse_label': {'name': 'Helvetica', 'size': 8}}

# Spacious Workbook (for large handwriting)
'line_height': 0.40 * inch,
'chars_per_line': 55,
'fonts': {'verse_label': {'name': 'Helvetica-Bold', 'size': 11}}

# Traditional Style
'line_height': 0.30 * inch,
'fonts': {'verse_label': {'name': 'Times-Bold', 'size': 10}},
'line_color': (0.0, 0.0, 0.0),

# Kids/Teaching Style
'line_height': 0.50 * inch,
'chars_per_line': 45,
'fonts': {'verse_label': {'name': 'Helvetica-Bold', 'size': 12}},
'line_width': 1.0,

CREATING WORKBOOKS FOR OTHER BOOKS
-----------------------------------
To create a workbook for a different book:

1. Change 'book' to the 3-letter code (e.g., 'rom' for Romans)
2. Change 'book_name' to the full name (e.g., 'Romans')
3. Update 'chapters' dictionary with correct chapter/verse counts

You can find chapter/verse counts at:
https://www.blueletterbible.org/

Example for Romans:
'book': 'rom',
'book_name': 'Romans',
'chapters': {
    1: 32, 2: 29, 3: 31, 4: 25, 5: 21, 6: 23, 7: 25, 8: 39,
    9: 33, 10: 21, 11: 36, 12: 21, 13: 14, 14: 23, 15: 33, 16: 27
}

TROUBLESHOOTING
---------------
Q: Script fails with "book not found"
A: Make sure you're using the correct 3-letter book code from fetch.bible

Q: Line spacing looks wrong
A: Adjust 'line_height' in the CONFIG

Q: Too many/few lines per verse
A: Adjust 'chars_per_line' in the CONFIG

Q: PDF looks too crowded
A: Increase margins, line_height, or verse_label_width

Q: Want different Bible version
A: Currently only BSB (eng_bsb) is tested. Other versions on fetch.bible
   may work by changing 'version' in CONFIG.

SUPPORT
-------
For questions or issues, check the fetch.bible API documentation:
https://fetch.bible/