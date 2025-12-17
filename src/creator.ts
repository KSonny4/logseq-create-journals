import * as fs from 'fs';
import * as path from 'path';
import { formatDate } from './scanner.js';
import { CreateResult } from './types.js';

/**
 * Creates missing journal files from startDate to endDate (inclusive)
 * Uses the template content for all new files
 */
export function createJournalFiles(
  journalsDir: string,
  startDate: Date,
  endDate: Date,
  templateContent: string
): CreateResult {
  const filesCreated: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const fileName = `${formatDate(currentDate)}.md`;
    const filePath = path.join(journalsDir, fileName);

    // Skip if file already exists
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, templateContent, 'utf8');
      filesCreated.push(fileName);
      console.log(`Created: ${fileName}`);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    success: true,
    filesCreated: filesCreated.length,
    message: filesCreated.length > 0
      ? `Created ${filesCreated.length} journal file(s).`
      : 'All journal files already exist.',
    dateRange: {
      start: new Date(startDate),
      end: new Date(endDate),
    },
  };
}

