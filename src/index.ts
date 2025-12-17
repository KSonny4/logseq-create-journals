import * as fs from 'fs';
import * as path from 'path';
import { scanJournals } from './scanner.js';
import { createJournalFiles } from './creator.js';
import { CreateResult } from './types.js';

/**
 * Pings healthchecks.io with the result
 */
async function pingHealthcheck(url: string, success: boolean): Promise<void> {
  try {
    const pingUrl = success ? url : `${url}/fail`;
    const response = await fetch(pingUrl, { method: 'GET' });
    if (!response.ok) {
      console.warn(`Healthcheck ping failed: ${response.status} ${response.statusText}`);
    } else {
      console.log('Healthcheck pinged successfully');
    }
  } catch (error) {
    console.warn(`Failed to ping healthcheck: ${error}`);
  }
}

/**
 * Main function to create missing journal files
 */
export async function createMissingJournals(
  journalsDir: string,
  healthcheckUrl?: string
): Promise<CreateResult> {
  console.log(`Scanning journals directory: ${journalsDir}`);

  // Scan for existing journals
  const scanResult = scanJournals(journalsDir);

  if (!scanResult.lastDate || !scanResult.lastFileName) {
    return {
      success: false,
      filesCreated: 0,
      message: 'No existing journal files found. Cannot determine template.',
      dateRange: null,
    };
  }

  console.log(`Last journal found: ${scanResult.lastFileName} (${scanResult.lastDate.toISOString().split('T')[0]})`);

  // Read template from last journal file
  const templatePath = path.join(journalsDir, scanResult.lastFileName);
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  console.log(`Using template from: ${scanResult.lastFileName}`);

  // Calculate date range: from (lastDate + 1) to (lastDate + 1 month)
  const startDate = new Date(scanResult.lastDate);
  startDate.setDate(startDate.getDate() + 1);

  const endDate = new Date(scanResult.lastDate);
  endDate.setMonth(endDate.getMonth() + 1);

  console.log(`Creating journals from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

  // Create missing journal files
  const result = createJournalFiles(journalsDir, startDate, endDate, templateContent);

  // Ping healthcheck on success
  if (result.success && healthcheckUrl) {
    await pingHealthcheck(healthcheckUrl, true);
  } else if (!result.success && healthcheckUrl) {
    await pingHealthcheck(healthcheckUrl, false);
  }

  return result;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const JOURNALS_DIR = process.env.JOURNALS_DIR || '/Users/petr.kubelka/Documents/logseq/journals';
  const HEALTHCHECK_URL = process.env.HEALTHCHECK_URL || 'https://hc-ping.com/379563e1-1f16-4845-80ed-344fc431826e';
  
  createMissingJournals(JOURNALS_DIR, HEALTHCHECK_URL)
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

