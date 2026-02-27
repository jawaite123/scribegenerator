# Bible Workbook Generator - Project Documentation

## Overview

This is a web application that generates custom Bible transcription workbooks as PDFs. Users can configure page size, fonts, line spacing, margins, and more through a web interface.

**Original**: Python CLI script using reportlab
**Current**: Node.js/Express web app using PDFKit

## Tech Stack

- **Backend**: Node.js + Express.js
- **PDF Generation**: PDFKit (ported from Python reportlab)
- **Frontend**: Bootstrap 5 + Vanilla JavaScript
- **Bible Data**: fetch.bible API (BSB - Berean Standard Bible)
- **Deployment**: Vercel (serverless)

## Key Features

1. **Web Interface** - Bootstrap form with all customization options
2. **Background PDF Generation** - Async processing with real-time progress tracking
3. **Preset Configurations** - Default, Large Print, Compact, 6×9 Book, iPad
4. **Multiple Page Sizes** - US Letter, A4, 6×9 (book size), iPad
5. **Full Customization** - Margins, line spacing, fonts, line appearance, etc.
6. **Automatic Cleanup** - Old PDFs deleted after 24 hours

## Project Structure

```
scribegenerator/
├── server.js                   # Express server entry point
├── package.json                # Dependencies
├── vercel.json                 # Vercel deployment config
├── .github/workflows/          # GitHub Actions for auto-deploy
│
├── src/
│   ├── services/
│   │   ├── bibleApi.js        # Fetch & cache Bible data
│   │   ├── textAnalysis.js    # Calculate lines needed per verse
│   │   ├── pdfGenerator.js    # Generate PDF with PDFKit
│   │   └── taskManager.js     # Background task tracking
│   ├── routes/
│   │   ├── api.js             # API endpoints
│   │   └── index.js           # Serve HTML
│   ├── utils/
│   │   ├── configValidator.js # Validate form input
│   │   ├── cleanup.js         # Auto-delete old PDFs
│   │   └── constants/config.js # Page sizes, fonts, book codes
│
├── public/
│   ├── index.html             # Main UI
│   ├── js/generator.js        # Frontend logic
│   ├── css/style.css          # Custom styles
│   └── presets/               # JSON preset files
│
├── bible_cache/               # Local: cached Bible data
└── generated_pdfs/            # Local: temporary PDFs
```

## How It Works

### 1. User Configures Workbook
- Selects Bible book (Matthew, Mark, Luke, etc.)
- Chooses page size (Letter, A4, 6×9, iPad)
- Customizes margins, line spacing, fonts
- Can load presets or customize everything

### 2. PDF Generation Process

```
User clicks "Generate"
  ↓
Frontend: POST /api/generate with config
  ↓
Backend: Creates task ID, starts background generation
  ↓
1. Fetch Bible text from fetch.bible API (cached)
2. Parse book data into chapters/verses
3. Analyze each verse (word count, average length)
4. Calculate lines needed per verse
5. Generate PDF with PDFKit
  ↓
Frontend: Polls /api/status/:taskId every 1 second
  ↓
Progress updates: fetching → parsing → analyzing → generating
  ↓
Complete: Download PDF via /api/download/:taskId
```

### 3. Line Calculation Algorithm

Each verse's line count is calculated based on:

```javascript
estimatedChars = wordCount × avgWordLength + (wordCount - 1)
effectiveChars = charsPerLine × wholeWordFactor
linesNeeded = Math.ceil(estimatedChars / effectiveChars)
// Clamped between 1-8 lines
```

**Whole Word Factor** (default 0.85): Accounts for the fact that words don't break mid-word, so only ~85% of each line's character capacity is usable.

### 4. PDF Layout

```
Page structure:
┌─────────────────────────────────────┐
│ Top Margin                          │
│                                     │
│ [1:1]  ___________________         │ ← Verse label (right-aligned)
│        ___________________         │ ← Lines for handwriting
│ [1:2]  ___________________         │
│        ___________________         │
│        ___________________         │
│                                     │
│              Page 1                 │ ← Page number (centered)
│ Bottom Margin                       │
└─────────────────────────────────────┘
```

## Important Technical Details

### Vercel Deployment Considerations

**1. Read-Only Filesystem**
Vercel serverless functions have read-only filesystem except `/tmp`.

