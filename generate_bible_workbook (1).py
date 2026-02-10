#!/usr/bin/env python3
"""
Bible Transcription Workbook Generator
Modular version with configuration support
"""

import re
import json
import os
import sys
import requests

# Fix for Python 3.7 compatibility with reportlab
if sys.version_info < (3, 9):
    import hashlib
    _old_md5 = hashlib.md5
    def _new_md5(*args, **kwargs):
        kwargs.pop('usedforsecurity', None)
        return _old_md5(*args, **kwargs)
    hashlib.md5 = _new_md5

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

# ============================================================================
# CONFIGURATION - EDIT THESE VALUES
# ============================================================================

CONFIG = {
    # Bible version (currently only BSB supported via fetch.bible)
    'version': 'eng_bsb',  # Berean Standard Bible
    
    # Book to generate (use 3-letter codes: mat, mrk, luk, jhn, act, rom, etc.)
    'book': 'psa',
    'book_name': 'Psalms',
    
    # Layout settings
    'page_size': letter,  # or A4: (8.27 * inch, 11.69 * inch)
    'margins': {
        'left': 0.75 * inch,
        'right': 0.75 * inch,
        'top': 0.75 * inch,
        'bottom': 0.75 * inch
    },
    
    # Line spacing (distance between lines)
    'line_height': 0.30 * inch,  # Change this! Try 0.25, 0.30, 0.35, 0.40, etc.
    
    # Font settings
    'fonts': {
        'verse_label': {
            'name': 'Helvetica-Bold',  # Options: Helvetica, Helvetica-Bold, Times-Roman, Times-Bold, Courier
            'size': 9
        },
        'page_number': {
            'name': 'Helvetica',
            'size': 10
        }
    },
    
    # Text analysis settings
    'chars_per_line': 65,  # Average characters that fit on a line
    'whole_word_factor': 0.85,  # Adjustment for not splitting words
    
    # Verse label settings
    'verse_label_width': 0.8 * inch,
    
    # Line appearance
    'line_color': (0.7, 0.7, 0.7),  # RGB: (0.7, 0.7, 0.7) = gray
    'line_width': 0.5,  # Line thickness in points
    
    # Cache directory
    'cache_dir': 'bible_cache'
}

# ============================================================================
# FETCH.BIBLE API BOOK CODES
# ============================================================================
# Common book codes for reference:
# Old Testament: gen, exo, lev, num, deu, jos, jdg, rut, 1sa, 2sa, 1ki, 2ki,
#                1ch, 2ch, ezr, neh, est, job, psa, pro, ecc, sng, isa, jer,
#                lam, ezk, dan, hos, jol, amo, oba, jon, mic, nam, hab, zep,
#                hag, zec, mal
# New Testament: mat, mrk, luk, jhn, act, rom, 1co, 2co, gal, eph, php, col,
#                1th, 2th, 1ti, 2ti, tit, phm, heb, jas, 1pe, 2pe, 1jn, 2jn,
#                3jn, jud, rev

# ============================================================================
# CORE FUNCTIONS
# ============================================================================

def fetch_book_from_api(version, book):
    """Fetch entire book from fetch.bible"""
    cache_dir = CONFIG['cache_dir']
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir)
    
    cache_file = os.path.join(cache_dir, f"{version}_{book}.json")
    
    # Check cache first
    if os.path.exists(cache_file):
        print(f"Loading {book.upper()} from cache... ", end="", flush=True)
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            print(f"✓")
            return data
        except Exception as e:
            print(f"✗ Cache error: {e}, will re-fetch")
            try:
                os.remove(cache_file)
            except:
                pass
    
    # Fetch from API
    url = f"https://v1.fetch.bible/bibles/{version}/html/{book}.json"
    print(f"Fetching {book.upper()} from API... ", end="", flush=True)
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        # Save to cache
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✓")
        return data
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def extract_verse_text(html_string):
    """Extract clean text from HTML string"""
    # Remove all HTML tags
    text = re.sub(r'<[^>]+>', '', html_string)
    # Remove verse numbers (standalone digits at the start)
    text = re.sub(r'^\d+\s*', '', text)
    # Remove footnote markers
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def parse_book_data(data):
    """Parse the fetch.bible format into verses and return chapter info"""
    all_verses = {}
    chapter_counts = {}
    
    contents = data.get('contents', [])
    
    print("\nParsing chapters...")
    for chapter_num in range(1, len(contents)):
        chapter_data = contents[chapter_num]
        verses_in_chapter = {}
        
        for verse_num in range(1, len(chapter_data)):
            verse_array = chapter_data[verse_num]
            
            verse_text_parts = []
            for part in verse_array:
                clean_text = extract_verse_text(part)
                if clean_text:
                    verse_text_parts.append(clean_text)
            
            verse_text = ' '.join(verse_text_parts).strip()
            
            # Remove any remaining verse numbers at the start
            verse_text = re.sub(r'^\d+\s+', '', verse_text)
            
            if verse_text:
                verses_in_chapter[verse_num] = verse_text
        
        if verses_in_chapter:
            all_verses[chapter_num] = verses_in_chapter
            verse_count = len(verses_in_chapter)
            chapter_counts[chapter_num] = verse_count
            print(f"  ✓ Chapter {chapter_num}: {verse_count} verses")
    
    return all_verses, chapter_counts

