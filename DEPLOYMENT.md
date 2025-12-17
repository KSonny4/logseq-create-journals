# Deployment Guide - Logseq Journal Creator to n8n

## Quick Deploy

Run the deploy script from your Mac:
```bash
cd /Users/petr.kubelka/git_projects/logseq-create-journals
./deploy.sh
```

This will:
1. Remove any existing workflow with the same name
2. Copy the workflow to the Raspberry Pi
3. Import it into n8n
4. Activate the workflow
5. Restart n8n

## Prerequisites

1. **Build the project first:**
   ```bash
   npm install
   npm run build
   ```

2. **Ensure the built files are on the Raspberry Pi:**
   - The workflow expects the script at: `/Users/petr.kubelka/git_projects/logseq-create-journals/dist/index.js`
   - Make sure this path exists on the Raspberry Pi (or update the workflow to use the correct path)

3. **Set up environment variable:**
   ```bash
   export RPI_PASS="your_password"
   # Or create a .env file with: RPI_PASS=your_password
   ```

## Status
✅ GitHub repository: `github.com/KSonny4/logseq-create-journals`  
✅ n8n workflow configured  
✅ Scheduled to run monthly on the 1st at midnight (cron: `0 0 1 * * *`)

## Verify Installation

1. **Check volume mount (if using Docker):**
   ```bash
   docker exec n8n ls -la /logseq/journals | head -5
   ```

2. **Test workflow manually:**
   - In n8n UI, open "Logseq Journal Creator" workflow
   - Click "Execute Workflow" button
   - Check execution logs for success/errors

3. **Verify schedule:**
   - Workflow is set to run monthly on the 1st at midnight
   - Cron expression: `0 0 1 * * *`
   - You can change this in the Schedule Trigger node

## Workflow Configuration

The workflow uses an Execute Command node that runs:
```bash
node /Users/petr.kubelka/git_projects/logseq-create-journals/dist/index.js
```

With environment variables:
- `JOURNALS_DIR=/logseq/journals` (mounted volume path)
- `HEALTHCHECK_URL=https://hc-ping.com/379563e1-1f16-4845-80ed-344fc431826e`

## Production Features

The workflow includes:
- ✅ Error handling with try/catch
- ✅ Healthchecks.io logging and pinging
- ✅ Idempotent operations (safe to run multiple times)
- ✅ Skips existing files

## Troubleshooting

- **Workflow not running:** Check if it's activated (toggle switch in n8n UI)
- **Permission errors:** Verify volume mount permissions: `docker exec n8n ls -la /logseq`
- **Script not found:** Verify the path to `dist/index.js` exists on the Raspberry Pi
- **No files created:** Check that journal files exist in the directory and the last journal can be found

## Updating the Workflow

After making changes to the code:
1. Rebuild: `npm run build`
2. Copy `dist/` folder to Raspberry Pi (if needed)
3. Redeploy: `./deploy.sh`