**Solution**: Environment detection
```javascript
// Automatically uses /tmp on Vercel
const cacheDir = process.env.VERCEL ? '/tmp/bible_cache' : 'bible_cache';
const pdfDir = process.env.VERCEL ? '/tmp/generated_pdfs' : 'generated_pdfs';
```

**2. Static File Routing**
Must explicitly route static files in `vercel.json`:
```json
{
  "routes": [
    { "src": "/css/(.*)", "dest": "/public/css/$1" },
    { "src": "/js/(.*)", "dest": "/public/js/$1" },
    { "src": "/presets/(.*)", "dest": "/public/presets/$1" }
  ]
}
```

**3. Absolute Paths**
Use `process.cwd()` for file paths on Vercel:
```javascript
const presetPath = path.join(process.cwd(), 'public', 'presets', `${name}.json`);
```

**4. Ephemeral Storage**
`/tmp` directory is cleared between function invocations. This is fine because:
- Bible data can be re-fetched (cached when possible)
- PDFs only need to exist temporarily for download

### Coordinate System (PDFKit)

**CRITICAL**: PDFKit uses top-left origin (0,0 at top-left corner)

```javascript
// Calculate Y position from TOP of page
const y = topMargin + (lineOnPage × lineHeight);

// NOT from bottom (this was the original bug):
// const y = pageHeight - topMargin - (lineOnPage × lineHeight); // ❌ WRONG
```

### Page Number Positioning

Must use explicit positioning to prevent auto-pagination:

```javascript
// Calculate exact center position
const textWidth = doc.widthOfString(pageNumStr);
const x = (pageWidth - textWidth) / 2;
const y = pageHeight - 0.5";

// Disable line breaking to prevent new page
doc.text(pageNumStr, x, y, { lineBreak: false });
```

## API Endpoints

### Frontend Routes
- `GET /` - Main application page

### API Routes
- `POST /api/generate` - Start PDF generation, returns `{ taskId }`
- `GET /api/status/:taskId` - Get generation status/progress
- `GET /api/download/:taskId` - Download completed PDF
- `GET /api/presets/:name` - Load preset configuration
- `POST /api/cleanup` - Manually trigger PDF cleanup
- `GET /api/stats` - Get task manager statistics (debug)

## Configuration Options

### Page Sizes
- **letter**: 8.5" × 11" (612 × 792 points)
- **a4**: 8.27" × 11.69" (595.44 × 841.68 points)
- **6x9**: 6" × 9" (432 × 648 points) - Book size
- **ipad**: 7.3" × 9.7" (525.6 × 698.4 points)

### Available Fonts (PDFKit Standard)
- Helvetica, Helvetica-Bold, Helvetica-Oblique, Helvetica-BoldOblique
- Times-Roman, Times-Bold, Times-Italic, Times-BoldItalic
- Courier, Courier-Bold, Courier-Oblique, Courier-BoldOblique

### Margins
- Range: 0.25" - 2.0"
- Default: 0.75" all sides

### Line Height
- Range: 0.2" - 0.6"
- Default: 0.30"
- Recommendations: 0.25" (tight), 0.30" (normal), 0.40" (loose)