def analyze_verse(text):
    """Analyze verse to get word count and average word length"""
    words = re.findall(r'\b\w+\b', text)
    word_count = len(words)
    if word_count > 0:
        avg_length = sum(len(word) for word in words) / word_count
    else:
        avg_length = 5.0
    return word_count, avg_length

def calculate_lines_needed(word_count, avg_word_length):
    """Calculate lines needed based on word count and average word length"""
    estimated_chars = word_count * avg_word_length + (word_count - 1)
    chars_per_line = CONFIG['chars_per_line']
    effective_chars = chars_per_line * CONFIG['whole_word_factor']
    lines = int((estimated_chars + effective_chars - 1) // effective_chars)
    return max(1, min(lines, 8))

def create_workbook(output_filename, verse_data, chapters, book_name):
    """Create PDF workbook for transcribing"""
    c = canvas.Canvas(output_filename, pagesize=CONFIG['page_size'])
    page_width, page_height = CONFIG['page_size']
    
    # Layout settings
    left_margin = CONFIG['margins']['left']
    right_margin = CONFIG['margins']['right']
    top_margin = CONFIG['margins']['top']
    bottom_margin = CONFIG['margins']['bottom']
    line_height = CONFIG['line_height']
    
    usable_height = page_height - top_margin - bottom_margin
    lines_per_page = int(usable_height / line_height)
    
    verse_label_width = CONFIG['verse_label_width']
    writing_area_start = left_margin + verse_label_width
    
    page_num = 1
    line_on_page = 0
    
    total_lines = 0
    line_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0}
    
    print(f"\nCreating workbook with {lines_per_page} lines per page...")
    
    for chapter, verse_count in chapters.items():
        for verse in range(1, verse_count + 1):
            if (chapter, verse) not in verse_data:
                print(f"  WARNING: Missing data for {chapter}:{verse}, using default")
                word_count, avg_word_length = 18, 5.0
            else:
                word_count, avg_word_length = verse_data[(chapter, verse)]
            
            lines_needed = calculate_lines_needed(word_count, avg_word_length)
            total_lines += lines_needed
            line_distribution[lines_needed] += 1
            
            # Check if we need a new page
            if line_on_page + lines_needed > lines_per_page:
                c.setFont(CONFIG['fonts']['page_number']['name'], 
                         CONFIG['fonts']['page_number']['size'])
                c.drawCentredString(page_width / 2, 0.5 * inch, str(page_num))
                c.showPage()
                page_num += 1
                line_on_page = 0
            
            # Draw verse label on first line
            y_pos = page_height - top_margin - (line_on_page * line_height) - 0.15 * inch
            c.setFont(CONFIG['fonts']['verse_label']['name'], 
                     CONFIG['fonts']['verse_label']['size'])
            verse_label = f"{chapter}:{verse}"
            c.drawString(left_margin, y_pos, verse_label)
            
            # Draw all lines for this verse
            for line_num in range(lines_needed):
                y_pos = page_height - top_margin - (line_on_page * line_height) - 0.15 * inch
                c.setStrokeColorRGB(*CONFIG['line_color'])
                c.setLineWidth(CONFIG['line_width'])
                line_y = y_pos - 0.05 * inch
                c.line(writing_area_start, line_y, page_width - right_margin, line_y)
                line_on_page += 1
    
    # Final page number
    c.setFont(CONFIG['fonts']['page_number']['name'], 
             CONFIG['fonts']['page_number']['size'])
    c.drawCentredString(page_width / 2, 0.5 * inch, str(page_num))
    c.save()
    
    print(f"✓ Created workbook: {output_filename}")
    print(f"  Total pages: {page_num}")
    print(f"  Total chapters: {len(chapters)}")
    print(f"  Total verses: {sum(chapters.values())}")
    print(f"  Total lines: {total_lines}")
    print(f"\nLine distribution:")
    for lines, count in sorted(line_distribution.items()):
        if count > 0:
            pct = count / sum(chapters.values()) * 100
            print(f"  {lines} line(s): {count} verses ({pct:.1f}%)")

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    print("="*70)
    print(f"{CONFIG['book_name']} {CONFIG['version'].upper()} Transcription Workbook Generator")
    print("="*70)
    
    # Step 1: Fetch and parse
    print(f"\nStep 1: Fetching {CONFIG['book_name']} from fetch.bible")
    print("-"*70)
    
    book_data = fetch_book_from_api(CONFIG['version'], CONFIG['book'])
    if not book_data:
        print(f"ERROR: Failed to fetch {CONFIG['book_name']} data!")
        return 1
    
    all_verses, chapter_counts = parse_book_data(book_data)
    
    # Create verse data structures
    all_verses_data = {}
    all_verses_text = {}
    
    for chapter_num, verses in all_verses.items():
        for verse_num, text in verses.items():
            wc, al = analyze_verse(text)
            all_verses_data[(chapter_num, verse_num)] = (wc, al)
            all_verses_text[(chapter_num, verse_num)] = text
    
    print(f"\nTotal verses loaded: {len(all_verses_data)}")
    print(f"Total chapters: {len(chapter_counts)}")
    
    # Step 2: Save compiled data
    print("\nStep 2: Saving compiled verse data")
    print("-"*70)
    
    data_file = f'{CONFIG["book"]}_data.py'
    with open(data_file, 'w', encoding='utf-8') as f:
        f.write(f"# {CONFIG['book_name']} {CONFIG['version'].upper()} Exact Verse Data\n\n")
        f.write("VERSE_DATA = {\n")
        for (chapter, verse), (wc, al) in sorted(all_verses_data.items()):
            f.write(f"    ({chapter}, {verse}): ({wc}, {al:.2f}),\n")
        f.write("}\n\n")
        f.write("CHAPTER_COUNTS = {\n")
        for chapter, count in sorted(chapter_counts.items()):
            f.write(f"    {chapter}: {count},\n")
        f.write("}\n")
    
    print(f"✓ Saved verse statistics to {data_file}")
    
    # Save full text
    text_file = f'{CONFIG["book"]}_text.json'
    text_data = {}
    for (chapter, verse), text in sorted(all_verses_text.items()):
        chapter_key = f"chapter_{chapter}"
        if chapter_key not in text_data:
            text_data[chapter_key] = {}
        text_data[chapter_key][str(verse)] = text
    
    with open(text_file, 'w', encoding='utf-8') as f:
        json.dump(text_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved full verse text to {text_file}")
    
    # Step 3: Generate the workbook
    print("\nStep 3: Generating PDF workbook")
    print("-"*70)
    
    output_pdf = f"{CONFIG['book_name']}_Transcription_Workbook.pdf"
    create_workbook(output_pdf, all_verses_data, chapter_counts, CONFIG['book_name'])
    
    print("\n" + "="*70)
    print(f"✓ COMPLETE! Your workbook is ready: {output_pdf}")
    print("="*70)
    print("\nWorkbook specifications:")
    print(f"  - Book: {CONFIG['book_name']}")
    print(f"  - Version: {CONFIG['version'].upper()}")
    print(f"  - Line spacing: {CONFIG['line_height'] / inch:.2f} inches")
    print(f"  - Font: {CONFIG['fonts']['verse_label']['name']} {CONFIG['fonts']['verse_label']['size']}pt")
    print(f"  - Characters per line: {CONFIG['chars_per_line']}")
    print(f"\nTo customize, edit the CONFIG section at the top of this script!")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())