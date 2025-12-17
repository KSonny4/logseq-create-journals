import * as fs from 'fs';
import * as path from 'path';
import { scanJournals } from './scanner.js';
import { createJournalFiles } from './creator.js';
import { CreateResult } from './types.js';

/**
 * Extracts UUID from healthcheck URL
 */
function extractUuidFromUrl(url: string): string | null {
  const match = url.match(/hc-ping\.com\/([a-f0-9-]+)/i);
  return match ? match[1] : null;
}

/**
 * Sends log message to healthchecks.io
 */
async function hcLog(url: string, message: string): Promise<void> {
  const uuid = extractUuidFromUrl(url);
  if (!uuid) {
    console.warn(`Invalid healthcheck URL format: ${url}. Cannot send log to healthchecks.io.`);
    return;
  }

  try {
    const logUrl = `https://hc-ping.com/${uuid}/log`;
    const response = await fetch(logUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: message,
    });
    if (!response.ok) {
      console.warn(`Healthcheck log failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.warn(`Failed to send log to healthcheck: ${error}`);
  }
}

/**
 * Pings healthchecks.io with success result
 */
async function pingHealthcheckSuccess(url: string, message?: string): Promise<void> {
  const uuid = extractUuidFromUrl(url);
  if (!uuid) {
    console.warn(`Invalid healthcheck URL format: ${url}. Cannot ping healthchecks.io.`);
    return;
  }

  try {
    const pingUrl = `https://hc-ping.com/${uuid}`;
    const response = await fetch(pingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: message || '',
    });
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
 * Pings healthchecks.io with failure result
 */
async function pingHealthcheckFail(url: string, message?: string): Promise<void> {
  const uuid = extractUuidFromUrl(url);
  if (!uuid) {
    console.warn(`Invalid healthcheck URL format: ${url}. Cannot ping healthchecks.io.`);
    return;
  }

  try {
    const pingUrl = `https://hc-ping.com/${uuid}/fail`;
    const response = await fetch(pingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: message || '',
    });
    if (!response.ok) {
      console.warn(`Healthcheck fail ping failed: ${response.status} ${response.statusText}`);
    } else {
      console.log('Healthcheck fail pinged successfully');
    }
  } catch (error) {
    console.warn(`Failed to ping healthcheck fail: ${error}`);
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
  
  if (healthcheckUrl) {
    await hcLog(healthcheckUrl, `Starting journal creator - scanning directory: ${journalsDir}`);
  }

  // Validate directory exists
  if (!fs.existsSync(journalsDir)) {
    const errorMsg = `Journals directory not found: ${journalsDir}`;
    console.error(errorMsg);
    if (healthcheckUrl) {
      await hcLog(healthcheckUrl, `ERROR: ${errorMsg}`);
      await pingHealthcheckFail(healthcheckUrl, errorMsg);
    }
    return {
      success: false,
      filesCreated: 0,
      message: errorMsg,
      dateRange: null,
    };
  }

  // Scan for existing journals
  const scanResult = scanJournals(journalsDir);
  
  if (healthcheckUrl) {
    await hcLog(healthcheckUrl, `Found ${scanResult.totalJournals} existing journal file(s)`);
  }

  if (!scanResult.lastDate || !scanResult.lastFileName) {
    const errorMsg = 'No existing journal files found. Cannot determine template.';
    console.error(errorMsg);
    if (healthcheckUrl) {
      await hcLog(healthcheckUrl, `ERROR: ${errorMsg}`);
      await pingHealthcheckFail(healthcheckUrl, errorMsg);
    }
    return {
      success: false,
      filesCreated: 0,
      message: errorMsg,
      dateRange: null,
    };
  }

  const lastDateStr = scanResult.lastDate.toISOString().split('T')[0];
  console.log(`Last journal found: ${scanResult.lastFileName} (${lastDateStr})`);
  
  if (healthcheckUrl) {
    await hcLog(healthcheckUrl, `Last journal: ${scanResult.lastFileName} (${lastDateStr})`);
  }

  // Read template from last journal file
  const templatePath = path.join(journalsDir, scanResult.lastFileName);
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  console.log(`Using template from: ${scanResult.lastFileName}`);
  
  if (healthcheckUrl) {
    await hcLog(healthcheckUrl, `Reading template from: ${scanResult.lastFileName}`);
  }

  // Calculate date range: from (lastDate + 1) to (lastDate + 1 month)
  const startDate = new Date(scanResult.lastDate);
  startDate.setDate(startDate.getDate() + 1);

  const endDate = new Date(scanResult.lastDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  console.log(`Creating journals from ${startDateStr} to ${endDateStr}`);
  
  if (healthcheckUrl) {
    await hcLog(healthcheckUrl, `Creating journals from ${startDateStr} to ${endDateStr}`);
  }

  // Create missing journal files
  const result = createJournalFiles(journalsDir, startDate, endDate, templateContent);
  
  if (healthcheckUrl) {
    await hcLog(healthcheckUrl, `Created ${result.filesCreated} journal file(s)`);
  }

  // Ping healthcheck with result
  if (healthcheckUrl) {
    if (result.success) {
      const successMsg = result.filesCreated > 0
        ? `Successfully created ${result.filesCreated} journal file(s)`
        : 'All journal files already exist';
      await pingHealthcheckSuccess(healthcheckUrl, successMsg);
    } else {
      await pingHealthcheckFail(healthcheckUrl, result.message);
    }
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
    .catch(async error => {
      console.error('Error:', error);
      const errorMsg = `Unexpected error: ${error instanceof Error ? error.message : String(error)}`;
      if (HEALTHCHECK_URL) {
        await hcLog(HEALTHCHECK_URL, `ERROR: ${errorMsg}`);
        await pingHealthcheckFail(HEALTHCHECK_URL, errorMsg);
      }
      process.exit(1);
    });
}