### Line Appearance
- Color: Hex color picker (default #b3b3b3 gray)
- Width: 0.1 - 2.0 points (default 0.5)

### Advanced Settings
- **Characters per Line**: 45-85 (default 65)
- **Whole Word Factor**: 0.70-0.95 (default 0.85)
- **Verse Label Width**: 0.3"-1.5" (default 0.8")

## Preset Configurations

### Default
- Letter size, 0.75" margins, 0.30" line height
- 65 chars/line, Helvetica-Bold labels

### Large Print
- Letter size, 1.0" margins, 0.40" line height
- 55 chars/line, 11pt labels, wider verse labels

### Compact
- Letter size, 0.5" margins, 0.25" line height
- 75 chars/line, 8pt labels, narrower labels

### 6×9 Book
- 6×9 page, 0.75" margins, 0.30" line height
- 50 chars/line, optimized for book binding

### iPad
- iPad size, 0.5"/0.75" margins, 0.35" line height
- 45 chars/line, narrow verse labels

## Bible Book Codes (fetch.bible)

### Gospels
- mat (Matthew), mrk (Mark), luk (Luke), jhn (John)

### Popular OT Books
- gen (Genesis), exo (Exodus), psa (Psalms), pro (Proverbs), isa (Isaiah)

### NT Letters
- rom (Romans), 1co (1 Corinthians), 2co (2 Corinthians)
- gal (Galatians), eph (Ephesians), php (Philippians), col (Colossians)
- heb (Hebrews), jas (James), 1pe (1 Peter), rev (Revelation)

Full list in: `src/constants/config.js`

## Development

### Local Setup
```bash
npm install
npm run dev  # or: npm start
```
Access at: http://localhost:3000

### Environment Variables
```bash
PORT=3000
NODE_ENV=development
PDF_CLEANUP_HOURS=24
```

## Deployment

### Vercel (Recommended)

**Option 1: GitHub Integration (Easiest)**
1. Go to https://vercel.com/new
2. Import GitHub repository
3. Auto-deploys on every push

**Option 2: GitHub Actions (Automated)**
1. Run `vercel link` locally
2. Get credentials from `.vercel/project.json`
3. Add GitHub secrets: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
4. Push to main branch - auto-deploys via GitHub Action

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions.

## Common Issues & Solutions

### Issue: Static files 404 on Vercel
**Solution**: Update `vercel.json` with proper static routes for `/css/`, `/js/`, `/presets/`

### Issue: "ENOENT: no such file or directory"
**Solution**: App automatically uses `/tmp` on Vercel. Make sure environment detection is working.

### Issue: Presets not loading
**Solution**: Ensure presets use `process.cwd()` for absolute paths

### Issue: Page numbers on wrong page
**Solution**: Use `lineBreak: false` when drawing page numbers

### Issue: Verses misaligned after page breaks
**Solution**: Calculate Y from top of page, not bottom

## Performance

### Typical Generation Times
- Small book (Mark, 16 chapters): 3-5 seconds
- Medium book (Matthew, 28 chapters): 5-8 seconds
- Large book (Psalms, 150 chapters): 15-25 seconds

### Optimization Opportunities
- Cache Bible data aggressively (already implemented)
- Consider reducing fetch.bible API calls
- Could pre-generate common books
- Stream PDF generation instead of waiting for complete file

## Future Enhancements

### Potential Features
- [ ] Multiple Bible versions (currently only BSB)
- [ ] Chapter range selection (e.g., John 1-5)
- [ ] Multi-book workbooks
- [ ] Custom verse spacing
- [ ] Print directly (browser print dialog)
- [ ] Save custom presets to database
- [ ] Email PDF delivery
- [ ] Live preview before generation
- [ ] Different line styles (dotted, dashed, college-ruled)
- [ ] Verse text preview on hover
- [ ] Download history

### Code Improvements
- [ ] Add unit tests
- [ ] Add TypeScript types
- [ ] Implement proper logger (winston/pino)
- [ ] Add API rate limiting
- [ ] Implement Redis caching for production
- [ ] Add Sentry error tracking
- [ ] Create Docker container
- [ ] Add API documentation (Swagger)

## Important Files

### Must Read
- [server.js](server.js) - Entry point
- [src/services/pdfGenerator.js](src/services/pdfGenerator.js) - Core PDF logic
- [src/services/bibleApi.js](src/services/bibleApi.js) - fetch.bible integration
- [vercel.json](vercel.json) - Deployment configuration

### Configuration
- [src/constants/config.js](src/constants/config.js) - All constants
- [public/presets/](public/presets/) - Preset JSON files

### Original Reference
- [generate_bible_workbook.py](generate_bible_workbook.py) - Original Python implementation (kept for reference)

## Notes for Future Developers

1. **PDFKit vs reportlab**: PDFKit coordinate system is different. Top-left is (0,0), not bottom-left.

2. **Vercel `/tmp` directory**: Always use environment detection for file paths. `/tmp` is cleared between invocations.

3. **Line calculation**: The whole word factor is critical for accurate spacing. Don't remove it.

4. **Right-aligned verse labels**: Prevents wrapping for long references like "119:176"

5. **Background tasks**: Uses in-memory Map for simplicity. For scale, consider Bull + Redis.

6. **fetch.bible API**: Free tier, no auth required. BSB translation only tested.

7. **File cleanup**: Runs every hour. Important for disk space management.

8. **Preset loading**: Must use absolute paths with `process.cwd()` on Vercel.

## Support

For questions or issues:
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment issues
- Check [readme.md](readme.md) for configuration options
- Review GitHub Actions logs for deployment failures
- Check Vercel logs for runtime errors

---

**Last Updated**: February 2026
**Project Status**: Production Ready ✅
**Deployment**: https://scribegenerator.vercel.app
