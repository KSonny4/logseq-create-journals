import * as fs from 'fs';
import * as path from 'path';
import { ScanResult } from './types.js';

/**
 * Formats a date to YYYY_MM_DD format
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}_${month}_${day}`;
}

/**
 * Parses a date from YYYY_MM_DD.md filename
 */
export function parseDateFromFilename(filename: string): Date | null {
  const match = filename.match(/^(\d{4})_(\d{2})_(\d{2})\.md$/);
  if (!match) {
    return null;
  }
  
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Month is 0-indexed
  const day = parseInt(match[3], 10);
  
  return new Date(year, month, day);
}

/**
 * Scans the journals directory and finds the last (most recent) journal file
 */
export function scanJournals(journalsDir: string): ScanResult {
  if (!fs.existsSync(journalsDir)) {
    return {
      lastDate: null,
      lastFileName: null,
      totalJournals: 0,
    };
  }

  const files = fs.readdirSync(journalsDir);
  const journalFiles = files.filter(file => file.match(/^\d{4}_\d{2}_\d{2}\.md$/));
  
  if (journalFiles.length === 0) {
    return {
      lastDate: null,
      lastFileName: null,
      totalJournals: 0,
    };
  }

  // Parse dates and find the most recent one
  let lastDate: Date | null = null;
  let lastFileName: string | null = null;

  for (const file of journalFiles) {
    const date = parseDateFromFilename(file);
    if (date && (!lastDate || date > lastDate)) {
      lastDate = date;
      lastFileName = file;
    }
  }

  return {
    lastDate,
    lastFileName,
    totalJournals: journalFiles.length,
  };
}

