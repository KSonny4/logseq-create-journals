# Logseq Journal Creator

Automatically creates missing Logseq journal files for the next month, using the last existing journal file as a template.

## Features

- ✅ Scans journals directory for existing `YYYY_MM_DD.md` files
- ✅ Finds the most recent (last) journal file
- ✅ Creates missing journal files from (last date + 1) through (last date + 1 month)
- ✅ Uses the last journal file as a template for all new files
- ✅ Skips files that already exist (idempotent)
- ✅ Pings healthchecks.io on completion
- ✅ Fully typed TypeScript
- ✅ Ready for monthly automation (cron or n8n)

## Installation

```bash
npm install
npm run build
```

## Usage

### Standalone

```bash
# Use default journal directory
npm start

# Or specify custom directory
JOURNALS_DIR=/path/to/journals npm start

# With custom healthcheck URL
HEALTHCHECK_URL=https://hc-ping.com/your-uuid npm start
```

### With n8n

1. **Create a new workflow in n8n**

2. **Add a Schedule Trigger (Cron) node:**
   - Set cron expression to: `0 0 1 * *` (runs on the 1st day of every month at midnight)
   - Or: `0 0 * * 1` (runs every Monday at midnight)

3. **Add an Execute Command node:**
   - Command: `node /Users/petr.kubelka/git_projects/logseq-create-journals/dist/index.js`
   - Or with custom path: `JOURNALS_DIR=/path/to/journals node /Users/petr.kubelka/git_projects/logseq-create-journals/dist/index.js`

4. **(Optional) Add notification:**
   - Add an HTTP Request or Email node to get notified when journals are created

## How It Works

### Example: Creating Missing Journals

**Scenario:**
- Last journal file: `2025_12_17.md`
- Current date: December 20, 2025

**Process:**
1. Scans directory and finds `2025_12_17.md` as the last journal
2. Reads `2025_12_17.md` as template
3. Creates files from `2025_12_18.md` through `2026_01_17.md` (1 month ahead)
4. Each new file contains the exact same content as the template

**Result:**
- Creates 31 new journal files (Dec 18 - Jan 17)
- All files have the same content as `2025_12_17.md`
- Skips any files that already exist

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build
npm run build
```

## Configuration

Set environment variables to customize behavior:

- `JOURNALS_DIR` - Path to Logseq journals directory (defaults to `/Users/petr.kubelka/Documents/logseq/journals`)
- `HEALTHCHECK_URL` - Healthcheck ping URL (defaults to `https://hc-ping.com/379563e1-1f16-4845-80ed-344fc431826e`)

## File Format

The script expects Logseq journal files in the format:
- Filename: `YYYY_MM_DD.md` (e.g., `2025_12_17.md`)
- Content: Any markdown content (used as template for new files)

## Scheduling

This tool is designed to run monthly. Recommended schedules:

- **Monthly (1st of month)**: `0 0 1 * *`
- **Weekly (every Monday)**: `0 0 * * 1`
- **Daily**: `0 0 * * *` (will only create files if needed)

## License

ISC

